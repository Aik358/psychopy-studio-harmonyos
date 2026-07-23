#!/usr/bin/env bash
# ===========================================================================
# build_libusb_ohos.sh
#
# 把 libusb 1.0.27 的交叉编译产物接入鸿蒙打包，供 Python 的 pyusb 包在设备上
# 做 USB 硬件通信（眼动仪 / 脑电帽等）。
#
# 【为什么用 Alpine 预编译版，而不是自己交叉编译】
#   libusb 是 autotools 工程（无 CMakeLists.txt）。本机没有 autoreconf/autoconf/
#   libtool，而 DevEco OHOS NDK 的 clang 配出来的 ./configure 在沙箱里会 hang
#   （已实测：ohos-clang --version 正常，但 ./configure --version 也 EXIT=124）。
#   因此改道：直接取 **Alpine Linux 的 aarch64 预编译 libusb**——
#   Alpine 是 musl 发行版，其 .so 与鸿蒙的 musl-aarch64 二进制兼容，且 libusb
#   官方构建默认 **不链 libudev**（udev 仅用于 Linux 桌面热插拔枚举，鸿蒙用
#   usbfs /sys/bus/usb，关闭/缺失 udev 不影响核心传输），所以 NEEDED 仅 musl libc。
#   零编译、零外部依赖，最适合打包。
#
# 【产物与落位】
#   1) 解包 apk（本质是 gzipped tar），取真实文件 usr/lib/libusb-1.0.so.0.4.0
#      （不是符号链接——鸿蒙 musl 动态链接器拒绝符号链接的已签名 .so）。
#   2) 校验 NEEDED 仅 [libc.musl-aarch64.so.1]，SONAME = libusb-1.0.so.0。
#   3) 复制到 $OUT（项目根 out/）：
#        out/libusb-1.0.so.0.4.0   (真实文件，带完整版本号)
#        out/libusb-1.0.so.0       (soname，pyusb/动态链接器实际解析的名字)
#        out/libusb-1.0.so         (linker name，ctypes find_library('usb-1.0') 兜底)
#   4) 同步进 3 个 HAP 原生库目录（与 libelectron.so 同级，随 HAP 签名安装、可 dlopen）：
#        electron/libs/arm64-v8a/
#        hap_inspect/libs/arm64-v8a/
#        libs/arm64-v8a/
#       harmony-python.js 的 getPythonEnv() 已把这 3 个目录写死进 LD_LIBRARY_PATH，
#       所以任意 .so 丢进去即可被 Python 子进程 dlopen 找到，零额外配置。
#
# 运行环境：Windows + Git Bash（工具链在 D:\DevEco Studio，产物在 E:）。
# ===========================================================================
set -uo pipefail

NDK="D:/DevEco Studio/sdk/default/openharmony/native"
LLVM_BIN="$NDK/llvm/bin"

ROOT="E:/psychopy-experiment"
WORK="$ROOT/ohos_build_usb"
ALPINE="$WORK/alpine"
OUT="$ROOT/out"
mkdir -p "$WORK" "$ALPINE" "$OUT"

READELF="$LLVM_BIN/llvm-readelf.exe"

APK="libusb-1.0.27-r0.apk"
APK_PATH="$ALPINE/$APK"

echo "==> [1/5] 下载 Alpine aarch64 预编译 libusb (musl, 无 udev) ..."
# v3.20 / v3.21 的 main 仓库都带 1.0.27-r0；依次尝试，附 ghproxy 镜像兜底。
MIRRORS=(
  "https://dl-cdn.alpinelinux.org/alpine/v3.20/main/aarch64/$APK"
  "https://dl-cdn.alpinelinux.org/alpine/v3.21/main/aarch64/$APK"
  "https://ghproxy.net/https://dl-cdn.alpinelinux.org/alpine/v3.20/main/aarch64/$APK"
)
downloaded=0
for url in "${MIRRORS[@]}"; do
  echo "  try $url"
  if curl -L --retry 2 --retry-delay 2 --max-time 90 -o "$APK_PATH" "$url" \
     && [ -s "$APK_PATH" ] && [ "$(wc -c < "$APK_PATH")" -gt 1000 ]; then
    echo "  OK: downloaded $(wc -c < "$APK_PATH") bytes"
    downloaded=1
    break
  fi
  echo "  failed, next mirror..."
done
if [ $downloaded -ne 1 ]; then
  echo "ERROR: 所有镜像均下载失败（本环境网络不稳定）。"
  echo "可手动把 $APK 放到 $APK_PATH 后重跑本脚本。"
  exit 1
fi

echo "==> [2/5] 解包 apk（gzipped tar）并定位真实 .so ..."
# Git Bash 会把 "E:/..." 当远程主机(rsh)解析 → 用 cygpath 转成 /e/... 的 Unix 路径
APK_U="$(cygpath -u "$APK_PATH" 2>/dev/null || echo "$APK_PATH")"
ALPINE_U="$(cygpath -u "$ALPINE" 2>/dev/null || echo "$ALPINE")"
# 先清掉旧解包残留，避免拿到过期文件
rm -rf "$ALPINE_U/usr"
tar --force-local -xzf "$APK_U" -C "$ALPINE_U"

REAL=""
for f in "$ALPINE"/usr/lib/libusb-1.0.so.*; do
  [ -f "$f" ] && [ ! -L "$f" ] && REAL="$f"
done
if [ -z "$REAL" ]; then
  echo "ERROR: 未在 $ALPINE/usr/lib 找到真实的 libusb-1.0.so.*（非符号链接）"
  find "$ALPINE" -name 'libusb-1.0*' 2>/dev/null || true
  exit 1
fi
echo "  真实文件: $REAL"

echo "==> [3/5] 校验 NEEDED / SONAME（应仅 musl libc，无 libudev）..."
"$READELF" -d "$REAL" | grep -iE 'NEEDED|SONAME' || true
# 硬性断言：NEEDED 只能有 libc.musl-aarch64.so.1
if "$READELF" -d "$REAL" 2>/dev/null | grep -i 'NEEDED' | grep -qv 'libc.musl-aarch64.so.1'; then
  echo "ERROR: libusb 除了 musl libc 还依赖其它库（如 libudev），不能安全打包！"
  exit 1
fi
echo "  OK: 仅依赖 musl libc，可安全打包。"

echo "==> [4/5] 复制到 out/（真实文件 + soname + linker name）..."
cp -f "$REAL" "$OUT/libusb-1.0.so.0.4.0"
cp -f "$REAL" "$OUT/libusb-1.0.so.0"
cp -f "$REAL" "$OUT/libusb-1.0.so"
ls -la "$OUT"/libusb-1.0.so* | sed 's/.*\(libusb[^ ]*\)/\1/'

echo "==> [5/5] 同步进 3 个 HAP 原生库目录（随 HAP 签名安装、可 dlopen）..."
for d in electron/libs/arm64-v8a hap_inspect/libs/arm64-v8a libs/arm64-v8a; do
  mkdir -p "$ROOT/$d"
  cp -f "$REAL" "$ROOT/$d/libusb-1.0.so.0"
  cp -f "$REAL" "$ROOT/$d/libusb-1.0.so"
  echo "  -> $ROOT/$d"
done

echo "==> DONE"
echo "产物: out/libusb-1.0.so.0(.4.0) 与 out/libusb-1.0.so，并已同步到 3 个 HAP libs/arm64-v8a/。"
echo "Python 侧：harmony-python.js 的 deps 已含 pyusb/pyserial，运行时 pyusb 经 LD_LIBRARY_PATH 找到本 libusb。"
