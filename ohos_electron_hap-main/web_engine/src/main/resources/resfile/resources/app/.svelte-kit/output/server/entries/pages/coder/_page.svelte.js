import "clsx";
import { k as escape_html, j as getContext, s as setContext } from "../../../chunks/context.js";
import { o as openIn, _ as Script, g as Menu, h as SubMenu, I as Item, S as Separator, s as showWindow, i as showDevTools, j as setupPython, V as Version, P as PrefsDialog, m as BugReport, r as Ribbon, t as Section, u as IconButton, v as SwitchButton, U as UserCtrl, G as Gap, N as Notebook, q as Page, $ as CodeEditor, z as ButtonTab, C as CodeOutput, d as CompactButton, J as Frame, K as Pane_group, O as Pane, Q as Panel, W as Pane_resizer, X as TipsDialog, Y as Shortcuts, Z as SetupPython } from "../../../chunks/TipsDialog.js";
import { d as parsePath, p as python, m as mime, e as electron, s as snapshot, f as browseFileOpen, g as browseFileSave, c as prefs, I as Icon, T as Theme } from "../../../chunks/Theme.js";
import { z as bind_props, J as stringify, y as await_block, G as ensure_array_like, F as attr_class, x as attr } from "../../../chunks/index.js";
import "path-browserify";
import "@sveltejs/kit/internal/server";
import "@monaco-editor/loader";
import "marked";
import { D as Dialog_1 } from "../../../chunks/Dialog.js";
function CodeInput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = void 0,
      onsubmit = (evt) => {
      },
      onprevious = (evt) => {
      },
      onnext = (evt) => {
      }
    } = $$props;
    $$renderer2.push(`<textarea class="svelte-wlk6fo">`);
    const $$body = escape_html(value);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    } else {
      $$renderer2.push(`
`);
    }
    $$renderer2.push(`</textarea>`);
    bind_props($$props, { value });
  });
}
let current = {
  pages: [],
  tab: 0,
  openFile: async (file) => {
    if (typeof file === "string") {
      file = parsePath(file);
    }
    if (file.ext === ".psyexp") {
      openIn(file.file, "builder");
      return;
    }
    if (file.ext === ".psyrun") {
      openIn(file.file, "runner");
      return;
    }
    if (file.ext === ".psydat") {
      let fileCSV = await python.liaison.send("app", {
        command: "run",
        args: ["psychopy.tools.filetools:psydat2csv", file.file]
      });
      file = parsePath(fileCSV);
    }
    let mimeType = mime.getType(file.name) || "unknown";
    if (!(mimeType.startsWith("text") || ["application/json", "application/xml"].includes(mimeType))) {
      electron.files.openExternal(file.file);
      return;
    }
    if (!current.pages.some((item) => item.file.file === file.file)) {
      current.pages.push(new Script(file));
    }
    current.tab = current.pages.findIndex((item) => item.file.file === file.file);
    await current.pages[current.tab].fromFile(file);
  },
  tip: { shown: false }
};
function fileNew() {
  current.pages.push(new Script({
    file: void 0,
    parent: void 0,
    name: "untitled.py",
    stem: "untitled",
    ext: ".py"
  }));
  current.tab = snapshot(current.pages.length) - 1;
}
async function fileOpen() {
  let file = await browseFileOpen(
    [
      {
        description: "Python Scripts",
        accept: { "text/x-python-code": [".py"] }
      },
      {
        description: "JavaScript Scripts",
        accept: { "text/javascript": [".js"] }
      },
      {
        description: "Data Files",
        accept: { "text/csv": [".csv"], "application/json": [".json"] }
      }
    ],
    current.pages[current.tab]?.file?.parent
  );
  if (file === void 0) {
    return;
  }
  current.openFile(file);
}
async function revealFolder() {
  if (electron && current.pages[current.tab].file) {
    electron.files.showItemInFolder(current.pages[current.tab].file.file);
  }
}
async function fileSave() {
  if (!current.pages[current.tab]?.file?.file) {
    return fileSaveAs();
  }
  current.pages[current.tab].toFile(current.pages[current.tab].file);
}
async function fileSaveAs() {
  let file = await browseFileSave(
    [
      {
        description: "Python Scripts",
        accept: { "text/x-python-code": [".py"] }
      },
      {
        description: "JavaScript Scripts",
        accept: { "text/javascript": [".js"] }
      },
      {
        description: "Data Files",
        accept: { "text/csv": [".csv"], "application/json": [".json"] }
      }
    ],
    current.pages[current.tab]?.file?.file || "untitled.py"
  );
  if (file === void 0) {
    return;
  }
  current.pages[current.tab].file = file;
  await fileSave();
}
function quit() {
  if (electron) {
    electron.quit();
  }
}
function undo() {
  current.pages[current.tab]?.editor?.getModel()?.undo();
}
function redo() {
  current.pages[current.tab]?.editor?.getModel()?.undo();
}
function find() {
  current.pages[current.tab]?.editor?.trigger("find", "editor.actions.findWithArgs", { searchString: "" });
}
function togglePiloting() {
  if (current.pages[current.tab]) {
    current.pages[current.tab].pilotMode = !current.pages[current.tab].pilotMode;
  }
}
function sendToRunner() {
  openIn(current.pages[current.tab]?.file?.file, "runner");
}
async function runPython(version) {
  if (!python) {
    return;
  }
  if (current.pages[current.tab]) {
    await current.pages[current.tab].runPython(version);
  }
  return true;
}
async function stopPython(version) {
  if (!python) {
    return;
  }
  if (current.pages[current.tab]) {
    await current.pages[current.tab].stopPython(version);
  }
  return true;
}
var shortcuts = {};
function Menu_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { shown = void 0 } = $$props;
    let show = {
      prefsDlg: false,
      pluginMgr: false,
      bugReport: false
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Menu($$renderer3, {
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          SubMenu($$renderer4, {
            label: "File",
            icon: "/icons/rbn-file.svg",
            children: ($$renderer5) => {
              Item($$renderer5, {
                icon: "/icons/btn-new.svg",
                label: "New file",
                shortcut: "new",
                onclick: fileNew
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-open.svg",
                label: "Open file",
                shortcut: "open",
                onclick: fileOpen
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-save.svg",
                label: "Save file",
                shortcut: "save",
                onclick: fileSave,
                disabled: Object.values(current2.pages).length === 0 || !current2.pages[current2.tab]?.canUndo && current2.pages[current2.tab]?.file?.file
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-saveas.svg",
                label: "Save file as",
                shortcut: "saveAs",
                onclick: fileSaveAs,
                disabled: Object.values(current2.pages).length === 0
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Reveal in file explorer",
                onclick: revealFolder,
                shortcut: "revealFolder",
                disabled: current2.pages[current2.tab]?.file?.parent === void 0
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, { label: "Close window", onclick: close, shortcut: "close" });
              $$renderer5.push(`<!----> `);
              Separator($$renderer5);
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-settings.svg",
                label: "Preferences",
                onclick: (evt) => {
                  show.prefsDlg = true;
                }
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, { label: "Reset preferences", onclick: (evt) => prefs.reset() });
              $$renderer5.push(`<!---->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          SubMenu($$renderer4, {
            label: "Edit",
            icon: "/icons/rbn-edit.svg",
            children: ($$renderer5) => {
              Item($$renderer5, {
                label: "Undo",
                icon: "/icons/btn-undo.svg",
                disabled: !current2.pages[current2.tab]?.canUndo,
                onclick: undo,
                shortcut: "undo"
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Redo",
                icon: "/icons/btn-redo.svg",
                onclick: redo,
                disabled: !current2.pages[current2.tab]?.redo,
                shortcut: "redo"
              });
              $$renderer5.push(`<!----> `);
              Separator($$renderer5);
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Find",
                icon: "/icons/btn-find.svg",
                onclick: find,
                disabled: !current2.pages[current2.tab]?.editor,
                shortcut: "find"
              });
              $$renderer5.push(`<!---->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          SubMenu($$renderer4, {
            label: "View",
            icon: "/icons/rbn-windows.svg",
            children: ($$renderer5) => {
              Item($$renderer5, {
                label: "Show Builder",
                onclick: (evt) => showWindow("builder")
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, { label: "Show Runner", onclick: (evt) => showWindow("runner") });
              $$renderer5.push(`<!----> `);
              Separator($$renderer5);
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Show developer tools",
                onclick: showDevTools,
                shortcut: "showDevTools"
              });
              $$renderer5.push(`<!---->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          if (electron) {
            $$renderer4.push("<!--[-->");
            SubMenu($$renderer4, {
              label: "Run",
              icon: "/icons/btn-runpy.svg",
              children: ($$renderer5) => {
                Item($$renderer5, {
                  label: "Toggle pilot mode",
                  onclick: togglePiloting,
                  shortcut: "togglePilot",
                  disabled: !current2.pages[current2.tab]
                });
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: "Send to Runner",
                  icon: `/icons/btn-send${stringify(current2.pages[current2.tab]?.pilotMode ? "pilot" : "run")}.svg`,
                  onclick: sendToRunner,
                  shortcut: "sendToRunner",
                  disabled: !current2.pages[current2.tab]
                });
                $$renderer5.push(`<!----> `);
                Separator($$renderer5);
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: `${stringify(current2.pages[current2.tab]?.pilotMode ? "Pilot" : "Run")} in Python`,
                  icon: `/icons/btn-${stringify(current2.pages[current2.tab]?.pilotMode?.pilotMode ? "pilot" : "run")}py.svg`,
                  onclick: (evt) => runPython(),
                  shortcut: "runPython",
                  disabled: !current2.pages[current2.tab] || current2.pages[current2.tab].file.ext !== ".py"
                });
                $$renderer5.push(`<!---->`);
              },
              $$slots: { default: true }
            });
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          SubMenu($$renderer4, {
            label: "Tools",
            icon: "/icons/btn-hamburger.svg",
            children: ($$renderer5) => {
              Item($$renderer5, {
                label: "Manage plugins and packages",
                icon: "/icons/btn-plugin.svg",
                onclick: (evt) => show.pluginMgr = true,
                disabled: !python?.ready
              });
              $$renderer5.push(`<!----> `);
              if (electron) {
                $$renderer5.push("<!--[-->");
                Separator($$renderer5);
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: "Open PsychoPy user folder",
                  onclick: (evt) => electron.paths.user().then((folder) => electron.files.openPath(folder))
                });
                $$renderer5.push(`<!---->`);
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (python) {
                $$renderer5.push("<!--[-->");
                Item($$renderer5, {
                  label: "Reinstall Python",
                  onclick: (evt) => setupPython("app", true)
                });
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          SubMenu($$renderer4, {
            label: "Help",
            children: ($$renderer5) => {
              Item($$renderer5, {
                label: "PsychoPy Homepage",
                onclick: (evt) => open("https://www.psychopy.org/")
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Documentation",
                onclick: (evt) => open("https://www.psychopy.org/documentation")
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Help Forum",
                onclick: (evt) => open("https://discourse.psychopy.org/")
              });
              $$renderer5.push(`<!----> `);
              Separator($$renderer5);
              $$renderer5.push(`<!----> `);
              if (electron) {
                $$renderer5.push("<!--[-->");
                await_block($$renderer5, electron.version(), () => {
                }, (version) => {
                  Item($$renderer5, {
                    label: `PsychoPy ${stringify(version.major)}.${stringify(version.minor)}`,
                    disabled: true
                  });
                });
                $$renderer5.push(`<!--]-->`);
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]-->`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          if (electron) {
            $$renderer4.push("<!--[-->");
            await_block($$renderer4, electron.version(), () => {
            }, (version) => {
              if (version === "dev" || Version.parse(version).extra) {
                $$renderer4.push("<!--[-->");
                Separator($$renderer4);
                $$renderer4.push(`<!----> `);
                Item($$renderer4, { label: "Report bug", onclick: (evt) => show.bugReport = true });
                $$renderer4.push(`<!---->`);
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]-->`);
            });
            $$renderer4.push(`<!--]--> `);
            Separator($$renderer4);
            $$renderer4.push(`<!----> `);
            Item($$renderer4, { label: "Quit", onclick: quit, shortcut: "quit" });
            $$renderer4.push(`<!---->`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      PrefsDialog($$renderer3, {
        get shown() {
          return show.prefsDlg;
        },
        set shown($$value) {
          show.prefsDlg = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (python) {
        $$renderer3.push("<!--[-->");
        Dialog_1($$renderer3, {
          get shown() {
            return show.pluginMgr;
          },
          set shown($$value) {
            show.pluginMgr = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (electron) {
        $$renderer3.push("<!--[-->");
        BugReport($$renderer3, {
          user: current2.user,
          context: current2.pages,
          get shown() {
            return show.bugReport;
          },
          set shown($$value) {
            show.bugReport = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { shown });
  });
}
function Ribbon_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let show = {};
    let awaiting = { runpy: Promise.resolve(false) };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Ribbon($$renderer3, {
        children: ($$renderer4) => {
          Section($$renderer4, {
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-hamburger.svg",
                label: "Menu",
                onclick: () => show.menu = true,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              Menu_1($$renderer5, {
                get shown() {
                  return show.menu;
                },
                set shown($$value) {
                  show.menu = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Section($$renderer4, {
            label: "File",
            icon: "/icons/rbn-file.svg",
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-new.svg",
                label: "New file",
                onclick: fileNew,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-open.svg",
                label: "Open file",
                onclick: fileOpen,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-save.svg",
                label: "Save file",
                onclick: fileSave,
                borderless: true,
                disabled: Object.values(current2.pages).length === 0 || !current2.pages[current2.tab]?.canUndo && current2.pages[current2.tab]?.file?.file
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-saveas.svg",
                label: "Save file as",
                onclick: fileSaveAs,
                borderless: true,
                disabled: Object.values(current2.pages).length === 0
              });
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Section($$renderer4, {
            label: "Edit",
            icon: "/icons/rbn-edit.svg",
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-undo.svg",
                label: "Undo",
                onclick: undo,
                disabled: !current2.pages[current2.tab]?.canUndo,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-redo.svg",
                label: "Redo",
                onclick: redo,
                disabled: !current2.pages[current2.tab]?.canRedo,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-find.svg",
                label: "Find",
                onclick: find,
                disabled: !current2.pages[current2.tab]?.editor,
                borderless: true
              });
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Section($$renderer4, {
            label: "Experiment",
            icon: "/icons/rbn-experiment.svg",
            children: ($$renderer5) => {
              var bind_get = () => current2.pages[current2.tab]?.pilotMode;
              var bind_set = (value) => current2.pages[current2.tab].pilotMode = value;
              SwitchButton($$renderer5, {
                labels: ["Pilot", "Run"],
                tooltip: `Experiment will run in ${stringify(current2.pages[current2.tab]?.pilotMode ? "pilot" : "run")} mode`,
                get value() {
                  return bind_get();
                },
                set value($$value) {
                  bind_set($$value);
                },
                disabled: !current2.pages[current2.tab]
              });
              $$renderer5.push(`<!----> `);
              if (python?.ready) {
                $$renderer5.push("<!--[-->");
                IconButton($$renderer5, {
                  icon: `/icons/btn-send${stringify(current2.pages[current2.tab]?.pilotMode ? "pilot" : "run")}.svg`,
                  label: "Send experiment to runner",
                  onclick: sendToRunner,
                  disabled: !current2.pages[current2.tab]?.file?.file,
                  borderless: true
                });
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]-->`);
            }
          });
          $$renderer4.push(`<!----> `);
          if (python?.ready) {
            $$renderer4.push("<!--[-->");
            Section($$renderer4, {
              label: "Run",
              icon: "/icons/btn-runpy.svg",
              children: ($$renderer5) => {
                IconButton($$renderer5, {
                  icon: `/icons/btn-${stringify(current2.pages[current2.tab]?.pilotMode ? "pilot" : "run")}py.svg`,
                  label: `${stringify(current2.pages[current2.tab]?.pilotMode ? "Pilot" : "Run")} experiment locally`,
                  onclick: (evt) => runPython(),
                  disabled: !current2.pages[current2.tab]?.file?.file || current2.pages[current2.tab]?.file?.ext !== ".py",
                  cancel: (evt) => stopPython(),
                  borderless: true,
                  get awaiting() {
                    return awaiting.runpy;
                  },
                  set awaiting($$value) {
                    awaiting.runpy = $$value;
                    $$settled = false;
                  }
                });
              }
            });
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          Section($$renderer4, {
            label: "Pavlovia",
            icon: "/icons/rbn-pavlovia.svg",
            children: ($$renderer5) => {
              UserCtrl($$renderer5);
            }
          });
          $$renderer4.push(`<!----> `);
          Gap($$renderer4);
          $$renderer4.push(`<!----> `);
          Section($$renderer4, {
            label: "Views",
            icon: "/icons/rbn-windows.svg",
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-builder.svg",
                label: "Builder view",
                onclick: (evt) => showWindow("builder"),
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-coder.svg",
                label: "Coder view",
                onclick: (evt) => showWindow("coder"),
                borderless: true,
                disabled: true
              });
              $$renderer5.push(`<!----> `);
              if (electron) {
                $$renderer5.push("<!--[-->");
                IconButton($$renderer5, {
                  icon: "/icons/btn-runner.svg",
                  label: "Runner view",
                  onclick: (evt) => showWindow("runner"),
                  borderless: true
                });
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]-->`);
            }
          });
          $$renderer4.push(`<!---->`);
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function CoderNotebook($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Notebook($$renderer3, {
        children: ($$renderer4) => {
          $$renderer4.push(`<!--[-->`);
          const each_array = ensure_array_like(Object.entries(current2.pages));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let [i, page] = each_array[$$index];
            var bind_get = () => current2.tab === parseInt(i);
            var bind_set = (val) => {
              if (val) {
                current2.tab = parseInt(i);
              }
            };
            Page($$renderer4, {
              label: page.file.name,
              close: (evt) => current2.pages.splice(i, 1),
              get selected() {
                return bind_get();
              },
              set selected($$value) {
                bind_set($$value);
              },
              children: ($$renderer5) => {
                CodeEditor($$renderer5, {
                  readonly: prefs.params["readonly"].val,
                  file: page.file,
                  get theme() {
                    return prefs.params.theme.val;
                  },
                  set theme($$value) {
                    prefs.params.theme.val = $$value;
                    $$settled = false;
                  },
                  get value() {
                    return page.content;
                  },
                  set value($$value) {
                    page.content = $$value;
                    $$settled = false;
                  },
                  get editor() {
                    return page.editor;
                  },
                  set editor($$value) {
                    page.editor = $$value;
                    $$settled = false;
                  },
                  get canUndo() {
                    return page.canUndo;
                  },
                  set canUndo($$value) {
                    page.canUndo = $$value;
                    $$settled = false;
                  },
                  get canRedo() {
                    return page.canRedo;
                  },
                  set canRedo($$value) {
                    page.canRedo = $$value;
                    $$settled = false;
                  }
                });
              },
              $$slots: { default: true }
            });
          }
          $$renderer4.push(`<!--]--> `);
          ButtonTab($$renderer4, {
            callback: (evt) => current2.pages.push(new Script({
              file: void 0,
              parent: void 0,
              name: "untitled.py",
              stem: "untitled",
              ext: ".py"
            })),
            tooltip: "New file..."
          });
          $$renderer4.push(`<!---->`);
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function Shell($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { id } = $$props;
    let output = { content: "" };
    let input = { past: [], present: "", future: [] };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="shell-ctrl svelte-3nwxar"><div class="output svelte-3nwxar">`);
      {
        let ctrls = function($$renderer4) {
          CompactButton($$renderer4, {
            icon: "/icons/btn-clear.svg",
            onclick: (evt) => output.content = "",
            tooltip: "Clear output"
          });
        };
        CodeOutput($$renderer3, {
          get value() {
            return output.content;
          },
          set value($$value) {
            output.content = $$value;
            $$settled = false;
          },
          ctrls,
          $$slots: { ctrls: true }
        });
      }
      $$renderer3.push(`<!----></div> `);
      CodeInput($$renderer3, {
        onsubmit: (evt) => {
          let cmd = input.present;
          let resp = python.shell.send("app", id, cmd);
          input.past.push(cmd);
          input.future = [];
          input.present = "";
          resp.then((resp2) => output.content += resp2.join("\n") + "\n").catch((err) => console.log(err));
        },
        onprevious: (evt) => {
          if (!input.past.length) {
            return;
          }
          input.future.unshift(input.present);
          input.present = input.past.pop();
        },
        onnext: (evt) => {
          if (!input.future.length) {
            return;
          }
          input.past.push(input.present);
          input.present = input.future.shift();
        },
        get value() {
          return input.present;
        },
        set value($$value) {
          input.present = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function ShellNotebook($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let shells = {};
    let currentTab = void 0;
    python.shell.open("app").then((id) => {
      shells[id] = "Python";
      currentTab = id;
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Notebook($$renderer3, {
        children: ($$renderer4) => {
          $$renderer4.push(`<!--[-->`);
          const each_array = ensure_array_like(Object.entries(shells));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let [id, label] = each_array[$$index];
            var bind_get = () => currentTab === id;
            var bind_set = (value) => {
              if (value) {
                currentTab = id;
              }
            };
            Page($$renderer4, {
              label,
              close: (evt) => {
                python.shell.close("app", id);
                delete shells[id];
              },
              get selected() {
                return bind_get();
              },
              set selected($$value) {
                bind_set($$value);
              },
              children: ($$renderer5) => {
                Shell($$renderer5, { id });
              },
              $$slots: { default: true }
            });
          }
          $$renderer4.push(`<!--]--> `);
          ButtonTab($$renderer4, {
            callback: async (evt) => shells[await python.shell.open("app")] = "Python"
          });
          $$renderer4.push(`<!---->`);
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function TreeRoot($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @interface */
      children
    } = $$props;
    let nodes = { selected: void 0 };
    setContext("siblings", nodes);
    $$renderer2.push(`<div class="tree-root svelte-1vc3saq">`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function TreeNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      label,
      icon = void 0,
      disabled = false,
      /** @interface */
      chevron
    } = $$props;
    let handle = void 0;
    let siblings = getContext("siblings");
    $$renderer2.push(`<button${attr_class("tree-node svelte-s0a6w2", void 0, {
      "disabled": disabled,
      "selected": siblings.selected === handle
    })}${attr("disabled", disabled, true)}>`);
    chevron?.($$renderer2);
    $$renderer2.push(`<!----> `);
    if (icon) {
      $$renderer2.push("<!--[-->");
      Icon($$renderer2, { src: icon, size: "1.25rem" });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <span class="node-label svelte-s0a6w2">${escape_html(label)}</span></button>`);
  });
}
function TreeBranch($$renderer, $$props) {
  let {
    label,
    icon = void 0
  } = $$props;
  $$renderer.push(`<div class="tree-branch svelte-hzgo4u">`);
  {
    let chevron = function($$renderer2) {
      Icon($$renderer2, {
        src: `/icons/sym-arrow-${stringify("right")}.svg`,
        size: ".5rem"
      });
    };
    TreeNode($$renderer, {
      label,
      icon,
      chevron
    });
  }
  $$renderer.push(`<!----> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div>`);
}
function DirCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, onchange = (value2) => {
    } } = $$props;
    let current2 = getContext("current");
    $$renderer2.push(`<div class="dir-ctrl svelte-rlum3y"><input class="directory svelte-rlum3y"${attr("value", value)} disabled/> `);
    CompactButton($$renderer2, {
      icon: "/icons/btn-open.svg",
      tooltip: "Open folder...",
      onclick: async (evt) => {
        let folder = await electron.files.openDialog({ properties: ["openDirectory"] });
        if (folder === void 0) {
          return;
        }
        value = folder[0];
        onchange(snapshot(value));
      }
    });
    $$renderer2.push(`<!----> `);
    CompactButton($$renderer2, {
      icon: "/icons/btn-target.svg",
      tooltip: "Navigate to current file",
      onclick: (evt) => {
        value = current2.pages[current2.tab].file.parent;
        onchange(snapshot(value));
      },
      disabled: current2.pages[current2.tab] === void 0
    });
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { value });
  });
}
function FolderNode_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0 } = $$props;
    getContext("current");
    TreeBranch($$renderer2, {
      label: parsePath(value || "").name
    });
    bind_props($$props, { value });
  });
}
function FileExplorer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    getContext("current");
    let directory = void 0;
    electron.paths.documents().then((resp) => directory = resp);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="file-explorer svelte-vnimlf">`);
      DirCtrl($$renderer3, {
        get value() {
          return directory;
        },
        set value($$value) {
          directory = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      TreeRoot($$renderer3, {
        children: ($$renderer4) => {
          FolderNode_1($$renderer4, {
            get value() {
              return directory;
            },
            set value($$value) {
              directory = $$value;
              $$settled = false;
            }
          });
        }
      });
      $$renderer3.push(`<!----></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    setContext("current", current);
    let params = new URLSearchParams(location.search);
    if (params.get("fileOpen")) {
      current.openFile(params.get("fileOpen"));
    }
    if (electron) {
      electron.windows.listen("fileOpen", (evt, file) => current.openFile(file));
      electron.windows.emit("ready", true);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<title>PsychoPy Coder</title> `);
      {
        let ribbon = function($$renderer4) {
          Ribbon_1($$renderer4);
        };
        Frame($$renderer3, {
          onFileDrop: (evt, file) => current.openFile(file),
          ribbon,
          children: ($$renderer4) => {
            Pane_group($$renderer4, {
              direction: "vertical",
              children: ($$renderer5) => {
                Pane($$renderer5, {
                  defaultSize: 2 / 3,
                  children: ($$renderer6) => {
                    Pane_group($$renderer6, {
                      direction: "horizontal",
                      children: ($$renderer7) => {
                        if (electron) {
                          $$renderer7.push("<!--[-->");
                          Pane($$renderer7, {
                            defaultSize: 1 / 4,
                            children: ($$renderer8) => {
                              Panel($$renderer8, {
                                title: "Files",
                                children: ($$renderer9) => {
                                  FileExplorer($$renderer9);
                                }
                              });
                            },
                            $$slots: { default: true }
                          });
                        } else {
                          $$renderer7.push("<!--[!-->");
                        }
                        $$renderer7.push(`<!--]--> `);
                        Pane_resizer($$renderer7, { style: "width: .3rem;" });
                        $$renderer7.push(`<!----> `);
                        Pane($$renderer7, {
                          defaultSize: 3 / 4,
                          children: ($$renderer8) => {
                            Panel($$renderer8, {
                              title: "Editor",
                              children: ($$renderer9) => {
                                CoderNotebook($$renderer9);
                              }
                            });
                          },
                          $$slots: { default: true }
                        });
                        $$renderer7.push(`<!---->`);
                      },
                      $$slots: { default: true }
                    });
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Pane_resizer($$renderer5, { style: "height: .3rem;" });
                $$renderer5.push(`<!----> `);
                if (python?.ready) {
                  $$renderer5.push("<!--[-->");
                  Pane($$renderer5, {
                    defaultSize: 1 / 3,
                    children: ($$renderer6) => {
                      Panel($$renderer6, {
                        title: "Console",
                        children: ($$renderer7) => {
                          ShellNotebook($$renderer7);
                        }
                      });
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer5.push("<!--[!-->");
                }
                $$renderer5.push(`<!--]-->`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            TipsDialog($$renderer4, {
              categories: ["general", "coder", "silly"],
              get shown() {
                return current.tip.shown;
              },
              set shown($$value) {
                current.tip.shown = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----> `);
            Theme($$renderer4);
            $$renderer4.push(`<!----> `);
            Shortcuts($$renderer4, { callbacks: shortcuts });
            $$renderer4.push(`<!----> `);
            SetupPython($$renderer4);
            $$renderer4.push(`<!---->`);
          }
        });
      }
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
