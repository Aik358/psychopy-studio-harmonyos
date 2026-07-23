#!/usr/bin/env python3
"""
prepare_bundle.py — 在 Windows/macOS 上组织「包内自包含 Python」目录，并生成待签名清单。

输入：
  --source-site-packages  Windows 源 site-packages (来自 asar 解包或 conda env)
  --bundle                python-bundle/ 目录 (默认本脚本同级)

行为：
  * 复制「纯 Python」包 (无 .so/.pyd) 到 bundle/lib/python3.12/site-packages/
  * 含原生扩展的包写入 BINARIES_TO_SIGN.txt —— 这些需从鸿蒙 brew 获取 aarch64 轮子，
    放进 bundle 后用 sign_bundle.sh 自签
  * 生成 bundle/bin/activate_bundle.sh 便于手动/调试设置 PYTHONHOME / PYTHONPATH

重要：Windows 的 .pyd 不能直接用于鸿蒙！含原生扩展的包必须替换为 aarch64 版。
"""
import argparse, os, shutil, sys


def has_native(sp_pkg):
    for root, _, files in os.walk(sp_pkg):
        for f in files:
            if f.endswith((".so", ".pyd", ".dylib")):
                return True
    return False


def copy_pure(source_sp, bundle_sp, native_out):
    natives = []
    for name in sorted(os.listdir(source_sp)):
        src = os.path.join(source_sp, name)
        if not os.path.isdir(src):
            continue
        if name.endswith((".dist-info", ".egg-info", ".egg-link")):
            continue
        if has_native(src):
            natives.append(name)
            print(f"[prepare] SKIP native pkg (need aarch64): {name}")
            continue
        dst = os.path.join(bundle_sp, name)
        print(f"[prepare] copy pure  : {name}")
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    with open(native_out, "w") as f:
        for n in sorted(set(natives)):
            f.write(n + "\n")
    print(f"[prepare] {len(natives)} native pkgs listed -> {native_out}")


def write_activator(bundle_dir):
    sh = os.path.join(bundle_dir, "bin", "activate_bundle.sh")
    os.makedirs(os.path.dirname(sh), exist_ok=True)
    content = """#!/bin/sh
# 调试用：让本 bundle 的 python 成为默认
BUNDLE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PYTHONHOME="$BUNDLE_ROOT"
export PYTHONPATH="$BUNDLE_ROOT/lib/python3.12/site-packages"
export PATH="$BUNDLE_ROOT/bin:$PATH"
echo "PYTHONHOME=$PYTHONHOME"
"""
    with open(sh, "w") as f:
        f.write(content)
    print(f"[prepare] wrote {sh}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-site-packages", required=True,
                    help="Windows 源 site-packages 路径")
    ap.add_argument("--bundle", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "python-bundle"))
    args = ap.parse_args()
    bundle_sp = os.path.join(args.bundle, "lib", "python3.12", "site-packages")
    os.makedirs(bundle_sp, exist_ok=True)
    native_out = os.path.abspath(os.path.join(args.bundle, "..", "BINARIES_TO_SIGN.txt"))
    copy_pure(args.source_site_packages, bundle_sp, native_out)
    write_activator(args.bundle)
    print("\n下一步：在鸿蒙设备获取 aarch64 原生轮子放入 site-packages，然后运行 sign_bundle.sh")


if __name__ == "__main__":
    main()
