#!/usr/bin/env python3
"""
Liaison Shim 鈥?Pure Python WebSocket liaison replacement for HarmonyOS.
Does NOT depend on rpds-py / maturin / Rust.

Protocol compatible with PsychoPy's liaison.js:
  - On start: prints "LIAISON_START@<address>" to stdout
  - WebSocket JSON-RPC: receives {command: {...}, id: "uuid"}
  - Replies: {response: ..., evt: {id: "uuid"}} or {error: {...}}

Usage:
    python3 liaison_shim.py
"""

import os
import sys
import json
import importlib
import importlib
import asyncio
import socket
import traceback

# 鈹€鈹€ Environment 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
os.environ['PSYCHOPY_NO_GUI'] = '1'
os.environ['MPLBACKEND'] = 'Agg'
# Prevent OpenBLAS from spawning threads that trigger SECCOMP violations on HarmonyOS
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
os.environ['OPENBLAS_MAIN_FREE'] = '1'

# 鈹€鈹€ 楦胯挋娌欑鍙啓璺緞 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
# Psychopy preferences.py 鐢?os.environ['HOME'] + '.psychopy3' 鏋勯€?userPrefsDir
# 锛堜笉璇?PSYCHOPY_HOME锛夛紝榛樿 ~ 鍗?/storage/Users/currentUser 楦胯挋娌欑鎷掔粷鍐欍€?
# 鎶?HOME 閲嶅畾鍚戝埌娌欑鍙啓鐩綍锛宒evices.json / userPrefs.cfg 閮戒細钀借繖閲屻€?
# MPLCONFIGDIR 鍚岀悊 鈥?matplotlib 鐢?~ 鎴栬鍙橀噺鏋勯€犵紦瀛樼洰褰曘€?
_HARMONY_SANDBOX = "/data/storage/el2/base/cache"
os.makedirs(os.path.join(_HARMONY_SANDBOX, "home"), exist_ok=True)
os.environ['HOME'] = os.path.join(_HARMONY_SANDBOX, "home")
os.makedirs(os.path.join(_HARMONY_SANDBOX, "matplotlib"), exist_ok=True)
os.environ['MPLCONFIGDIR'] = os.path.join(_HARMONY_SANDBOX, "matplotlib")

# 鈹€鈹€ platform.system() 楦胯挋琛ヤ竵 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
# psychopy preferences.py 琛?161 鐢?platform.system() + '.spec' 鎵?spec 鏂囦欢
# 楦胯挋杩斿洖 'HarmonyOS' 浣?preferences 鐩綍鍙湁 Darwin/FreeBSD/Linux/Windows.spec
# 鈫?鎵句笉鍒?HarmonyOS.spec 鈫?prefsSpec 绌?鈫?validate 鏃犻粯璁?鈫?cfg['general'] KeyError
# 楦胯挋 POSIX 鍏煎锛孡inux.spec 鍐呭閫傜敤锛屾墦琛ヤ竵璁?platform.system() 杩斿洖 'Linux'
import platform as _platform
_platform.system = lambda *a, **kw: 'Linux'
# 鍚屾椂鏀?platform 骞冲彴鍚嶏紙鏌愪簺搴撶敤 sys.platform=='linux' 鍒ゅ畾锛岄缚钂欐湰鏉ュ氨鏄級
# 鈹€鈹€ 棰勭疆鏈€灏?userPrefs.cfg 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
# preferences.loadUserPrefs() 鍔犺浇 userPrefs.cfg 鏃惰嫢鏂囦欢涓嶅瓨鍦?绌?cfg 娌?section
# 鈫?loadAll 琛?309 self.userPrefsCfg['general'] 鎶?KeyError 鈫?import psychopy 澶辫触
# 棰勭疆鍚叏閮?8 涓繀闇€ section 鐨勬渶灏?cfg 鍒版矙绠卞彲鍐欑洰褰曪紝璁╅娆″惎鍔ㄤ篃鑳?import
_HARMONY_HOME = os.environ['HOME']
_HARMONY_PREFS_DIR = os.path.join(_HARMONY_HOME, '.psychopy3')
os.makedirs(_HARMONY_PREFS_DIR, exist_ok=True)
_HARMONY_PREFS_FILE = os.path.join(_HARMONY_PREFS_DIR, 'userPrefs.cfg')
_DEFAULT_PREFS = """[general]
units = norm
fullscr = True
allowGUI = True
quitKey = escape
paths = list()
# 鈫?psychopy/__init__.py:124 璇?prefs.general['paths'] 寰幆娣诲姞 site 璺緞锛岀己姝ら敭鎶?KeyError

[app]
resetPrefs = False
showWarnings = True
theme = light

[coder]
defaultView = Coder

[builder]
defaultView = Builder

[hardware]
audioLib = ptb

[piloting]

[connections]

[keyBindings]
"""
# 鍐欐垨鏇存柊 userPrefs.cfg 鈥?纭繚 [general] 娈垫湁 paths 閿?
# 鏃?HAP 鍒涘缓鐨勬枃浠剁己 paths 閿紝file exists 璺宠繃瀵艰嚧淇涓嶇敓鏁?
try:
    if os.path.isfile(_HARMONY_PREFS_FILE):
        # 璇荤幇鏈夋枃浠讹紝琛ョ己閿?
        with open(_HARMONY_PREFS_FILE, 'r', encoding='utf-8') as f:
            _lines = f.readlines()
        _needs_paths = True
        _in_general = False
        for _line in _lines:
            if _line.strip() == '[general]':
                _in_general = True
            elif _line.startswith('['):
                _in_general = False
            elif _in_general and _line.strip().startswith('paths'):
                _needs_paths = False
                break
        if _needs_paths:
            # 鍦?[general] 娈垫湯灏惧姞 paths = list()
            _new_lines = []
            _in_general = False
            _general_done = False
            for _line in _lines:
                if _line.strip() == '[general]':
                    _in_general = True
                    _new_lines.append(_line)
                elif _line.startswith('[') and _in_general and not _general_done:
                    _new_lines.append('paths = list()\n')
                    _new_lines.append(_line)
                    _in_general = False
                    _general_done = True
                elif _line.startswith('['):
                    _in_general = False
                    _new_lines.append(_line)
                elif _in_general and not _general_done:
                    _new_lines.append(_line)
                else:
                    _new_lines.append(_line)
            with open(_HARMONY_PREFS_FILE, 'w', encoding='utf-8') as f:
                f.writelines(_new_lines)
            print(f"[liaison-shim] Added 'paths' key to userPrefs.cfg [general]", flush=True)
    else:
        with open(_HARMONY_PREFS_FILE, 'w', encoding='utf-8') as f:
            f.write(_DEFAULT_PREFS)
except Exception as _e:
    print(f"[liaison-shim] WARNING: Failed to write/update userPrefs.cfg: {_e}", flush=True)

# 鈹€鈹€ Add site-packages to sys.path 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
_HARMONY_SITE_PATHS = [
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/site-packages",
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/dist-packages",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"),
    "/data/data/com.example.electron/files/python/lib/python3.12/site-packages",
    # json_tricks 绛夌敤鎴?pip 瀹夎鐨勫寘鍦?~/.local 涓?
    # 鈽?涓嶈兘鐢?os.path.expanduser("~") 鈥?鍓嶉潰 HOME 宸查噸瀹氬悜鍒版矙绠?
    # ~ 浼氬睍寮€鍒?/data/storage/el2/base/cache/home 鑰岄潪鐢ㄦ埛鐪?home
    # 鐪熻矾寰勬槸 /storage/Users/currentUser/.local/lib/python3.12/site-packages
    "/storage/Users/currentUser/.local/lib/python3.12/site-packages",
    "/storage/Users/currentUser/.local/lib/python3.12/dist-packages",
]
for _p in _HARMONY_SITE_PATHS:
    if os.path.isdir(_p) and _p not in sys.path:
        # Append bundled lib AFTER stdlib to avoid shadowing (e.g. logging.py 鈫?stdlib)
        if _p.endswith("lib") and "site-packages" not in _p and "dist-packages" not in _p:
            sys.path.append(_p)
        else:
            sys.path.insert(0, _p)
    elif os.path.isdir(_p) and _p in sys.path:
        pass  # already in path
    else:
        print(f"[liaison-shim] DEBUG _HARMONY_SITE_PATHS skip: {_p} exists={os.path.isdir(_p)} in_path={_p in sys.path}", flush=True)
print(f"[liaison-shim] DEBUG sys.path[0:5]={sys.path[:5]}", flush=True)

# 鈹€鈹€ Monkey-patch missing GUI modules 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
import types

def _mock_module(name, **attrs):
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules[name] = mod
    return mod

# 鈹€鈹€ json_tricks 杩愯鏃跺洖閫€锛圚AP 婕忔墦鍖?json_tricks/ 鐩綍锛夆攢鈹€
# 宓屽叆 json_tricks v3.17.3 鍏?9 鏂囦欢婧愮爜锛?3KB 鈫?lzma 13.7KB 鈫?b64 18.3KB锛?
# import json_tricks 澶辫触鏃惰В鍘嬫敞鍏?sys.modules
_JSON_TRICKS_B64 = (
    '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'
)
_JSON_TRICKS_META = [('__init__.py', 0, 1559), ('_version.py', 1559, 21), ('comment.py', 1580, 979), ('decoders.py', 2559, 12125), ('encoders.py', 14684, 17441), ('nonp.py', 32125, 13261), ('np.py', 45386, 1252), ('np_utils.py', 46638, 348), ('utils.py', 46986, 6805)]
_JSON_TRICKS_VERSION = "3.17.3"

def _inject_json_tricks():
    import lzma, base64, types, sys
    blob = lzma.decompress(base64.b64decode(b"".join(_JSON_TRICKS_B64)))
    pkg = types.ModuleType("json_tricks")
    pkg.__file__ = __file__
    pkg.__package__ = "json_tricks"
    pkg.__path__ = []
    pkg.__version__ = _JSON_TRICKS_VERSION
    for fname, off, sz in _JSON_TRICKS_META:
        src_bytes = blob[off:off+sz]
        mod_name = "json_tricks." + fname.replace(".py", "")
        sub = types.ModuleType(mod_name)
        sub.__file__ = __file__
        sub.__package__ = "json_tricks"
        src_str = src_bytes.decode("utf-8")
        # inject json_tricks parent first so relative imports work
        if "json_tricks" not in sys.modules:
            sys.modules["json_tricks"] = pkg
        exec(src_str, sub.__dict__)
        sys.modules[mod_name] = sub
        attr = fname.replace(".py", "")
        if attr == "__init__":
            pkg.__dict__.update(sub.__dict__)
        else:
            setattr(pkg, attr, sub)
    sys.modules["json_tricks"] = pkg
    return pkg

try:
    import json_tricks
except ImportError:
    _inject_json_tricks()
    import json_tricks
    print("[liaison-shim] json_tricks loaded from inline fallback (v" + json_tricks.__version__ + ")", flush=True)

# 鈹€鈹€ astunparse 杩愯鏃跺洖閫€锛圚AP 鏋勫缓鍙兘婕忔墦鍖?astunparse 鐩綍锛夆攢鈹€鈹€鈹€
# astunparse 鏄函 Python 鍖咃紝v1.6.3锛屽祵鍏ヤ互涓嬫簮鐮佺‘淇濊澶囩鍙敤
import textwrap, importlib, sys as _sys
_ASTUNPARSE_SOURCE = {
    "__init__.py": textwrap.dedent("""\
    # coding: utf-8
    from __future__ import absolute_import
    from six.moves import cStringIO
    from .unparser import Unparser
    from .printer import Printer
    __version__ = '1.6.3'
    def unparse(tree):
        v = cStringIO()
        Unparser(tree, file=v)
        return v.getvalue()
    def dump(tree):
        v = cStringIO()
        Printer(file=v).visit(tree)
        return v.getvalue()
    """),
    "printer.py": textwrap.dedent("""\
    from __future__ import unicode_literals
    import sys, ast, six
    class Printer(ast.NodeVisitor):
        def __init__(self, file=sys.stdout, indent="  "):
            self.indentation = 0
            self.indent_with = indent
            self.f = file
        def visit(self, node):
            super(Printer, self).visit(node)
        def write(self, text):
            self.f.write(six.text_type(text))
        def generic_visit(self, node):
            if isinstance(node, list):
                nodestart = "["; nodeend = "]"
                children = [("", child) for child in node]
            else:
                nodestart = type(node).__name__ + "("; nodeend = ")"
                children = [(name + "=", value) for name, value in ast.iter_fields(node)]
            if len(children) > 1: self.indentation += 1
            self.write(nodestart)
            for i, pair in enumerate(children):
                attr, child = pair
                if len(children) > 1: self.write("\\n" + self.indent_with * self.indentation)
                if isinstance(child, (ast.AST, list)): self.write(attr); self.visit(child)
                else: self.write(attr + repr(child))
                if i != len(children) - 1: self.write(",")
            self.write(nodeend)
            if len(children) > 1: self.indentation -= 1
    """),
    "unparser.py": textwrap.dedent("""\
    from __future__ import print_function, unicode_literals
    import six, sys, ast, os, tokenize
    from six import StringIO
    INFSTR = "1e" + repr(sys.float_info.max_10_exp + 1)
    def interleave(inter, f, seq):
        seq = iter(seq)
        try: f(next(seq))
        except StopIteration: pass
        else:
            for x in seq: inter(); f(x)
    class Unparser:
        def __init__(self, tree, file = sys.stdout):
            self.f = file; self.future_imports = []; self._indent = 0
            self.dispatch(tree); print("", file=self.f); self.f.flush()
        def fill(self, text = ""): self.f.write("\\n"+"    "*self._indent + text)
        def write(self, text): self.f.write(six.text_type(text))
        def enter(self): self.write(":"); self._indent += 1
        def leave(self): self._indent -= 1
        def dispatch(self, tree):
            if isinstance(tree, list):
                for t in tree: self.dispatch(t); return
            meth = getattr(self, "_"+tree.__class__.__name__); meth(tree)
        def _Module(self, tree):
            for stmt in tree.body: self.dispatch(stmt)
        def _Interactive(self, tree):
            for stmt in tree.body: self.dispatch(stmt)
        def _Expression(self, tree): self.dispatch(tree.body)
        def _Expr(self, tree): self.fill(); self.dispatch(tree.value)
        def _NamedExpr(self, tree):
            self.write("("); self.dispatch(tree.target); self.write(" := "); self.dispatch(tree.value); self.write(")")
        def _Import(self, t):
            self.fill("import "); interleave(lambda: self.write(", "), self.dispatch, t.names)
        def _ImportFrom(self, t):
            if t.module and t.module == "__future__": self.future_imports.extend(n.name for n in t.names)
            self.fill("from "); self.write("." * t.level)
            if t.module: self.write(t.module)
            self.write(" import "); interleave(lambda: self.write(", "), self.dispatch, t.names)
        def _Assign(self, t):
            self.fill()
            for target in t.targets: self.dispatch(target); self.write(" = ")
            self.dispatch(t.value)
        def _AugAssign(self, t):
            self.fill(); self.dispatch(t.target); self.write(" "+self.binop[t.op.__class__.__name__]+"= "); self.dispatch(t.value)
        def _AnnAssign(self, t):
            self.fill()
            if not t.simple and isinstance(t.target, ast.Name): self.write("(")
            self.dispatch(t.target)
            if not t.simple and isinstance(t.target, ast.Name): self.write(")")
            self.write(": "); self.dispatch(t.annotation)
            if t.value: self.write(" = "); self.dispatch(t.value)
        def _Return(self, t):
            self.fill("return")
            if t.value: self.write(" "); self.dispatch(t.value)
        def _Pass(self, t): self.fill("pass")
        def _Break(self, t): self.fill("break")
        def _Continue(self, t): self.fill("continue")
        def _Delete(self, t):
            self.fill("del "); interleave(lambda: self.write(", "), self.dispatch, t.targets)
        def _Assert(self, t):
            self.fill("assert "); self.dispatch(t.test)
            if t.msg: self.write(", "); self.dispatch(t.msg)
        def _Exec(self, t):
            self.fill("exec "); self.dispatch(t.body)
            if t.globals: self.write(" in "); self.dispatch(t.globals)
            if t.locals: self.write(", "); self.dispatch(t.locals)
        def _Print(self, t):
            self.fill("print "); do_comma = False
            if t.dest: self.write(">>"); self.dispatch(t.dest); do_comma = True
            for e in t.values:
                if do_comma: self.write(", ")
                else: do_comma = True
                self.dispatch(e)
            if not t.nl: self.write(",")
        def _Global(self, t):
            self.fill("global "); interleave(lambda: self.write(", "), self.write, t.names)
        def _Nonlocal(self, t):
            self.fill("nonlocal "); interleave(lambda: self.write(", "), self.write, t.names)
        def _Await(self, t):
            self.write("("); self.write("await")
            if t.value: self.write(" "); self.dispatch(t.value)
            self.write(")")
        def _Yield(self, t):
            self.write("("); self.write("yield")
            if t.value: self.write(" "); self.dispatch(t.value)
            self.write(")")
        def _YieldFrom(self, t):
            self.write("("); self.write("yield from")
            if t.value: self.write(" "); self.dispatch(t.value)
            self.write(")")
        def _Raise(self, t):
            self.fill("raise")
            if six.PY3:
                if not t.exc: assert not t.cause; return
                self.write(" "); self.dispatch(t.exc)
                if t.cause: self.write(" from "); self.dispatch(t.cause)
            else:
                self.write(" ")
                if t.type: self.dispatch(t.type)
                if t.inst: self.write(", "); self.dispatch(t.inst)
                if t.tback: self.write(", "); self.dispatch(t.tback)
        def _Try(self, t):
            self.fill("try"); self.enter(); self.dispatch(t.body); self.leave()
            for ex in t.handlers: self.dispatch(ex)
            if t.orelse: self.fill("else"); self.enter(); self.dispatch(t.orelse); self.leave()
            if t.finalbody: self.fill("finally"); self.enter(); self.dispatch(t.finalbody); self.leave()
        def _TryExcept(self, t):
            self.fill("try"); self.enter(); self.dispatch(t.body); self.leave()
            for ex in t.handlers: self.dispatch(ex)
            if t.orelse: self.fill("else"); self.enter(); self.dispatch(t.orelse); self.leave()
        def _TryFinally(self, t):
            if len(t.body) == 1 and isinstance(t.body[0], ast.TryExcept): self.dispatch(t.body)
            else: self.fill("try"); self.enter(); self.dispatch(t.body); self.leave()
            self.fill("finally"); self.enter(); self.dispatch(t.finalbody); self.leave()
        def _ExceptHandler(self, t):
            self.fill("except")
            if t.type: self.write(" "); self.dispatch(t.type)
            if t.name: self.write(" as "); self.write(t.name if six.PY3 else str(t.name))
            self.enter(); self.dispatch(t.body); self.leave()
        def _ClassDef(self, t):
            self.write("\\n")
            for deco in t.decorator_list: self.fill("@"); self.dispatch(deco)
            self.fill("class "+t.name)
            if six.PY3:
                self.write("("); comma = False
                for e in t.bases:
                    if comma: self.write(", "); else: comma = True; self.dispatch(e)
                for e in t.keywords:
                    if comma: self.write(", "); else: comma = True; self.dispatch(e)
                if sys.version_info[:2] < (3, 5):
                    if t.starargs:
                        if comma: self.write(", "); else: comma = True; self.write("*"); self.dispatch(t.starargs)
                    if t.kwargs:
                        if comma: self.write(", "); else: comma = True; self.write("**"); self.dispatch(t.kwargs)
                self.write(")")
            elif t.bases:
                self.write("(")
                for a in t.bases: self.dispatch(a); self.write(", ")
                self.write(")")
            self.enter(); self.dispatch(t.body); self.leave()
        def _FunctionDef(self, t): self.__FunctionDef_helper(t, "def")
        def _AsyncFunctionDef(self, t): self.__FunctionDef_helper(t, "async def")
        def __FunctionDef_helper(self, t, fill_suffix):
            self.write("\\n")
            for deco in t.decorator_list: self.fill("@"); self.dispatch(deco)
            self.fill(fill_suffix+" "+t.name + "("); self.dispatch(t.args); self.write(")")
            if getattr(t, "returns", False): self.write(" -> "); self.dispatch(t.returns)
            self.enter(); self.dispatch(t.body); self.leave()
        def _For(self, t): self.__For_helper("for ", t)
        def _AsyncFor(self, t): self.__For_helper("async for ", t)
        def __For_helper(self, fill, t):
            self.fill(fill); self.dispatch(t.target); self.write(" in "); self.dispatch(t.iter)
            self.enter(); self.dispatch(t.body); self.leave()
            if t.orelse: self.fill("else"); self.enter(); self.dispatch(t.orelse); self.leave()
        def _If(self, t):
            self.fill("if "); self.dispatch(t.test); self.enter(); self.dispatch(t.body); self.leave()
            while (t.orelse and len(t.orelse) == 1 and isinstance(t.orelse[0], ast.If)):
                t = t.orelse[0]; self.fill("elif "); self.dispatch(t.test); self.enter(); self.dispatch(t.body); self.leave()
            if t.orelse: self.fill("else"); self.enter(); self.dispatch(t.orelse); self.leave()
        def _While(self, t):
            self.fill("while "); self.dispatch(t.test); self.enter(); self.dispatch(t.body); self.leave()
            if t.orelse: self.fill("else"); self.enter(); self.dispatch(t.orelse); self.leave()
        def _generic_With(self, t, async_=False):
            self.fill("async with " if async_ else "with ")
            if hasattr(t, "items"): interleave(lambda: self.write(", "), self.dispatch, t.items)
            else:
                self.dispatch(t.context_expr)
                if t.optional_vars: self.write(" as "); self.dispatch(t.optional_vars)
            self.enter(); self.dispatch(t.body); self.leave()
        def _With(self, t): self._generic_With(t)
        def _AsyncWith(self, t): self._generic_With(t, async_=True)
        def _Bytes(self, t): self.write(repr(t.s))
        def _Str(self, tree):
            if six.PY3: self.write(repr(tree.s))
            else:
                if "unicode_literals" not in self.future_imports: self.write(repr(tree.s))
                elif isinstance(tree.s, str): self.write("b" + repr(tree.s))
                elif isinstance(tree.s, unicode): self.write(repr(tree.s).lstrip("u"))
                else: assert False
        def _JoinedStr(self, t):
            self.write("f"); string = StringIO(); self._fstring_JoinedStr(t, string.write)
            v = string.getvalue()
            if "\\n" in v or "\\r" in v: quote_types = ["'''", '\"\"\"']
            else: quote_types = ["'", '"', '\"\"\"', "'''"]
            for quote_type in quote_types:
                if quote_type not in v: v = "{quote_type}{v}{quote_type}".format(quote_type=quote_type, v=v); break
            else: v = repr(v)
            self.write(v)
        def _FormattedValue(self, t):
            self.write("f"); string = StringIO(); self._fstring_JoinedStr(t, string.write); self.write(repr(string.getvalue()))
        def _fstring_JoinedStr(self, t, write):
            for value in t.values:
                meth = getattr(self, "_fstring_" + type(value).__name__); meth(value, write)
        def _fstring_Str(self, t, write):
            value = t.s.replace("{", "{{").replace("}", "}}"); write(value)
        def _fstring_Constant(self, t, write):
            assert isinstance(t.value, str)
            value = t.value.replace("{", "{{").replace("}", "}}"); write(value)
        def _fstring_FormattedValue(self, t, write):
            write("{"); expr = StringIO(); Unparser(t.value, expr); expr = expr.getvalue().rstrip("\\n")
            if expr.startswith("{"): write(" ")
            write(expr)
            if t.conversion != -1:
                conversion = chr(t.conversion); assert conversion in "sra"
                write("!{conversion}".format(conversion=conversion))
            if t.format_spec:
                write(":")
                meth = getattr(self, "_fstring_" + type(t.format_spec).__name__); meth(t.format_spec, write)
            write("}")
        def _Name(self, t): self.write(t.id)
        def _NameConstant(self, t): self.write(repr(t.value))
        def _Repr(self, t): self.write("`"); self.dispatch(t.value); self.write("`")
        def _write_constant(self, value):
            if isinstance(value, (float, complex)): self.write(repr(value).replace("inf", INFSTR))
            else: self.write(repr(value))
        def _Constant(self, t):
            value = t.value
            if isinstance(value, tuple):
                self.write("(")
                if len(value) == 1: self._write_constant(value[0]); self.write(",")
                else: interleave(lambda: self.write(", "), self._write_constant, value)
                self.write(")")
            elif value is Ellipsis: self.write("...")
            else:
                if t.kind == "u": self.write("u")
                self._write_constant(t.value)
        def _Num(self, t):
            repr_n = repr(t.n)
            if six.PY3: self.write(repr_n.replace("inf", INFSTR))
            else:
                if repr_n.startswith("-"): self.write("(")
                if "inf" in repr_n and repr_n.endswith("*j"): repr_n = repr_n.replace("*j", "j")
                self.write(repr_n.replace("inf", INFSTR))
                if repr_n.startswith("-"): self.write(")")
        def _List(self, t):
            self.write("["); interleave(lambda: self.write(", "), self.dispatch, t.elts); self.write("]")
        def _ListComp(self, t):
            self.write("["); self.dispatch(t.elt)
            for gen in t.generators: self.dispatch(gen)
            self.write("]")
        def _GeneratorExp(self, t):
            self.write("("); self.dispatch(t.elt)
            for gen in t.generators: self.dispatch(gen)
            self.write(")")
        def _SetComp(self, t):
            self.write("{"); self.dispatch(t.elt)
            for gen in t.generators: self.dispatch(gen)
            self.write("}")
        def _DictComp(self, t):
            self.write("{"); self.dispatch(t.key); self.write(": "); self.dispatch(t.value)
            for gen in t.generators: self.dispatch(gen)
            self.write("}")
        def _comprehension(self, t):
            if getattr(t, "is_async", False): self.write(" async for ")
            else: self.write(" for ")
            self.dispatch(t.target); self.write(" in "); self.dispatch(t.iter)
            for if_clause in t.ifs: self.write(" if "); self.dispatch(if_clause)
        def _IfExp(self, t):
            self.write("("); self.dispatch(t.body); self.write(" if "); self.dispatch(t.test); self.write(" else "); self.dispatch(t.orelse); self.write(")")
        def _Set(self, t):
            assert(t.elts); self.write("{"); interleave(lambda: self.write(", "), self.dispatch, t.elts); self.write("}")
        def _Dict(self, t):
            self.write("{")
            def write_key_value_pair(k, v): self.dispatch(k); self.write(": "); self.dispatch(v)
            def write_item(item):
                k, v = item
                if k is None: self.write("**"); self.dispatch(v)
                else: write_key_value_pair(k, v)
            interleave(lambda: self.write(", "), write_item, zip(t.keys, t.values))
            self.write("}")
        def _Tuple(self, t):
            self.write("(")
            if len(t.elts) == 1: self.dispatch(t.elts[0]); self.write(",")
            else: interleave(lambda: self.write(", "), self.dispatch, t.elts)
            self.write(")")
        unop = {"Invert":"~", "Not": "not", "UAdd":"+", "USub":"-"}
        def _UnaryOp(self, t):
            self.write("("); self.write(self.unop[t.op.__class__.__name__]); self.write(" ")
            if six.PY2 and isinstance(t.op, ast.USub) and isinstance(t.operand, ast.Num):
                self.write("("); self.dispatch(t.operand); self.write(")")
            else: self.dispatch(t.operand)
            self.write(")")
        binop = { "Add":"+", "Sub":"-", "Mult":"*", "MatMult":"@", "Div":"/", "Mod":"%",
                        "LShift":"<<", "RShift":">>", "BitOr":"|", "BitXor":"^", "BitAnd":"&",
                        "FloorDiv":"//", "Pow": "**"}
        def _BinOp(self, t):
            self.write("("); self.dispatch(t.left); self.write(" " + self.binop[t.op.__class__.__name__] + " "); self.dispatch(t.right); self.write(")")
        cmpops = {"Eq":"==", "NotEq":"!=", "Lt":"<", "LtE":"<=", "Gt":">", "GtE":">=",
                            "Is":"is", "IsNot":"is not", "In":"in", "NotIn":"not in"}
        def _Compare(self, t):
            self.write("("); self.dispatch(t.left)
            for o, e in zip(t.ops, t.comparators): self.write(" " + self.cmpops[o.__class__.__name__] + " "); self.dispatch(e)
            self.write(")")
        boolops = {ast.And: "and", ast.Or: "or"}
        def _BoolOp(self, t):
            self.write("("); s = " %s " % self.boolops[t.op.__class__]
            interleave(lambda: self.write(s), self.dispatch, t.values); self.write(")")
        def _Attribute(self,t):
            self.dispatch(t.value)
            if isinstance(t.value, getattr(ast, "Constant", getattr(ast, "Num", None))) and isinstance(t.value.n, int):
                self.write(" ")
            self.write("."); self.write(t.attr)
        def _Call(self, t):
            self.dispatch(t.func); self.write("("); comma = False
            for e in t.args:
                if comma: self.write(", "); else: comma = True; self.dispatch(e)
            for e in t.keywords:
                if comma: self.write(", "); else: comma = True; self.dispatch(e)
            if sys.version_info[:2] < (3, 5):
                if t.starargs:
                    if comma: self.write(", "); else: comma = True; self.write("*"); self.dispatch(t.starargs)
                if t.kwargs:
                    if comma: self.write(", "); else: comma = True; self.write("**"); self.dispatch(t.kwargs)
            self.write(")")
        def _Subscript(self, t):
            self.dispatch(t.value); self.write("["); self.dispatch(t.slice); self.write("]")
        def _Starred(self, t): self.write("*"); self.dispatch(t.value)
        def _Ellipsis(self, t): self.write("...")
        def _Index(self, t): self.dispatch(t.value)
        def _Slice(self, t):
            if t.lower: self.dispatch(t.lower)
            self.write(":")
            if t.upper: self.dispatch(t.upper)
            if t.step: self.write(":"); self.dispatch(t.step)
        def _ExtSlice(self, t): interleave(lambda: self.write(", "), self.dispatch, t.dims)
        def _arg(self, t):
            self.write(t.arg)
            if t.annotation: self.write(": "); self.dispatch(t.annotation)
        def _arguments(self, t):
            first = True
            all_args = getattr(t, "posonlyargs", []) + t.args
            defaults = [None] * (len(all_args) - len(t.defaults)) + t.defaults
            for index, elements in enumerate(zip(all_args, defaults), 1):
                a, d = elements
                if first: first = False
                else: self.write(", ")
                self.dispatch(a)
                if d: self.write("="); self.dispatch(d)
                if index == len(getattr(t, "posonlyargs", ())): self.write(", /")
            if t.vararg or getattr(t, "kwonlyargs", False):
                if first: first = False
                else: self.write(", ")
                self.write("*")
                if t.vararg:
                    if hasattr(t.vararg, "arg"):
                        self.write(t.vararg.arg)
                        if t.vararg.annotation: self.write(": "); self.dispatch(t.vararg.annotation)
                    else:
                        self.write(t.vararg)
                        if getattr(t, "varargannotation", None): self.write(": "); self.dispatch(t.varargannotation)
            if getattr(t, "kwonlyargs", False):
                for a, d in zip(t.kwonlyargs, t.kw_defaults):
                    if first: first = False
                    else: self.write(", ")
                    self.dispatch(a)
                    if d: self.write("="); self.dispatch(d)
            if t.kwarg:
                if first: first = False
                else: self.write(", ")
                if hasattr(t.kwarg, "arg"):
                    self.write("**"+t.kwarg.arg)
                    if t.kwarg.annotation: self.write(": "); self.dispatch(t.kwarg.annotation)
                else:
                    self.write("**"+t.kwarg)
                    if getattr(t, "kwargannotation", None): self.write(": "); self.dispatch(t.kwargannotation)
        def _keyword(self, t):
            if t.arg is None: self.write("**")
            else: self.write(t.arg); self.write("=")
            self.dispatch(t.value)
        def _Lambda(self, t):
            self.write("("); self.write("lambda "); self.dispatch(t.args); self.write(": "); self.dispatch(t.body); self.write(")")
        def _alias(self, t):
            self.write(t.name)
            if t.asname: self.write(" as "+t.asname)
        def _withitem(self, t):
            self.dispatch(t.context_expr)
            if t.optional_vars: self.write(" as "); self.dispatch(t.optional_vars)
    """),
}
try:
    import astunparse
except ImportError:
    pkg = types.ModuleType("astunparse")
    pkg.__file__ = __file__
    pkg.__package__ = "astunparse"
    pkg.__path__ = []
    # load submodules
    for fname, src in _ASTUNPARSE_SOURCE.items():
        mod_name = "astunparse." + fname.replace(".py", "")
        mod = types.ModuleType(mod_name)
        mod.__file__ = __file__
        mod.__package__ = "astunparse"
        exec(src, mod.__dict__)
        _sys.modules[mod_name] = mod
        # attach to parent package
        attr = fname.replace(".py", "")
        if attr == "__init__":
            pkg.__dict__.update(mod.__dict__)
        else:
            setattr(pkg, attr, mod)
    _sys.modules["astunparse"] = pkg
    import astunparse
    print("[liaison-shim] astunparse loaded from inline fallback (v" + astunparse.__version__ + ")", flush=True)
del _ASTUNPARSE_SOURCE, textwrap, importlib, _sys

def _mock_pyqt6():
    for mod_name in [
        "PyQt6", "PyQt6.QtCore", "PyQt6.QtGui", "PyQt6.QtWidgets",
        "PyQt6.QtTest", "PyQt6.QtSvg", "PyQt6.QtPrintSupport",
        "PyQt6.QtOpenGL", "PyQt6.QtOpenGLWidgets",
    ]:
        if mod_name not in sys.modules:
            _mock_module(mod_name)

    qtcore = sys.modules.get("PyQt6.QtCore")
    if qtcore and not hasattr(qtcore, 'QObject'):
        class _DummyQObject:
            def __init__(self, *a, **kw): pass
        qtcore.QObject = _DummyQObject
        qtcore.pyqtSignal = lambda *a, **kw: lambda *a2, **kw2: None
        qtcore.pyqtSlot = lambda *a, **kw: lambda f: f
        qtcore.pyqtProperty = lambda *a, **kw: lambda f: f
        qtcore.QTimer = type('QTimer', (), {
            '__init__': lambda self: None,
            'singleShot': staticmethod(lambda *a: None),
            'timeout': None,
            'start': lambda self, *a: None,
            'stop': lambda self: None,
        })
        qtcore.QThread = type('QThread', (), {
            '__init__': lambda self: None,
            'start': lambda self: None,
            'wait': lambda self: None,
            'run': lambda self: None,
        })
        qtcore.QEventLoop = type('QEventLoop', (), {
            '__init__': lambda self: None,
            'exec': lambda self: 0,
            'quit': lambda self: None,
        })

    qtgui = sys.modules.get("PyQt6.QtGui")
    if qtgui and not hasattr(qtgui, 'QAction'):
        qtgui.QAction = type('QAction', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QIcon = type('QIcon', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QPixmap = type('QPixmap', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QFont = type('QFont', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QColor = type('QColor', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QImage = type('QImage', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QCursor = type('QCursor', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QKeySequence = type('QKeySequence', (), {'__init__': lambda self, *a, **kw: None})
        qtgui.QDesktopServices = type('QDesktopServices', (), {
            'openUrl': staticmethod(lambda url: True)
        })

    qtwidgets = sys.modules.get("PyQt6.QtWidgets")
    if qtwidgets and not hasattr(qtwidgets, 'QWidget'):
        for cls_name in [
            'QWidget', 'QMainWindow', 'QDialog', 'QApplication', 'QPushButton',
            'QLabel', 'QLineEdit', 'QTextEdit', 'QComboBox', 'QCheckBox',
            'QListWidget', 'QTreeWidget', 'QTableWidget', 'QSplitter', 'QTabWidget',
            'QScrollArea', 'QFrame', 'QGroupBox', 'QVBoxLayout', 'QHBoxLayout',
            'QGridLayout', 'QFormLayout', 'QAction', 'QMenu', 'QMenuBar', 'QToolBar',
            'QStatusBar', 'QFileDialog', 'QMessageBox', 'QInputDialog', 'QSizePolicy',
            'QStyledItemDelegate', 'QStyle', 'QAbstractItemView',
        ]:
            setattr(qtwidgets, cls_name, type(cls_name, (), {
                '__init__': lambda self, *a, **kw: None,
            }))

def _mock_wx():
    """Mock wx 灞炴€цˉ鍏?鈥?psychopy.localization._localization 琛?52 璋?wx.Locale()锛?
    鍘?mock 鍙缓绌烘ā鍧楁病 Locale 绫?鈫?AttributeError 鈫?localization import 澶辫触
    鈫?data 鈫?experiment 鏁翠釜閾炬柇 鈫?liaison 璋?getElementProfiles/writeScript 鎶?
    'logging is not defined'锛堝疄闄呮槸 _experiment.py 娌″姞杞芥垚鍔燂級"""
    if 'wx' not in sys.modules:
        wx_mod = types.ModuleType('wx')
        # localization._localization 琛?35-155 鐢ㄥ埌鐨?API锛歸x.Locale() / wx.LANGUAGE_DEFAULT
        # 鐢?stub 鑰岄潪 mock 鐪熻涓?鈥?psychopy 鍙敤瀹冭 locale 鍏冩暟鎹紝楦胯挋鍚庣涓嶉渶瑕佺湡 wx
        wx_mod.LANGUAGE_DEFAULT = 0
        class _LangInfo:
            def __init__(self, desc, canon): self.Description = desc; self.CanonicalName = canon
        class _Locale:
            def __init__(self, *a, **kw): pass
            def GetLocale(self): return 'en_US'
            def GetCanonicalName(self): return 'en_US'
            def GetSystemLanguage(self): return wx_mod.LANGUAGE_DEFAULT
            def GetLanguageInfo(self, i): return _LangInfo('English (U.S.)', 'en_US') if i == 0 else None
            def IsAvailable(self, i): return i == wx_mod.LANGUAGE_DEFAULT
        wx_mod.Locale = _Locale
        wx_mod.GetTranslation = lambda s: s
        wx_mod.__version__ = '4.2.0'  # wizard.py:22 妫€ wx.__version__
        sys.modules['wx'] = wx_mod
    else:
        wx_mod = sys.modules['wx']
        if not hasattr(wx_mod, 'LANGUAGE_DEFAULT'): wx_mod.LANGUAGE_DEFAULT = 0
        if not hasattr(wx_mod, '__version__'): wx_mod.__version__ = '4.2.0'
        if not hasattr(wx_mod, 'GetTranslation'): wx_mod.GetTranslation = lambda s: s
        if not hasattr(wx_mod, 'Locale'):
            class _LangInfo:
                def __init__(self, desc, canon): self.Description = desc; self.CanonicalName = canon
            class _Locale:
                def __init__(self, *a, **kw): pass
                def GetLocale(self): return 'en_US'
                def GetCanonicalName(self): return 'en_US'
                def GetSystemLanguage(self): return wx_mod.LANGUAGE_DEFAULT
                def GetLanguageInfo(self, i): return _LangInfo('English (U.S.)', 'en_US') if i == 0 else None
                def IsAvailable(self, i): return i == wx_mod.LANGUAGE_DEFAULT
            wx_mod.Locale = _Locale

def _mock_pyqt5():
    for mod_name in ["PyQt5", "PyQt5.QtCore", "PyQt5.QtGui", "PyQt5.QtWidgets"]:
        if mod_name not in sys.modules:
            _mock_module(mod_name)

_mock_pyqt6()
_mock_pyqt5()
_mock_wx()

# 鈹€鈹€ libsndfile 鐪熷簱锛圚armonyBrew Cellar锛夆攢鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
# psychopy.tools.audiotools 琛?107 `import soundfile as sf`锛岄缚钂欑郴缁?Python 缂?libsndfile.so
# 鈫?OSError 鈫?microphone/camera 缁勪欢 import 澶辫触 鈫?getAllComponents 鎶ラ敊
# HarmonyBrew 宸茶 libsndfile 1.2.2_1锛岀敤 LD_LIBRARY_PATH 璁?ctypes ffi.dlopen 鎵惧埌鐪?.so
# 锛堝疄娴嬶細璁炬鍙橀噺鍚庨缚钂欑郴缁?Python soundfile 0.14.0 鐪熷姞杞芥垚鍔燂紝available_formats 姝ｅ父锛?
_HB_LIBSNDFILE = os.path.expanduser("~/.harmonybrew/Cellar/libsndfile/1.2.2_1/lib")
_HB_LIB = os.path.expanduser("~/.harmonybrew/lib")
if os.path.isdir(_HB_LIBSNDFILE):
    _ld = os.environ.get("LD_LIBRARY_PATH", "")
    os.environ["LD_LIBRARY_PATH"] = ":".join([p for p in [_HB_LIBSNDFILE, _HB_LIB, _ld] if p])

# 鈹€鈹€ Import PsychoPy 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
START_MARKER = "LIAISON_START"
psychopy_version = None

try:
    import psychopy
    psychopy_version = psychopy.__version__
    print(f"[liaison-shim] PsychoPy {psychopy_version} loaded", flush=True)
except Exception as e:
    print(f"[liaison-shim] WARNING: Failed to import psychopy: {e}", flush=True)

# 鈹€鈹€ Registry 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
_registry = {}

# 鈹€鈹€ Command handlers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

def _resolve(val):
    if isinstance(val, str) and val.startswith("$"):
        return _registry.get(val[1:], val)
    if isinstance(val, list):
        return [_resolve(v) for v in val]
    if isinstance(val, dict):
        return {k: _resolve(v) for k, v in val.items()}
    return val

def _serialize(obj):
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, (list, tuple)):
        return [_serialize(item) for item in obj]
    if isinstance(obj, dict):
        return {str(k): _serialize(v) for k, v in obj.items()}
    if isinstance(obj, set):
        return [_serialize(item) for item in obj]
    if hasattr(obj, 'to_dict') and callable(obj.to_dict):
        try:
            return obj.to_dict()
        except Exception:
            pass
    if hasattr(obj, '__dict__'):
        result = {}
        for k, v in vars(obj).items():
            if not k.startswith('_'):
                try:
                    result[k] = _serialize(v)
                except Exception:
                    result[k] = str(v)
        return result
    return str(obj)

def _import_target(target_str):
    # Resolve API version aliases (old frontend name 鈫?actual function)
    if target_str in _API_ALIASES:
        target_str = _API_ALIASES[target_str]
        print(f"[liaison-shim] alias resolved: {_API_ALIASES} 鈫?{target_str}", flush=True)

    if ":" in target_str:
        module_name, attr_name = target_str.split(":", 1)
    elif "." in target_str:
        parts = target_str.rsplit(".", 1)
        if len(parts) == 2 and not parts[0].isdigit():
            module_name, attr_name = parts
        else:
            module_name, attr_name = target_str, None
    else:
        module_name, attr_name = target_str, None

    mod = importlib.import_module(module_name)
    if attr_name:
        return getattr(mod, attr_name)
    return mod

def cmd_exists(args, kwargs):
    try:
        _import_target(args[0])
        return True
    except (ImportError, AttributeError):
        return False

def cmd_import(args, kwargs):
    try:
        importlib.import_module(args[0])
        return True
    except ImportError:
        return False

def cmd_register(args, kwargs):
    name = args[0]
    target = args[1]
    try:
        obj = _import_target(target)
    except (ImportError, AttributeError) as e:
        if target.startswith("psychopy."):
            print(f"[liaison-shim] psychopy not available, skipping register: {target}", flush=True)
            _send_alert("8900", "WARNING", f"PsychoPy not installed 鈥?skipping {target}. Use Reinstall Python to install packages.")
            return True
        raise
    _registry[name] = obj
    return True

def cmd_init(args, kwargs):
    name = args[0]
    target = args[1]
    try:
        cls = _import_target(target)
    except (ImportError, AttributeError) as e:
        if target.startswith("psychopy."):
            print(f"[liaison-shim] psychopy not available, skipping init: {target}", flush=True)
            _send_alert("8900", "WARNING", f"PsychoPy not installed 鈥?cannot initialize {target}. Basic mode active.")
            return True
        raise
    resolved_kwargs = {k: _resolve(v) for k, v in kwargs.items()}
    obj = cls(**resolved_kwargs)
    _registry[name] = obj
    return True

# Targets that are safe to return empty dict when psychopy is missing
_SAFE_FALLBACK_TARGETS = {
    "psychopy.experiment:getElementProfiles",
    "psychopy.experiment:getLoopProfiles",
    "psychopy.experiment:getDeviceProfiles",
}

# API version alias map: old frontend name 鈫?actual 2025.2.4 function
_API_ALIASES = {
    "psychopy.experiment:getElementProfiles": "psychopy.experiment.getAllComponents",
    "psychopy.experiment:getLoopProfiles": "psychopy.experiment.getAllStandaloneRoutines",
    "psychopy.experiment:getDeviceProfiles": "psychopy.experiment.getAllElements",
}

def cmd_run(args, kwargs):
    target = args[0]
    call_args = [_resolve(a) for a in args[1:]]
    print(f"[liaison-shim] cmd_run target={target!r} args={call_args!r} kwargs={kwargs!r}", flush=True)
    try:
        func = _import_target(target)
        print(f"[liaison-shim] cmd_run resolved func={func!r}", flush=True)
    except (ImportError, AttributeError) as e:
        print(f"[liaison-shim] cmd_run _import_target failed: {e}", flush=True)
        traceback.print_exc()
        if target in _SAFE_FALLBACK_TARGETS or target.startswith("psychopy."):
            print(f"[liaison-shim] psychopy not available, returning empty for: {target}", flush=True)
            _send_alert("8901", "WARNING", f"PsychoPy not installed 鈥?using built-in components. Install psychopy for full features.")
            return {}
        raise
    resolved_kwargs = {k: _resolve(v) for k, v in kwargs.items()}
    try:
        result = func(*call_args, **resolved_kwargs)
        print(f"[liaison-shim] cmd_run result type={type(result).__name__}", flush=True)
    except Exception as e:
        print(f"[liaison-shim] cmd_run func call failed: {e}", flush=True)
        traceback.print_exc()
        raise
    return _serialize(result)

def cmd_try(args, kwargs):
    try:
        return cmd_run(args, kwargs)
    except Exception as e:
        print(f"[liaison-shim] try failed (ignored): {e}", flush=True)
        return None

def cmd_call(args, kwargs):
    name = args[0]
    method_name = args[1]
    call_args = [_resolve(a) for a in args[2:]]
    if name not in _registry:
        print(f"[liaison-shim] Object '{name}' not registered, returning None", flush=True)
        return None
    obj = _registry[name]
    method = getattr(obj, method_name)
    resolved_kwargs = {k: _resolve(v) for k, v in kwargs.items()}
    result = method(*call_args, **resolved_kwargs)
    return _serialize(result)

def cmd_get(args, kwargs):
    name = args[0]
    attr = args[1]
    if name not in _registry:
        print(f"[liaison-shim] Object '{name}' not registered, returning None", flush=True)
        return None
    return _serialize(getattr(_registry[name], attr, None))

def cmd_set(args, kwargs):
    name = args[0]
    attr = args[1]
    value = _resolve(args[2]) if len(args) > 2 else None
    if name not in _registry:
        print(f"[liaison-shim] Object '{name}' not registered, ignoring set", flush=True)
        return True
    setattr(_registry[name], attr, value)
    return True

def cmd_ping(args, kwargs):
    return "pong"

_COMMANDS = {
    "ping": cmd_ping,
    "exists": cmd_exists,
    "import": cmd_import,
    "register": cmd_register,
    "init": cmd_init,
    "run": cmd_run,
    "try": cmd_try,
    "call": cmd_call,
    "get": cmd_get,
    "set": cmd_set,
}

def execute_command(command):
    if not isinstance(command, dict):
        return command
    cmd_name = command.get("command")
    args = command.get("args", [])
    kwargs = command.get("kwargs", {})
    if not cmd_name:
        raise ValueError("No 'command' field in message")
    handler = _COMMANDS.get(cmd_name)
    if handler is None:
        raise ValueError(f"Unknown command: {cmd_name}")
    return handler(args, kwargs)

# 鈹€鈹€ WebSocket server 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€

_active_websocket = None

def _send_alert(code, cat, msg):
    """Send an alert event to the client via WebSocket."""
    global _active_websocket
    if _active_websocket:
        try:
            alert = {
                "evt": {"name": "alert"},
                "message": {"code": code, "cat": cat, "msg": msg},
            }
            asyncio.ensure_future(_active_websocket.send(json.dumps(alert, default=str)))
        except Exception:
            pass


async def handle_message(websocket):
    global _active_websocket
    _active_websocket = websocket
    print(f"[liaison-shim] Client connected", flush=True)
    try:
        async for raw_data in websocket:
            try:
                msg = json.loads(raw_data)
            except json.JSONDecodeError:
                await websocket.send(json.dumps({"error": "Invalid JSON"}))
                continue

            msgid = msg.get("id", "")
            command = msg.get("command", {})

            try:
                result = execute_command(command)
                reply = {"response": result, "evt": {"id": msgid}}
            except Exception as e:
                reply = {
                    "error": {
                        "message": str(e),
                        "traceback": traceback.format_exc(),
                    },
                    "evt": {"id": msgid}
                }
                print(f"[liaison-shim] Error for {msgid}: {e}", flush=True)
                traceback.print_exc()  # 鈽?鎵撳畬鏁?traceback 鍒?terminal 濂?debug

            try:
                await websocket.send(json.dumps(reply, default=str))
            except Exception as send_err:
                print(f"[liaison-shim] Send failed: {send_err}", flush=True)
                break
    except Exception as e:
        print(f"[liaison-shim] Connection error: {e}", flush=True)
    finally:
        _active_websocket = None
        print(f"[liaison-shim] Client disconnected", flush=True)

def find_free_port(start=8002):
    for port in range(start, start + 100):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("localhost", port))
                return port
        except OSError:
            continue
    raise RuntimeError("No free port found in range")

async def main():
    import websockets

    port = find_free_port()
    address = f"localhost:{port}"

    # 鈽?鎶?LIAISON_START@ 鍜?Listening on ws:// 绉诲埌 async with 鍧楀唴
    # 鏃т唬鐮佸湪 websockets.serve() 鍚姩涔嬪墠灏辨墦鍗颁簡 LIAISON_START@
    # 鈫?startLiaison 妫€娴嬪埌鍚庣珛鍗宠繛 WebSocket锛屼絾鏈嶅姟鍣ㄨ繕娌″紑濮嬬洃鍚?
    # 鈫?ECONNREFUSED 鈫?liaison 鍚姩澶辫触 鈫?sendLiaison 鎶?"Liaison not connected"
    async with websockets.serve(handle_message, "localhost", port):
        print(f"{START_MARKER}@{address}", flush=True)
        print(f"[liaison-shim] Listening on ws://{address}", flush=True)
        if psychopy_version:
            print(f"[liaison-shim] PsychoPy {psychopy_version} ready", flush=True)
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
