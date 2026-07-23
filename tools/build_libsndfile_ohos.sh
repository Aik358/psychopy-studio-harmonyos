#!/usr/bin/env bash
# ===========================================================================
# build_libsndfile_ohos.sh
# 用 DevEco 自带的 OpenHarmony NDK (clang + cmake + ninja) 把 libsndfile 交叉编成
# aarch64-linux-ohos (musl) 的共享库，用于鸿蒙设备的 Python soundfile。
#
# 不依赖 WSL / Docker / 任何 C 盘安装；工具链在 D:\DevEco Studio，产物在 E:。
#
# 本轮先编【核心版】(core formats: WAV/AU/AIFF/...)，不链接任何外部编解码器 .so，
# 因此产出的 libsndfile.so.1 只依赖 musl libc，import soundfile 必定成功。
# FLAC/OGG/Vorbis/Opus 等格式支持后续再叠加（静态链入）。
# ===========================================================================
set -euo pipefail

NDK="D:/DevEco Studio/sdk/default/openharmony/native"
TOOLCHAIN="$NDK/build/cmake/ohos.toolchain.cmake"
CMAKE="$NDK/build-tools/cmake/bin/cmake.exe"
NINJA="$NDK/build-tools/cmake/bin/ninja.exe"
LLVM_BIN="$NDK/llvm/bin"

ROOT="E:/psychopy-experiment"
WORK="$ROOT/ohos_build"
SRC="$WORK/src"
BUILD="$WORK/build"
PREFIX="$WORK/prefix"
OUT="$ROOT/out"
LOG="$ROOT/sndfile_build.log"

mkdir -p "$WORK" "$SRC" "$BUILD" "$PREFIX" "$OUT"

echo "==> [1/5] 下载 libsndfile 1.2.2 (tag archive, 带重试+镜像) ..."
# Windows 原生路径 (E:/...) 让 curl.exe 正确写入；GitHub 在本环境不稳定，
# 依次尝试多个镜像并重试，任一下载成功即继续。
VER="1.2.2"
ARCHIVE="$SRC/libsndfile-$VER.tar.gz"
# 已有完整归档则跳过下载（gzip -t 校验完整性）
if [ -s "$ARCHIVE" ] && gzip -t "$ARCHIVE" 2>/dev/null; then
  echo "  已存在有效归档，跳过下载: $ARCHIVE"
  downloaded=1
else
  downloaded=0
fi
MIRRORS=(
  "https://github.com/libsndfile/libsndfile/archive/refs/tags/$VER.tar.gz"
  "https://codeload.github.com/libsndfile/libsndfile/tar.gz/refs/tags/$VER"
  "https://ghproxy.net/https://github.com/libsndfile/libsndfile/archive/refs/tags/$VER.tar.gz"
  "https://mirror.ghproxy.com/https://github.com/libsndfile/libsndfile/archive/refs/tags/$VER.tar.gz"
)
for attempt in 1 2 3 4 5; do
  [ $downloaded -eq 1 ] && break
  for url in "${MIRRORS[@]}"; do
    echo "  try [$attempt] $url"
    if curl -L --retry 2 --retry-delay 2 --max-time 60 -o "$ARCHIVE" "$url" \
       && [ -s "$ARCHIVE" ]; then
      echo "  OK: downloaded $(wc -c < "$ARCHIVE") bytes"
      downloaded=1
      break 2
    fi
    echo "  failed, next mirror..."
  done
  [ $downloaded -eq 1 ] && break
  echo "  attempt $attempt finished, retrying..."
  sleep 3
done
if [ $downloaded -ne 1 ]; then
  echo "ERROR: 所有镜像/重试均失败（本环境 GitHub 访问不稳定）。"
  echo "可改在能稳定访问 GitHub 的机器上跑本脚本，或手动把 libsndfile-$VER 源码放到 $SRC/libsndfile-$VER.tar.gz 后重跑。"
  exit 1
fi
# Git Bash tar 会把 "E:/..." 当远程主机(rsh)解析 → 用 cygpath 转成 /e/... 的 Unix 路径
ARCHIVE_U="$(cygpath -u "$ARCHIVE" 2>/dev/null || echo "$ARCHIVE")"
SRC_U="$(cygpath -u "$SRC" 2>/dev/null || echo "$SRC")"
tar --force-local -xzf "$ARCHIVE_U" -C "$SRC_U"
SRCDIR="$SRC/libsndfile-$VER"

echo "==> [2/5] cmake 配置 (OHOS aarch64, core-only) ..."
"$CMAKE" -G Ninja \
  -DCMAKE_MAKE_PROGRAM="$NINJA" \
  -DCMAKE_TOOLCHAIN_FILE="$TOOLCHAIN" \
  -DOHOS_ARCH=arm64-v8a \
  -DOHOS_PLATFORM=ohos \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX="$PREFIX" \
  -DBUILD_SHARED_LIBS=ON \
  -DBUILD_EXAMPLES=OFF \
  -DBUILD_TESTING=OFF \
  -DENABLE_CPACK=OFF \
  -DLIBSNDFILE_EXAMPLES=OFF \
  -S "$SRCDIR" -B "$BUILD"

echo "==> [3/5] 编译 ..."
"$CMAKE" --build "$BUILD" --config Release

echo "==> [4/5] 收集产物 ..."
echo "--- 构建目录里的 libsndfile.so* ---"
find "$BUILD" -name "libsndfile.so*" -exec ls -lh {} \;
# 取真实文件（非符号链接），复制为 libsndfile.so.1（soundfile 的 dlopen 目标名）
REAL=$(find "$BUILD" -type f -name "libsndfile.so*" | head -1)
if [ -z "$REAL" ]; then
  echo "ERROR: 没找到 libsndfile.so 真实文件"
  exit 1
fi
cp -f "$REAL" "$OUT/libsndfile.so.1"
echo "copied: $REAL -> $OUT/libsndfile.so.1"
# 顺手也保留 libsndfile.so 同名副本（兼容不同 dlopen 习惯）
cp -f "$REAL" "$OUT/libsndfile.so"

echo "==> [5/5] 验证 NEEDED（应只有 musl libc，不应有 libFLAC/libogg 等）..."
"$LLVM_BIN/llvm-readelf.exe" -d "$OUT/libsndfile.so.1" | grep -E "NEEDED|SONAME" || true

echo "==> DONE"
ls -lh "$OUT/libsndfile.so.1"
echo "产物路径: $OUT/libsndfile.so.1"
