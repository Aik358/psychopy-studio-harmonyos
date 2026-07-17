#!/usr/bin/env python3
"""
Liaison Shim — Pure Python WebSocket liaison replacement for HarmonyOS.
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
import asyncio
import socket
import traceback

# ── Environment ──────────────────────────────────────────────
os.environ['PSYCHOPY_NO_GUI'] = '1'
os.environ['MPLBACKEND'] = 'Agg'
# Prevent OpenBLAS from spawning threads that trigger SECCOMP violations on HarmonyOS
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['NUMEXPR_NUM_THREADS'] = '1'
os.environ['OPENBLAS_MAIN_FREE'] = '1'

# ── 鸿蒙沙箱可写路径 ────────────────────────────────────────
# Psychopy preferences.py 用 os.environ['HOME'] + '.psychopy3' 构造 userPrefsDir
# （不读 PSYCHOPY_HOME），默认 ~ 即 /storage/Users/currentUser 鸿蒙沙箱拒绝写。
# 把 HOME 重定向到沙箱可写目录，devices.json / userPrefs.cfg 都会落这里。
# MPLCONFIGDIR 同理 — matplotlib 用 ~ 或该变量构造缓存目录。
_HARMONY_SANDBOX = "/data/storage/el2/base/cache"
os.makedirs(os.path.join(_HARMONY_SANDBOX, "home"), exist_ok=True)
os.environ['HOME'] = os.path.join(_HARMONY_SANDBOX, "home")
os.makedirs(os.path.join(_HARMONY_SANDBOX, "matplotlib"), exist_ok=True)
os.environ['MPLCONFIGDIR'] = os.path.join(_HARMONY_SANDBOX, "matplotlib")

# ── platform.system() 鸿蒙补丁 ───────────────────────────────
# psychopy preferences.py 行 161 用 platform.system() + '.spec' 找 spec 文件
# 鸿蒙返回 'HarmonyOS' 但 preferences 目录只有 Darwin/FreeBSD/Linux/Windows.spec
# → 找不到 HarmonyOS.spec → prefsSpec 空 → validate 无默认 → cfg['general'] KeyError
# 鸿蒙 POSIX 兼容，Linux.spec 内容适用，打补丁让 platform.system() 返回 'Linux'
import platform as _platform
_platform.system = lambda *a, **kw: 'Linux'
# 同时改 platform 平台名（某些库用 sys.platform=='linux' 判定，鸿蒙本来就是）
# ── 预置最小 userPrefs.cfg ────────────────────────────────────
# preferences.loadUserPrefs() 加载 userPrefs.cfg 时若文件不存在/空 cfg 没 section
# → loadAll 行 309 self.userPrefsCfg['general'] 抛 KeyError → import psychopy 失败
# 预置含全部 8 个必需 section 的最小 cfg 到沙箱可写目录，让首次启动也能 import
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
# ↑ psychopy/__init__.py:124 读 prefs.general['paths'] 循环添加 site 路径，缺此键抛 KeyError

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
# 写或更新 userPrefs.cfg — 确保 [general] 段有 paths 键
# 旧 HAP 创建的文件缺 paths 键，file exists 跳过导致修复不生效
try:
    if os.path.isfile(_HARMONY_PREFS_FILE):
        # 读现有文件，补缺键
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
            # 在 [general] 段末尾加 paths = list()
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

# ── Add site-packages to sys.path ────────────────────────────
_HARMONY_SITE_PATHS = [
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/site-packages",
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/dist-packages",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"),
    "/data/data/com.example.electron/files/python/lib/python3.12/site-packages",
    # json_tricks 等用户 pip 安装的包在 ~/.local 下
    # ★ 不能用 os.path.expanduser("~") — 前面 HOME 已重定向到沙箱
    # ~ 会展开到 /data/storage/el2/base/cache/home 而非用户真 home
    # 真路径是 /storage/Users/currentUser/.local/lib/python3.12/site-packages
    "/storage/Users/currentUser/.local/lib/python3.12/site-packages",
    "/storage/Users/currentUser/.local/lib/python3.12/dist-packages",
]
for _p in _HARMONY_SITE_PATHS:
    if os.path.isdir(_p) and _p not in sys.path:
        # Append bundled lib AFTER stdlib to avoid shadowing (e.g. logging.py → stdlib)
        if _p.endswith("lib") and "site-packages" not in _p and "dist-packages" not in _p:
            sys.path.append(_p)
        else:
            sys.path.insert(0, _p)
    elif os.path.isdir(_p) and _p in sys.path:
        pass  # already in path
    else:
        print(f"[liaison-shim] DEBUG _HARMONY_SITE_PATHS skip: {_p} exists={os.path.isdir(_p)} in_path={_p in sys.path}", flush=True)
print(f"[liaison-shim] DEBUG sys.path[0:5]={sys.path[:5]}", flush=True)

# ── Monkey-patch missing GUI modules ─────────────────────────
import types

def _mock_module(name, **attrs):
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules[name] = mod
    return mod

# ── astunparse 运行时回退（HAP 构建可能漏打包 astunparse 目录）────
# astunparse 是纯 Python 包，v1.6.3，嵌入以下源码确保设备端可用
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
    """Mock wx 属性补全 — psychopy.localization._localization 行 52 调 wx.Locale()，
    原 mock 只建空模块没 Locale 类 → AttributeError → localization import 失败
    → data → experiment 整个链断 → liaison 调 getElementProfiles/writeScript 报
    'logging is not defined'（实际是 _experiment.py 没加载成功）"""
    if 'wx' not in sys.modules:
        wx_mod = types.ModuleType('wx')
        # localization._localization 行 35-155 用到的 API：wx.Locale() / wx.LANGUAGE_DEFAULT
        # 用 stub 而非 mock 真行为 — psychopy 只用它读 locale 元数据，鸿蒙后端不需要真 wx
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
        wx_mod.__version__ = '4.2.0'  # wizard.py:22 检 wx.__version__
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

# ── libsndfile 真库（HarmonyBrew Cellar）──────────────────────
# psychopy.tools.audiotools 行 107 `import soundfile as sf`，鸿蒙系统 Python 缺 libsndfile.so
# → OSError → microphone/camera 组件 import 失败 → getAllComponents 报错
# HarmonyBrew 已装 libsndfile 1.2.2_1，用 LD_LIBRARY_PATH 让 ctypes ffi.dlopen 找到真 .so
# （实测：设此变量后鸿蒙系统 Python soundfile 0.14.0 真加载成功，available_formats 正常）
_HB_LIBSNDFILE = os.path.expanduser("~/.harmonybrew/Cellar/libsndfile/1.2.2_1/lib")
_HB_LIB = os.path.expanduser("~/.harmonybrew/lib")
if os.path.isdir(_HB_LIBSNDFILE):
    _ld = os.environ.get("LD_LIBRARY_PATH", "")
    os.environ["LD_LIBRARY_PATH"] = ":".join([p for p in [_HB_LIBSNDFILE, _HB_LIB, _ld] if p])

# ── Import PsychoPy ──────────────────────────────────────────
START_MARKER = "LIAISON_START"
psychopy_version = None

try:
    import psychopy
    psychopy_version = psychopy.__version__
    print(f"[liaison-shim] PsychoPy {psychopy_version} loaded", flush=True)
except Exception as e:
    print(f"[liaison-shim] WARNING: Failed to import psychopy: {e}", flush=True)

# ── Registry ─────────────────────────────────────────────────
_registry = {}

# ── Command handlers ─────────────────────────────────────────

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
    # Resolve API version aliases (old frontend name → actual function)
    if target_str in _API_ALIASES:
        target_str = _API_ALIASES[target_str]
        print(f"[liaison-shim] alias resolved: {_API_ALIASES} → {target_str}", flush=True)

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
            _send_alert("8900", "WARNING", f"PsychoPy not installed — skipping {target}. Use Reinstall Python to install packages.")
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
            _send_alert("8900", "WARNING", f"PsychoPy not installed — cannot initialize {target}. Basic mode active.")
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

# API version alias map: old frontend name → actual 2025.2.4 function
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
            _send_alert("8901", "WARNING", f"PsychoPy not installed — using built-in components. Install psychopy for full features.")
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

# ── WebSocket server ─────────────────────────────────────────

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
                traceback.print_exc()  # ★ 打完整 traceback 到 terminal 好 debug

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

    # ★ 把 LIAISON_START@ 和 Listening on ws:// 移到 async with 块内
    # 旧代码在 websockets.serve() 启动之前就打印了 LIAISON_START@
    # → startLiaison 检测到后立即连 WebSocket，但服务器还没开始监听
    # → ECONNREFUSED → liaison 启动失败 → sendLiaison 抛 "Liaison not connected"
    async with websockets.serve(handle_message, "localhost", port):
        print(f"{START_MARKER}@{address}", flush=True)
        print(f"[liaison-shim] Listening on ws://{address}", flush=True)
        if psychopy_version:
            print(f"[liaison-shim] PsychoPy {psychopy_version} ready", flush=True)
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
