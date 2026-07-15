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
if not os.path.isfile(_HARMONY_PREFS_FILE):
    _DEFAULT_PREFS = """[general]
units = norm
fullscr = True
allowGUI = True
quitKey = escape

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
    try:
        with open(_HARMONY_PREFS_FILE, 'w', encoding='utf-8') as f:
            f.write(_DEFAULT_PREFS)
    except Exception as _e:
        print(f"[liaison-shim] WARNING: Failed to write default userPrefs.cfg: {_e}", flush=True)

# ── Add site-packages to sys.path ────────────────────────────
_HARMONY_SITE_PATHS = [
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/site-packages",
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/dist-packages",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"),
    "/data/data/com.example.electron/files/python/lib/python3.12/site-packages",
]
for _p in _HARMONY_SITE_PATHS:
    if os.path.isdir(_p) and _p not in sys.path:
        # Append bundled lib AFTER stdlib to avoid shadowing (e.g. logging.py → stdlib)
        if _p.endswith("lib") and "site-packages" not in _p and "dist-packages" not in _p:
            sys.path.append(_p)
        else:
            sys.path.insert(0, _p)

# ── Monkey-patch missing GUI modules ─────────────────────────
import types

def _mock_module(name, **attrs):
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules[name] = mod
    return mod

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
    try:
        func = _import_target(target)
    except (ImportError, AttributeError) as e:
        if target in _SAFE_FALLBACK_TARGETS or target.startswith("psychopy."):
            print(f"[liaison-shim] psychopy not available, returning empty for: {target}", flush=True)
            _send_alert("8901", "WARNING", f"PsychoPy not installed — using built-in components. Install psychopy for full features.")
            return {}
        raise
    resolved_kwargs = {k: _resolve(v) for k, v in kwargs.items()}
    result = func(*call_args, **resolved_kwargs)
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

    print(f"{START_MARKER}@{address}", flush=True)
    print(f"[liaison-shim] Listening on ws://{address}", flush=True)
    if psychopy_version:
        print(f"[liaison-shim] PsychoPy {psychopy_version} ready", flush=True)

    async with websockets.serve(handle_message, "localhost", port):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
