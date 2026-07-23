import os, subprocess, sys

UD = "/data/storage/el2/base/files/psychopy4/.node"
TARGET = os.path.join(UD, "python")
SRC = "/data/service/hnp/python.org/python_3.12"
BST = "/data/service/hnp/bin/binary-sign-tool"
LOGF = os.path.join(UD, "poc_build.log")

logf = open(LOGF, "w")
def log(*a):
    print(*a, file=logf, flush=True)

log("=== PoC build start ===")
log("SRC =", SRC)
log("TARGET =", TARGET)

# 1) Copy HNP python into userData/python.
#    symlinks=False dereferences symlinks into plain files, avoiding the
#    app-sandbox "Permission denied" on symlink creation (venv's lib64->lib).
if os.path.isdir(TARGET):
    import shutil
    shutil.rmtree(TARGET)

def safe_copy(src, dst):
    try:
        shutil.copyfile(src, dst)
        shutil.copymode(src, dst)
    except OSError as e:
        log("copy warn:", src, e)

if os.path.isdir(SRC):
    shutil.copytree(SRC, TARGET, symlinks=False, copy_function=safe_copy)
    log("copytree done")
else:
    log("SRC MISSING:", SRC)
    sys.exit(1)

VPY = os.path.join(TARGET, "bin", "python3.12")
if not os.path.isfile(VPY):
    VPY = os.path.join(TARGET, "bin", "python3")
log("VPY =", VPY)

# 2) pip install numpy into the copied python
r = subprocess.run([VPY, "-m", "pip", "install", "--quiet", "numpy"], capture_output=True, text=True, timeout=300)
log("pip numpy rc=", r.returncode)
if r.returncode != 0:
    log("PIP FAIL:", r.stderr[-1500:])

# 3) self-sign every ELF (including python runtime's own .so)
signed = 0
for root, _, files in os.walk(TARGET):
    for f in files:
        p = os.path.join(root, f)
        try:
            if os.path.islink(p):
                continue
            with open(p, "rb") as fh:
                head = fh.read(4)
        except Exception:
            continue
        if head[0] == 0x7f and head[1:4] == b"ELF":
            sr = subprocess.run([BST, "--selfSign", p], capture_output=True, text=True, timeout=30)
            if sr.returncode != 0:
                log("SIGN FAIL:", p, sr.stderr[-300:])
            else:
                signed += 1
log("signed ELF count =", signed)

# 4) verify
r = subprocess.run([VPY, "-c", "import numpy; print('PoC OK:', numpy.__version__)"], capture_output=True, text=True, timeout=60)
log("VERIFY stdout:", r.stdout)
log("VERIFY stderr:", r.stderr[-800:])
log("VERIFY rc=", r.returncode)
log("=== PoC build end ===")
