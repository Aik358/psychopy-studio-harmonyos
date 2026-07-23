#!/usr/bin/env bash
# ===========================================================================
# build_libsndfile_musl.sh
# 交叉编译一个「自包含」的 libsndfile.so.1（musl aarch64），用于鸿蒙(HarmonyOS/OpenHarmony)。
#
# 目标：让 soundfile (Python) 在鸿蒙上可用，从而 psychopy 的音频读写不再降级。
# 关键思路（参考 bemoody/libsndfile-binaries）：
#   - 把 FLAC / Ogg / Vorbis / Opus 编解码器【静态链接】进 libsndfile.so.1 本身，
#   - 这样产出的 libsndfile.so.1 只依赖 musl libc（鸿蒙自带），不依赖任何外部 .so。
#   - 单文件部署，避免一长串传递依赖（libFLAC.so / libogg.so ...）的 ABI 风险。
#
# 必须在 Linux x86_64 上运行（WSL / 云主机均可）。需要约 2GB 磁盘、网络可访问源码。
#
# 用法：
#   bash build_libsndfile_musl.sh
#   # 产物：./out/libsndfile.so.1   （把它改名/放进 HAP 的 native libs 目录）
#
# 部署（见下方「鸿蒙集成」注释）：
#   1) 把 libsndfile.so.1 放到 HAP 内【可执行】native libs 目录
#      （与 libelectron.so 同级，例如 electron/libs/arm64-v8a/，已签名、可 dlopen）
#      ⚠ 严禁放 userData（/data/storage/el2/base/files/...）—— 那是 noexec，dlopen 会 Permission denied。
#   2) 启动应用时设 PSYCHOPY_SNDFILE_LIBDIR=/.../arm64-v8a
#      （harmony-python.js 的 getPythonEnv() 已会把它加进 Python 子进程的 LD_LIBRARY_PATH）
#   3) 重新打包部署即可。
# ===========================================================================

set -euo pipefail

WORKDIR="${PWD}/sndfile_build"
OUTDIR="${PWD}/out"
SYSROOT="${WORKDIR}/sysroot"
TOOLCHAIN_DIR="${WORKDIR}/toolchain"
NPROC="$(nproc)"

echo "==> 工作目录: ${WORKDIR}"
mkdir -p "${WORKDIR}" "${OUTDIR}" "${SYSROOT}" "${TOOLCHAIN_DIR}"

# ---------------------------------------------------------------------------
# 1) 准备 musl aarch64 交叉工具链
#    方案 A：musl.cc 预编译工具链（最简单）
# ---------------------------------------------------------------------------
if ! command -v aarch64-linux-musl-gcc >/dev/null 2>&1; then
  echo "==> 下载 musl.cc aarch64-linux-musl 工具链 ..."
  cd "${TOOLCHAIN_DIR}"
  curl -L -o musl.tgz https://musl.cc/aarch64-linux-musl-cross.tgz
  tar xzf musl.tgz
  export PATH="${TOOLCHAIN_DIR}/aarch64-linux-musl-cross/bin:${PATH}"
fi
CC="aarch64-linux-musl-gcc"
CXX="aarch64-linux-musl-g++"
PREFIX="${SYSROOT}/usr"
mkdir -p "${PREFIX}"

echo "==> 使用工具链: ${CC}"
${CC} --version | head -n1

# 公共 configure 参数（全部静态 .a，禁共享，避免传递依赖）
CFG="--host=aarch64-linux-musl --prefix=${PREFIX} --enable-static --disable-shared --with-pic"
MAKEFLAGS="-j${NPROC}"

build_from_tarball() {
  # $1=名称 $2=URL(含版本) $3=解压后目录名(留空则自动)
  local name="$1" url="$2" dir="$3"
  echo "==> 构建 ${name} ..."
  cd "${WORKDIR}"
  curl -L -o ${name}.tar.gz "${url}"
  tar xzf ${name}.tar.gz
  cd "${dir:-${name}}"
  ./configure ${CFG} "$@"
  make ${MAKEFLAGS}
  make install
}

# ---------------------------------------------------------------------------
# 2) 编解码器依赖（全部静态，最终被链进 libsndfile.so）
# ---------------------------------------------------------------------------
# libogg
build_from_tarball libogg \
  "https://downloads.xiph.org/releases/ogg/libogg-1.3.5.tar.gz" libogg-1.3.5

# libvorbis (依赖 libogg)
build_from_tarball libvorbis \
  "https://downloads.xiph.org/releases/vorbis/libvorbis-1.3.7.tar.gz" libvorbis-1.3.7

# FLAC (依赖 libogg；禁用例程/测试以加速)
build_from_tarball flac \
  "https://downloads.xiph.org/releases/flac/flac-1.4.3.tar.gz" flac-1.4.3 \
  --disable-cpplibs --disable-examples --disable-programs

# Opus
build_from_tarball opus \
  "https://downloads.xiph.org/releases/opus/opus-1.5.2.tar.gz" opus-1.5.2 \
  --disable-doc --disable-extra-programs

# ---------------------------------------------------------------------------
# 3) libsndfile：动态 .so，但把上面的静态编解码器链进来 → 自包含单文件
# ---------------------------------------------------------------------------
echo "==> 构建 libsndfile (shared, statically linked codecs) ..."
cd "${WORKDIR}"
SNDFILE_VER="1.2.2"
curl -L -o libsndfile.tar.gz \
  "https://github.com/libsndfile/libsndfile/archive/refs/tags/${SNDFILE_VER}.tar.gz"
tar xzf libsndfile.tar.gz
cd "libsndfile-${SNDFILE_VER}"

# 让 configure/pkg-config 找到我们静态安装的 codec .a
export PKG_CONFIG_PATH="${PREFIX}/lib/pkgconfig"
export CPPFLAGS="-I${PREFIX}/include"
export LDFLAGS="-L${PREFIX}/lib"

./autogen.sh || ./configure --version >/dev/null  # 没有 autogen.sh 时回退
./configure --host=aarch64-linux-musl \
  --prefix="${PREFIX}" \
  --enable-shared --disable-static \
  --disable-examples --disable-tests \
  --disable-sqlite-lock

make ${MAKEFLAGS}
make install

# ---------------------------------------------------------------------------
# 4) 收集产物：重命名为 libsndfile.so.1（soundfile 的 dlopen 目标名）
# ---------------------------------------------------------------------------
echo "==> 收集产物 ..."
# libsndfile 安装为 libsndfile.so -> libsndfile.so.1 -> libsndfile.so.1.0.0
cp -a "${PREFIX}/lib/libsndfile.so"* "${OUTDIR}/"
cd "${OUTDIR}"
# 确保存在 soname 文件（去掉中间符号链接，保留真实文件 + 所需的 .so.1）
ln -sf libsndfile.so.1 libsndfile.so 2>/dev/null || true

echo "==> 产物位于: ${OUTDIR}"
ls -lh "${OUTDIR}"
echo
echo "==> 验证：只应依赖 musl libc（不应出现 libFLAC/libogg 等外部 .so）"
aarch64-linux-musl-readelf -d "${OUTDIR}/libsndfile.so.1" 2>/dev/null | grep -E "NEEDED|SONAME" || \
  echo "(若上面 readelf 不可用，可用鸿蒙设备上的 readelf 复检)"

echo
echo "==================================================================="
echo " 下一步（部署到鸿蒙）："
echo " 1. 把 ${OUTDIR}/libsndfile.so.1 放进 HAP 的 native libs 目录（可 exec）"
echo " 2. 启动应用时设 PSYCHOPY_SNDFILE_LIBDIR=<该目录绝对路径>"
echo " 3. 重新 .\\build.ps1 + hdc 部署"
echo "==================================================================="
