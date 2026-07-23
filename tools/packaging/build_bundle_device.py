import os, subprocess, tarfile, shutil, time
SRC="/data/service/hnp/python.org/python_3.12"
UD="/data/storage/el2/base/files/psychopy4/.node"
TGT=os.path.join(UD,"python")
BST="/data/service/hnp/bin/binary-sign-tool"
SPY=os.path.join(SRC,"bin","python3.12")
REQS=["numpy"]
LF=os.path.join(UD,"build_bundle.log")
logf=open(LF,"w")
def log(*a):
    print(*a,file=logf,flush=True)
log("start",time.strftime("%F %T"),"SRC",SRC,"TGT",TGT)
if os.path.isdir(TGT):
    shutil.rmtree(TGT)
def cp(s,d):
    try:
        shutil.copyfile(s,d); shutil.copymode(s,d)
    except OSError as e:
        log("warn",s,e)
shutil.copytree(SRC,TGT,symlinks=False,copy_function=cp)
log("copytree done")
SP=os.path.join(TGT,"lib","python3.12","site-packages")
os.makedirs(SP,exist_ok=True)
r=subprocess.run([SPY,"-m","pip","install","--quiet","--target",SP]+REQS,capture_output=True,text=True,timeout=600)
log("pip rc",r.returncode)
if r.returncode!=0:
    log("PIPERR",r.stderr[-2000:])
n=0
for root,_,files in os.walk(TGT):
    for f in files:
        p=os.path.join(root,f)
        if os.path.islink(p):
            continue
        try:
            h=open(p,"rb").read(4)
        except Exception:
            continue
        if h[:1]==b"\x7f" and h[1:4]==b"ELF":
            sr=subprocess.run([BST,"--selfSign",p],capture_output=True,text=True,timeout=30)
            if sr.returncode!=0:
                log("SIGNF",p,sr.stderr[-200:])
            else:
                n+=1
log("signed",n)
env=dict(os.environ); env["PYTHONPATH"]=SP
r=subprocess.run([SPY,"-c","import numpy;print('PoC OK',numpy.__version__)"],capture_output=True,text=True,timeout=60,env=env)
log("VERIFY",repr(r.stdout),repr(r.stderr[-500:]),"rc",r.returncode)
tgz=os.path.join(UD,"python-bundle.tar.gz")
with tarfile.open(tgz,"w:gz") as tf:
    tf.add(TGT,arcname="python")
log("tar",os.path.getsize(tgz),"bytes")
subprocess.Popen([SPY,"-m","http.server","8125","--directory",UD],
    stdout=open(os.path.join(UD,"httpd.log"),"w"),stderr=subprocess.STDOUT,start_new_session=True)
log("http :8125")
log("Windows: curl -o out/python-bundle.tar.gz http://127.0.0.1:8125/python-bundle.tar.gz")
log("end")
