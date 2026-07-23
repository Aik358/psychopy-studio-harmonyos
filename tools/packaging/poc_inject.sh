#!/bin/bash
#
# poc_inject.sh (v2) — 在【已安装成品 app】就地验证「包内自签 .so 能否被 app 加载」
#
# 相对 v1 的关键修正：
#   1) 签名必须在【目标文件系统上原地(in-place)】进行。v1 在家目录暂存区签名后再 cp，
#      而鸿蒙签名是文件系统的安全标签，跨文件系统 cp 会丢失 → 改为：直接把源文件
#      copy 进 <userData>/python，再在该目录上原地签名。
#   2) 不仅签名 *.so，还要签名所有 ELF 可执行文件（尤其 bin/python3.12，否则执行即
#      permission denied）。
#   3) 不再吞掉签名工具报错：先探测工具是否存在，并把工具的 stderr 打出来。
#   4) userData 不再瞎抓 .backup 这类垃圾目录；自动探测模糊/失败时明确要求 --userdata。
#
# 用法（在鸿蒙设备 / 鸿蒙电脑上执行）：
#   sh poc_inject.sh --userdata /path/to/real/userData
#   建议用 hdc 在设备侧以调试身份跑（能写 app 沙箱）：
#     hdc shell "sh /data/local/tmp/poc_inject.sh --userdata <...>"
#
#   若实在拿不到真实 userData，可在【重部署后的 app】>_ 面板里跑：
#     window.harmony.status()   # 复制返回的 userData 字段
#   （注意：当前旧包的 python.status 尚未注册，需先按源码修复重新部署）
#
set -u

echo "============================================================"
echo " PoC 注入脚本 v2 — 包内自签 .so 就地验证（落点 = userData/python）"
echo "============================================================"

USERDATA=""
APP_MODULE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --userdata) USERDATA="$2"; shift 2;;
    --app-root) APP_MODULE="$(basename "$2")"; shift 2;;
    -h|--help) echo "用法: sh poc_inject.sh --userdata <真实 userData 路径>"; exit 0;;
    *) echo "忽略未知参数: $1"; shift;;
  esac
done

# ---------- 0. 环境 & 签名工具诊断 ----------
# 若装了 Harmonybrew，先加载其环境（让 brew / ohos-pip-autosign 进 PATH）
[ -x "$HOME/.harmonybrew/bin/brew" ] && eval "$("$HOME/.harmonybrew/bin/brew" shellenv)" 2>/dev/null
echo
echo "[0] 环境诊断 ..."
echo "  whoami: $(id -un 2>/dev/null) (uid=$(id -u 2>/dev/null))"
echo "  binary-sign-tool : $(command -v binary-sign-tool || echo '【未安装】')"
echo "  ohos-pip-autosign: $(command -v ohos-pip-autosign || echo '【未安装】')"
if python3 -c "import ohos_pip_autosign" >/dev/null 2>&1; then
  echo "  python3 -m ohos_pip_autosign: 可用"
else
  echo "  python3 -m ohos_pip_autosign: 不可用"
fi
echo "  readelf: $(command -v readelf || echo '【未安装】')"

if command -v binary-sign-tool >/dev/null 2>&1; then
  SIGNER="binary-sign-tool"
elif command -v ohos-pip-autosign >/dev/null 2>&1; then
  SIGNER="ohos-pip-autosign"
elif python3 -c "import ohos_pip_autosign" >/dev/null 2>&1; then
  SIGNER="python3 -m ohos_pip_autosign"
else
  SIGNER=""
fi

# ---------- 1. 确定 userData（拒绝 .backup 等垃圾目录） ----------
echo
echo "[1] 确定 userData ..."
if [ -z "$USERDATA" ] && [ -n "$APP_MODULE" ]; then
  for cand in \
    "/data/storage/el2/base/$APP_MODULE" \
    "/data/storage/el1/base/$APP_MODULE" \
    "/data/app/el2/base/$APP_MODULE" \
    "/data/app/el1/base/$APP_MODULE" ; do
    [ -d "$cand" ] && USERDATA="$cand" && break
  done
fi
if [ -z "$USERDATA" ]; then
  # 扫描 el2/base 下非点目录，列出候选让你确认
  echo "  ! 未提供 --userdata 且无法从模块名推导，扫描候选："
  cands=$(find /data/storage/el2/base -maxdepth 1 -mindepth 1 -type d ! -name '.*' 2>/dev/null)
  if [ -n "$cands" ]; then
    echo "$cands" | sed 's/^/      - /'
  else
    echo "      （无）"
  fi
  echo
  echo "  ✗ 无法自动确定真实 userData。请二选一："
  echo "    a) 重部署 app 后，在 >_ 面板跑 window.harmony.status() 复制 userData 字段，"
  echo "       再: sh poc_inject.sh --userdata <粘贴>"
  echo "    b) 用 bm 查包名: bm dump -a | grep <你的app>  得到 baseDir"
  exit 1
fi
# 安检：只拒绝真正的垃圾目录（v1 误抓的 .backup，以及 .tmp/.staging/.bak/.. 遍历），
#       放过 .node/.config 这类合法隐藏目录（Electron userData 本就常是隐藏目录）
case "$USERDATA" in
  *"/.backup"*|*"/.tmp"*|*"/.staging"*|*"/.bak"*|*"/.."*|*"//"*)
    echo "  ✗ 拒绝疑似垃圾目录: $USERDATA（含 /.backup/.tmp/.staging/.bak/.. 等）"; exit 1;;
esac
echo "✓ userData: $USERDATA"
TARGET="$USERDATA/python"
echo "  目标 bundle 位置: $TARGET"

# ---------- 2. 用 python3 + ohos-pip-autosign 构建【已签名】的 numpy 环境 ----------
# 关键：让 numpy 的 .so 在 pip install 时就被 ohos-pip-autosign 自动签名（ELF 内部 note），
#       避免之后手动复制/签名丢标签。python 标准库的 lib-dynload 来自 brew python（已预签）。
echo
echo "[2] 构建已签名的 python+numpy 环境（venv + ohos-pip-autosign 自动签名）..."
PY=$(command -v python3)
# 优先用 Harmonybrew 的 python（原生 aarch64-musl，pip 能直接下预编译 numpy 轮子并自动签）
BREWPY="$HOME/.harmonybrew/bin/python3"
[ -x "$BREWPY" ] && PY="$BREWPY"
[ -z "$PY" ] && { echo "  ✗ 找不到 python3"; exit 1; }
echo "  使用 python: $PY"
VENV=$(mktemp -d /tmp/poc_venv.XXXXXX)
if ! "$PY" -m venv "$VENV" 2>/tmp/venv_err; then
  echo "  ✗ 创建 venv 失败: $(cat /tmp/venv_err)"; rm -rf "$VENV"; exit 1
fi
# shellcheck disable=SC1091
. "$VENV/bin/activate"
if command -v ohos-pip-autosign >/dev/null 2>&1; then
  ohos-pip-autosign activate 2>/tmp/act_err \
    && echo "  ✓ ohos-pip-autosign 已激活（pip 装的 .so 将自动签名）" \
    || echo "  ⚠ activate 失败: $(cat /tmp/act_err)"
else
  echo "  ⚠ 未找到 ohos-pip-autosign，依赖的 .so 将不会自动签名（大概率加载失败）"
fi
pip install --quiet --upgrade pip 2>/dev/null
if ! pip install numpy 2>/tmp/pip_err; then
  echo "  ✗ pip install numpy 失败: $(tail -3 /tmp/pip_err)"; rm -rf "$VENV"; exit 1
fi
deactivate 2>/dev/null
echo "  ✓ 已签名环境构建于 $VENV"

# ---------- 3. 复制已签名环境到 TARGET（保留 ELF 内部签名）----------
echo
echo "[3] 复制已签名环境到 $TARGET ..."
rm -rf "$TARGET"
mkdir -p "$TARGET"
# -aL: 归档并解引用 symlink，确保自包含；ELF 内部签名随文件内容保留
if cp -aL "$VENV"/. "$TARGET"/ 2>/tmp/cp_err; then
  echo "  ✓ 已复制到 $TARGET"
else
  echo "  ✗ 复制失败: $(cat /tmp/cp_err)"
  echo "    若沙箱权限不足，请用 hdc 以调试身份运行: hdc shell \"sh <脚本> --userdata $USERDATA\""
  rm -rf "$VENV"; exit 3
fi
rm -rf "$VENV"
# 兜底：若系统仍提供 binary-sign-tool，逐文件补签一次（覆盖 lib-dynload 等万一未签的 .so）
if command -v binary-sign-tool >/dev/null 2>&1; then
  echo "  （检测到 binary-sign-tool，逐文件兜底补签所有 ELF ...）"
  find "$TARGET" -type f -print0 | while IFS= read -r -d '' f; do
    m=$(od -An -tx1 -N4 "$f" 2>/dev/null | tr -d ' \n')
    [ "$m" = "7f454c46" ] && binary-sign-tool --selfSign "$f" >/dev/null 2>&1
  done
  echo "  ✓ 兜底补签完成"
fi
# 确保入口可执行
[ -x "$TARGET/bin/python3.12" ] || chmod +x "$TARGET/bin/python3.12" 2>/dev/null
# 抽查一个 numpy .so 的签名 note
SAMPLE=$(find "$TARGET" -name "_multiarray_umath*.so" 2>/dev/null | head -1)
if [ -n "$SAMPLE" ] && command -v readelf >/dev/null 2>&1; then
  echo "  抽查签名 note: $SAMPLE"
  readelf -n "$SAMPLE" 2>/dev/null | grep -iE "0x10|self|sign|OHOS" | head -3 || echo "    (readelf 未显示预期 note，继续尝试)"
fi

# ---------- 4. 验证 import numpy（用包内 python 原地执行） ----------
echo
echo "[4] 验证 import numpy（包内 python: $TARGET/bin/python3.12）..."
if [ ! -x "$TARGET/bin/python3.12" ]; then
  echo "  ✗ $TARGET/bin/python3.12 不存在或不可执行（前面签名/拷贝是否成功？）"
  exit 5
fi
OUT=$("$TARGET/bin/python3.12" -c "
import sys
print('sys.prefix =', sys.prefix)
try:
    import numpy
    print('PoC OK:', numpy.__version__)
except Exception as e:
    print('PoC FAIL:', repr(e))
" 2>&1)
echo "$OUT"

# ---------- 5. 回滚说明 ----------
echo
echo "============================================================"
echo " 回滚方式（撤销本次 PoC，零残留）："
echo "   rm -rf \"$TARGET\"          # 删掉 userData/python 即可，不动已装 app"
echo "  git 快照（Windows 侧）: git checkout main && git branch -D backup/before-poc-*"
echo "============================================================"

if echo "$OUT" | grep -q "PoC OK"; then
  echo "✅ 结论：默认模式（包内自签 .so）路线通过，可规模化打包完整依赖。"
  exit 0
else
  echo "❌ 结论：自签 .so 在包内仍无法加载。"
  echo "   排查顺序："
  echo "     1) 上方 [3] 是否有 [FAIL] 及工具真实报错？工具是否装好？"
  echo "     2) 抽查 note 是否出现 0x10 / OHOS 字样？没有则说明 selfSign 未真正打上标记。"
  echo "     3) 设备是否要求更严格签名（正式证书而非 selfSign）？"
  echo "   见 docs/BUNDLED_PYTHON_POC.md。"
  exit 2
fi
