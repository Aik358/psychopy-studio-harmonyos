import { k as escape_html, j as getContext, s as setContext } from "../../../chunks/context.js";
import "clsx";
import { T as Tooltip, M as MessageArray, a as Message, b as MessageDialog, C as CodeOutput, c as current, n as newWindow, o as openIn, R as Routine$1, d as CompactButton, D as Dialog, B as Button, e as auth, f as DropdownButton, I as Item, S as Separator, g as Menu, h as SubMenu, s as showWindow, i as showDevTools, j as setupPython, V as Version, P as PrefsDialog, k as ParamsDialog, l as Dialog_1$1, m as BugReport, p as ParamCtrl, N as Notebook, q as Page, L as Listbook, r as Ribbon, t as Section$1, u as IconButton, v as SwitchButton, U as UserCtrl, G as Gap, w as Component$1, x as Notebook_1$1, y as StandaloneRoutine, z as ButtonTab, A as PanelButton, E as LoopInitiator, F as LoopTerminator, H as FlowLoop, J as Frame, K as Pane_group, O as Pane, Q as Panel$3, W as Pane_resizer, X as TipsDialog, Y as Shortcuts, Z as SetupPython } from "../../../chunks/TipsDialog.js";
import { I as Icon, p as python, b as projects, c as prefs, e as electron, d as parsePath, f as browseFileOpen, s as snapshot, g as browseFileSave, H as HasParams, h as git, P as Param, i as pending, j as profiles, k as html, T as Theme } from "../../../chunks/Theme.js";
import path from "path-browserify";
import "@sveltejs/kit/internal/server";
import "@monaco-editor/loader";
import { marked } from "marked";
import { z as bind_props, x as attr, F as attr_class, G as ensure_array_like, y as await_block, J as stringify, K as attr_style } from "../../../chunks/index.js";
import { D as Dialog_1$2 } from "../../../chunks/Dialog.js";
function ToggleButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = void 0,
      /** @prop @type {string|undefined} Path to icon for this button, if any */
      icon = void 0,
      /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is toggled */
      ontoggle = (evt) => {
      },
      /** @prop @type {string|undefined} Hover text for this button, if any */
      tooltip = void 0,
      /** @prop @type {boolean} Is this button the primary action? */
      primary = false,
      /** @prop @type {boolean} Is this button an affirmative response? */
      affirmative = false,
      /** @prop @type {boolean} Is this button a negative response? */
      negative = false,
      /** @prop @type {boolean} Disable this button */
      disabled = false
    } = $$props;
    let showTooltip = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button${attr("disabled", disabled, true)}${attr_class("svelte-1tih1lf", void 0, {
        "primary": primary,
        "affirmative": affirmative,
        "negative": negative,
        "active": value
      })}>`);
      if (tooltip) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
          position: "bottom-right",
          get shown() {
            return showTooltip;
          },
          set shown($$value) {
            showTooltip = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html(tooltip)}`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (icon) {
        $$renderer3.push("<!--[-->");
        Icon($$renderer3, { src: icon, size: "1rem" });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></button>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { value });
  });
}
function PythonErrors($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let errors = [];
    let showDlg = false;
    python.output.stderr.listen((evt, message) => errors.push({
      dismiss: new Promise((resolve, reject) => setTimeout(resolve, 5e3)),
      content: message
    }));
    python.liaison.listen("error", (evt, message) => errors.push({
      dismiss: new Promise((resolve, reject) => setTimeout(resolve, 5e3)),
      content: message
    }));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      MessageArray($$renderer3, {
        children: ($$renderer4) => {
          $$renderer4.push(`<!--[-->`);
          const each_array = ensure_array_like(errors);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let error = each_array[$$index];
            await_block(
              $$renderer4,
              error.dismiss,
              () => {
                Message($$renderer4, {
                  message: "Python error, click to show",
                  icon: "/icons/sym-error.svg",
                  onclick: (evt) => showDlg = true
                });
              },
              () => {
                $$renderer4.push(``);
              }
            );
            $$renderer4.push(`<!--]-->`);
          }
          $$renderer4.push(`<!--]-->`);
        }
      });
      $$renderer3.push(`<!----> `);
      MessageDialog($$renderer3, {
        buttons: { CANCEL: (evt) => {
        } },
        get shown() {
          return showDlg;
        },
        set shown($$value) {
          showDlg = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="output-container">`);
          CodeOutput($$renderer4, { value: errors.map((err) => err.content.error).join("\n") });
          $$renderer4.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
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
function file_new() {
  newWindow("builder");
}
async function file_open() {
  let file = await browseFileOpen(
    [
      {
        description: "PsychoPy Experiments",
        accept: { "application/xml": [".psyexp"] }
      }
    ],
    current.experiment.file?.parent || ""
  );
  if (file === void 0) {
    return;
  }
  await openFile(file);
}
async function openFile(file) {
  await current.experiment.fromFile(file);
  if (current.experiment.routines) {
    current.routine = Object.values(current.experiment.routines)[0];
  } else {
    current.routine = void 0;
  }
  for (let project of Object.values(projects)) {
    if (project.id.endsWith(current.experiment.file.stem)) {
      current.project = project;
    }
  }
  current.experiment.history.clear();
  let readme = await findReadme();
  if (readme) {
    current.readme.script.fromFile(readme);
    if (prefs.params["alwaysShowReadme"].val) {
      current.readme.shown = true;
    }
  }
  console.log(`Loaded experiment '${current.experiment.file.name}':`, current.experiment);
}
async function revealFolder() {
  if (electron && current.experiment.file) {
    electron.files.showItemInFolder(current.experiment.file.file);
  }
}
async function file_save() {
  if (current.experiment.file.file) {
    current.experiment.toFile(snapshot(current.experiment.file));
    current.experiment.history.clear();
  } else {
    return file_save_as();
  }
}
async function file_save_as() {
  let file = await browseFileSave(
    [
      {
        description: "PsychoPy Experiments",
        accept: { "application/xml": [".psyexp"] }
      }
    ],
    current.experiment.file?.file || "untitled.psyexp"
  );
  if (!file || !file.file) {
    return;
  }
  current.experiment.file = file;
  await file_save();
  return current.experiment.file;
}
function close() {
  window.close();
}
function quit() {
  if (electron) {
    electron.quit();
  }
}
function undo() {
  current.experiment.history.undo();
  if (current.routine && current.routine.name in current.experiment.routines) {
    current.routine = current.experiment.routines[current.routine.name];
  }
}
function redo() {
  current.experiment.history.redo();
  if (current.routine && current.routine.name in current.experiment.routines) {
    current.routine = current.experiment.routines[current.routine.name];
  }
}
async function findReadme() {
  if (electron && current.experiment.file?.parent) {
    for (let sibling of await electron.files.scandir(current.experiment.file.parent)) {
      if (["readme.md", "readme.txt"].includes(sibling.toLowerCase())) {
        return parsePath(path.join(current.experiment.file.parent, sibling));
      }
    }
  }
}
async function showReadme() {
  let readme = await findReadme();
  if (readme) {
    current.readme.script.fromFile(readme);
  } else if (current.experiment.file?.parent) {
    current.readme.script.file = parsePath(path.join(current.experiment.file.parent, "readme.md"));
    current.readme.script.content = "";
    current.readme.script.toFile(current.readme.script.file);
  } else {
    current.readme.script.file = parsePath("readme.md");
    current.readme.script.content = "";
  }
  current.readme.shown = true;
}
function copyRoutine(routine = void 0) {
  if (!routine) {
    routine = current.routine;
  }
  current.clipboard.set(routine.toJSON());
}
async function pasteRoutine() {
  let clipboard = await current.clipboard.get();
  if (!clipboard) {
    return;
  }
  let element;
  if (clipboard.tag === "Routine") {
    element = new Routine$1();
  } else {
    element = new HasParams(clipboard.tag);
  }
  element.fromJSON(clipboard);
  if (![Routine$1, HasParams].some((cls) => element instanceof cls)) {
    return;
  }
  let name = current.experiment.resolveNameConflict(element.name);
  if (element instanceof Routine$1) {
    element.settings.params["name"].val = name;
  } else {
    element.params["name"].val = name;
  }
  current.experiment.routines[element.name] = current.routine = element;
}
function togglePiloting() {
  current.experiment.history.update(`toggle pilot mode`);
  current.experiment.settings.params["runMode"].val = !current.experiment.settings.params["runMode"].val;
}
async function sendToRunner() {
  await openIn(current.experiment.file.file, "runner");
}
async function compilePython() {
  if (current.experiment.file === void 0) {
    await file_save_as();
    if (current.experiment.file === void 0) {
      return;
    }
  }
  let target = await current.experiment.writeScript("PsychoPy");
  openIn(target, "coder");
  return target;
}
async function compileJS() {
  if (current.experiment.file === void 0) {
    await file_save_as();
    if (current.experiment.file === void 0) {
      return;
    }
  }
  let target = await current.experiment.writeScript("PsychoJS");
  openIn(target, "coder");
  return target;
}
async function runPython() {
  await sendToRunner();
  await current.experiment.runPython(true);
  return true;
}
async function stopPython(executable) {
  await current.experiment.stopPython();
}
async function runJS() {
  if (!python) {
    return;
  }
  await compileJS();
  if (current.experiment.pilotMode) {
    await current.experiment.runJS(true);
  } else {
    await window.open(`https://run.pavlovia.org/${current.project.namespace?.path}/${current.project.path}`);
  }
}
var shortcuts = {};
function Project($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { project } = $$props;
    $$renderer2.push(`<div class="local-project svelte-u6bvaj"><div class="project-header svelte-u6bvaj"><h3 class="svelte-u6bvaj">${escape_html(project.id)}</h3> `);
    CompactButton($$renderer2, {
      icon: "/icons/btn-delete.svg",
      onclick: (evt) => delete projects[project.id]
    });
    $$renderer2.push(`<!----></div> <div>Local folder:</div> <input${attr("value", project.localRoot)}/></div>`);
  });
}
function ManageProjectsDlg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0 } = $$props;
    async function openProjectsFile(evt) {
      let handle = await window.showOpenFilePicker({
        types: [
          {
            description: "PsychoPy Projects",
            accept: { "application/json": [".json"] }
          }
        ]
      });
      let file = await handle[0].getFile();
      let data = JSON.parse(await file.text());
      projectsFromJSON(data);
      console.log(`Loaded devices from ${file.name}:`, data);
    }
    function projectsFromJSON(data) {
      Object.keys(projects).forEach((key) => delete projects[key]);
      for (let [key, proj] of Object.entries(data)) {
        projects[key] = proj;
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "manageProjects",
        title: "Local projects",
        buttons: { OK: (evt) => {
        } },
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="projects-list svelte-g2xi4q"><!--[-->`);
          const each_array = ensure_array_like(Object.values(projects));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let profile = each_array[$$index];
            Project($$renderer4, { project: profile });
          }
          $$renderer4.push(`<!--]--> `);
          Button($$renderer4, { label: "Import projects", onclick: openProjectsFile });
          $$renderer4.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
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
function NewProjectDlg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0, awaiting = void 0 } = $$props;
    let current2 = getContext("current");
    let details = { name: void 0, group: void 0, root: void 0 };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        title: "New project",
        buttons: {
          OK: async (evt) => {
            await git.newProject(snapshot(details), current2.experiment.file.parent, snapshot(current2.user));
            current2.project = await findProject(current2.experiment, current2.user);
            awaiting.resolve(true);
          },
          CANCEL: (evt) => awaiting.resolve(false)
        },
        onopen: (evt) => {
          details.name = current2.experiment.file.stem;
          details.group = current2.user?.profile.username;
          details.root = auth.root;
          let newPromise = Promise.withResolvers();
          awaiting.resolve(newPromise.promise);
          awaiting = newPromise;
        },
        shrink: true,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="content svelte-17tp8bm"><div class="ctrl svelte-17tp8bm">pavlovia.org / `);
          $$renderer4.select(
            { value: details.group, style: "" },
            ($$renderer5) => {
              $$renderer5.option({ value: current2.user.profile.username }, ($$renderer6) => {
                $$renderer6.push(`${escape_html(current2.user.profile.username)}`);
              });
              await_block($$renderer5, fetch(`${auth.root}/api/v4/groups?access_token=${current2.user.token.access}`), () => {
              }, (resp) => {
                await_block($$renderer5, resp.json(), () => {
                }, (groups) => {
                  $$renderer5.push(`<!--[-->`);
                  const each_array = ensure_array_like(groups);
                  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                    let group = each_array[$$index];
                    $$renderer5.option({ value: group.path }, ($$renderer6) => {
                      $$renderer6.push(`${escape_html(group.path)}`);
                    });
                  }
                  $$renderer5.push(`<!--]-->`);
                });
                $$renderer5.push(`<!--]-->`);
              });
              $$renderer5.push(`<!--]-->`);
            },
            void 0,
            void 0,
            { "flex-grow": "1" }
          );
          $$renderer4.push(` / <input${attr("value", details.name)}/></div></div>`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { shown, awaiting });
  });
}
function ProjectCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let show = { newProjectDlg: false, manageProjectsDlg: false };
    let awaiting = { newProjectDlg: Promise.withResolvers() };
    let label = (() => {
      if (current2.project) {
        if (current2.project.owner?.username === current2.user?.profile?.username) {
          return current2.project.path;
        } else {
          return `${current2.project.namespace?.path}/${current2.project.path}`;
        }
      } else {
        return "No project";
      }
    })();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      DropdownButton($$renderer3, {
        label,
        onclick: (evt) => {
          if (current2.project) {
            window.open(current2.project.web_url.replace("gitlab.pavlovia", "pavlovia"));
          }
        },
        disabled: !current2.project,
        children: ($$renderer4) => {
          Item($$renderer4, {
            label: "New project",
            icon: "/icons/btn-add.svg",
            onclick: (evt) => show.newProjectDlg = true,
            disabled: !current2.user || !current2.experiment?.file?.file
          });
          $$renderer4.push(`<!----> `);
          Item($$renderer4, {
            label: "Edit project",
            icon: "/icons/btn-edit.svg",
            onclick: (evt) => window.open(`${current2.project.web_url}/edit`, "_blank"),
            disabled: !current2.project
          });
          $$renderer4.push(`<!----> `);
          Separator($$renderer4);
          $$renderer4.push(`<!----> `);
          Item($$renderer4, {
            label: "Search projects...",
            icon: "/icons/btn-find.svg",
            onclick: (evt) => window.open("https://pavlovia.org/explore", "_blank")
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      ManageProjectsDlg($$renderer3, {
        get shown() {
          return show.manageProjectsDlg;
        },
        set shown($$value) {
          show.manageProjectsDlg = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      NewProjectDlg($$renderer3, {
        get shown() {
          return show.newProjectDlg;
        },
        set shown($$value) {
          show.newProjectDlg = $$value;
          $$settled = false;
        },
        get awaiting() {
          return awaiting.newProjectDlg;
        },
        set awaiting($$value) {
          awaiting.newProjectDlg = $$value;
          $$settled = false;
        }
      });
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
function Dialog_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @bindable @type {Boolean} State dictating whether this dialog is shown */
      shown = void 0,
      /** @interface */
      children = void 0
    } = $$props;
    let useRegex = false;
    let caseSensitive = false;
    let searchTerm = "";
    let results = current.experiment.search(searchTerm, useRegex, caseSensitive);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "find-in-experiment",
        title: "Find in experiment...",
        onopen: (evt) => searchTerm = "",
        buttons: { OK: (evt) => {
        } },
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="container svelte-dvaapd"><div class="find-ctrls svelte-dvaapd"><input type="text" placeholder="Search..." class="search-bar svelte-dvaapd"${attr("value", searchTerm)}/> `);
          ToggleButton($$renderer4, {
            icon: "/icons/btn-regex.svg",
            tooltip: "Use RegEx syntax",
            get value() {
              return useRegex;
            },
            set value($$value) {
              useRegex = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> `);
          ToggleButton($$renderer4, {
            icon: "/icons/btn-case.svg",
            tooltip: "Use case-sensitive searching",
            get value() {
              return caseSensitive;
            },
            set value($$value) {
              caseSensitive = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> <div class="results-list svelte-dvaapd"><!--[-->`);
          const each_array = ensure_array_like(results);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let result = each_array[$$index];
            $$renderer4.push(`<div class="result-item svelte-dvaapd"><div class="item-breadcrumbs svelte-dvaapd">`);
            if (result.breadcrumbs.loop) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<button class="breadcrumb svelte-dvaapd">${escape_html(result.breadcrumbs.loop.name)}</button>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (result.breadcrumbs.routine) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`<button class="breadcrumb svelte-dvaapd">${escape_html(result.breadcrumbs.routine.name)}</button>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (result.breadcrumbs.component) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`> <button class="breadcrumb svelte-dvaapd">${escape_html(["RoutineSettingsComponent", "SettingsComponent"].includes(result.breadcrumbs.component.tag) ? "settings" : result.breadcrumbs.component.name)}</button>`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (result.breadcrumbs.param) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`> ${escape_html(result.breadcrumbs.param.name)}`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]--></div> <div class="item-content svelte-dvaapd">${escape_html(result.text.before)}<b class="svelte-dvaapd">${escape_html(result.text.text)}</b>${escape_html(result.text.after)}</div></div>`);
          }
          $$renderer4.push(`<!--]--></div></div> `);
          children?.($$renderer4);
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      {
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
function Menu_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { shown = void 0 } = $$props;
    let show = {
      prefsDlg: false,
      findDlg: false,
      settingsDlg: false,
      deviceMgrDlg: false,
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
                onclick: file_new
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-open.svg",
                label: "Open file",
                shortcut: "open",
                onclick: file_open
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-save.svg",
                label: "Save file",
                shortcut: "save",
                onclick: file_save,
                disabled: !current2.experiment.history.past.length
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                icon: "/icons/btn-saveas.svg",
                label: "Save file as",
                shortcut: "saveAs",
                onclick: file_save_as
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Reveal in file explorer",
                onclick: revealFolder,
                shortcut: "revealFolder",
                disabled: current2.experiment.file?.parent === void 0
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
                disabled: current2.experiment.file === null || !current2.experiment.history.past.length,
                onclick: undo,
                shortcut: "undo"
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Redo",
                icon: "/icons/btn-redo.svg",
                onclick: redo,
                disabled: current2.experiment.file === null || !current2.experiment.history.future.length,
                shortcut: "redo"
              });
              $$renderer5.push(`<!----> `);
              Separator($$renderer5);
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Find in experiment",
                icon: "/icons/btn-find.svg",
                onclick: (evt) => show.findDlg = true,
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
              Item($$renderer5, { label: "Show Coder", onclick: (evt) => showWindow("coder") });
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
          SubMenu($$renderer4, {
            label: "Experiment",
            icon: "/icons/rbn-experiment.svg",
            children: ($$renderer5) => {
              Item($$renderer5, {
                label: "Experiment settings",
                icon: "/icons/btn-settings.svg",
                onclick: (evt) => show.settingsDlg = true
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Show readme",
                icon: "/icons/btn-new.svg",
                onclick: (evt) => showReadme()
              });
              $$renderer5.push(`<!----> `);
              Separator($$renderer5);
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Copy current Routine",
                icon: "/icons/btn-copy.svg",
                onclick: (evt) => copyRoutine()
              });
              $$renderer5.push(`<!----> `);
              Item($$renderer5, {
                label: "Paste Routine",
                icon: "/icons/btn-paste.svg",
                onclick: (evt) => pasteRoutine()
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
                  shortcut: "togglePilot"
                });
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: "Send to Runner",
                  icon: `/icons/btn-send${stringify(current2.experiment.pilotMode ? "pilot" : "run")}.svg`,
                  onclick: sendToRunner,
                  shortcut: "sendToRunner",
                  disabled: !current2.experiment.file
                });
                $$renderer5.push(`<!----> `);
                Separator($$renderer5);
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: "Compile Python",
                  icon: "/icons/btn-compilepy.svg",
                  onclick: (evt) => compilePython(),
                  shortcut: "compilePython",
                  disabled: current2.experiment === null
                });
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: `${stringify(current2.experiment.pilotMode ? "Pilot" : "Run")} in Python`,
                  icon: `/icons/btn-${stringify(current2.experiment.pilotMode ? "pilot" : "run")}py.svg`,
                  onclick: (evt) => runPython(),
                  shortcut: "runPython",
                  disabled: current2.experiment === null
                });
                $$renderer5.push(`<!----> `);
                Separator($$renderer5);
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: "Compile JS",
                  icon: "/icons/btn-compilejs.svg",
                  onclick: (evt) => compileJS(),
                  shortcut: "compileJS",
                  disabled: current2.experiment === null
                });
                $$renderer5.push(`<!----> `);
                Item($$renderer5, {
                  label: `${stringify(current2.experiment.pilotMode ? "Pilot" : "Run")} in browser`,
                  icon: `/icons/btn-${stringify(current2.experiment.pilotMode ? "pilot" : "run")}js.svg`,
                  onclick: (evt) => runJS(),
                  shortcut: "runJS",
                  disabled: current2.experiment === null
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
                  Item($$renderer5, { label: `PsychoPy ${stringify(version)}`, disabled: true });
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
      Dialog_1($$renderer3, {
        get shown() {
          return show.findDlg;
        },
        set shown($$value) {
          show.findDlg = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      ParamsDialog($$renderer3, {
        element: current2.experiment.settings,
        get shown() {
          return show.settingsDlg;
        },
        set shown($$value) {
          show.settingsDlg = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      Dialog_1$1($$renderer3, {
        get shown() {
          return show.deviceMgrDlg;
        },
        set shown($$value) {
          show.deviceMgrDlg = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (python) {
        $$renderer3.push("<!--[-->");
        Dialog_1$2($$renderer3, {
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
          context: current2.experiment,
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
function SavePrompt($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let {
      /** @prop @type {Function} Function to call after YES or NO is clicked (so after saving, if YES) */
      action = (evt) => {
      },
      /** @bindable @type {Boolean} State controlling whether this dialog is shown */
      shown = void 0
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (current2.experiment.history.past.length) {
        $$renderer3.push("<!--[-->");
        MessageDialog($$renderer3, {
          id: "save-prompt",
          buttons: {
            YES: (evt) => {
              file_save();
              action(evt);
            },
            NO: (evt) => {
              action(evt);
            },
            CANCEL: (evt) => {
            }
          },
          get shown() {
            return shown;
          },
          set shown($$value) {
            shown = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->'${escape_html(current2.experiment.file.name)}' has unsaved changes, save now?`);
          },
          $$slots: { default: true }
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
let MonitorConfiguration$1 = class MonitorConfiguration {
  params = {};
  constructor(monitor, name, date) {
    this.monitor = monitor;
    this.name = name;
    this.date = date;
  }
  /**
   * @returns JSON object representing this element
   */
  toJSON() {
    return {
      calibDate: this.date,
      distance: snapshot(this.params.distance.val),
      sizePix: String.prototype.split(snapshot(this.params.sizePix.val), ",").map((val) => String.prototype.trim(val)),
      width: snapshot(this.params.width.val),
      usebits: snapshot(this.params.usebits.val),
      gammaGrid: snapshot(this.params.gammaGrid.val)
    };
  }
  /**
   * Populate this element from a JSON object
   *
   * @param {Object} node JSON object representing this element
   */
  fromJSON(node) {
    this.date = node.calibDate;
    this.params.distance = new Param("distance");
    Object.assign(this.params.distance, {
      val: node.distance,
      updates: "constant",
      inputType: "single",
      valType: "code",
      label: "Screen distance (cm)",
      hint: "How far, in centimeters (cm), is the screen from the participant?"
    });
    this.params.sizePix = new Param("sizePix");
    Object.assign(this.params.sizePix, {
      val: node.sizePix,
      updates: "constant",
      inputType: "single",
      valType: "list",
      label: "Screen size (pix)",
      hint: "The dimensions of the screen in pixels"
    });
    this.params.width = new Param("width");
    Object.assign(this.params.width, {
      val: node.width,
      updates: "constant",
      inputType: "single",
      valType: "code",
      label: "Screen width (cm)",
      hint: "The width of the screen in cenimeters (cm)"
    });
    this.params.usebits = new Param("usebits");
    Object.assign(this.params.usebits, {
      val: node.usebits,
      updates: "constant",
      inputType: "bool",
      valType: "code",
      label: "Use bits++?",
      hint: "Whether to use a CRS Bits++ calibration tool"
    });
    this.params.gammaGrid = new Param("gammaGrid");
    Object.assign(this.params.gammaGrid, {
      val: node.gammaGrid,
      updates: "constant",
      inputType: "calibration",
      valType: "code",
      label: "Gamma calibration",
      hint: "Gamma calibration grid"
    });
  }
};
class CalibrationSetup {
  params = {};
  constructor() {
    this.params.photometer = new Param("photometer");
    Object.assign(this.params.photometer, {
      valType: "code",
      inputType: "choice",
      label: "Photometer",
      hint: "Photometer device, from the device manager, to use for this calibration"
    });
    this.params.screen = new Param("screen");
    Object.assign(this.params.screen, {
      valType: "code",
      inputType: "single",
      label: "Screen",
      hint: "Screen number to run calibration on"
    });
    this.params.patchSize = new Param("patchSize");
    Object.assign(this.params.patchSize, {
      val: 0.3,
      valType: "code",
      inputType: "single",
      label: "Patch size",
      hint: "How much of the screen (0-1) the calibration patch should occupy"
    });
    this.params.nPoints = new Param("nPoints");
    Object.assign(this.params.nPoints, {
      val: 8,
      valType: "code",
      inputType: "single",
      label: "Calibration points",
      hint: "How many calibration points to use"
    });
    this.ready = python.liaison.send("app", {
      command: "run",
      args: [
        "psychopy.experiment.monitor:BasePhotometerDeviceBackend.__subclasses__"
      ]
    }).then(async (resp) => {
      let temp = { allowedVals: [], allowedLabels: [] };
      for (let cls of resp) {
        await python.liaison.send(
          "app",
          {
            command: "get",
            args: [cls.match(/python\:\/\/\/(.*)/)[1] + ".deviceClass"]
          },
          5e3
        ).then((resp2) => temp.allowedVals.push(resp2));
        await python.liaison.send(
          "app",
          {
            command: "get",
            args: [cls.match(/python\:\/\/\/(.*)/)[1] + ".backendLabel"]
          },
          5e3
        ).then((resp2) => temp.allowedLabels.push(resp2));
      }
      Object.assign(this.params.photometer, temp);
      this.params.photometer.val = temp.allowedVals[0];
    });
  }
}
function CalibrationSetupDlg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { param = void 0, shown = void 0 } = $$props;
    async function calibrate() {
      await python.liaison.send(
        "app",
        {
          command: "init",
          args: ["calibrationWin", "psychopy.visual.window:Window"],
          kwargs: {
            screen: parseInt(config.params["screen"].val),
            checkTiming: false,
            fullscr: true
          }
        },
        1e4
      );
      let photometerName;
      await python.liaison.send("app", {
        // get available photometers for chosen class
        command: "run",
        args: [
          "psychopy.hardware.manager:DeviceManager.getAvailableDevices",
          snapshot(config.params.photometer.val)
        ]
      }).then((profiles2) => {
        photometerName = profiles2[0].deviceName;
        return python.liaison.send("app", { command: "run", kwargs: profiles2[0] });
      });
      await python.liaison.send("app", {
        command: "run",
        args: [
          "psychopy.hardware.monitor:calibrateGamma",
          "$calibrationWin",
          photometerName
        ],
        kwargs: {
          patchSize: parseFloat(config.params.patchSize.val),
          nPoints: parseInt(config.params.nPoints.val)
        }
      });
    }
    let config = void 0;
    function reset() {
      config = new CalibrationSetup();
    }
    reset();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        title: "Monitor calibration setup",
        buttons: { OK: calibrate, CANCEL: reset },
        shrink: true,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="calibration-config svelte-1lrl97n">`);
          await_block(
            $$renderer4,
            config.ready,
            () => {
              $$renderer4.push(`Getting photodiode classes...`);
            },
            () => {
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like(Object.keys(config.params));
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let key = each_array[$$index];
                ParamCtrl($$renderer4, {
                  name: key,
                  get param() {
                    return config.params[key];
                  },
                  set param($$value) {
                    config.params[key] = $$value;
                    $$settled = false;
                  }
                });
              }
              $$renderer4.push(`<!--]-->`);
            }
          );
          $$renderer4.push(`<!--]--></div>`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { param, shown });
  });
}
function MonitorConfiguration2($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { calib = void 0 } = $$props;
    let show = { calibSetup: false };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="monitor-config svelte-1tmlm5l"><!--[-->`);
      const each_array = ensure_array_like(Object.keys(calib.params));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let key = each_array[$$index];
        ParamCtrl($$renderer3, {
          name: key,
          get param() {
            return calib.params[key];
          },
          set param($$value) {
            calib.params[key] = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]--> <div class="calibrate-btn svelte-1tmlm5l">`);
      Button($$renderer3, {
        label: "Calibrate",
        icon: "/icons/btn-runpy.svg",
        onclick: (evt) => show.calibSetup = true,
        horizontal: true
      });
      $$renderer3.push(`<!----> `);
      CalibrationSetupDlg($$renderer3, {
        get param() {
          return calib.params.gammaGrid;
        },
        set param($$value) {
          calib.params.gammaGrid = $$value;
          $$settled = false;
        },
        get shown() {
          return show.calibSetup;
        },
        set shown($$value) {
          show.calibSetup = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { calib });
  });
}
function MonitorCenterDlg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0 } = $$props;
    let monitors = {
      all: {},
      selection: { monitor: void 0, calibration: void 0 },
      promise: Promise.resolve([]),
      save: () => {
        for (let [name, monitor] of Object.entries(monitors.all)) {
          python.liaison.send(
            "app",
            {
              // create monitor
              command: "init",
              args: [
                `monitor_${name}`,
                "psychopy.monitors.calibTools:Monitor",
                name
              ]
            },
            1e5
          ).then((resp) => python.liaison.send(
            "app",
            {
              // apply json
              command: "run",
              args: [
                `monitor_${name}.fromJSON`,
                {
                  name: monitor.name,
                  calibrations: Object.fromEntries(Object.entries(monitor.calibrations).map(([name2, calib]) => [name2, calib.toJSON()]))
                }
              ]
            },
            1e5
          )).then((resp) => python.liaison.send(
            "app",
            {
              // save monitor
              command: "run",
              args: [`monitor_${name}.save`]
            },
            1e5
          ));
        }
      },
      refresh: () => {
        monitors.all = {};
        monitors.promise = python.liaison.send(
          "app",
          {
            command: "run",
            args: ["psychopy.monitors.calibTools:getAllMonitors"]
          },
          1e5
        ).then((monitorNames) => {
          for (let name of monitorNames) {
            python.liaison.send(
              "app",
              {
                command: "run",
                args: ["psychopy.monitors.calibTools:Monitor", name]
              },
              1e5
            ).then((details) => {
              for (let [calibName, calib] of Object.entries(details.calibrations || {})) {
                details.calibrations[calibName] = new MonitorConfiguration$1(name, calibName, calib.calibDate);
                details.calibrations[calibName].fromJSON(calib);
              }
              monitors.all[name] = details;
            });
          }
        });
      }
    };
    monitors.refresh();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        title: "Monitor Center",
        buttons: {
          OK: monitors.save,
          APPLY: monitors.save,
          CANCEL: monitors.refresh
        },
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="content svelte-g77dd">`);
          Notebook($$renderer4, {
            children: ($$renderer5) => {
              await_block(
                $$renderer5,
                monitors.promise,
                () => {
                  $$renderer5.push(`Loading monitors...`);
                },
                () => {
                  $$renderer5.push(`<!--[-->`);
                  const each_array = ensure_array_like(Object.entries(monitors.all));
                  for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
                    let [name, details] = each_array[$$index_1];
                    var bind_get = () => monitors.selection.monitor === name;
                    var bind_set = (evt) => monitors.selection.monitor = name;
                    Page($$renderer5, {
                      label: name,
                      get selected() {
                        return bind_get();
                      },
                      set selected($$value) {
                        bind_set($$value);
                      },
                      children: ($$renderer6) => {
                        Listbook($$renderer6, {
                          children: ($$renderer7) => {
                            $$renderer7.push(`<!--[-->`);
                            const each_array_1 = ensure_array_like(Object.entries(details.calibrations || {}));
                            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                              let [calibName, calib] = each_array_1[$$index];
                              var bind_get_1 = () => monitors.selection.calibration === calibName;
                              var bind_set_1 = (evt) => monitors.selection.calibration = calibName;
                              Page($$renderer7, {
                                label: calibName,
                                get selected() {
                                  return bind_get_1();
                                },
                                set selected($$value) {
                                  bind_set_1($$value);
                                },
                                children: ($$renderer8) => {
                                  if (monitors.all[name]?.calibrations[calibName]) {
                                    $$renderer8.push("<!--[-->");
                                    MonitorConfiguration2($$renderer8, {
                                      get calib() {
                                        return monitors.all[name].calibrations[calibName];
                                      },
                                      set calib($$value) {
                                        monitors.all[name].calibrations[calibName] = $$value;
                                        $$settled = false;
                                      }
                                    });
                                  } else {
                                    $$renderer8.push("<!--[!-->");
                                  }
                                  $$renderer8.push(`<!--]-->`);
                                },
                                $$slots: { default: true }
                              });
                            }
                            $$renderer7.push(`<!--]-->`);
                          }
                        });
                      },
                      $$slots: { default: true }
                    });
                  }
                  $$renderer5.push(`<!--]-->`);
                }
              );
              $$renderer5.push(`<!--]-->`);
            }
          });
          $$renderer4.push(`<!----></div>`);
        },
        $$slots: { default: true }
      });
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
function CommitDlg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0, awaiting = void 0 } = $$props;
    let current2 = getContext("current");
    let message = "";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        title: "Commit changes",
        buttons: {
          OK: (evt) => git.commit(snapshot(message), current2.experiment.file.parent, snapshot(current2.user)).then((resp) => awaiting.resolve(resp)),
          CANCEL: (evt) => awaiting.resolve(false)
        },
        onopen: (evt) => {
          message = "";
          let newPromise = Promise.withResolvers();
          awaiting.resolve(newPromise.promise);
          awaiting = newPromise;
        },
        shrink: true,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="content svelte-1byz79g">Briefly describe the changes made since last sync. <input${attr("value", message)}/></div>`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { shown, awaiting });
  });
}
function Sync($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let {
      /** @interface */
      button
    } = $$props;
    async function sync(folder, user, force = false) {
      if (current2.experiment?.settings?.params?.["exportHTML"].val === "on Sync") {
        await current2.experiment.writeScript("PsychoJS");
      }
      let remote = await git.getRemote(folder, user);
      if (remote === null) {
        show.newProject = true;
        if (await awaiting.newProject.promise) {
          remote = await git.getRemote(folder, user);
        } else {
          git.output("Cancelled by user.");
          return;
        }
      }
      await git.pull(folder, user, false);
      let sha;
      if ((await git.stage(folder)).length) {
        show.commit = true;
        sha = await awaiting.commit.promise;
        showWindow("runner");
        if (!sha) {
          git.output("Cancelled by user.");
          return;
        }
        await git.push(folder, user, force);
      } else {
        showWindow("runner");
        git.output("Nothing to push.");
      }
      git.output(`Finished sync`);
      return sha;
    }
    let show = { newProject: false, commit: false };
    let awaiting = {
      newProject: Promise.withResolvers(),
      commit: Promise.withResolvers()
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      button($$renderer3, sync);
      $$renderer3.push(`<!----> `);
      NewProjectDlg($$renderer3, {
        get shown() {
          return show.newProject;
        },
        set shown($$value) {
          show.newProject = $$value;
          $$settled = false;
        },
        get awaiting() {
          return awaiting.newProject;
        },
        set awaiting($$value) {
          awaiting.newProject = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      CommitDlg($$renderer3, {
        get shown() {
          return show.commit;
        },
        set shown($$value) {
          show.commit = $$value;
          $$settled = false;
        },
        get awaiting() {
          return awaiting.commit;
        },
        set awaiting($$value) {
          awaiting.commit = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { sync });
  });
}
function Ribbon_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let show = {
      menu: false,
      settingsDlg: false,
      findDlg: false,
      deviceMgrDlg: false,
      monitorCenterDlg: false
    };
    let awaiting = {
      runpy: Promise.resolve(""),
      compilepy: Promise.resolve(""),
      runjs: Promise.resolve(""),
      compilejs: Promise.resolve("")
    };
    let lastAction = (() => {
      if (current2.experiment.history.past.length) {
        return ` "${current2.experiment.history.past.at(-1).msg}"`;
      }
    })();
    let nextAction = (() => {
      if (current2.experiment.history.future.length) {
        return ` "${current2.experiment.history.future[0].msg}"`;
      }
    })();
    let prompts = { NEW: false, OPEN: false };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Ribbon($$renderer3, {
        children: ($$renderer4) => {
          Section$1($$renderer4, {
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
          Section$1($$renderer4, {
            label: "File",
            icon: "/icons/rbn-file.svg",
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-new.svg",
                label: "New file",
                onclick: (evt) => prompts.NEW = true,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              SavePrompt($$renderer5, {
                action: file_new,
                get shown() {
                  return prompts.NEW;
                },
                set shown($$value) {
                  prompts.NEW = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-open.svg",
                label: "Open file",
                onclick: (evt) => prompts.OPEN = true,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              SavePrompt($$renderer5, {
                action: file_open,
                get shown() {
                  return prompts.OPEN;
                },
                set shown($$value) {
                  prompts.OPEN = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-save.svg",
                label: "Save file",
                onclick: file_save,
                disabled: !current2.experiment.history.past.length && current2.experiment.file.file,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-saveas.svg",
                label: "Save file as",
                onclick: file_save_as,
                borderless: true
              });
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Section$1($$renderer4, {
            label: "Edit",
            icon: "/icons/rbn-edit.svg",
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-undo.svg",
                label: `Undo${stringify(lastAction)}`,
                onclick: undo,
                disabled: !current2.experiment.file.file || !current2.experiment.history.past.length,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-redo.svg",
                label: `Redo ${stringify(nextAction)}`,
                onclick: redo,
                disabled: !current2.experiment.file.file || !current2.experiment.history.future.length,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-find.svg",
                label: "Find",
                onclick: () => show.findDlg = true,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              Dialog_1($$renderer5, {
                get shown() {
                  return show.findDlg;
                },
                set shown($$value) {
                  show.findDlg = $$value;
                  $$settled = false;
                }
              });
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Section$1($$renderer4, {
            label: "Experiment",
            icon: "/icons/rbn-experiment.svg",
            children: ($$renderer5) => {
              var bind_get = () => current2.experiment.pilotMode;
              var bind_set = (value) => {
                current2.experiment.history.update(`toggle pilot mode`);
                current2.experiment.settings.params["runMode"].val = value;
              };
              if (python?.ready) {
                $$renderer5.push("<!--[-->");
                IconButton($$renderer5, {
                  icon: "/icons/btn-monitors.svg",
                  label: "Open the monitor center",
                  onclick: (evt) => show.monitorCenterDlg = true,
                  borderless: true
                });
                $$renderer5.push(`<!----> `);
                MonitorCenterDlg($$renderer5, {
                  get shown() {
                    return show.monitorCenterDlg;
                  },
                  set shown($$value) {
                    show.monitorCenterDlg = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----> `);
                IconButton($$renderer5, {
                  icon: "/icons/btn-devices.svg",
                  label: "Open the device manager",
                  onclick: (evt) => show.deviceMgrDlg = true,
                  borderless: true
                });
                $$renderer5.push(`<!----> `);
                Dialog_1$1($$renderer5, {
                  get shown() {
                    return show.deviceMgrDlg;
                  },
                  set shown($$value) {
                    show.deviceMgrDlg = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!---->`);
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]--> `);
              IconButton($$renderer5, {
                icon: "/icons/btn-settings.svg",
                label: "Experiment settings",
                onclick: (evt) => show.settingsDlg = true,
                disabled: current2.experiment === null,
                borderless: true
              });
              $$renderer5.push(`<!----> `);
              if (current2.experiment !== null) {
                $$renderer5.push("<!--[-->");
                ParamsDialog($$renderer5, {
                  element: current2.experiment.settings,
                  get shown() {
                    return show.settingsDlg;
                  },
                  set shown($$value) {
                    show.settingsDlg = $$value;
                    $$settled = false;
                  }
                });
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]--> `);
              SwitchButton($$renderer5, {
                labels: ["Pilot", "Run"],
                tooltip: `Experiment will run in ${stringify(current2.experiment.pilotMode ? "pilot" : "run")} mode`,
                get value() {
                  return bind_get();
                },
                set value($$value) {
                  bind_set($$value);
                },
                disabled: current2.experiment === null
              });
              $$renderer5.push(`<!----> `);
              if (python?.ready) {
                $$renderer5.push("<!--[-->");
                IconButton($$renderer5, {
                  icon: `/icons/btn-send${stringify(current2.experiment.pilotMode ? "pilot" : "run")}.svg`,
                  label: "Send experiment to runner",
                  onclick: sendToRunner,
                  disabled: !current2.experiment.file.file,
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
            Section$1($$renderer4, {
              label: "Desktop",
              icon: "/icons/rbn-desktop.svg",
              children: ($$renderer5) => {
                IconButton($$renderer5, {
                  icon: "/icons/btn-compilepy.svg",
                  label: "Write experiment as a .py file",
                  onclick: (evt) => compilePython(),
                  disabled: !current2.experiment.file.file,
                  borderless: true,
                  get awaiting() {
                    return awaiting.compilepy;
                  },
                  set awaiting($$value) {
                    awaiting.compilepy = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----> `);
                IconButton($$renderer5, {
                  icon: `/icons/btn-${stringify(current2.experiment.pilotMode ? "pilot" : "run")}py.svg`,
                  label: `${stringify(current2.experiment.pilotMode ? "Pilot" : "Run")} experiment locally`,
                  onclick: (evt) => runPython(),
                  disabled: !current2.experiment.file.file,
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
                $$renderer5.push(`<!---->`);
              }
            });
            $$renderer4.push(`<!----> `);
            Section$1($$renderer4, {
              label: "Browser",
              icon: "/icons/rbn-browser.svg",
              children: ($$renderer5) => {
                IconButton($$renderer5, {
                  icon: "/icons/btn-compilejs.svg",
                  label: "Write experiment as a .js file",
                  onclick: (evt) => compileJS(),
                  disabled: !current2.experiment.file.file,
                  borderless: true,
                  get awaiting() {
                    return awaiting.compilejs;
                  },
                  set awaiting($$value) {
                    awaiting.compilejs = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!----> `);
                IconButton($$renderer5, {
                  icon: `/icons/btn-${stringify(current2.experiment.pilotMode ? "pilot" : "run")}js.svg`,
                  label: `${stringify(current2.experiment.pilotMode ? "Pilot" : "Run")} experiment in browser`,
                  onclick: (evt) => runJS(),
                  disabled: !current2.experiment.file.file || !current2.experiment.pilotMode && !current2.project,
                  borderless: true,
                  get awaiting() {
                    return awaiting.runjs;
                  },
                  set awaiting($$value) {
                    awaiting.runjs = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!---->`);
              }
            });
            $$renderer4.push(`<!---->`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          Section$1($$renderer4, {
            label: "Pavlovia",
            icon: "/icons/rbn-pavlovia.svg",
            children: ($$renderer5) => {
              {
                let button = function($$renderer6, sync) {
                  IconButton($$renderer6, {
                    icon: "/icons/btn-sync.svg",
                    label: "Sync experiment",
                    onclick: (evt) => sync(snapshot(current2.experiment.file.parent), snapshot(current2.user), true),
                    disabled: !current2.user || !current2.experiment.file.file,
                    borderless: true
                  });
                };
                Sync($$renderer5, { button, $$slots: { button: true } });
              }
              $$renderer5.push(`<!----> `);
              UserCtrl($$renderer5);
              $$renderer5.push(`<!----> `);
              ProjectCtrl($$renderer5);
              $$renderer5.push(`<!---->`);
            }
          });
          $$renderer4.push(`<!----> `);
          Gap($$renderer4);
          $$renderer4.push(`<!----> `);
          Section$1($$renderer4, {
            label: "Views",
            icon: "/icons/rbn-windows.svg",
            children: ($$renderer5) => {
              IconButton($$renderer5, {
                icon: "/icons/btn-builder.svg",
                label: "Builder view",
                onclick: (evt) => showWindow("builder"),
                borderless: true,
                disabled: true
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
function EntryPoint$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { routine, index } = $$props;
    let hovered = false;
    let moving = current2.moving && [Component$1].includes(current2.moving.constructor);
    let inserting = current2.inserting && [Component$1].includes(current2.inserting.constructor);
    $$renderer2.push(`<div${attr_class("entry-point svelte-1g614kq", void 0, { "active": moving || inserting, "hovered": hovered })}${attr_style("", {
      "grid-row-start": index >= 0 ? index + 3 : routine.components.length + 3
    })}>`);
    Icon($$renderer2, {
      src: `/icons/sym-arrow-right${stringify("")}.svg`,
      size: "1rem"
    });
    $$renderer2.push(`<!----> <button class="hitbox svelte-1g614kq" aria-label="Entry point"${attr("tabindex", moving || inserting ? 0 : -1)}></button></div>`);
  });
}
function StaticPeriod($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component, hovered = void 0 } = $$props;
    $$renderer2.push(`<div class="static-period-container svelte-yq6e5r"><div class="static-period svelte-yq6e5r" role="none"${attr_style("", {
      left: `${stringify(component.visualStart === null ? 0 : component.visualStart * 100 / component.routine.visualStop)}%`,
      right: `${stringify(component.visualStop === null || component.routine.visualStop && component.visualStop > component.routine.visualStop ? 0 : (component.routine.visualStop - component.visualStop) * 100 / component.routine.visualStop)}%`,
      opacity: hovered ? "0.5" : "0.25"
    })}></div></div>`);
    bind_props($$props, { hovered });
  });
}
function Component($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { component } = $$props;
    let hovered = false;
    let showContextMenu = false;
    let contextMenuPos = { x: void 0, y: void 0 };
    let showDialog = false;
    function abbreviateLongName(name) {
      if (name.length > 20) {
        return `${name.slice(0, 20)}...`;
      }
      return name;
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      EntryPoint$1($$renderer3, { routine: component.routine, index: component.index });
      $$renderer3.push(`<!----> <label class="comp-name svelte-1nb68qp"${attr("for", component.params["name"].val)}${attr_style(`opacity: ${stringify(component.disabled ? 0.3 : 1)}`, {
        border: hovered ? "1px solid var(--overlay)" : `1px solid var(--base)`,
        "grid-row-start": component.index + 3
      })} draggable="true" role="none">${escape_html(prefs.params["abbreviateLongCompNames"].val ? abbreviateLongName(component.name) : component.name)} `);
      Icon($$renderer3, { src: component.iconSVG });
      $$renderer3.push(`<!----></label> <div class="comp-overshoot-timeline svelte-1nb68qp"${attr_style("", {
        "grid-column-start": "undershoot",
        "grid-row-start": component.index + 3
      })}>`);
      if (component.visualStart === null) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="comp-overshoot-bar svelte-1nb68qp" role="none"${attr_style("", {
          background: `linear-gradient(-90deg, var(--${stringify(component.visualColor)}), var(--base));`
        })}></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> <div class="comp-timeline svelte-1nb68qp"${attr("id", component.params["name"].val)}${attr("draggable", true)} role="none"${attr_style("", {
        "grid-template-columns": `repeat(${stringify(component.routine.visualTicks.labels.length)}, 1fr) ${stringify(component.routine.visualTicks.remainder)}fr;`,
        "grid-row-start": component.index + 3
      })}><div class="comp-timeline-bar svelte-1nb68qp"${attr_style("", {
        left: `${stringify(component.visualStart === null ? 0 : component.visualStart * 100 / component.routine.visualStop)}%`,
        right: `${stringify(component.visualStop === null || component.routine.visualStop && component.visualStop > component.routine.visualStop ? 0 : (component.routine.visualStop - component.visualStop) * 100 / component.routine.visualStop)}%`,
        "background-color": `var(--${stringify(component.visualColor)})`,
        border: hovered ? "1px solid var(--outline)" : `1px solid var(--${component.visualColor})`
      })}></div> <!--[-->`);
      const each_array = ensure_array_like(component.routine.visualTicks.labels);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tick = each_array[$$index];
        $$renderer3.push(`<div class="comp-timeline-tick svelte-1nb68qp"${attr_style(`flex-basis: ${stringify(tick.proportion)}`)}></div>`);
      }
      $$renderer3.push(`<!--]--> <div class="comp-timeline-tick svelte-1nb68qp" id="timeline-label-remainder"${attr_style("", {
        "border-left": component.routine.settings.visualStop ? ".5rem solid var(--orange)" : "1px solid var(--overlay)",
        "z-index": component.routine.settings.visualStop ? 2 : 0
      })}></div></div> `);
      if (component.tag === "StaticComponent") {
        $$renderer3.push("<!--[-->");
        StaticPeriod($$renderer3, {
          component,
          get hovered() {
            return hovered;
          },
          set hovered($$value) {
            hovered = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="comp-overshoot-timeline svelte-1nb68qp"${attr_style("", {
        "grid-column-start": "overshoot",
        "grid-row-start": component.index + 3
      })}>`);
      if (component.visualStop === null || component.routine.visualStop && component.visualStop > component.routine.visualStop) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="comp-overshoot-bar svelte-1nb68qp" role="none"${attr_style("", {
          background: `linear-gradient(90deg, var(--${stringify(component.routine.settings.visualStop ? "overlay" : component.visualColor)}), var(--base))`
        })}></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> `);
      Menu($$renderer3, {
        get shown() {
          return showContextMenu;
        },
        set shown($$value) {
          showContextMenu = $$value;
          $$settled = false;
        },
        get position() {
          return contextMenuPos;
        },
        set position($$value) {
          contextMenuPos = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Item($$renderer4, {
            icon: "/icons/btn-edit.svg",
            label: "Edit Component",
            onclick: (evt) => showDialog = true
          });
          $$renderer4.push(`<!----> `);
          Item($$renderer4, {
            icon: `/icons/sym-dot-${stringify(component.disabled ? "blue" : "light")}.svg`,
            label: `${stringify(component.disabled ? "Enable" : "Disable")} Component`,
            onclick: (evt) => {
              current2.experiment.history.update(`${component.disabled ? "enable" : "disable"} ${component.name}`);
              component.params.disabled.val = !component.disabled;
            }
          });
          $$renderer4.push(`<!----> `);
          Item($$renderer4, {
            icon: "/icons/btn-delete.svg",
            label: "Delete Component",
            onclick: (evt) => {
              current2.experiment.history.update(`remove ${component.name}`);
              component.routine.removeComponent(component);
            }
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      ParamsDialog($$renderer3, {
        element: component,
        get shown() {
          return showDialog;
        },
        set shown($$value) {
          showDialog = $$value;
          $$settled = false;
        }
      });
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
function Timeline($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { routine } = $$props;
    $$renderer2.push(`<div class="comp-name"></div> <div class="comp-overshoot-timeline svelte-4egudf"></div> <div class="comp-timeline svelte-4egudf"${attr_style(`grid-template-columns: repeat(${stringify(routine.visualTicks ? routine.visualTicks.labels.length : 0)}, 1fr) ${stringify(routine.visualTicks.remainder)}fr;`)}><!--[-->`);
    const each_array = ensure_array_like(routine.visualTicks.labels);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tick = each_array[$$index];
      $$renderer2.push(`<div class="comp-timeline-tick svelte-4egudf"${attr("id", `timeline-label-${stringify(tick.label)}`)}><label for="timeline-labels"${attr_class("svelte-4egudf", void 0, { "force-ended": routine.settings.visualStop })}>${escape_html(tick.label)}s</label></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="comp-timeline-tick svelte-4egudf" id="timeline-label-remainder"${attr_style("", {
      "border-left": routine.settings.visualStop ? ".5rem solid var(--orange)" : "1px solid var(--overlay)"
    })}></div></div> <div class="comp-overshoot-timeline svelte-4egudf"></div>`);
  });
}
function Canvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { routine = void 0 } = $$props;
    let showDialog = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="routine-canvas svelte-1jnlv78"${attr_style("", {
        "grid-template-rows": `min-content [timeline-top] min-content repeat(${stringify(routine.components.length)}, min-content) [timeline-bottom] min-content`
      })}><div class="button-container svelte-1jnlv78">`);
      Button($$renderer3, {
        label: "Routine settings",
        icon: "/icons/btn-settings.svg",
        tooltip: "Edit settings for this Routine",
        onclick: () => showDialog = true,
        horizontal: true
      });
      $$renderer3.push(`<!----></div> `);
      ParamsDialog($$renderer3, {
        element: routine.settings,
        get shown() {
          return showDialog;
        },
        set shown($$value) {
          showDialog = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (routine.components) {
        $$renderer3.push("<!--[-->");
        Timeline($$renderer3, { routine });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <!--[-->`);
      const each_array = ensure_array_like(routine.components);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let component = each_array[$$index];
        Component($$renderer3, { component });
      }
      $$renderer3.push(`<!--]--> `);
      EntryPoint$1($$renderer3, { routine, index: "-1" });
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
function Standalone($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { component } = $$props;
    let valid = Object.values(component.params).every((param) => param.valid.value);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="standalone-routine-canvas svelte-1ly2nn7">`);
      Notebook_1$1($$renderer3, {
        get element() {
          return component;
        },
        set element($$value) {
          component = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div class="standalone-routine-ctrls svelte-1ly2nn7"><div class="ctrl-gap svelte-1ly2nn7"></div> `);
      Button($$renderer3, {
        label: "Apply",
        primary: true,
        horizontal: true,
        disabled: !valid,
        onclick: (evt) => component.restore.set()
      });
      $$renderer3.push(`<!----> `);
      Button($$renderer3, {
        label: "Discard",
        horizontal: true,
        onclick: (evt) => component.restore.apply()
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
function Notebook_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let showNewRoutineDialog = false;
    let valid = {};
    let btnsDisabled = {
      OK: Object.values(valid).some((val) => !val.state),
      APPLY: Object.values(valid).some((val) => !val.state)
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Notebook($$renderer3, {
        children: ($$renderer4) => {
          if (current2.experiment !== null) {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<!--[-->`);
            const each_array = ensure_array_like(Object.entries(current2.experiment.routines));
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let [name, routine] = each_array[$$index];
              var bind_get = () => {
                return current2.routine === routine;
              };
              var bind_set = (value) => {
                current2.routine = routine;
              };
              var bind_get_1 = () => routine.name;
              var bind_set_1 = (value) => routine.settings.params["name"].val = value;
              Page($$renderer4, {
                get selected() {
                  return bind_get();
                },
                set selected($$value) {
                  bind_set($$value);
                },
                get label() {
                  return bind_get_1();
                },
                set label($$value) {
                  bind_set_1($$value);
                },
                close: () => {
                  current2.experiment.history.update();
                  delete current2.experiment.routines[name];
                },
                closeTooltip: `Delete ${stringify(name)}`,
                data: routine,
                children: ($$renderer5) => {
                  if (routine instanceof Routine$1) {
                    $$renderer5.push("<!--[-->");
                    Canvas($$renderer5, { routine });
                  } else {
                    $$renderer5.push("<!--[!-->");
                    if (current2.experiment.routines[name] instanceof StandaloneRoutine) {
                      $$renderer5.push("<!--[-->");
                      Standalone($$renderer5, { component: routine });
                    } else {
                      $$renderer5.push("<!--[!-->");
                    }
                    $$renderer5.push(`<!--]-->`);
                  }
                  $$renderer5.push(`<!--]-->`);
                },
                $$slots: { default: true }
              });
            }
            $$renderer4.push(`<!--]-->`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          ButtonTab($$renderer4, {
            callback: (evt) => {
              current2.inserting = new Routine$1();
              showNewRoutineDialog = true;
            },
            tooltip: "New Routine..."
          });
          $$renderer4.push(`<!---->`);
        }
      });
      $$renderer3.push(`<!----> `);
      if (current2.inserting instanceof Routine$1) {
        $$renderer3.push("<!--[-->");
        Dialog($$renderer3, {
          id: "new-routine",
          title: "New Routine",
          onopen: () => current2.inserting.settings.restore.set(),
          buttons: {
            OK: (evt) => {
              current2.inserting.exp = current2.experiment;
              current2.experiment.routines[current2.inserting.name] = current2.inserting;
            },
            CANCEL: (evt) => {
              current2.inserting.settings.restore.apply();
              current2.inserting = void 0;
            },
            HELP: "https://www.psychopy.org/builder/routines.html#routines"
          },
          buttonsDisabled: btnsDisabled,
          get shown() {
            return showNewRoutineDialog;
          },
          set shown($$value) {
            showNewRoutineDialog = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Notebook_1$1($$renderer4, {
              element: current2.inserting.settings,
              get valid() {
                return valid;
              },
              set valid($$value) {
                valid = $$value;
                $$settled = false;
              }
            });
          },
          $$slots: { default: true }
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
  });
}
function ComponentButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { component } = $$props;
    let dlgComponent = new Component$1(component["__name__"]);
    let showDialog = void 0;
    function titleCase(name) {
      name = name.replace("Component", "");
      name = name.replace("Routine", "");
      name = name.replace(/(\w)([A-Z])/g, "$1 $2");
      return name;
    }
    function newComponent() {
      dlgComponent = new Component$1(component["__name__"]);
      showDialog = true;
    }
    let valid = Object.values(dlgComponent.params).every((param) => param.valid?.value);
    let btnsDisabled = { OK: !valid, APPLY: !valid };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (!component.hidden) {
        $$renderer3.push("<!--[-->");
        Button($$renderer3, {
          label: titleCase(component["__name__"]),
          icon: component.iconSVG,
          vertical: true,
          disabled: !(current2.routine instanceof Routine$1),
          onclick: newComponent
        });
        $$renderer3.push(`<!----> `);
        Dialog($$renderer3, {
          id: "new-component",
          title: `New ${stringify(titleCase(component["__name__"]))}`,
          onopen: () => dlgComponent.restore.set(),
          buttons: {
            OK: (evt) => {
              current2.routine.addComponent(dlgComponent);
              dlgComponent.restore.set();
            },
            CANCEL: () => dlgComponent.restore.apply(),
            HELP: dlgComponent.helpLink
          },
          buttonsDisabled: btnsDisabled,
          get shown() {
            return showDialog;
          },
          set shown($$value) {
            showDialog = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Notebook_1$1($$renderer4, { element: dlgComponent });
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!---->`);
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
  });
}
function Section($$renderer, $$props) {
  let { label, children } = $$props;
  PanelButton($$renderer, {
    label,
    children: ($$renderer2) => {
      $$renderer2.push(`<div class="component-section-buttons svelte-b7kudy">`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    },
    $$slots: { default: true }
  });
}
function RoutineButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { component } = $$props;
    function titleCase(name) {
      name = name.replace("Component", "");
      name = name.replace("Routine", "");
      name = name.replace(/(\w)([A-Z])/g, "$1 $2");
      return name;
    }
    function newRoutine() {
      current2.experiment.history.update(`new Routine`);
      let rt = new StandaloneRoutine(component["__name__"]);
      rt.exp = current2.experiment;
      current2.experiment.routines[rt.name] = rt;
      current2.routine = rt;
      current2.inserting = rt;
    }
    if (!component.hidden) {
      $$renderer2.push("<!--[-->");
      Button($$renderer2, {
        label: titleCase(component["__name__"]),
        icon: `/icons/components/${stringify(component["__name__"])}.svg`,
        vertical: true,
        onclick: newRoutine
      });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function FilterDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { filter = void 0, shown = void 0 } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "component-filter",
        title: "Filter Components",
        shrink: true,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="container svelte-8tksg9">Show only Components which work with... <div class="radio-ctrl svelte-8tksg9"><input type="radio" id="component-filter-any" name="component-filter"${attr("checked", filter === void 0, true)}/> <label for="component-filter-any">Any</label> <input type="radio" id="component-filter-py" name="component-filter"${attr("checked", filter && filter.includes("PsychoPy") && !filter.includes("PsychoJS"), true)}/> <label for="component-filter-py">PsychoPy (local)</label> <input type="radio" id="component-filter-js" name="component-filter"${attr("checked", filter && !filter.includes("PsychoPy") && filter.includes("PsychoJS"), true)}/> <label for="component-filter-js">PsychoJS (online)</label> <input type="radio" id="component-filter-both" name="component-filter"${attr("checked", filter && filter.includes("PsychoPy") && filter.includes("PsychoJS"), true)}/> <label for="component-filter-both">Both</label></div></div>`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { filter, shown });
  });
}
function Panel$2($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function sortProfiles(profiles2) {
      let categs = Object.values(profiles2).reduce((all, profile) => Array.prototype.concat(all, profile.categories.filter((categ) => !all.includes(categ))), []);
      let categOrder = {
        first: ["Stimuli", "Responses"],
        last: ["I/O", "Custom", "Other"]
      };
      categs.sort((a, b) => (
        // prioritise categs listed in `first`
        categOrder.first.includes(b) - categOrder.first.includes(a) + // deprioritise categs listed in `last`
        (categOrder.last.includes(a) - categOrder.last.includes(b))
      ));
      let sorted = categs.map((categ) => [
        categ,
        Object.values(profiles2).filter((profile) => profile.categories.includes(categ) && // skip base elements
        !profile["__class__"].match(/psychopy\.experiment\.(components|routines)\._?base:.*/) && // skip hidden elements
        !profile.hidden)
      ]);
      return sorted;
    }
    function filterProfiles(profiles2) {
      return profiles2.filter((profile) => filter === void 0 || filter.every((value) => profile.targets.includes(value)));
    }
    async function refreshProfiles() {
      if (await python?.ready) {
        pending.components = python.liaison.send(
          "app",
          {
            command: "run",
            args: ["psychopy.experiment:getElementProfiles"]
          },
          1e5
        ).then((data) => Object.assign(profiles.components, data));
      }
    }
    let showFilterDlg = false;
    let showPluginMgr = false;
    let filter = void 0;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div id="components"><div class="ctrls svelte-14x5eb5">`);
      if (python?.ready) {
        $$renderer3.push("<!--[-->");
        CompactButton($$renderer3, {
          icon: "/icons/btn-add.svg",
          tooltip: "Get more...",
          onclick: (evt) => showPluginMgr = true
        });
        $$renderer3.push(`<!----> `);
        Dialog_1$2($$renderer3, {
          get shown() {
            return showPluginMgr;
          },
          set shown($$value) {
            showPluginMgr = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> `);
        CompactButton($$renderer3, {
          icon: "/icons/btn-refresh.svg",
          tooltip: "Reload Components",
          onclick: refreshProfiles
        });
        $$renderer3.push(`<!---->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      CompactButton($$renderer3, {
        icon: "/icons/btn-filter.svg",
        tooltip: "Filter...",
        onclick: (evt) => showFilterDlg = true
      });
      $$renderer3.push(`<!----> `);
      FilterDialog($$renderer3, {
        get filter() {
          return filter;
        },
        set filter($$value) {
          filter = $$value;
          $$settled = false;
        },
        get shown() {
          return showFilterDlg;
        },
        set shown($$value) {
          showFilterDlg = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> <div class="components">`);
      await_block($$renderer3, python?.ready, () => {
      }, (ready) => {
        await_block(
          $$renderer3,
          pending.components,
          () => {
            $$renderer3.push(`<div class="message svelte-14x5eb5">Loading Components...</div>`);
          },
          () => {
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(sortProfiles(profiles.components));
            for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
              let [categ, categProfiles] = each_array[$$index_1];
              if (filterProfiles(categProfiles).length) {
                $$renderer3.push("<!--[-->");
                Section($$renderer3, {
                  label: categ,
                  children: ($$renderer4) => {
                    $$renderer4.push(`<!--[-->`);
                    const each_array_1 = ensure_array_like(filterProfiles(categProfiles));
                    for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                      let profile = each_array_1[$$index];
                      if (profile["__class__"].startsWith("psychopy.experiment.components") || profile["__class__"].endsWith("omponent")) {
                        $$renderer4.push("<!--[-->");
                        ComponentButton($$renderer4, { component: profile });
                      } else {
                        $$renderer4.push("<!--[!-->");
                        RoutineButton($$renderer4, { component: profile });
                      }
                      $$renderer4.push(`<!--]-->`);
                    }
                    $$renderer4.push(`<!--]-->`);
                  }
                });
              } else {
                $$renderer3.push("<!--[!-->");
              }
              $$renderer3.push(`<!--]-->`);
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer3.push(`<!--]-->`);
      });
      $$renderer3.push(`<!--]--></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function EntryPoint($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { index = void 0 } = $$props;
    let hovered = false;
    let moving = current2.moving && [Routine$1, StandaloneRoutine, LoopInitiator, LoopTerminator].includes(current2.moving.constructor);
    let inserting = current2.inserting && [Routine$1, StandaloneRoutine, LoopInitiator, LoopTerminator].includes(current2.inserting.constructor);
    $$renderer2.push(`<div${attr_class("entry-point svelte-bbudjt", void 0, { "active": moving || inserting, "hovered": hovered })}><button class="hitbox svelte-bbudjt" aria-label="Entry point"${attr("tabindex", moving || inserting ? 0 : -1)}></button></div>`);
  });
}
function Routine($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { element = void 0 } = $$props;
    let show = { settingsDlg: false, contextMenu: false, tooltip: false };
    let contextMenuPos = { x: void 0, y: void 0 };
    function removeRoutine(evt) {
      current2.experiment.history.update(`remove ${element.name}`);
      current2.experiment.flow.removeElement(element.index);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      EntryPoint($$renderer3, { index: element.index });
      $$renderer3.push(`<!----> <button${attr_class("routine svelte-rk31uv", void 0, {
        "active": current2.routine ? current2.routine.name === element.name : false,
        "disabled": element.disabled
      })}${attr("draggable", true)}>`);
      if (element.settings && "desc" in element.settings.params && element.settings.params["desc"].val) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
          position: "bottom",
          get shown() {
            return show.tooltip;
          },
          set shown($$value) {
            show.tooltip = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            if (element.settings.params["desc"].val.length > 64) {
              $$renderer4.push("<!--[-->");
              $$renderer4.push(`${escape_html(element.settings.params["desc"].val.slice(0, 64))}...`);
            } else {
              $$renderer4.push("<!--[!-->");
              $$renderer4.push(`${escape_html(element.settings.params["desc"].val)}`);
            }
            $$renderer4.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> ${escape_html(element.name)}</button> `);
      Menu($$renderer3, {
        get shown() {
          return show.contextMenu;
        },
        set shown($$value) {
          show.contextMenu = $$value;
          $$settled = false;
        },
        get position() {
          return contextMenuPos;
        },
        set position($$value) {
          contextMenuPos = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          if (element.settings) {
            $$renderer4.push("<!--[-->");
            Item($$renderer4, {
              icon: "/icons/btn-edit.svg",
              label: "Routine settings",
              onclick: (evt) => show.settingsDlg = true
            });
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> `);
          Item($$renderer4, {
            icon: `/icons/sym-dot-${stringify(element.disabled ? "blue" : "light")}.svg`,
            label: `${stringify(element.disabled ? "Enable" : "Disable")} Routine`,
            onclick: (evt) => {
              current2.experiment.history.update(`${element.disabled ? "enable" : "disable"} ${element.name}`);
              if (element.settings) {
                element.settings.params.disabled.val = !element.disabled;
              } else {
                element.params.disabled.val = !element.disabled;
              }
            }
          });
          $$renderer4.push(`<!----> `);
          Item($$renderer4, {
            icon: "/icons/btn-copy.svg",
            label: "Copy Routine",
            onclick: (evt) => copyRoutine(element)
          });
          $$renderer4.push(`<!----> `);
          Item($$renderer4, {
            icon: "/icons/btn-delete.svg",
            label: "Remove Routine",
            onclick: removeRoutine
          });
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      if (element.settings) {
        $$renderer3.push("<!--[-->");
        ParamsDialog($$renderer3, {
          get element() {
            return element.settings;
          },
          set element($$value) {
            element.settings = $$value;
            $$settled = false;
          },
          get shown() {
            return show.settingsDlg;
          },
          set shown($$value) {
            show.settingsDlg = $$value;
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
    bind_props($$props, { element });
  });
}
function Loop_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let { element = void 0 } = $$props;
    let showDialog = false;
    let showContextMenu = false;
    let contextMenuPos = { x: void 0, y: void 0 };
    function removeLoop(evt) {
      current2.experiment.history.update(`remove ${element.name}`);
      if (current2.experiment.flow.flat.includes(element.initiator)) {
        current2.experiment.flow.flat.splice(current2.experiment.flow.flat.indexOf(element.initiator), 1);
      }
      if (current2.experiment.flow.flat.includes(element.terminator)) {
        current2.experiment.flow.flat.splice(current2.experiment.flow.flat.indexOf(element.terminator), 1);
      }
    }
    let valid = Object.values(element.params).every((param) => param.valid?.value);
    let btnsDisabled = { OK: !valid, APPLY: !valid };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (element.complete) {
        $$renderer3.push("<!--[-->");
        EntryPoint($$renderer3, { index: element.initiator.index });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div${attr_class("loop svelte-1118i51", void 0, { "incomplete": !element.complete })}>`);
      if (element) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<button class="loop-name svelte-1118i51">${escape_html(element.name)}</button>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="loop-arrow left svelte-1118i51"${attr("draggable", true)} role="none">`);
      Icon($$renderer3, {
        src: `/icons/sym-arrow-up${stringify("")}.svg`
      });
      $$renderer3.push(`<!----></div> `);
      if (element) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(Object.keys(element.routines));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let i = each_array[$$index];
          if (element.routines[i] instanceof FlowLoop) {
            $$renderer3.push("<!--[-->");
            Loop_1($$renderer3, {
              get element() {
                return element.routines[i];
              },
              set element($$value) {
                element.routines[i] = $$value;
                $$settled = false;
              }
            });
          } else {
            $$renderer3.push("<!--[!-->");
            Routine($$renderer3, {
              get element() {
                return element.routines[i];
              },
              set element($$value) {
                element.routines[i] = $$value;
                $$settled = false;
              }
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (element.complete) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="loop-arrow right svelte-1118i51"${attr("draggable", true)} role="none">`);
        Icon($$renderer3, {
          src: `/icons/sym-arrow-down${stringify("")}.svg`
        });
        $$renderer3.push(`<!----></div> `);
        EntryPoint($$renderer3, { index: element.terminator.index });
        $$renderer3.push(`<!---->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> `);
      Menu($$renderer3, {
        get shown() {
          return showContextMenu;
        },
        set shown($$value) {
          showContextMenu = $$value;
          $$settled = false;
        },
        get position() {
          return contextMenuPos;
        },
        set position($$value) {
          contextMenuPos = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Item($$renderer4, {
            icon: "/icons/btn-delete.svg",
            label: "Delete Loop",
            onclick: removeLoop
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        id: `loop-${stringify(element.name)}`,
        title: element.name,
        onopen: () => element.initiator.restore.set(),
        buttons: {
          OK: (evt) => {
          },
          APPLY: (evt) => element.initiator.restore.set(),
          CANCEL: (evt) => element.initiator.restore.apply()
        },
        buttonsDisabled: btnsDisabled,
        get shown() {
          return showDialog;
        },
        set shown($$value) {
          showDialog = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Notebook_1$1($$renderer4, {
            element: element instanceof FlowLoop ? element.initiator : element,
            get valid() {
              return valid;
            },
            set valid($$value) {
              valid = $$value;
              $$settled = false;
            }
          });
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { element });
  });
}
function Flow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="flow-canvas svelte-1ymcx07"><div class="flow svelte-1ymcx07"><div class="flowline-container svelte-1ymcx07"><div class="flowline svelte-1ymcx07"></div> <div class="flowline-arrow svelte-1ymcx07">`);
      Icon($$renderer3, { src: "/icons/sym-arrow-right.svg", size: ".75rem" });
      $$renderer3.push(`<!----></div></div> `);
      if (current2.experiment) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(current2.experiment.flow.dynamic);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let emt = each_array[$$index];
          $$renderer3.push(`<div class="flow-animation svelte-1ymcx07">`);
          if (emt instanceof FlowLoop) {
            $$renderer3.push("<!--[-->");
            Loop_1($$renderer3, {
              get element() {
                return emt;
              },
              set element($$value) {
                emt = $$value;
                $$settled = false;
              }
            });
          } else {
            $$renderer3.push("<!--[!-->");
            Routine($$renderer3, {
              get element() {
                return emt;
              },
              set element($$value) {
                emt = $$value;
                $$settled = false;
              }
            });
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      EntryPoint($$renderer3, { index: "-1" });
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
function AddRoutine($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let showNewRoutineDialog = false;
    let showMenu = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="container svelte-1o4sr79">`);
      Button($$renderer3, {
        label: "Add Routine",
        icon: "/icons/btn-routine.svg",
        tooltip: "Add a Routine to the experiment flow",
        onclick: () => {
          showMenu = true;
        },
        disabled: current2.inserting,
        horizontal: true
      });
      $$renderer3.push(`<!----> `);
      Menu($$renderer3, {
        get shown() {
          return showMenu;
        },
        set shown($$value) {
          showMenu = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Item($$renderer4, {
            label: "New Routine...",
            onclick: () => {
              current2.inserting = new Routine$1();
              showNewRoutineDialog = true;
            }
          });
          $$renderer4.push(`<!----> <!--[-->`);
          const each_array = ensure_array_like(Object.entries(current2.experiment.routines));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let [name, routine] = each_array[$$index];
            Item($$renderer4, {
              label: name,
              onclick: () => {
                current2.inserting = routine;
              }
            });
          }
          $$renderer4.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div> `);
      if (current2.inserting instanceof Routine$1) {
        $$renderer3.push("<!--[-->");
        Dialog($$renderer3, {
          id: "new-routine",
          title: "New Routine",
          onopen: () => current2.inserting.settings.restore.set(),
          buttons: {
            OK: (evt) => {
              current2.inserting.exp = current2.experiment;
              current2.experiment.routines[current2.inserting.name] = current2.inserting;
            },
            CANCEL: (evt) => {
              current2.inserting.settings.restore.apply();
              current2.inserting = void 0;
            },
            HELP: "https://www.psychopy.org/builder/routines.html#routines"
          },
          buttonsDisabled: {
            OK: !Object.values(current2.inserting.settings.params).every((param) => param.valid?.value),
            APPLY: !Object.values(current2.inserting.settings.params).every((param) => param.valid?.value)
          },
          get shown() {
            return showNewRoutineDialog;
          },
          set shown($$value) {
            showNewRoutineDialog = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Notebook_1$1($$renderer4, { element: current2.inserting.settings });
          },
          $$slots: { default: true }
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
  });
}
function AddLoop($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    let showDialog = false;
    let showMenu = false;
    let valid = (() => {
      if (current2.inserting) {
        return Object.values(current2.inserting.params).every((param) => param.valid?.value);
      }
    })();
    let btnsDisabled = { OK: !valid, APPLY: !valid };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="container svelte-i9bjwn">`);
      Button($$renderer3, {
        label: "Add Loop",
        icon: "/icons/btn-loop.svg",
        tooltip: "Add a loop to the experiment flow",
        onclick: () => showMenu = true,
        disabled: current2.inserting,
        horizontal: true
      });
      $$renderer3.push(`<!----> `);
      Menu($$renderer3, {
        get shown() {
          return showMenu;
        },
        set shown($$value) {
          showMenu = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          await_block(
            $$renderer4,
            pending.loops,
            () => {
              Item($$renderer4, { label: "Loading loops..." });
            },
            (loops) => {
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like(Object.entries(loops));
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let [loopType, loopProfile] = each_array[$$index];
                if (!loopProfile.hidden) {
                  $$renderer4.push("<!--[-->");
                  Item($$renderer4, {
                    label: `New ${stringify(loopProfile.label?.toLowerCase?.() || loopType)}...`,
                    onclick: () => {
                      current2.inserting = new LoopInitiator(loopType);
                      current2.inserting.exp = current2.experiment;
                      showDialog = true;
                    }
                  });
                } else {
                  $$renderer4.push("<!--[!-->");
                }
                $$renderer4.push(`<!--]-->`);
              }
              $$renderer4.push(`<!--]-->`);
            }
          );
          $$renderer4.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      if (current2.inserting instanceof LoopInitiator) {
        $$renderer3.push("<!--[-->");
        Dialog($$renderer3, {
          id: "new-loop",
          title: "New loop",
          onopen: () => current2.inserting.restore.set(),
          buttons: {
            OK: (evt) => {
            },
            CANCEL: (evt) => {
              current2.inserting.restore.apply();
              current2.inserting = void 0;
            },
            HELP: "https://www.psychopy.org/builder/flow.html#loops"
          },
          buttonsDisabled: btnsDisabled,
          get shown() {
            return showDialog;
          },
          set shown($$value) {
            showDialog = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            Notebook_1$1($$renderer4, {
              element: current2.inserting,
              get valid() {
                return valid;
              },
              set valid($$value) {
                valid = $$value;
                $$settled = false;
              }
            });
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function Panel$1($$renderer) {
  $$renderer.push(`<div class="flow-buttons svelte-1af6kv0">`);
  AddRoutine($$renderer);
  $$renderer.push(`<!----> `);
  AddLoop($$renderer);
  $$renderer.push(`<!----></div>`);
}
function Panel($$renderer) {
  $$renderer.push(`<div class="flow-panel svelte-1lgnm09">`);
  Panel$1($$renderer);
  $$renderer.push(`<!----> `);
  Flow($$renderer);
  $$renderer.push(`<!----></div>`);
}
function ReadMe($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { script, shown = void 0 } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        title: script.file.name,
        buttons: {
          OK: (evt) => {
          },
          EXTRA: {
            Edit: (evt) => openIn(script.file, "coder"),
            Refresh: (evt) => script.fromFile(script.file)
          }
        },
        buttonsDisabled: {
          EXTRA: { Edit: !script.file?.parent, Refresh: !script.file?.parent }
        },
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="readme-preview svelte-h5cupi">${html(marked(script.content || ""))}</div>`);
        },
        $$slots: { default: true }
      });
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let params = new URLSearchParams(location.search);
    if (params.get("fileOpen")) {
      openFile(params.get("fileOpen"));
    }
    setContext("current", current);
    if (electron) {
      electron.windows.listen("fileOpen", (evt, file) => openFile(file));
      electron.windows.emit("ready", true);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (current.experiment.file) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<title>PsychoPy Builder: ${escape_html(current.experiment.file?.name)}</title>`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<title>PsychoPy Builder</title>`);
      }
      $$renderer3.push(`<!--]--> `);
      {
        let ribbon = function($$renderer4) {
          Ribbon_1($$renderer4);
        };
        Frame($$renderer3, {
          onFileDrop: (evt, file) => openFile(file),
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
                        Pane($$renderer7, {
                          defaultSize: 3 / 4,
                          children: ($$renderer8) => {
                            Panel$3($$renderer8, {
                              title: "Routines",
                              children: ($$renderer9) => {
                                Notebook_1($$renderer9);
                              }
                            });
                          },
                          $$slots: { default: true }
                        });
                        $$renderer7.push(`<!----> `);
                        Pane_resizer($$renderer7, { style: "width: .3rem;" });
                        $$renderer7.push(`<!----> `);
                        Pane($$renderer7, {
                          defaultSize: 1 / 4,
                          children: ($$renderer8) => {
                            Panel$3($$renderer8, {
                              title: "Components",
                              children: ($$renderer9) => {
                                Panel$2($$renderer9);
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
                Pane($$renderer5, {
                  defaultSize: 1 / 3,
                  children: ($$renderer6) => {
                    Panel$3($$renderer6, {
                      title: "Flow",
                      children: ($$renderer7) => {
                        Panel($$renderer7);
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
            ReadMe($$renderer4, {
              script: current.readme.script,
              get shown() {
                return current.readme.shown;
              },
              set shown($$value) {
                current.readme.shown = $$value;
                $$settled = false;
              }
            });
            $$renderer4.push(`<!----> `);
            TipsDialog($$renderer4, {
              categories: ["general", "builder", "silly"],
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
            if (python) {
              $$renderer4.push("<!--[-->");
              SetupPython($$renderer4);
              $$renderer4.push(`<!----> `);
              PythonErrors($$renderer4);
              $$renderer4.push(`<!---->`);
            } else {
              $$renderer4.push("<!--[!-->");
            }
            $$renderer4.push(`<!--]-->`);
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
