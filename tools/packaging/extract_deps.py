#!/usr/bin/env python3
"""
extract_deps.py — 从「被移植端」(Windows 官方 PsychoPy Studio) 提取鸿蒙打包所需的依赖清单。

两种来源：
  1. --asar PATH/app.asar            解包官方 Windows 版，扫描其内置 site-packages
  2. --conda-env PATH/psychopy       直接读 conda 开发环境的 pip freeze

输出（写入 --out 目录，默认脚本同级）：
  requirements-bundle.txt   顶层依赖及版本（pip 可直接安装 / 核对）
  NATIVE_PACKAGES.txt       含 C 扩展(.so/.pyd)的包 —— 鸿蒙端必须用 aarch64 版并自签

用法：
  python extract_deps.py --conda-env "C:/Users/JH Z/.conda/envs/psychopy"
  python extract_deps.py --asar "C:/Program Files/PsychoPy Studio/resources/app.asar"
"""
import argparse, os, re, shutil, subprocess, sys

# 这些包在鸿蒙端需要 aarch64 原生轮子（Windows 源里对应 .pyd / 自身含 .so）
NATIVE_HINTS = re.compile(
    r"(numpy|scipy|pandas|matplotlib|opencv|cv2|av|pyo|pyaudio|sounddevice|"
    r"lxml|pillow|PIL|psutil|watchdog|cython|pyyaml|greenlet|websockets|zmq|"
    r"pyzmq|h5py|scikit|numexpr|tables|regex|pywin|comtypes|cffi|pynput|"
    r"moviepy|imageio|OpenCV|blosc|numcodecs|pytables|pyobjc|wxpython|mediapipe)",
    re.I,
)


def from_conda(env_path, out_dir):
    py = os.path.join(env_path, "python.exe")
    if not os.path.exists(py):
        py = os.path.join(env_path, "Scripts", "python.exe")
    if not os.path.exists(py):
        py = shutil.which("python") or sys.executable
    print(f"[extract_deps] using python: {py}")
    try:
        out = subprocess.check_output([py, "-m", "pip", "freeze"], text=True)
    except subprocess.CalledProcessError as e:
        print("pip freeze failed:", e, file=sys.stderr)
        sys.exit(1)
    pkgs = [l.strip() for l in out.splitlines() if l.strip() and not l.startswith("#")]
    write_lists(pkgs, out_dir)


def extract_asar(asar_path, out_dir, work=None):
    work = work or os.path.join(out_dir, "_asar_extract")
    asar_cmd = None
    if shutil.which("asar"):
        asar_cmd = ["asar"]
    elif shutil.which("npx"):
        asar_cmd = ["npx", "-y", "@electron/asar"]
    if not asar_cmd:
        print("需要 asar 工具: 安装 `npm i -g @electron/asar` 或确保 npx 可用", file=sys.stderr)
        sys.exit(1)
    os.makedirs(work, exist_ok=True)
    print("[extract_deps] extracting asar (this is slow, ~200MB)...")
    subprocess.check_call(asar_cmd + ["extract", asar_path, work])
    sp = None
    for root, dirs, _ in os.walk(work):
        if os.path.basename(root) == "site-packages":
            sp = root
            break
    if not sp:
        print("未在 asar 中找到 site-packages", file=sys.stderr)
        sys.exit(1)
    pkgs = []
    for name in os.listdir(sp):
        if name.endswith(".dist-info") or name.endswith(".egg-info"):
            pkgs.append(name.split("-")[0])
        elif name.endswith(".egg-link"):
            pkgs.append(name.split(".")[0])
    if not pkgs:
        pkgs = [n for n in os.listdir(sp) if os.path.isdir(os.path.join(sp, n)) and not n.startswith("_")]
    write_lists(sorted(set(pkgs)), out_dir)


def write_lists(pkgs, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    req = os.path.join(out_dir, "requirements-bundle.txt")
    native = os.path.join(out_dir, "NATIVE_PACKAGES.txt")
    with open(req, "w") as f:
        for p in sorted(pkgs):
            f.write(p + "\n")
    natives = sorted({p for p in pkgs if NATIVE_HINTS.search(p)})
    with open(native, "w") as f:
        for p in natives:
            f.write(p + "\n")
    print(f"[extract_deps] wrote {len(pkgs)} packages -> {req}")
    print(f"[extract_deps] {len(natives)} native packages -> {native}")


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--conda-env", help="conda 环境路径 (含 python.exe)")
    g.add_argument("--asar", help="Windows 官方 app.asar 路径")
    ap.add_argument("--out", default=os.path.dirname(os.path.abspath(__file__)), help="输出目录")
    args = ap.parse_args()
    if args.conda_env:
        from_conda(args.conda_env, args.out)
    else:
        extract_asar(args.asar, args.out)


if __name__ == "__main__":
    main()
