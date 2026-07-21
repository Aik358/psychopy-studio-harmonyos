/**
 * harmony.js — HarmonyOS Python Runtime Discovery & Setup Guidance
 *
 * Detects the HarmonyOS platform and discovers available Python runtimes.
 * Provides tiered setup guidance:
 *   1. System Python (HNP) + pip install missing packages (--user)
 *   2. System Python venv (isolated, safe) — if --user is denied
 *   3. harmonybrew Python — if no system Python at all
 *   4. Manual download guidance — last resort
 */

import fs from "fs";
import path from "path";
import process from "process";
import proc from "child_process";
import { output } from "./utils.js";
import { app } from "electron";

// Known paths where HarmonyOS PC places Python3
const HARMONY_PYTHON_PATHS = [
  // HarmonyOS HNP (HarmonyOS Native Package) installed Python
  "/data/service/hnp/python.org/python_3.12/bin/python3",
  "/data/service/hnp/python.org/python_3.11/bin/python3",
  "/data/service/hnp/python.org/python_3.10/bin/python3",
  // User directory symlink (common on HarmonyOS)
  "/storage/Users/currentUser/.local/bin/python3",
  // harmonybrew installed Python
  "/data/data/com.harmonybrew/files/usr/bin/python3",
  // Standard Linux paths
  "/usr/bin/python3",
  "/system/bin/python3",
  "/bin/python3",
  "/usr/bin/python",
  "/system/bin/python",
];

// harmonybrew binary paths
const HARMONYBREW_PATHS = [
  "/data/data/com.harmonybrew/files/usr/bin/brew",
  "/storage/Users/currentUser/.harmonybrew/bin/brew",
];

// Core packages required by PsychoPy Studio backend
// liaison-py is replaced by liaison_shim.py, so we need websockets instead
const REQUIRED_PACKAGES = [
  "numpy",
  "scipy",
  "PIL",        // Pillow
  "pyglet",
  "websockets",
  "esprima",
  "psychopy",   // psychopy-lib imports as 'psychopy'
];

// Packages that are nice-to-have but not critical
const OPTIONAL_PACKAGES = [
  "dukpy",
  "javascripthon",
  "i18next",
  "matplotlib",
];

let _isHarmonyOS = null;
let _harmonybrewPath = null;
let _diagnosticCache = null;

/**
 * Check if we are running on HarmonyOS.
 */
export function isHarmonyOS() {
  if (_isHarmonyOS !== null) return _isHarmonyOS;

  const pf = (process.platform || "").toLowerCase();
  if (pf === "ohos" || pf.startsWith("ohos") || pf === "harmonyos") {
    _isHarmonyOS = true;
    return true;
  }

  try {
    const uname = proc.execSync("uname -a", { timeout: 3000, encoding: "utf8" });
    if (/harmony|hongmeng|ohos/i.test(uname)) {
      _isHarmonyOS = true;
      return true;
    }
  } catch (_) {}

  for (const hint of ["/system/etc/ohos.conf", "/ohos", "/system/ohos"]) {
    if (fs.existsSync(hint)) {
      _isHarmonyOS = true;
      return true;
    }
  }

  _isHarmonyOS = false;
  return false;
}

/**
 * Find harmonybrew executable on the system.
 * @returns {string|null}
 */
export function findHarmonybrew() {
  if (_harmonybrewPath !== null) return _harmonybrewPath;
  if (!isHarmonyOS()) { _harmonybrewPath = null; return null; }

  for (const p of HARMONYBREW_PATHS) {
    try {
      if (fs.existsSync(p)) {
        _harmonybrewPath = p;
        output("harmony", `Found harmonybrew at: ${p}`);
        return p;
      }
    } catch (_) {}
  }

  // Try `which brew`
  try {
    const w = proc.execSync("which brew", { timeout: 3000, encoding: "utf8" }).trim();
    if (w && fs.existsSync(w)) {
      _harmonybrewPath = w;
      return w;
    }
  } catch (_) {}

  _harmonybrewPath = null;
  return null;
}

/**
 * Find a native Python3 executable on HarmonyOS.
 * @returns {string|null} Path to Python executable, or null if not found
 */
export function findNativePython() {
  if (!isHarmonyOS()) return null;

  for (const p of HARMONY_PYTHON_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const ver = proc
          .execSync(`"${p}" --version`, { timeout: 5000, encoding: "utf8" })
          .trim();
        if (ver.startsWith("Python")) {
          output("harmony", `Found native Python: ${p} (${ver})`);
          return p;
        }
      }
    } catch (_) {}
  }

  // Try `which python3`
  try {
    const w = proc
      .execSync("which python3", { timeout: 3000, encoding: "utf8" })
      .trim();
    if (w && fs.existsSync(w)) return w;
  } catch (_) {}

  return null;
}

/**
 * Get the version string of a Python executable.
 * @param {string} pythonPath
 * @returns {string|null} e.g. "3.12.8"
 */
export function getPythonVersion(pythonPath) {
  if (!pythonPath || !fs.existsSync(pythonPath)) return null;
  try {
    const v = proc
      .execSync(`"${pythonPath}" --version`, { timeout: 5000, encoding: "utf8" })
      .trim();
    const m = v.match(/Python\s+(\d+\.\d+\.\d+)/);
    return m ? m[1] : null;
  } catch (_) {
    return null;
  }
}

/**
 * Check which packages are installed in the given Python environment.
 * @param {string} pythonPath
 * @returns {object} { packageName: version, ... }
 */
export function checkInstalledPackages(pythonPath) {
  if (!pythonPath || !fs.existsSync(pythonPath)) return {};
  try {
    const resp = proc.execSync(
      `"${pythonPath}" -c "import json,importlib.metadata; print(json.dumps({d.metadata['Name']: d.version for d in importlib.metadata.distributions()}))"`,
      { timeout: 15000, encoding: "utf8" }
    ).trim();
    return JSON.parse(resp);
  } catch (_) {
    // Fallback: try pip list
    try {
      const resp = proc.execSync(
        `"${pythonPath}" -m pip list --format json`,
        { timeout: 15000, encoding: "utf8" }
      ).trim();
      const parsed = JSON.parse(resp);
      const result = {};
      for (const p of parsed) result[p.name] = p.version;
      return result;
    } catch (_) {
      return {};
    }
  }
}

/**
 * Check if a specific package can be imported.
 * @param {string} pythonPath
 * @param {string} importName e.g. "numpy"
 * @returns {boolean}
 */
export function canImport(pythonPath, importName) {
  if (!pythonPath || !fs.existsSync(pythonPath)) return false;
  try {
    proc.execSync(
      `"${pythonPath}" -c "import ${importName}"`,
      { timeout: 10000, encoding: "utf8" }
    );
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Run a full diagnostic of the Python environment.
 * Returns a structured object with all findings.
 *
 * @returns {object} Diagnostic result
 */
export function diagnosePythonEnvironment() {
  if (_diagnosticCache) return _diagnosticCache;

  const diag = {
    platform: "unknown",
    isHarmonyOS: false,
    python: null,           // path to python executable
    pythonVersion: null,    // version string
    pythonOk: false,        // version >= 3.9
    harmonybrew: null,      // path to harmonybrew
    packages: {},           // { name: version }
    missingRequired: [],    // required packages not found
    missingOptional: [],    // optional packages not found
    pipAvailable: false,    // can use pip
    venvAvailable: false,   // can create venv
    userInstallOk: false,   // --user install works
    recommendation: "none", // "system_python" | "venv" | "harmonybrew" | "manual" | "none"
    canProceed: false,      // has a viable path forward
  };

  diag.isHarmonyOS = isHarmonyOS();
  diag.platform = diag.isHarmonyOS ? "harmonyos" : (process.platform || "unknown");

  if (!diag.isHarmonyOS) {
    _diagnosticCache = diag;
    return diag;
  }

  // Find Python
  diag.python = findNativePython();
  if (diag.python) {
    diag.pythonVersion = getPythonVersion(diag.python);
    if (diag.pythonVersion) {
      const parts = diag.pythonVersion.split(".").map(Number);
      diag.pythonOk = parts[0] >= 3 && parts[1] >= 9;
    }
  }

  // Find harmonybrew
  diag.harmonybrew = findHarmonybrew();

  // If we have Python, check packages
  if (diag.python && diag.pythonOk) {
    diag.packages = checkInstalledPackages(diag.python);

    // Check required packages (by import name, since pip name != import name)
    const importNames = {
      numpy: "numpy",
      scipy: "scipy",
      PIL: "Pillow",
      pyglet: "pyglet",
      websockets: "websockets",
      esprima: "esprima",
      psychopy: "psychopy",
    };
    for (const [importName, pipName] of Object.entries(importNames)) {
      if (!(pipName in diag.packages) && !(importName in diag.packages)) {
        // Double-check by trying to import
        if (!canImport(diag.python, importName)) {
          diag.missingRequired.push({ import: importName, pip: pipName });
        }
      }
    }

    for (const opt of OPTIONAL_PACKAGES) {
      if (!(opt in diag.packages) && !canImport(diag.python, opt)) {
        diag.missingOptional.push(opt);
      }
    }

    // Check pip availability
    try {
      proc.execSync(`"${diag.python}" -m pip --version`, { timeout: 5000, encoding: "utf8" });
      diag.pipAvailable = true;
    } catch (_) {
      diag.pipAvailable = false;
    }

    // Check venv availability
    try {
      proc.execSync(`"${diag.python}" -c "import venv"`, { timeout: 5000, encoding: "utf8" });
      diag.venvAvailable = true;
    } catch (_) {
      diag.venvAvailable = false;
    }

    // Check --user install capability
    if (diag.pipAvailable) {
      try {
        // Dry-run: check if --user flag is accepted (doesn't actually install)
        proc.execSync(
          `"${diag.python}" -m pip install --user --dry-run pip`,
          { timeout: 10000, encoding: "utf8" }
        );
        diag.userInstallOk = true;
      } catch (_) {
        diag.userInstallOk = false;
      }
    }
  }

  // Determine recommendation
  if (diag.python && diag.pythonOk && diag.missingRequired.length === 0) {
    diag.recommendation = "system_python";
    diag.canProceed = true;
  } else if (diag.python && diag.pythonOk && diag.pipAvailable && diag.userInstallOk) {
    // System Python exists, can install missing packages with --user
    diag.recommendation = "system_python";
    diag.canProceed = true;
  } else if (diag.python && diag.pythonOk && diag.venvAvailable) {
    // Can create a venv to install packages safely
    diag.recommendation = "venv";
    diag.canProceed = true;
  } else if (diag.harmonybrew) {
    // Use harmonybrew to install Python
    diag.recommendation = "harmonybrew";
    diag.canProceed = true;
  } else if (diag.python && !diag.pythonOk) {
    // Python too old
    diag.recommendation = "harmonybrew";
    diag.canProceed = !!diag.harmonybrew;
  } else {
    // No Python at all
    diag.recommendation = "manual";
    diag.canProceed = false;
  }

  _diagnosticCache = diag;
  return diag;
}

/**
 * Generate user-facing guidance text based on diagnostics.
 * @param {object} diag - from diagnosePythonEnvironment()
 * @returns {string} Markdown text
 */
export function generateSetupGuidance(diag) {
  let md = "### 🔍 Python 环境诊断\n\n";

  // Platform info
  md += `**平台:** ${diag.isHarmonyOS ? "HarmonyOS (鸿蒙)" : diag.platform}\n`;
  if (diag.python) {
    md += `**系统 Python:** ✅ ${diag.python}\n`;
    md += `**版本:** ${diag.pythonVersion || "未知"} ${diag.pythonOk ? "✅" : "❌ (需 ≥3.9)"}\n`;
  } else {
    md += `**系统 Python:** ❌ 未找到\n`;
  }
  if (diag.harmonybrew) {
    md += `**Harmonybrew:** ✅ ${diag.harmonybrew}\n`;
  } else {
    md += `**Harmonybrew:** ❌ 未安装\n`;
  }
  md += "\n";

  // Package status
  if (diag.python && diag.pythonOk) {
    if (diag.missingRequired.length === 0) {
      md += "**核心依赖:** ✅ 全部已安装\n";
    } else {
      md += `**核心依赖:** ⚠️ 缺少 ${diag.missingRequired.length} 个包\n`;
      md += "| 缺少的包 | pip 安装名 |\n|---------|------------|\n";
      for (const m of diag.missingRequired) {
        md += `| ${m.import} | \`${m.pip}\` |\n`;
      }
      md += "\n";
    }

    if (diag.missingOptional.length > 0) {
      md += `**可选依赖:** 缺少 ${diag.missingOptional.length} 个 (不影响核心功能)\n\n`;
    }

    md += `**pip 可用:** ${diag.pipAvailable ? "✅" : "❌"}\n`;
    md += `**venv 可用:** ${diag.venvAvailable ? "✅" : "❌"}\n`;
    md += `**--user 安装:** ${diag.userInstallOk ? "✅" : "❌"}\n\n`;
  }

  // Recommendation
  md += "---\n\n### 📋 推荐操作\n\n";

  switch (diag.recommendation) {
    case "system_python":
      if (diag.missingRequired.length === 0) {
        md += "✅ **环境完整，无需额外操作。** Python 后端可以直接启动。\n";
      } else if (diag.userInstallOk) {
        md += "系统 Python 可用，但缺少部分依赖包。将自动安装：\n\n";
        md += "```bash\n";
        const pipNames = diag.missingRequired.map(m => m.pip);
        md += `pip3 install --user ${pipNames.join(" ")}\n`;
        md += "pip3 install --user psychopy-lib --no-deps\n";
        md += "```\n\n";
        md += "点击「自动安装」将使用 `pip3 install --user` 安装缺失的包。\n";
        md += "这不会影响系统其他 Python 程序。\n";
      } else if (diag.venvAvailable) {
        md += "系统 Python 可用，但 `--user` 安装受限。将创建独立 venv：\n\n";
        md += "```bash\n";
        md += `python3 -m venv ~/.psychopy-venv\n`;
        md += "~/.psychopy-venv/bin/pip install " + diag.missingRequired.map(m => m.pip).join(" ") + "\n";
        md += "~/.psychopy-venv/bin/pip install psychopy-lib --no-deps\n";
        md += "```\n\n";
        md += "venv 是隔离环境，完全不影响系统 Python。\n";
      }
      break;

    case "harmonybrew":
      if (!diag.python) {
        md += "系统未安装 Python3。推荐通过 **Harmonybrew** 安装：\n\n";
        md += "```bash\n";
        md += "# 安装 harmonybrew（如未安装）\n";
        md += "curl -fsSL https://harmonybrew.github.io/install.sh | bash\n\n";
        md += "# 安装 Python\n";
        md += "brew install python@3.12\n\n";
        md += "# 安装依赖\n";
        md += "pip3 install --user numpy scipy pillow pyglet websockets esprima\n";
        md += "pip3 install --user psychopy-lib --no-deps\n";
        md += "```\n\n";
        md += "安装完成后重启应用。\n";
        if (diag.harmonybrew) {
          md += "\n✅ 检测到 harmonybrew 已安装，点击「自动安装」将执行上述命令。\n";
        }
      } else {
        md += `系统 Python 版本过低 (${diag.pythonVersion})，需要 ≥3.9。\n\n`;
        if (diag.harmonybrew) {
          md += "推荐通过 harmonybrew 安装新版 Python：\n\n";
          md += "```bash\nbrew install python@3.12\n```\n";
        } else {
          md += "推荐通过 HNP 安装新版 Python：\n\n";
          md += "```bash\nhnp install python.org/python_3.12\n```\n";
        }
      }
      break;

    case "manual":
      md += "系统未安装 Python3，且 harmonybrew 不可用。\n\n";
      md += "请选择以下任一方式安装 Python 3.9+：\n\n";
      md += "**方式 1：HNP（推荐）**\n";
      md += "```bash\nhnp install python.org/python_3.12\n```\n\n";
      md += "**方式 2：Harmonybrew**\n";
      md += "```bash\ncurl -fsSL https://harmonybrew.github.io/install.sh | bash\nbrew install python@3.12\n```\n\n";
      md += "**方式 3：从源码编译**\n";
      md += "```bash\nwget https://www.python.org/ftp/python/3.12.8/Python-3.12.8.tgz\ntar xzf Python-3.12.8.tgz\ncd Python-3.12.8\n./configure --prefix=$HOME/.local\nmake && make install\n```\n\n";
      md += "安装 Python 后，再安装依赖：\n";
      md += "```bash\npip3 install --user numpy scipy pillow pyglet websockets esprima\npip3 install --user psychopy-lib --no-deps\n```\n\n";
      md += "完成后重启应用。\n";
      break;

    case "none":
    default:
      md += "❌ 无法确定可用的 Python 安装路径。请联系技术支持。\n";
      break;
  }

  return md;
}

/**
 * Get the appropriate Python discovery strategy for this platform.
 * @returns {"uv"|"native"|"hybrid"}
 */
export function getPythonStrategy() {
  if (!isHarmonyOS()) return "uv";

  const nativePython = findNativePython();
  if (!nativePython) return "uv";

  const ver = getPythonVersion(nativePython);
  if (!ver) return "uv";

  const parts = ver.split(".").map(Number);
  if (parts.length >= 2 && parts[0] >= 3 && parts[1] >= 9) {
    output("harmony", `Native Python ${ver} is sufficient for PsychoPy`);
    return "hybrid";
  }

  return "uv";
}
