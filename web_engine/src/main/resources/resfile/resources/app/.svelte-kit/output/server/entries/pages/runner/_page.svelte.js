import { j as getContext, k as escape_html, s as setContext } from "../../../chunks/context.js";
import "clsx";
import { d as CompactButton, a0 as Experiment, _ as Script, a1 as RadioButton, B as Button, C as CodeOutput, g as Menu, h as SubMenu, I as Item, S as Separator, s as showWindow, i as showDevTools, j as setupPython, V as Version, P as PrefsDialog, m as BugReport, r as Ribbon, t as Section, u as IconButton, v as SwitchButton, o as openIn, U as UserCtrl, G as Gap, J as Frame, K as Pane_group, O as Pane, Q as Panel$1, W as Pane_resizer, N as Notebook, q as Page, X as TipsDialog, Y as Shortcuts, Z as SetupPython } from "../../../chunks/TipsDialog.js";
import { d as parsePath, e as electron, f as browseFileOpen, s as snapshot, g as browseFileSave, I as Icon, c as prefs, p as python, h as git, T as Theme } from "../../../chunks/Theme.js";
import { G as ensure_array_like, x as attr, K as attr_style, J as stringify, z as bind_props, y as await_block } from "../../../chunks/index.js";
import "@sveltejs/kit/internal/server";
import path from "path-browserify";
import "@monaco-editor/loader";
import "marked";
function AlertsOutput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    $$renderer2.push(`<div class="alerts-output svelte-iw39i4"><div class="alerts-array svelte-iw39i4"><!--[-->`);
    const each_array = ensure_array_like(current2.output.alerts);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let message = each_array[$$index];
      $$renderer2.push(`<div class="alert svelte-iw39i4"><h3 class="svelte-iw39i4">${escape_html(message.cat)} Alert</h3> <code class="alert-code svelte-iw39i4">#${escape_html(message.code)}</code> <span class="alert-msg">${escape_html(message.msg)}</span> <a${attr("href", `https://docs.psychopy.org/alerts/${stringify(message.code)}.html`)} target="_blank"${attr_style("", { "grid-column-start": "content" })}>More info</a></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="alerts-ctrls svelte-iw39i4">`);
    CompactButton($$renderer2, {
      icon: "/icons/btn-clear.svg",
      onclick: (evt) => current2.output.alerts.length = 0,
      tooltip: "Clear alerts"
    });
    $$renderer2.push(`<!----></div></div>`);
  });
}
let current = {
  user: void 0,
  selection: void 0,
  runlist: [],
  file: void 0,
  tab: "alerts",
  output: { alerts: [], stdout: "", pavlovia: "" },
  awaiting: { runpy: Promise.resolve(""), runjs: Promise.resolve("") },
  tip: { shown: false }
};
async function addFile(file, pilotMode = void 0) {
  let item;
  if (typeof file === "string") {
    file = parsePath(file);
  }
  if (current.runlist.some((item2) => item2.file.file === file.file)) {
    current.selection = current.runlist.findIndex((item2) => item2.file.file === file.file);
    return;
  }
  if (file.ext === ".psyrun") {
    for (let subfile of await loadPsyrun(file)) {
      addFile(subfile.file, subfile.pilotMode);
    }
    return;
  }
  if (file.ext === ".psyexp") {
    item = new Experiment("untitled.psyexp");
    await item.fromFile(file);
  }
  if (file.ext === ".py") {
    item = new Script(file);
  }
  if (!item) {
    return;
  }
  if (pilotMode !== void 0) {
    item.pilotMode = pilotMode;
  }
  current.runlist.push(item);
  current.selection = current.runlist.length;
}
async function loadPsyrun(file) {
  let content = await electron.files.load(file.file);
  let output = [];
  for (let item of JSON.parse(content)) {
    output.push({
      file: parsePath(path.join(item.path, item.file)),
      pilotMode: item.pilotMode
    });
  }
  return output;
}
function fileNew() {
  current.runlist.length = 0;
  current.file = void 0;
}
async function fileOpen(replace = false) {
  let allowedFiles;
  if (replace) {
    allowedFiles = [
      // only psyrun if we're replacing
      {
        description: "PsychoPy Runner Configurations",
        accept: { "application/x-python-code": [".psyrun"] }
      }
    ];
  } else {
    allowedFiles = [
      {
        description: "PsychoPy Experiments",
        accept: { "application/xml": [".psyexp"] }
      },
      {
        description: "Python Scripts",
        accept: { "application/x-python-code": [".py"] }
      },
      {
        description: "PsychoPy Runner Configurations",
        accept: { "application/x-python-code": [".psyrun"] }
      }
    ];
  }
  let file = await browseFileOpen(allowedFiles, "");
  if (file === void 0) {
    return;
  }
  if (replace) {
    fileNew();
    current.file = file;
  }
  await addFile(file);
}
async function fileSave() {
  if (current.file) {
    let output = current.runlist.map((item) => snapshot({
      path: item.file.parent,
      file: item.file.name,
      runMode: item.file.pilotMode ? "pilot" : "run"
    }));
    output = JSON.stringify(output, void 0, 4);
    if (electron) {
      await electron.files.save(snapshot(current.file.file), output);
    } else {
      let file = await current.file.handle.createWritable();
      file.seek(0);
      file.write(output);
      file.close();
    }
  } else {
    return fileSaveAs();
  }
}
async function fileSaveAs() {
  let file = await browseFileSave(
    [
      {
        description: "PsychoPy Runner Configurations",
        accept: { "application/xml": [".psyrun"] }
      }
    ],
    current.file?.file || "untitled.psyrun"
  );
  if (file === void 0) {
    return;
  }
  current.file = file;
  await fileSave();
  return current.file;
}
function quit() {
  if (electron) {
    electron.quit();
  }
}
function togglePiloting() {
  if (current.runlist[current.selection]) {
    current.runlist[current.selection].pilotMode = !current.runlist[current.selection]?.pilotMode;
  }
}
var shortcuts = {};
function Panel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="panel svelte-q8ea2z"><div class="items svelte-q8ea2z"><!--[-->`);
      const each_array = ensure_array_like(Object.entries(current2.runlist));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let [i, item] = each_array[$$index];
        $$renderer3.push(`<div class="item svelte-q8ea2z">`);
        Icon($$renderer3, {
          src: `/icons/btn-${stringify(item.pilotMode ? "pilot" : "run")}py.svg`
        });
        $$renderer3.push(`<!----> `);
        RadioButton($$renderer3, {
          value: parseInt(i),
          label: `${stringify(item.file.name.length > 40 ? "..." : "")}${stringify(item.file.name.slice(-40))}`,
          tooltip: item.file.file,
          icon: `/icons/btn-${stringify(item instanceof Experiment ? "builder" : "coder")}.svg`,
          get selection() {
            return current2.selection;
          },
          set selection($$value) {
            current2.selection = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> `);
        CompactButton($$renderer3, {
          icon: "/icons/btn-delete.svg",
          onclick: (evt) => delete current2.runlist[parseInt(i)]
        });
        $$renderer3.push(`<!----></div>`);
      }
      $$renderer3.push(`<!--]--></div> <div class="ctrls svelte-q8ea2z">`);
      Button($$renderer3, {
        label: "Add file",
        icon: "/icons/btn-add.svg",
        onclick: (evt) => fileOpen(false),
        horizontal: true
      });
      $$renderer3.push(`<!----></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function StdoutOutput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      {
        let ctrls = function($$renderer4) {
          CompactButton($$renderer4, {
            icon: "/icons/btn-clear.svg",
            onclick: (evt) => current2.output.stdout = "",
            tooltip: "Clear stdout"
          });
        };
        CodeOutput($$renderer3, {
          get value() {
            return current2.output.stdout;
          },
          set value($$value) {
            current2.output.stdout = $$value;
            $$settled = false;
          },
          ctrls,
          $$slots: { ctrls: true }
        });
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function PavloviaOutput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      {
        let ctrls = function($$renderer4) {
          CompactButton($$renderer4, {
            icon: "/icons/btn-clear.svg",
            onclick: (evt) => current2.output.pavlovia = "",
            tooltip: "Clear pavlovia output"
          });
        };
        CodeOutput($$renderer3, {
          get value() {
            return current2.output.pavlovia;
          },
          set value($$value) {
            current2.output.pavlovia = $$value;
            $$settled = false;
          },
          ctrls,
          $$slots: { ctrls: true }
        });
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function Menu_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { shown = void 0 } = $$props;
    let show = {
      prefsDlg: false,
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
                onclick: fileSave
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-saveas.svg",
                label: "Save file as",
                shortcut: "saveAs",
                onclick: fileSaveAs
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
              $$renderer5.push(`<!----> `);
              if (electron) {
                $$renderer5.push("<!--[-->");
                Separator($$renderer5);
                $$renderer5.push(`<!----> `);
                Item($$renderer5, { label: "Quit", onclick: quit, shortcut: "quit" });
                $$renderer5.push(`<!---->`);
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]-->`);
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
              Item($$renderer5, { label: "Show Coder", onclick: (evt) => showWindow("coder") });
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
              disabled: current2.selection === void 0,
              children: ($$renderer5) => {
                Item($$renderer5, {
                  label: "Toggle pilot mode",
                  onclick: togglePiloting,
                  shortcut: "togglePilot",
                  disabled: current2.selection === void 0
                });
                $$renderer5.push(`<!----> `);
                Separator($$renderer5);
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: `${stringify(current2.runlist[current2.selection]?.pilotMode ? "Pilot" : "Run")} in Python`,
                  icon: `/icons/btn-${stringify(current2.runlist[current2.selection]?.pilotMode ? "pilot" : "run")}py.svg`,
                  onclick: (evt) => current2.awaiting.runpy = current2.runlist[current2.selection]?.runPython(),
                  shortcut: "runPython",
                  disabled: current2.selection === void 0
                });
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: `${stringify(current2.runlist[current2.selection]?.pilotMode ? "Pilot" : "Run")} in browser`,
                  icon: `/icons/btn-${stringify(current2.runlist[current2.selection]?.pilotMode ? "pilot" : "run")}js.svg`,
                  onclick: (evt) => current2.awaiting.runjs = current2.runlist[current2.selection]?.runJS(),
                  shortcut: "runJS",
                  disabled: current2.selection === void 0
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
                label: "Open device manager",
                icon: "/icons/btn-devices.svg",
                onclick: (evt) => show.deviceMgrDlg = true
              });
              $$renderer5.push(`<!----> `);
              if (python?.ready) {
                $$renderer5.push("<!--[-->");
                Item($$renderer5, {
                  label: "Manage plugins and packages",
                  icon: "/icons/btn-plugin.svg",
                  onclick: (evt) => show.pluginMgr = true,
                  disabled: !python?.ready
                });
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]--> `);
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
      if (electron) {
        $$renderer3.push("<!--[-->");
        BugReport($$renderer3, {
          user: current2.user,
          context: current2.runlist,
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
    let show = {
      menu: false
    };
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
                label: "New configuration",
                onclick: (evt) => fileNew(),
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-open.svg",
                label: "Open configuration",
                onclick: (evt) => fileOpen(true).catch((err) => console.error(err)),
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-save.svg",
                label: "Save configuration",
                onclick: fileSave,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-saveas.svg",
                label: "Save configuration as",
                onclick: fileSaveAs,
                borderless: true
              });
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Section($$renderer4, {
            label: "Selection",
            icon: "/icons/rbn-experiment.svg",
            children: ($$renderer5) => {
              var bind_get = () => current2.runlist[current2.selection]?.pilotMode;
              var bind_set = (value) => current2.runlist[current2.selection]?.setPilotMode(value);
              SwitchButton($$renderer5, {
                labels: ["Pilot", "Run"],
                tooltip: `Experiment will run in ${stringify(current2.runlist[current2.selection]?.pilotMode ? "pilot" : "run")} mode`,
                get value() {
                  return bind_get();
                },
                set value($$value) {
                  bind_set($$value);
                },
                disabled: current2.selection === void 0
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: `/icons/btn-send${stringify(current2.runlist[current2.selection]?.file.ext === ".psyexp" ? "builder" : "coder")}.svg`,
                label: `Open selection in ${stringify(current2.runlist[current2.selection]?.file.ext === ".psyexp" ? "Builder" : "Coder")}`,
                onclick: (evt) => openIn(current2.runlist[current2.selection]?.file.file, current2.runlist[current2.selection]?.file.ext === ".psyexp" ? "builder" : "coder"),
                borderless: true,
                disabled: !current2.runlist[current2.selection]
              });
              $$renderer5.push(`<!---->`);
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
                  icon: `/icons/btn-${stringify(current2.runlist[current2.selection]?.pilotMode ? "pilot" : "run")}py.svg`,
                  label: `${stringify(current2.runlist[current2.selection]?.pilotMode ? "Pilot" : "Run")} experiment locally`,
                  onclick: (evt) => current2.runlist[current2.selection]?.runPython(),
                  disabled: current2.selection === void 0,
                  cancel: python.scripts.stop,
                  borderless: true,
                  get awaiting() {
                    return current2.awaiting.runpy;
                  },
                  set awaiting($$value) {
                    current2.awaiting.runpy = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----> `);
                IconButton($$renderer5, {
                  icon: `/icons/btn-${stringify(current2.runlist[current2.selection]?.pilotMode ? "pilot" : "run")}js.svg`,
                  label: `${stringify(current2.runlist[current2.selection]?.pilotMode ? "Pilot" : "Run")} experiment in browser`,
                  onclick: (evt) => current2.runlist[current2.selection]?.runJS(),
                  disabled: current2.selection === void 0 || !(current2.runlist[current2.selection] instanceof Experiment),
                  borderless: true,
                  get awaiting() {
                    return current2.awaiting.runjs;
                  },
                  set awaiting($$value) {
                    current2.awaiting.runjs = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!---->`);
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
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              if (electron) {
                $$renderer5.push("<!--[-->");
                IconButton($$renderer5, {
                  icon: "/icons/btn-runner.svg",
                  label: "Runner view",
                  onclick: (evt) => showWindow("runner"),
                  borderless: true,
                  disabled: true
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    setContext("current", current);
    let params = new URLSearchParams(location.search);
    if (params.get("fileOpen")) {
      addFile(params.get("fileOpen"));
    }
    if (electron) {
      electron.windows.listen("fileOpen", (evt, file) => addFile(file));
      electron.windows.emit("ready", true);
    }
    python.liaison.listen("alert", (evt, message) => {
      if (!current.output.alerts.some((item) => item.code === message.message.code)) {
        current.output.alerts.push(message.message);
      }
    });
    python.output.stdout.listen((evt, message) => current.output.stdout += `${message}
`);
    python.output.stderr.listen((evt, message) => current.output.stdout += `${message}
`);
    python.liaison.listen("error", (evt, message) => current.output.stdout += `${message.error}
`);
    git.listen((evt, message) => {
      current.output.pavlovia += message + "\n";
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (current.runlist[current.selection]?.file?.name) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<title>PsychoPy Runner: ${escape_html(current.runlist[current.selection].file.name)}</title>`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<title>PsychoPy Runner</title>`);
      }
      $$renderer3.push(`<!--]--> `);
      {
        let ribbon = function($$renderer4) {
          Ribbon_1($$renderer4);
        };
        Frame($$renderer3, {
          onFileDrop: (evt, file) => addFile(file),
          ribbon,
          children: ($$renderer4) => {
            Pane_group($$renderer4, {
              direction: "horizontal",
              children: ($$renderer5) => {
                Pane($$renderer5, {
                  defaultSize: 1 / 3,
                  children: ($$renderer6) => {
                    Panel$1($$renderer6, {
                      title: "Files",
                      children: ($$renderer7) => {
                        Panel($$renderer7);
                      }
                    });
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!----> `);
                Pane_resizer($$renderer5, { style: "width: .3rem;" });
                $$renderer5.push(`<!----> `);
                Pane($$renderer5, {
                  defaultSize: 2 / 3,
                  children: ($$renderer6) => {
                    Panel$1($$renderer6, {
                      title: "Output",
                      children: ($$renderer7) => {
                        Notebook($$renderer7, {
                          children: ($$renderer8) => {
                            var bind_get = () => current.tab === "alerts";
                            var bind_set = (val) => {
                              if (val) {
                                current.tab = "alerts";
                              }
                            };
                            var bind_get_1 = () => current.tab === "stdout";
                            var bind_set_1 = (val) => {
                              if (val) {
                                current.tab = "stdout";
                              }
                            };
                            var bind_get_2 = () => current.tab === "pavlovia";
                            var bind_set_2 = (val) => {
                              if (val) {
                                current.tab = "pavlovia";
                              }
                            };
                            Page($$renderer8, {
                              label: "Alerts",
                              get selected() {
                                return bind_get();
                              },
                              set selected($$value) {
                                bind_set($$value);
                              },
                              children: ($$renderer9) => {
                                AlertsOutput($$renderer9);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer8.push(`<!----> `);
                            Page($$renderer8, {
                              label: "Stdout",
                              get selected() {
                                return bind_get_1();
                              },
                              set selected($$value) {
                                bind_set_1($$value);
                              },
                              children: ($$renderer9) => {
                                StdoutOutput($$renderer9);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer8.push(`<!----> `);
                            Page($$renderer8, {
                              label: "Pavlovia",
                              get selected() {
                                return bind_get_2();
                              },
                              set selected($$value) {
                                bind_set_2($$value);
                              },
                              children: ($$renderer9) => {
                                PavloviaOutput($$renderer9);
                              },
                              $$slots: { default: true }
                            });
                            $$renderer8.push(`<!---->`);
                          }
                        });
                      }
                    });
                  },
                  $$slots: { default: true }
                });
                $$renderer5.push(`<!---->`);
              },
              $$slots: { default: true }
            });
            $$renderer4.push(`<!----> `);
            TipsDialog($$renderer4, {
              categories: ["general", "runner", "silly"],
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
