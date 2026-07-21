// 简体中文翻译字典（PsychoPy Studio OH）
// 仅覆盖需要翻译的键；缺失的键会回退到 en_US.js，再回退到原始英文串。
// 翻译遵循心理学实验工具的专业术语：
//   stimulus → 刺激, trial → 试次, routine → 例程, pilot → 试点, component → 组件

export default {
    // ---- 菜单栏 ----  (菜单栏标题)
    "menu.file": "文件",
    "menu.edit": "编辑",
    "menu.view": "视图",
    "menu.experiment": "实验",
    "menu.run": "运行",
    "menu.tools": "工具",
    "menu.help": "帮助",

    // ---- 文件菜单 ----
    "file.new": "新建文件",
    "file.open": "打开文件",
    "file.save": "保存文件",
    "file.saveAs": "文件另存为",
    "file.reveal": "在文件管理器中显示",
    "file.close": "关闭窗口",
    "file.preferences": "首选项",
    "file.resetPrefs": "重置首选项",
    "file.quit": "退出",
    "file.newConfig": "新建配置",
    "file.openConfig": "打开配置",
    "file.saveConfig": "保存配置",
    "file.saveConfigAs": "配置另存为",

    // ---- 编辑菜单 ----
    "edit.undo": "撤销",
    "edit.redo": "重做",
    "edit.find": "查找",
    "edit.findInExp": "在实验中查找",

    // ---- 视图菜单 ----
    "view.showBuilder": "显示 Builder",
    "view.showCoder": "显示 Coder",
    "view.showRunner": "显示 Runner",
    "view.devTools": "显示开发者工具",

    // ---- 实验菜单 ----
    "exp.settings": "实验设置",
    "exp.readme": "显示自述文件",
    "exp.copyRoutine": "复制当前例程",
    "exp.pasteRoutine": "粘贴例程",

    // ---- 运行菜单 ----
    "run.togglePilot": "切换试点模式",
    "run.sendToRunner": "发送到运行器",
    "run.compilePy": "编译 Python",
    "run.compileJs": "编译 JS",
    "run.runInPython": "在 Python 中运行",
    "run.pilotInPython": "在 Python 中试跑",
    "run.runInBrowser": "在浏览器中运行",
    "run.pilotInBrowser": "在浏览器中试跑",

    // ---- 工具菜单 ----
    "tools.deviceManager": "打开设备管理器",
    "tools.plugins": "管理插件与包",
    "tools.userFolder": "打开 PsychoPy 用户文件夹",
    "tools.reinstallPy": "重新安装 Python",

    // ---- 帮助菜单 ----
    "help.homepage": "PsychoPy 主页",
    "help.docs": "文档",
    "help.forum": "帮助论坛",
    "help.about": "PsychoPy {version}",
    "help.aboutShort": "PsychoPy {version}",
    "help.reportBug": "报告问题",

    // ---- 工具栏 / 功能区 ----
    "tb.menu": "菜单",
    "tb.file": "文件",
    "tb.edit": "编辑",
    "tb.experiment": "实验",
    "tb.desktop": "桌面",
    "tb.browser": "浏览器",
    "tb.pavlovia": "Pavlovia",
    "tb.views": "视图",
    "tb.selection": "选中项",
    "tb.newFile": "新建文件",
    "tb.openFile": "打开文件",
    "tb.saveFile": "保存文件",
    "tb.saveFileAs": "文件另存为",
    "tb.undo": "撤销",
    "tb.redo": "重做",
    "tb.find": "查找",
    "tb.monitorCenter": "打开监视器中心",
    "tb.deviceManager": "打开设备管理器",
    "tb.expSettings": "实验设置",
    "tb.pilot": "试跑",
    "tb.run": "运行",
    "tb.sendToRunner": "发送实验到运行器",
    "tb.writePy": "将实验导出为 .py 文件",
    "tb.runLocal": "在本地运行实验",
    "tb.pilotLocal": "在本地试跑实验",
    "tb.writeJs": "将实验导出为 .js 文件",
    "tb.runBrowser": "在浏览器中运行实验",
    "tb.pilotBrowser": "在浏览器中试跑实验",
    "tb.sync": "同步实验",
    "tb.builderView": "Builder 视图",
    "tb.coderView": "Coder 视图",
    "tb.runnerView": "Runner 视图",
    "tb.newConfig": "新建配置",
    "tb.openConfig": "打开配置",
    "tb.saveConfig": "保存配置",
    "tb.saveConfigAs": "配置另存为",
    "tb.openSelectionIn": "在 {target} 中打开选中项",

    // ---- 切换按钮（试跑/运行）提示 ----
    "tip.runMode": "实验将以运行模式运行",
    "tip.pilotMode": "实验将以试点模式运行",

    // ---- 标准对话框按钮 ----
    "dlg.ok": "确定",
    "dlg.apply": "应用",
    "dlg.yes": "是",
    "dlg.no": "否",
    "dlg.cancel": "取消",
    "dlg.help": "帮助",
    "dlg.reset": "重置",

    // ---- 启动 / 主页 ----
    "home.builder": "Builder",
    "home.builderDesc": "通过直观的图形界面（GUI）轻松生成实验。",
    "home.coder": "Coder",
    "home.coderDesc": "直接用多种语言编写和编辑代码。",
    "home.runner": "Runner",
    "home.runnerDesc": "协调运行实验与脚本，并查看产生的警告。",
    "home.ready": "就绪",
    "home.failedSetup": "初始化失败：",
    "home.tryAgain": "重试？",

    // ---- 平板模式 ----
    "tablet.banner": "正在以平板模式运行",
    "tablet.title": "平板模式",
    "tablet.body": "您正在鸿蒙平板或平板模式下运行本应用。您可以编辑实验并在浏览器中运行。依赖 Python 的功能（本地实验执行、外接设备连接、设备管理器等）在平板模式下不可用。如需完整功能，请在电脑模式或桌面设备上运行本应用。",
    "tablet.switchSuggestion": "在支持的设备（如 MatePad Edge）上，可在系统设置中切换至电脑模式以解锁完整功能。",

    // ---- 组件面板 ----
    "comp.getMore": "获取更多…",
    "comp.reload": "重新加载组件",
    "comp.filter": "筛选…",
    "comp.loading": "正在加载组件…",
    "comp.failedLoad": "组件加载失败。",

    // ---- 其他通用 ----
    "common.close": "关闭",
    "common.confirm": "确认",
    "common.loading": "加载中…",
    "common.error": "错误",
    "common.warning": "警告"
};
