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

# ── Add site-packages to sys.path ────────────────────────────
_HARMONY_SITE_PATHS = [
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/site-packages",
    "/data/service/hnp/python.org/python_3.12/lib/python3.12/dist-packages",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib"),
    "/data/data/com.example.electron/files/python/lib/python3.12/site-packages",
]
for _p in _HARMONY_SITE_PATHS:
    if os.path.isdir(_p) and _p not in sys.path:
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
    if 'wx' not in sys.modules:
        _mock_module('wx')

def _mock_pyqt5():
    for mod_name in ["PyQt5", "PyQt5.QtCore", "PyQt5.QtGui", "PyQt5.QtWidgets"]:
        if mod_name not in sys.modules:
            _mock_module(mod_name)

_mock_pyqt6()
_mock_pyqt5()
_mock_wx()

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
    obj = _import_target(target)
    _registry[name] = obj
    return True

def cmd_init(args, kwargs):
    name = args[0]
    target = args[1]
    cls = _import_target(target)
    resolved_kwargs = {k: _resolve(v) for k, v in kwargs.items()}
    obj = cls(**resolved_kwargs)
    _registry[name] = obj
    return True

def cmd_run(args, kwargs):
    target = args[0]
    call_args = [_resolve(a) for a in args[1:]]
    func = _import_target(target)
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
        raise KeyError(f"Object '{name}' not registered")
    obj = _registry[name]
    method = getattr(obj, method_name)
    resolved_kwargs = {k: _resolve(v) for k, v in kwargs.items()}
    result = method(*call_args, **resolved_kwargs)
    return _serialize(result)

def cmd_get(args, kwargs):
    name = args[0]
    attr = args[1]
    if name not in _registry:
        raise KeyError(f"Object '{name}' not registered")
    return _serialize(getattr(_registry[name], attr, None))

def cmd_set(args, kwargs):
    name = args[0]
    attr = args[1]
    value = _resolve(args[2]) if len(args) > 2 else None
    if name not in _registry:
        raise KeyError(f"Object '{name}' not registered")
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

async def handle_message(websocket):
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
