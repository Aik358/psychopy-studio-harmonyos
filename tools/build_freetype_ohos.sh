#!/usr/bin/env bash
# ===========================================================================
# build_freetype_ohos.sh
# 用 DevEco 自带的 OpenHarmony NDK (clang + cmake + ninja) 把 FreeType 交叉编成
# aarch64-linux-ohos (musl) 的共享库，用于鸿蒙设备的 Python freetype 包
# （psychopy.tools.fontmanager 依赖 libfreetype.so）。
#
# 与 build_libsndfile_ohos.sh 同一套路：不依赖 WSL/Docker，工具链在 D:\DevEco Studio，
# 产物在 E:。编【核心版】(只依赖 musl libc，不链外部 zlib/libpng/harfbuzz)，
# 因此产出的 libfreetype.so.6 在鸿蒙上 import freetype 必定成功。
# ===========================================================================
set -euo pipefail

NDK="D:/DevEco Studio/sdk/default/openharmony/native"
TOOLCHAIN="$NDK/build/cmake/ohos.toolchain.cmake"
CMAKE="$NDK/build-tools/cmake/bin/cmake.exe"
NINJA="$NDK/build-tools/cmake/bin/ninja.exe"
LLVM_BIN="$NDK/llvm/bin"

ROOT="E:/psychopy-experiment"
WORK="$ROOT/ohos_build_ft"
SRC="$WORK/src"
BUILD="$WORK/build"
PREFIX="$WORK/prefix"
OUT="$ROOT/out"
LOG="$ROOT/freetype_build.log"

mkdir -p "$WORK" "$SRC" "$BUILD" "$PREFIX" "$OUT"

echo "==> [1/5] 下载 FreeType 2.13.3 (tag archive, 带重试+镜像) ..."
# Windows 原生路径 (E:/...) 让 curl.exe 正确写入；GitHub 在本环境不稳定，依次尝试镜像。
VER="VER-2-13-3"
ARCHIVE="$SRC/freetype-$VER.tar.gz"
# 已有完整归档则跳过下载（gzip -t 校验完整性）
if [ -s "$ARCHIVE" ] && gzip -t "$ARCHIVE" 2>/dev/null; then
  echo "  已存在有效归档，跳过下载: $ARCHIVE"
  downloaded=1
else
  downloaded=0
fi
MIRRORS=(
  "https://github.com/freetype/freetype/archive/refs/tags/$VER.tar.gz"
  "https://codeload.github.com/freetype/freetype/tar.gz/refs/tags/$VER"
  "https://ghproxy.net/https://github.com/freetype/freetype/archive/refs/tags/$VER.tar.gz"
  "https://mirror.ghproxy.com/https://github.com/freetype/freetype/archive/refs/tags/$VER.tar.gz"
)
for attempt in 1 2 3 4 5; do
  [ $downloaded -eq 1 ] && break
  for url in "${MIRRORS[@]}"; do
    echo "  try [$attempt] $url"
    if curl -L --retry 2 --retry-delay 2 --max-time 90 -o "$ARCHIVE" "$url" \
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
  echo "可改在能稳定访问 GitHub 的机器上跑本脚本，或手动把 freetype-$VER 源码放到 $ARCHIVE 后重跑。"
  exit 1
fi
# Git Bash tar 会把 "E:/..." 当远程主机(rsh)解析 → 用 cygpath 转成 /e/... 的 Unix 路径
ARCHIVE_U="$(cygpath -u "$ARCHIVE" 2>/dev/null || echo "$ARCHIVE")"
SRC_U="$(cygpath -u "$SRC" 2>/dev/null || echo "$SRC")"
tar --force-local -xzf "$ARCHIVE_U" -C "$SRC_U"
SRCDIR="$SRC/freetype-$VER"

echo "==> [2/5] cmake 配置 (OHOS aarch64, core-only) ..."
"$CMAKE" -G Ninja \
  -DCMAKE_MAKE_PROGRAM="$NINJA" \
  -DCMAKE_TOOLCHAIN_FILE="$TOOLCHAIN" \
  -DOHOS_ARCH=arm64-v8a \
  -DOHOS_PLATFORM=ohos \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX="$PREFIX" \
  -DBUILD_SHARED_LIBS=ON \
  -DCMAKE_DISABLE_FIND_PACKAGE_PkgConfig=ON \
  -DFT_DISABLE_BZIP2=ON \
  -DFT_DISABLE_PNG=ON \
  -DFT_DISABLE_HARFBUZZ=ON \
  -DFT_DISABLE_BROTLI=ON \
  -DCMAKE_DISABLE_FIND_PACKAGE_ZLIB=ON \
  -S "$SRCDIR" -B "$BUILD"

echo "==> [3/5] 编译 ..."
"$CMAKE" --build "$BUILD" --config Release

echo "==> [4/5] 收集产物 ..."
# 直接复制已知路径的真实文件（避开 Git Bash 下 find 报 "environment too large" 的问题）。
REAL="$BUILD/libfreetype.so.6.20.2"
if [ ! -f "$REAL" ]; then
  echo "ERROR: 没找到 $REAL"
  exit 1
fi
cp -f "$REAL" "$OUT/libfreetype.so.6"
echo "copied: $REAL -> $OUT/libfreetype.so.6"
# freetype-py 默认 dlopen 的是 "libfreetype.so"（不带版本号），补一个同名副本。
cp -f "$REAL" "$OUT/libfreetype.so"

echo "==> [5/5] 验证 NEEDED（应只有 musl libc，不应有 libpng/libharfbuzz 等）..."
"$LLVM_BIN/llvm-readelf.exe" -d "$OUT/libfreetype.so.6" | grep -E "NEEDED|SONAME" || true

echo "==> DONE"
ls -lh "$OUT/libfreetype.so.6" "$OUT/libfreetype.so"
echo "产物路径: $OUT/libfreetype.so.6 和 $OUT/libfreetype.so"
