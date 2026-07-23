#!/bin/sh
# sign_bundle.sh — 在鸿蒙设备端对「包内 Python bundle」递归自签所有原生库。
# 必须在已通过终端/adb 进入设备、且 bundle 已部署到可读写位置后运行。
#
# 签名工具（脚本自动检测其一）：
#   * binary-sign-tool  (SDK 自带；--selfSign 打占位标记，系统放行，无需正式证书)
#   * ohos-pip-autosign (harmonybrew 装的 pip 包装器)
#
# 用法：
#   sh sign_bundle.sh /path/to/python-bundle
set -e
BUNDLE="${1:-.}"
echo "==> Signing all .so under: $BUNDLE"

SIGNER=""
if command -v binary-sign-tool >/dev/null 2>&1; then
  SIGNER="binary-sign-tool"
elif command -v ohos-pip-autosign >/dev/null 2>&1; then
  SIGNER="ohos-pip-autosign"
else
  echo "ERROR: 找不到 binary-sign-tool 或 ohos-pip-autosign，请先安装其一。" >&2
  exit 1
fi
echo "==> Signer: $SIGNER"

count=0
find "$BUNDLE" -type f -name "*.so" | while read -r f; do
  case "$SIGNER" in
    binary-sign-tool)
      binary-sign-tool --selfSign --in "$f" --out "$f" 2>/dev/null \
        || binary-sign-tool --sign --in "$f" --out "$f" 2>/dev/null \
        || echo "WARN: sign failed: $f"
      ;;
    ohos-pip-autosign)
      ohos-pip-autosign "$f" 2>/dev/null || echo "WARN: sign failed: $f"
      ;;
  esac
  count=$((count + 1))
  echo "signed ($count): $f"
done
echo "==> Done. $(find "$BUNDLE" -name '*.so' | wc -l) .so files present."
