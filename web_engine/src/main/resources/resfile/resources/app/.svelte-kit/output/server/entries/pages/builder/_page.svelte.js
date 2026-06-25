import "../../../chunks/internal.js";
import { D as escape_html, E as attr, a as bind_props, b as setContext, et as snapshot, f as stringify, i as await_block, m as html, n as attr_style, o as derived, s as ensure_array_like, t as attr_class, v as getContext } from "../../../chunks/server.js";
import { A as IconButton, B as Icon, D as profiles, E as pending, F as CompactButton, H as openIn, I as PanelButton, J as projects, K as electron, L as ToggleButton, M as Dialog, P as Menu, R as Button, S as Component$1, T as Param, U as showDevTools, V as newWindow, W as showWindow, Y as python, _ as FlowLoop, a as PythonErrors, b as Routine$1, d as Version, f as browseFileOpen, h as parsePath, j as MessageDialog, k as SwitchButton, n as prefs, o as SetupPython, p as browseFileSave, q as git, t as Theme, u as setupPython, v as LoopInitiator, w as HasParams, x as StandaloneRoutine, y as LoopTerminator, z as Tooltip } from "../../../chunks/Theme.js";
import { C as Pane_resizer, D as Panel$3, E as Frame, S as Shortcuts, T as Pane_group, _ as Notebook, a as BugReport, b as Item, c as Notebook_1$1, d as NewProjectDlg, f as UserCtrl, g as Listbook, h as Page, i as Ribbon, l as ParamCtrl, m as ButtonTab, n as Gap, o as PrefsDialog, p as Dialog_1$1, r as Section$1, s as ParamsDialog, t as TipsDialog, u as ProjectCtrl, v as SubMenu, w as Pane, x as current, y as Separator } from "../../../chunks/TipsDialog.js";
import { t as Dialog_1$2 } from "../../../chunks/pluginManager.js";
import path from "path-browserify";
import { marked } from "marked";
//#region src/routes/builder/callbacks.svelte.js
function file_new() {
	newWindow("builder");
}
async function file_open() {
	let file = await browseFileOpen([{
		description: "PsychoPy Experiments",
		accept: { "application/xml": [".psyexp"] }
	}], current.experiment.file?.parent || "");
	if (file === void 0) return;
	await openFile(file);
}
async function openFile(file) {
	await current.experiment.fromFile(file);
	if (current.experiment.routines) current.routine = Object.values(current.experiment.routines)[0];
	else current.routine = void 0;
	for (let project of Object.values(projects)) if (project.id.endsWith(current.experiment.file.stem)) current.project = project;
	current.experiment.history.clear();
	let readme = await findReadme();
	if (readme) {
		current.readme.script.fromFile(readme);
		if (prefs.params["alwaysShowReadme"].val) current.readme.shown = true;
	}
	console.log(`Loaded experiment '${current.experiment.file.name}':`, current.experiment);
}
async function revealFolder() {
	if (electron && current.experiment.file) electron.files.showItemInFolder(current.experiment.file.file);
}
async function file_save() {
	if (current.experiment.file.file) {
		current.experiment.toFile(snapshot(current.experiment.file));
		current.experiment.history.clear();
	} else return file_save_as();
}
async function file_save_as() {
	let file = await browseFileSave([{
		description: "PsychoPy Experiments",
		accept: { "application/xml": [".psyexp"] }
	}], current.experiment.file?.file || "untitled.psyexp");
	if (!file || !file.file) return;
	current.experiment.file = file;
	await file_save();
	return current.experiment.file;
}
function close() {
	window.close();
}
function quit() {
	if (electron) electron.quit();
}
function undo() {
	current.experiment.history.undo();
	if (current.routine && current.routine.name in current.experiment.routines) current.routine = current.experiment.routines[current.routine.name];
}
function redo() {
	current.experiment.history.redo();
	if (current.routine && current.routine.name in current.experiment.routines) current.routine = current.experiment.routines[current.routine.name];
}
async function findReadme() {
	if (electron && current.experiment.file?.parent) {
		for (let sibling of await electron.files.scandir(current.experiment.file.parent)) if (["readme.md", "readme.txt"].includes(sibling.toLowerCase())) return parsePath(path.join(current.experiment.file.parent, sibling));
	}
}
async function showReadme() {
	let readme = await findReadme();
	if (readme) current.readme.script.fromFile(readme);
	else if (current.experiment.file?.parent) {
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
	if (!routine) routine = current.routine;
	current.clipboard.set(routine.toJSON());
}
async function pasteRoutine() {
	let clipboard = await current.clipboard.get();
	if (!clipboard) return;
	let element;
	if (clipboard.tag === "Routine") element = new Routine$1();
	else element = new HasParams(clipboard.tag);
	element.fromJSON(clipboard);
	if (![Routine$1, HasParams].some((cls) => element instanceof cls)) return;
	let name = current.experiment.resolveNameConflict(element.name);
	if (element instanceof Routine$1) element.settings.params["name"].val = name;
	else element.params["name"].val = name;
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
		if (current.experiment.file === void 0) return;
	}
	let target = await current.experiment.writeScript("PsychoPy");
	openIn(target, "coder");
	return target;
}
async function compileJS() {
	if (current.experiment.file === void 0) {
		await file_save_as();
		if (current.experiment.file === void 0) return;
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
	if (!python) return;
	await compileJS();
	if (current.experiment.pilotMode) await current.experiment.runJS(true);
	else await window.open(`https://run.pavlovia.org/${current.project.namespace?.path}/${current.project.path}`);
}
var shortcuts = {
	new: file_new,
	open: file_open,
	revealFolder,
	save: file_save,
	saveAs: file_save_as,
	close,
	quit,
	undo,
	redo,
	togglePiloting,
	sendToRunner,
	compilePython,
	runPython,
	stopPython,
	compileJS,
	runJS,
	showDevTools
};
//#endregion
//#region src/lib/dialogs/find/Dialog.svelte
function Dialog_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0, children = void 0 } = $$props;
		let useRegex = false;
		let caseSensitive = false;
		let searchTerm = "";
		let results = derived(() => current.experiment.search(searchTerm, useRegex, caseSensitive));
		let dialog = {
			shown: false,
			element: void 0
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				id: "find-in-experiment",
				title: "Find in experiment...",
				onopen: (evt) => searchTerm = "",
				buttons: { OK: (evt) => {} },
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="container svelte-dvaapd"><div class="find-ctrls svelte-dvaapd"><input type="text" placeholder="Search..." class="search-bar svelte-dvaapd"${attr("value", searchTerm)}/> `);
					ToggleButton($$renderer, {
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
					$$renderer.push(`<!----> `);
					ToggleButton($$renderer, {
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
					$$renderer.push(`<!----></div> <div class="results-list svelte-dvaapd"><!--[-->`);
					const each_array = ensure_array_like(results());
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let result = each_array[$$index];
						$$renderer.push(`<div class="result-item svelte-dvaapd"><div class="item-breadcrumbs svelte-dvaapd">`);
						if (result.breadcrumbs.loop) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<button class="breadcrumb svelte-dvaapd">${escape_html(result.breadcrumbs.loop.name)}</button>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (result.breadcrumbs.routine) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<button class="breadcrumb svelte-dvaapd">${escape_html(result.breadcrumbs.routine.name)}</button>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (result.breadcrumbs.component) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`> <button class="breadcrumb svelte-dvaapd">${escape_html(["RoutineSettingsComponent", "SettingsComponent"].includes(result.breadcrumbs.component.tag) ? "settings" : result.breadcrumbs.component.name)}</button>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (result.breadcrumbs.param) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`> ${escape_html(result.breadcrumbs.param.name)}`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div> <div class="item-content svelte-dvaapd">${escape_html(result.text.before)}<b class="svelte-dvaapd">${escape_html(result.text.text)}</b>${escape_html(result.text.after)}</div></div>`);
					}
					$$renderer.push(`<!--]--></div></div> `);
					children?.($$renderer);
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			if (dialog.element) {
				$$renderer.push("<!--[0-->");
				ParamsDialog($$renderer, {
					element: dialog.element,
					onclose: () => dialog.element = void 0,
					get shown() {
						return dialog.shown;
					},
					set shown($$value) {
						dialog.shown = $$value;
						$$settled = false;
					}
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { shown });
	});
}
//#endregion
//#region src/routes/builder/ribbon/Menu.svelte
function Menu_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
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
		function $$render_inner($$renderer) {
			Menu($$renderer, {
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					SubMenu($$renderer, {
						label: "File",
						icon: "/icons/rbn-file.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								icon: "/icons/btn-new.svg",
								label: "New file",
								shortcut: "new",
								onclick: file_new
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-open.svg",
								label: "Open file",
								shortcut: "open",
								onclick: file_open
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-save.svg",
								label: "Save file",
								shortcut: "save",
								onclick: file_save,
								disabled: !current.experiment.history.past.length
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-saveas.svg",
								label: "Save file as",
								shortcut: "saveAs",
								onclick: file_save_as
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Reveal in file explorer",
								onclick: revealFolder,
								shortcut: "revealFolder",
								disabled: current.experiment.file?.parent === void 0
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Close window",
								onclick: close,
								shortcut: "close"
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-settings.svg",
								label: "Preferences",
								onclick: (evt) => {
									show.prefsDlg = true;
								}
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Reset preferences",
								onclick: (evt) => prefs.reset()
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: "Edit",
						icon: "/icons/rbn-edit.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: "Undo",
								icon: "/icons/btn-undo.svg",
								disabled: current.experiment.file === null || !current.experiment.history.past.length,
								onclick: undo,
								shortcut: "undo"
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Redo",
								icon: "/icons/btn-redo.svg",
								onclick: redo,
								disabled: current.experiment.file === null || !current.experiment.history.future.length,
								shortcut: "redo"
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Find in experiment",
								icon: "/icons/btn-find.svg",
								onclick: (evt) => show.findDlg = true,
								shortcut: "find"
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: "View",
						icon: "/icons/rbn-windows.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: "Show Coder",
								onclick: (evt) => showWindow("coder")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Show Runner",
								onclick: (evt) => showWindow("runner")
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Show developer tools",
								onclick: showDevTools,
								shortcut: "showDevTools"
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: "Experiment",
						icon: "/icons/rbn-experiment.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: "Experiment settings",
								icon: "/icons/btn-settings.svg",
								onclick: (evt) => show.settingsDlg = true
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Show readme",
								icon: "/icons/btn-new.svg",
								onclick: (evt) => showReadme()
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Copy current Routine",
								icon: "/icons/btn-copy.svg",
								onclick: (evt) => copyRoutine()
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Paste Routine",
								icon: "/icons/btn-paste.svg",
								onclick: (evt) => pasteRoutine()
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (electron) {
						$$renderer.push("<!--[0-->");
						SubMenu($$renderer, {
							label: "Run",
							icon: "/icons/btn-runpy.svg",
							children: ($$renderer) => {
								Item($$renderer, {
									label: "Toggle pilot mode",
									onclick: togglePiloting,
									shortcut: "togglePilot"
								});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: "Send to Runner",
									icon: `/icons/btn-send${current.experiment.pilotMode ? "pilot" : "run"}.svg`,
									onclick: sendToRunner,
									shortcut: "sendToRunner",
									disabled: !current.experiment.file
								});
								$$renderer.push(`<!----> `);
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: "Compile Python",
									icon: "/icons/btn-compilepy.svg",
									onclick: (evt) => compilePython(),
									shortcut: "compilePython",
									disabled: current.experiment === null
								});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: `${current.experiment.pilotMode ? "Pilot" : "Run"} in Python`,
									icon: `/icons/btn-${current.experiment.pilotMode ? "pilot" : "run"}py.svg`,
									onclick: (evt) => runPython(),
									shortcut: "runPython",
									disabled: current.experiment === null
								});
								$$renderer.push(`<!----> `);
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: "Compile JS",
									icon: "/icons/btn-compilejs.svg",
									onclick: (evt) => compileJS(),
									shortcut: "compileJS",
									disabled: current.experiment === null
								});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: `${current.experiment.pilotMode ? "Pilot" : "Run"} in browser`,
									icon: `/icons/btn-${current.experiment.pilotMode ? "pilot" : "run"}js.svg`,
									onclick: (evt) => runJS(),
									shortcut: "runJS",
									disabled: current.experiment === null
								});
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					SubMenu($$renderer, {
						label: "Tools",
						icon: "/icons/btn-hamburger.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: "Open device manager",
								icon: "/icons/btn-devices.svg",
								onclick: (evt) => show.deviceMgrDlg = true
							});
							$$renderer.push(`<!----> `);
							if (python?.ready) {
								$$renderer.push("<!--[0-->");
								Item($$renderer, {
									label: "Manage plugins and packages",
									icon: "/icons/btn-plugin.svg",
									onclick: (evt) => show.pluginMgr = true,
									disabled: !python?.ready
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (electron) {
								$$renderer.push("<!--[0-->");
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: "Open PsychoPy user folder",
									onclick: (evt) => electron.paths.user().then((folder) => electron.files.openPath(folder))
								});
								$$renderer.push(`<!---->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (python) {
								$$renderer.push("<!--[0-->");
								Item($$renderer, {
									label: "Reinstall Python",
									onclick: (evt) => setupPython("app", true)
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: "Help",
						children: ($$renderer) => {
							Item($$renderer, {
								label: "PsychoPy Homepage",
								onclick: (evt) => open("https://www.psychopy.org/")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Documentation",
								onclick: (evt) => open("https://www.psychopy.org/documentation")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Help Forum",
								onclick: (evt) => open("https://discourse.psychopy.org/")
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							if (electron) {
								$$renderer.push("<!--[0-->");
								await_block($$renderer, electron.version(), () => {}, (version) => {
									Item($$renderer, {
										label: `PsychoPy ${stringify(version)}`,
										disabled: true
									});
								});
								$$renderer.push(`<!--]-->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (electron) {
						$$renderer.push("<!--[0-->");
						await_block($$renderer, electron.version(), () => {}, (version) => {
							if (version === "dev" || Version.parse(version).extra) {
								$$renderer.push("<!--[0-->");
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: "Report bug",
									onclick: (evt) => show.bugReport = true
								});
								$$renderer.push(`<!---->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`<!--]--> `);
						Separator($$renderer, {});
						$$renderer.push(`<!----> `);
						Item($$renderer, {
							label: "Quit",
							onclick: quit,
							shortcut: "quit"
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			PrefsDialog($$renderer, {
				get shown() {
					return show.prefsDlg;
				},
				set shown($$value) {
					show.prefsDlg = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			Dialog_1($$renderer, {
				get shown() {
					return show.findDlg;
				},
				set shown($$value) {
					show.findDlg = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			ParamsDialog($$renderer, {
				element: current.experiment.settings,
				get shown() {
					return show.settingsDlg;
				},
				set shown($$value) {
					show.settingsDlg = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			Dialog_1$1($$renderer, {
				get shown() {
					return show.deviceMgrDlg;
				},
				set shown($$value) {
					show.deviceMgrDlg = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			if (python) {
				$$renderer.push("<!--[0-->");
				Dialog_1$2($$renderer, {
					get shown() {
						return show.pluginMgr;
					},
					set shown($$value) {
						show.pluginMgr = $$value;
						$$settled = false;
					}
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (electron) {
				$$renderer.push("<!--[0-->");
				BugReport($$renderer, {
					user: current.user,
					context: current.experiment,
					get shown() {
						return show.bugReport;
					},
					set shown($$value) {
						show.bugReport = $$value;
						$$settled = false;
					}
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { shown });
	});
}
//#endregion
//#region src/routes/builder/ribbon/SavePrompt.svelte
function SavePrompt($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { action = (evt) => {}, shown = void 0 } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (current.experiment.history.past.length) {
				$$renderer.push("<!--[0-->");
				MessageDialog($$renderer, {
					id: "save-prompt",
					buttons: {
						YES: (evt) => {
							file_save();
							action(evt);
						},
						NO: (evt) => {
							action(evt);
						},
						CANCEL: (evt) => {}
					},
					get shown() {
						return shown;
					},
					set shown($$value) {
						shown = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						$$renderer.push(`<!---->'${escape_html(current.experiment.file.name)}' has unsaved changes, save now?`);
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { shown });
	});
}
//#endregion
//#region src/lib/dialogs/monitorCenter/configuration.svelte.js
var MonitorConfiguration$1 = class {
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
var CalibrationSetup = class {
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
			val: .3,
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
			args: ["psychopy.experiment.monitor:BasePhotometerDeviceBackend.__subclasses__"]
		}).then(async (resp) => {
			let temp = {
				allowedVals: [],
				allowedLabels: []
			};
			for (let cls of resp) {
				await python.liaison.send("app", {
					command: "get",
					args: [cls.match(/python\:\/\/\/(.*)/)[1] + ".deviceClass"]
				}, 5e3).then((resp) => temp.allowedVals.push(resp));
				await python.liaison.send("app", {
					command: "get",
					args: [cls.match(/python\:\/\/\/(.*)/)[1] + ".backendLabel"]
				}, 5e3).then((resp) => temp.allowedLabels.push(resp));
			}
			Object.assign(this.params.photometer, temp);
			this.params.photometer.val = temp.allowedVals[0];
		});
	}
};
//#endregion
//#region src/lib/dialogs/monitorCenter/CalibrationSetupDlg.svelte
function CalibrationSetupDlg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, shown = void 0 } = $$props;
		async function calibrate() {
			await python.liaison.send("app", {
				command: "init",
				args: ["calibrationWin", "psychopy.visual.window:Window"],
				kwargs: {
					screen: parseInt(config.params["screen"].val),
					checkTiming: false,
					fullscr: true
				}
			}, 1e4);
			let photometerName;
			await python.liaison.send("app", {
				command: "run",
				args: ["psychopy.hardware.manager:DeviceManager.getAvailableDevices", snapshot(config.params.photometer.val)]
			}).then((profiles) => {
				photometerName = profiles[0].deviceName;
				return python.liaison.send("app", {
					command: "run",
					kwargs: profiles[0]
				});
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
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				title: "Monitor calibration setup",
				buttons: {
					OK: calibrate,
					CANCEL: reset
				},
				shrink: true,
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="calibration-config svelte-1lrl97n">`);
					await_block($$renderer, config.ready, () => {
						$$renderer.push(`Getting photodiode classes...`);
					}, () => {
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(Object.keys(config.params));
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let key = each_array[$$index];
							ParamCtrl($$renderer, {
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
						$$renderer.push(`<!--]-->`);
					});
					$$renderer.push(`<!--]--></div>`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			param,
			shown
		});
	});
}
//#endregion
//#region src/lib/dialogs/monitorCenter/MonitorConfiguration.svelte
function MonitorConfiguration($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { calib = void 0 } = $$props;
		let show = { calibSetup: false };
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="monitor-config svelte-1tmlm5l"><!--[-->`);
			const each_array = ensure_array_like(Object.keys(calib.params));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let key = each_array[$$index];
				ParamCtrl($$renderer, {
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
			$$renderer.push(`<!--]--> <div class="calibrate-btn svelte-1tmlm5l">`);
			Button($$renderer, {
				label: "Calibrate",
				icon: "/icons/btn-runpy.svg",
				onclick: (evt) => show.calibSetup = true,
				horizontal: true
			});
			$$renderer.push(`<!----> `);
			CalibrationSetupDlg($$renderer, {
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
			$$renderer.push(`<!----></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { calib });
	});
}
//#endregion
//#region src/lib/dialogs/monitorCenter/MonitorCenterDlg.svelte
function MonitorCenterDlg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0 } = $$props;
		let monitors = {
			all: {},
			selection: {
				monitor: void 0,
				calibration: void 0
			},
			promise: Promise.resolve([]),
			save: () => {
				for (let [name, monitor] of Object.entries(monitors.all)) python.liaison.send("app", {
					command: "init",
					args: [
						`monitor_${name}`,
						"psychopy.monitors.calibTools:Monitor",
						name
					]
				}, 1e5).then((resp) => python.liaison.send("app", {
					command: "run",
					args: [`monitor_${name}.fromJSON`, {
						name: monitor.name,
						calibrations: Object.fromEntries(Object.entries(monitor.calibrations).map(([name, calib]) => [name, calib.toJSON()]))
					}]
				}, 1e5)).then((resp) => python.liaison.send("app", {
					command: "run",
					args: [`monitor_${name}.save`]
				}, 1e5));
			},
			refresh: () => {
				monitors.all = {};
				monitors.promise = python.liaison.send("app", {
					command: "run",
					args: ["psychopy.monitors.calibTools:getAllMonitors"]
				}, 1e5).then((monitorNames) => {
					for (let name of monitorNames) python.liaison.send("app", {
						command: "run",
						args: ["psychopy.monitors.calibTools:Monitor", name]
					}, 1e5).then((details) => {
						for (let [calibName, calib] of Object.entries(details.calibrations || {})) {
							details.calibrations[calibName] = new MonitorConfiguration$1(name, calibName, calib.calibDate);
							details.calibrations[calibName].fromJSON(calib);
						}
						monitors.all[name] = details;
					});
				});
			}
		};
		monitors.refresh();
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
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
				children: ($$renderer) => {
					$$renderer.push(`<div class="content svelte-g77dd">`);
					Notebook($$renderer, {
						children: ($$renderer) => {
							await_block($$renderer, monitors.promise, () => {
								$$renderer.push(`Loading monitors...`);
							}, () => {
								$$renderer.push(`<!--[-->`);
								const each_array = ensure_array_like(Object.entries(monitors.all));
								for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
									let [name, details] = each_array[$$index_1];
									var bind_get = () => monitors.selection.monitor === name;
									var bind_set = (evt) => monitors.selection.monitor = name;
									Page($$renderer, {
										label: name,
										get selected() {
											return bind_get();
										},
										set selected($$value) {
											bind_set($$value);
										},
										children: ($$renderer) => {
											Listbook($$renderer, {
												children: ($$renderer) => {
													$$renderer.push(`<!--[-->`);
													const each_array_1 = ensure_array_like(Object.entries(details.calibrations || {}));
													for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
														let [calibName, calib] = each_array_1[$$index];
														var bind_get_1 = () => monitors.selection.calibration === calibName;
														var bind_set_1 = (evt) => monitors.selection.calibration = calibName;
														Page($$renderer, {
															label: calibName,
															get selected() {
																return bind_get_1();
															},
															set selected($$value) {
																bind_set_1($$value);
															},
															children: ($$renderer) => {
																if (monitors.all[name]?.calibrations[calibName]) {
																	$$renderer.push("<!--[0-->");
																	MonitorConfiguration($$renderer, {
																		get calib() {
																			return monitors.all[name].calibrations[calibName];
																		},
																		set calib($$value) {
																			monitors.all[name].calibrations[calibName] = $$value;
																			$$settled = false;
																		}
																	});
																} else $$renderer.push("<!--[-1-->");
																$$renderer.push(`<!--]-->`);
															},
															$$slots: { default: true }
														});
													}
													$$renderer.push(`<!--]-->`);
												},
												$$slots: { default: true }
											});
										},
										$$slots: { default: true }
									});
								}
								$$renderer.push(`<!--]-->`);
							});
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----></div>`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { shown });
	});
}
//#endregion
//#region src/lib/pavlovia/CommitDlg.svelte
function CommitDlg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0, awaiting = void 0 } = $$props;
		let current = getContext("current");
		let message = "";
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				title: "Commit changes",
				buttons: {
					OK: (evt) => git.commit(snapshot(message), current.experiment.file.parent, snapshot(current.user)).then((resp) => awaiting.resolve(resp)),
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
				children: ($$renderer) => {
					$$renderer.push(`<div class="content svelte-1byz79g">Briefly describe the changes made since last sync. <input${attr("value", message)}/></div>`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			shown,
			awaiting
		});
	});
}
//#endregion
//#region src/lib/pavlovia/Sync.svelte
function Sync($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { button } = $$props;
		async function sync(folder, user, force = false) {
			if (current.experiment?.settings?.params?.["exportHTML"].val === "on Sync") await current.experiment.writeScript("PsychoJS");
			let remote = await git.getRemote(folder, user);
			if (remote === null) {
				show.newProject = true;
				if (await awaiting.newProject.promise) remote = await git.getRemote(folder, user);
				else {
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
		let show = {
			newProject: false,
			commit: false
		};
		let awaiting = {
			newProject: Promise.withResolvers(),
			commit: Promise.withResolvers()
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			button($$renderer, sync);
			$$renderer.push(`<!----> `);
			NewProjectDlg($$renderer, {
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
			$$renderer.push(`<!----> `);
			CommitDlg($$renderer, {
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
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { sync });
	});
}
//#endregion
//#region src/routes/builder/ribbon/Ribbon.svelte
function Ribbon_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
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
		let lastAction = derived(() => {
			if (current.experiment.history.past.length) return ` "${current.experiment.history.past.at(-1).msg}"`;
		});
		let nextAction = derived(() => {
			if (current.experiment.history.future.length) return ` "${current.experiment.history.future[0].msg}"`;
		});
		let prompts = {
			NEW: false,
			OPEN: false,
			PYCOMPILE: false,
			PYRUN: false
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Ribbon($$renderer, {
				children: ($$renderer) => {
					Section$1($$renderer, {
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-hamburger.svg",
								label: "Menu",
								onclick: () => show.menu = true,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							Menu_1($$renderer, {
								get shown() {
									return show.menu;
								},
								set shown($$value) {
									show.menu = $$value;
									$$settled = false;
								}
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Section$1($$renderer, {
						label: "File",
						icon: "/icons/rbn-file.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-new.svg",
								label: "New file",
								onclick: (evt) => prompts.NEW = true,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							SavePrompt($$renderer, {
								action: file_new,
								get shown() {
									return prompts.NEW;
								},
								set shown($$value) {
									prompts.NEW = $$value;
									$$settled = false;
								}
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-open.svg",
								label: "Open file",
								onclick: (evt) => prompts.OPEN = true,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							SavePrompt($$renderer, {
								action: file_open,
								get shown() {
									return prompts.OPEN;
								},
								set shown($$value) {
									prompts.OPEN = $$value;
									$$settled = false;
								}
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-save.svg",
								label: "Save file",
								onclick: file_save,
								disabled: !current.experiment.history.past.length && current.experiment.file.file,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-saveas.svg",
								label: "Save file as",
								onclick: file_save_as,
								borderless: true
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Section$1($$renderer, {
						label: "Edit",
						icon: "/icons/rbn-edit.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-undo.svg",
								label: `Undo${stringify(lastAction())}`,
								onclick: undo,
								disabled: !current.experiment.file.file || !current.experiment.history.past.length,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-redo.svg",
								label: `Redo ${stringify(nextAction())}`,
								onclick: redo,
								disabled: !current.experiment.file.file || !current.experiment.history.future.length,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-find.svg",
								label: "Find",
								onclick: () => show.findDlg = true,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							Dialog_1($$renderer, {
								get shown() {
									return show.findDlg;
								},
								set shown($$value) {
									show.findDlg = $$value;
									$$settled = false;
								}
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Section$1($$renderer, {
						label: "Experiment",
						icon: "/icons/rbn-experiment.svg",
						children: ($$renderer) => {
							var bind_get = () => current.experiment.pilotMode;
							var bind_set = (value) => {
								current.experiment.history.update(`toggle pilot mode`);
								current.experiment.settings.params["runMode"].val = value;
							};
							if (python?.ready) {
								$$renderer.push("<!--[0-->");
								IconButton($$renderer, {
									icon: "/icons/btn-monitors.svg",
									label: "Open the monitor center",
									onclick: (evt) => show.monitorCenterDlg = true,
									borderless: true
								});
								$$renderer.push(`<!----> `);
								MonitorCenterDlg($$renderer, {
									get shown() {
										return show.monitorCenterDlg;
									},
									set shown($$value) {
										show.monitorCenterDlg = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!----> `);
								IconButton($$renderer, {
									icon: "/icons/btn-devices.svg",
									label: "Open the device manager",
									onclick: (evt) => show.deviceMgrDlg = true,
									borderless: true
								});
								$$renderer.push(`<!----> `);
								Dialog_1$1($$renderer, {
									get shown() {
										return show.deviceMgrDlg;
									},
									set shown($$value) {
										show.deviceMgrDlg = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!---->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							IconButton($$renderer, {
								icon: "/icons/btn-settings.svg",
								label: "Experiment settings",
								onclick: (evt) => show.settingsDlg = true,
								disabled: current.experiment === null,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							if (current.experiment !== null) {
								$$renderer.push("<!--[0-->");
								ParamsDialog($$renderer, {
									element: current.experiment.settings,
									get shown() {
										return show.settingsDlg;
									},
									set shown($$value) {
										show.settingsDlg = $$value;
										$$settled = false;
									}
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							SwitchButton($$renderer, {
								labels: ["Pilot", "Run"],
								tooltip: `Experiment will run in ${current.experiment.pilotMode ? "pilot" : "run"} mode`,
								get value() {
									return bind_get();
								},
								set value($$value) {
									bind_set($$value);
								},
								disabled: current.experiment === null
							});
							$$renderer.push(`<!----> `);
							if (python?.ready) {
								$$renderer.push("<!--[0-->");
								IconButton($$renderer, {
									icon: `/icons/btn-send${current.experiment.pilotMode ? "pilot" : "run"}.svg`,
									label: "Send experiment to runner",
									onclick: sendToRunner,
									disabled: !current.experiment.file.file,
									borderless: true
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (python?.ready) {
						$$renderer.push("<!--[0-->");
						Section$1($$renderer, {
							label: "Desktop",
							icon: "/icons/rbn-desktop.svg",
							children: ($$renderer) => {
								IconButton($$renderer, {
									icon: "/icons/btn-compilepy.svg",
									label: "Write experiment as a .py file",
									onclick: (evt) => compilePython(),
									disabled: !current.experiment.file.file,
									borderless: true,
									get awaiting() {
										return awaiting.compilepy;
									},
									set awaiting($$value) {
										awaiting.compilepy = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!----> `);
								IconButton($$renderer, {
									icon: `/icons/btn-${current.experiment.pilotMode ? "pilot" : "run"}py.svg`,
									label: `${current.experiment.pilotMode ? "Pilot" : "Run"} experiment locally`,
									onclick: (evt) => runPython(),
									disabled: !current.experiment.file.file,
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
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						Section$1($$renderer, {
							label: "Browser",
							icon: "/icons/rbn-browser.svg",
							children: ($$renderer) => {
								IconButton($$renderer, {
									icon: "/icons/btn-compilejs.svg",
									label: "Write experiment as a .js file",
									onclick: (evt) => compileJS(),
									disabled: !current.experiment.file.file,
									borderless: true,
									get awaiting() {
										return awaiting.compilejs;
									},
									set awaiting($$value) {
										awaiting.compilejs = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!----> `);
								IconButton($$renderer, {
									icon: `/icons/btn-${current.experiment.pilotMode ? "pilot" : "run"}js.svg`,
									label: `${current.experiment.pilotMode ? "Pilot" : "Run"} experiment in browser`,
									onclick: (evt) => runJS(),
									disabled: !current.experiment.file.file || !current.experiment.pilotMode && !current.project,
									borderless: true,
									get awaiting() {
										return awaiting.runjs;
									},
									set awaiting($$value) {
										awaiting.runjs = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					Section$1($$renderer, {
						label: "Pavlovia",
						icon: "/icons/rbn-pavlovia.svg",
						children: ($$renderer) => {
							{
								function button($$renderer, sync) {
									IconButton($$renderer, {
										icon: "/icons/btn-sync.svg",
										label: "Sync experiment",
										onclick: (evt) => sync(snapshot(current.experiment.file.parent), snapshot(current.user), true),
										disabled: !current.user || !current.experiment.file.file,
										borderless: true
									});
								}
								Sync($$renderer, {
									button,
									$$slots: { button: true }
								});
							}
							$$renderer.push(`<!----> `);
							UserCtrl($$renderer, {});
							$$renderer.push(`<!----> `);
							ProjectCtrl($$renderer, {});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Gap($$renderer, {});
					$$renderer.push(`<!----> `);
					Section$1($$renderer, {
						label: "Views",
						icon: "/icons/rbn-windows.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-builder.svg",
								label: "Builder view",
								onclick: (evt) => showWindow("builder"),
								borderless: true,
								disabled: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-coder.svg",
								label: "Coder view",
								onclick: (evt) => showWindow("coder"),
								borderless: true
							});
							$$renderer.push(`<!----> `);
							if (electron) {
								$$renderer.push("<!--[0-->");
								IconButton($$renderer, {
									icon: "/icons/btn-runner.svg",
									label: "Runner view",
									onclick: (evt) => showWindow("runner"),
									borderless: true
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/routines/EntryPoint.svelte
function EntryPoint$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { routine, index } = $$props;
		let hovered = false;
		let moving = derived(() => current.moving && [Component$1].includes(current.moving.constructor));
		let inserting = derived(() => current.inserting && [Component$1].includes(current.inserting.constructor));
		$$renderer.push(`<div${attr_class("entry-point svelte-1g614kq", void 0, {
			"active": moving() || inserting(),
			"hovered": hovered
		})}${attr_style("", { "grid-row-start": index >= 0 ? index + 3 : routine.components.length + 3 })}>`);
		Icon($$renderer, {
			src: `/icons/sym-arrow-right.svg`,
			size: "1rem"
		});
		$$renderer.push(`<!----> <button class="hitbox svelte-1g614kq" aria-label="Entry point"${attr("tabindex", moving() || inserting() ? 0 : -1)}></button></div>`);
	});
}
//#endregion
//#region src/routes/builder/routines/StaticPeriod.svelte
function StaticPeriod($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { component, hovered = void 0 } = $$props;
		$$renderer.push(`<div class="static-period-container svelte-yq6e5r"><div class="static-period svelte-yq6e5r" role="none"${attr_style("", {
			left: `${stringify(component.visualStart === null ? 0 : component.visualStart * 100 / component.routine.visualStop)}%`,
			right: `${stringify(component.visualStop === null || component.routine.visualStop && component.visualStop > component.routine.visualStop ? 0 : (component.routine.visualStop - component.visualStop) * 100 / component.routine.visualStop)}%`,
			opacity: hovered ? "0.5" : "0.25"
		})}></div></div>`);
		bind_props($$props, { hovered });
	});
}
//#endregion
//#region src/routes/builder/routines/Component.svelte
function Component($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { component } = $$props;
		let hovered = false;
		let showContextMenu = false;
		let contextMenuPos = {
			x: void 0,
			y: void 0
		};
		let showDialog = false;
		function abbreviateLongName(name) {
			if (name.length > 20) return `${name.slice(0, 20)}...`;
			return name;
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			EntryPoint$1($$renderer, {
				routine: component.routine,
				index: component.index
			});
			$$renderer.push(`<!----> <label class="comp-name svelte-1nb68qp"${attr("for", component.params["name"].val)}${attr_style(`opacity: ${stringify(component.disabled ? .3 : 1)}`, {
				border: hovered ? "1px solid var(--overlay)" : `1px solid var(--base)`,
				"grid-row-start": component.index + 3
			})} draggable="true" role="none">${escape_html(prefs.params["abbreviateLongCompNames"].val ? abbreviateLongName(component.name) : component.name)} `);
			Icon($$renderer, { src: component.iconSVG });
			$$renderer.push(`<!----></label> <div class="comp-overshoot-timeline svelte-1nb68qp"${attr_style("", {
				"grid-column-start": "undershoot",
				"grid-row-start": component.index + 3
			})}>`);
			if (component.visualStart === null) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="comp-overshoot-bar svelte-1nb68qp" role="none"${attr_style("", { background: `linear-gradient(-90deg, var(--${stringify(component.visualColor)}), var(--base));` })}></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="comp-timeline svelte-1nb68qp"${attr("id", component.params["name"].val)}${attr("draggable", true)} role="none"${attr_style("", {
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
				$$renderer.push(`<div class="comp-timeline-tick svelte-1nb68qp"${attr_style(`flex-basis: ${stringify(tick.proportion)}`)}></div>`);
			}
			$$renderer.push(`<!--]--> <div class="comp-timeline-tick svelte-1nb68qp" id="timeline-label-remainder"${attr_style("", {
				"border-left": component.routine.settings.visualStop ? ".5rem solid var(--orange)" : "1px solid var(--overlay)",
				"z-index": component.routine.settings.visualStop ? 2 : 0
			})}></div></div> `);
			if (component.tag === "StaticComponent") {
				$$renderer.push("<!--[0-->");
				StaticPeriod($$renderer, {
					component,
					get hovered() {
						return hovered;
					},
					set hovered($$value) {
						hovered = $$value;
						$$settled = false;
					}
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="comp-overshoot-timeline svelte-1nb68qp"${attr_style("", {
				"grid-column-start": "overshoot",
				"grid-row-start": component.index + 3
			})}>`);
			if (component.visualStop === null || component.routine.visualStop && component.visualStop > component.routine.visualStop) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="comp-overshoot-bar svelte-1nb68qp" role="none"${attr_style("", { background: `linear-gradient(90deg, var(--${stringify(component.routine.settings.visualStop ? "overlay" : component.visualColor)}), var(--base))` })}></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			Menu($$renderer, {
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
				children: ($$renderer) => {
					Item($$renderer, {
						icon: "/icons/btn-edit.svg",
						label: "Edit Component",
						onclick: (evt) => showDialog = true
					});
					$$renderer.push(`<!----> `);
					Item($$renderer, {
						icon: `/icons/sym-dot-${component.disabled ? "blue" : "light"}.svg`,
						label: `${component.disabled ? "Enable" : "Disable"} Component`,
						onclick: (evt) => {
							current.experiment.history.update(`${component.disabled ? "enable" : "disable"} ${component.name}`);
							component.params.disabled.val = !component.disabled;
						}
					});
					$$renderer.push(`<!----> `);
					Item($$renderer, {
						icon: "/icons/btn-delete.svg",
						label: "Delete Component",
						onclick: (evt) => {
							current.experiment.history.update(`remove ${component.name}`);
							component.routine.removeComponent(component);
						}
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			ParamsDialog($$renderer, {
				element: component,
				get shown() {
					return showDialog;
				},
				set shown($$value) {
					showDialog = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/routines/Timeline.svelte
function Timeline($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { routine } = $$props;
		$$renderer.push(`<div class="comp-name"></div> <div class="comp-overshoot-timeline svelte-4egudf"></div> <div class="comp-timeline svelte-4egudf"${attr_style(`grid-template-columns: repeat(${stringify(routine.visualTicks ? routine.visualTicks.labels.length : 0)}, 1fr) ${stringify(routine.visualTicks.remainder)}fr;`)}><!--[-->`);
		const each_array = ensure_array_like(routine.visualTicks.labels);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let tick = each_array[$$index];
			$$renderer.push(`<div class="comp-timeline-tick svelte-4egudf"${attr("id", `timeline-label-${stringify(tick.label)}`)}><label for="timeline-labels"${attr_class("svelte-4egudf", void 0, { "force-ended": routine.settings.visualStop })}>${escape_html(tick.label)}s</label></div>`);
		}
		$$renderer.push(`<!--]--> <div class="comp-timeline-tick svelte-4egudf" id="timeline-label-remainder"${attr_style("", { "border-left": routine.settings.visualStop ? ".5rem solid var(--orange)" : "1px solid var(--overlay)" })}></div></div> <div class="comp-overshoot-timeline svelte-4egudf"></div>`);
	});
}
//#endregion
//#region src/routes/builder/routines/Canvas.svelte
function Canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { routine = void 0 } = $$props;
		let showDialog = false;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="routine-canvas svelte-1jnlv78"${attr_style("", { "grid-template-rows": `min-content [timeline-top] min-content repeat(${stringify(routine.components.length)}, min-content) [timeline-bottom] min-content` })}><div class="button-container svelte-1jnlv78">`);
			Button($$renderer, {
				label: "Routine settings",
				icon: "/icons/btn-settings.svg",
				tooltip: "Edit settings for this Routine",
				onclick: () => showDialog = true,
				horizontal: true
			});
			$$renderer.push(`<!----></div> `);
			ParamsDialog($$renderer, {
				element: routine.settings,
				get shown() {
					return showDialog;
				},
				set shown($$value) {
					showDialog = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			if (routine.components) {
				$$renderer.push("<!--[0-->");
				Timeline($$renderer, { routine });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <!--[-->`);
			const each_array = ensure_array_like(routine.components);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let component = each_array[$$index];
				Component($$renderer, { component });
			}
			$$renderer.push(`<!--]--> `);
			EntryPoint$1($$renderer, {
				routine,
				index: "-1"
			});
			$$renderer.push(`<!----></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/routines/Standalone.svelte
function Standalone($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { component } = $$props;
		let valid = derived(() => Object.values(component.params).every((param) => param.valid.value));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="standalone-routine-canvas svelte-1ly2nn7">`);
			Notebook_1$1($$renderer, {
				get element() {
					return component;
				},
				set element($$value) {
					component = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> <div class="standalone-routine-ctrls svelte-1ly2nn7"><div class="ctrl-gap svelte-1ly2nn7"></div> `);
			Button($$renderer, {
				label: "Apply",
				primary: true,
				horizontal: true,
				disabled: !valid(),
				onclick: (evt) => component.restore.set()
			});
			$$renderer.push(`<!----> `);
			Button($$renderer, {
				label: "Discard",
				horizontal: true,
				onclick: (evt) => component.restore.apply()
			});
			$$renderer.push(`<!----></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/routines/Notebook.svelte
function Notebook_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let showNewRoutineDialog = false;
		let valid = {};
		let btnsDisabled = derived(() => ({
			OK: Object.values(valid).some((val) => !val.state),
			APPLY: Object.values(valid).some((val) => !val.state)
		}));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Notebook($$renderer, {
				children: ($$renderer) => {
					if (current.experiment !== null) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(Object.entries(current.experiment.routines));
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let [name, routine] = each_array[$$index];
							var bind_get = () => {
								return current.routine === routine;
							};
							var bind_set = (value) => {
								current.routine = routine;
							};
							var bind_get_1 = () => routine.name;
							var bind_set_1 = (value) => routine.settings.params["name"].val = value;
							Page($$renderer, {
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
									current.experiment.history.update();
									delete current.experiment.routines[name];
								},
								closeTooltip: `Delete ${stringify(name)}`,
								data: routine,
								children: ($$renderer) => {
									if (routine instanceof Routine$1) {
										$$renderer.push("<!--[0-->");
										Canvas($$renderer, { routine });
									} else if (current.experiment.routines[name] instanceof StandaloneRoutine) {
										$$renderer.push("<!--[1-->");
										Standalone($$renderer, { component: routine });
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
						}
						$$renderer.push(`<!--]-->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					ButtonTab($$renderer, {
						callback: (evt) => {
							current.inserting = new Routine$1();
							showNewRoutineDialog = true;
						},
						tooltip: "New Routine..."
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			if (current.inserting instanceof Routine$1) {
				$$renderer.push("<!--[0-->");
				Dialog($$renderer, {
					id: "new-routine",
					title: "New Routine",
					onopen: () => current.inserting.settings.restore.set(),
					buttons: {
						OK: (evt) => {
							current.inserting.exp = current.experiment;
							current.experiment.routines[current.inserting.name] = current.inserting;
						},
						CANCEL: (evt) => {
							current.inserting.settings.restore.apply();
							current.inserting = void 0;
						},
						HELP: "https://www.psychopy.org/builder/routines.html#routines"
					},
					buttonsDisabled: btnsDisabled(),
					get shown() {
						return showNewRoutineDialog;
					},
					set shown($$value) {
						showNewRoutineDialog = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						Notebook_1$1($$renderer, {
							element: current.inserting.settings,
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
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/components/ComponentButton.svelte
function ComponentButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
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
		let valid = derived(() => Object.values(dlgComponent.params).every((param) => param.valid?.value));
		let btnsDisabled = derived(() => ({
			OK: !valid(),
			APPLY: !valid()
		}));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (!component.hidden) {
				$$renderer.push("<!--[0-->");
				Button($$renderer, {
					label: titleCase(component["__name__"]),
					icon: component.iconSVG,
					vertical: true,
					disabled: !(current.routine instanceof Routine$1),
					onclick: newComponent
				});
				$$renderer.push(`<!----> `);
				Dialog($$renderer, {
					id: "new-component",
					title: `New ${stringify(titleCase(component["__name__"]))}`,
					onopen: () => dlgComponent.restore.set(),
					buttons: {
						OK: (evt) => {
							current.routine.addComponent(dlgComponent);
							dlgComponent.restore.set();
						},
						CANCEL: () => dlgComponent.restore.apply(),
						HELP: dlgComponent.helpLink
					},
					buttonsDisabled: btnsDisabled(),
					get shown() {
						return showDialog;
					},
					set shown($$value) {
						showDialog = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						Notebook_1$1($$renderer, { element: dlgComponent });
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!---->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/components/Section.svelte
function Section($$renderer, $$props) {
	let { label, children } = $$props;
	PanelButton($$renderer, {
		label,
		children: ($$renderer) => {
			$$renderer.push(`<div class="component-section-buttons svelte-b7kudy">`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		},
		$$slots: { default: true }
	});
}
//#endregion
//#region src/routes/builder/components/RoutineButton.svelte
function RoutineButton($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { component } = $$props;
		function titleCase(name) {
			name = name.replace("Component", "");
			name = name.replace("Routine", "");
			name = name.replace(/(\w)([A-Z])/g, "$1 $2");
			return name;
		}
		function newRoutine() {
			current.experiment.history.update(`new Routine`);
			let rt = new StandaloneRoutine(component["__name__"]);
			rt.exp = current.experiment;
			current.experiment.routines[rt.name] = rt;
			current.routine = rt;
			current.inserting = rt;
		}
		if (!component.hidden) {
			$$renderer.push("<!--[0-->");
			Button($$renderer, {
				label: titleCase(component["__name__"]),
				icon: `/icons/components/${stringify(component["__name__"])}.svg`,
				vertical: true,
				onclick: newRoutine
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/routes/builder/components/FilterDialog.svelte
function FilterDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { filter = void 0, shown = void 0 } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
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
				children: ($$renderer) => {
					$$renderer.push(`<div class="container svelte-8tksg9">Show only Components which work with... <div class="radio-ctrl svelte-8tksg9"><input type="radio" id="component-filter-any" name="component-filter"${attr("checked", filter === void 0, true)}/> <label for="component-filter-any">Any</label> <input type="radio" id="component-filter-py" name="component-filter"${attr("checked", filter && filter.includes("PsychoPy") && !filter.includes("PsychoJS"), true)}/> <label for="component-filter-py">PsychoPy (local)</label> <input type="radio" id="component-filter-js" name="component-filter"${attr("checked", filter && !filter.includes("PsychoPy") && filter.includes("PsychoJS"), true)}/> <label for="component-filter-js">PsychoJS (online)</label> <input type="radio" id="component-filter-both" name="component-filter"${attr("checked", filter && filter.includes("PsychoPy") && filter.includes("PsychoJS"), true)}/> <label for="component-filter-both">Both</label></div></div>`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			filter,
			shown
		});
	});
}
//#endregion
//#region src/routes/builder/components/Panel.svelte
function Panel$2($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/**
		* Sort Components into ordered categories
		* 
		* @param profiles { object } Object containing Component profiles, unsorted
		* 
		* @returns { array<array> } Entries-style array, with each item being a category (in order) and matching profiles
		*/
		function sortProfiles(profiles) {
			let categs = Object.values(profiles).reduce((all, profile) => Array.prototype.concat(all, profile.categories.filter((categ) => !all.includes(categ))), []);
			let categOrder = {
				first: ["Stimuli", "Responses"],
				last: [
					"I/O",
					"Custom",
					"Other"
				]
			};
			categs.sort((a, b) => categOrder.first.includes(b) - categOrder.first.includes(a) + (categOrder.last.includes(a) - categOrder.last.includes(b)));
			return categs.map((categ) => [categ, Object.values(profiles).filter((profile) => profile.categories.includes(categ) && !profile["__class__"].match(/psychopy\.experiment\.(components|routines)\._?base:.*/) && !profile.hidden)]);
		}
		/**
		* Apply the current filter to an array of profiles
		*/
		function filterProfiles(profiles) {
			return profiles.filter((profile) => filter === void 0 || filter.every((value) => profile.targets.includes(value)));
		}
		/**
		* Get Components again from PsychoPy
		*/
		async function refreshProfiles() {
			if (await python?.ready) pending.components = python.liaison.send("app", {
				command: "run",
				args: ["psychopy.experiment:getElementProfiles"]
			}, 1e5).then((data) => Object.assign(profiles.components, data));
		}
		let showFilterDlg = false;
		let showPluginMgr = false;
		let filter = void 0;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div id="components"><div class="ctrls svelte-14x5eb5">`);
			if (python?.ready) {
				$$renderer.push("<!--[0-->");
				CompactButton($$renderer, {
					icon: "/icons/btn-add.svg",
					tooltip: "Get more...",
					onclick: (evt) => showPluginMgr = true
				});
				$$renderer.push(`<!----> `);
				Dialog_1$2($$renderer, {
					get shown() {
						return showPluginMgr;
					},
					set shown($$value) {
						showPluginMgr = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----> `);
				CompactButton($$renderer, {
					icon: "/icons/btn-refresh.svg",
					tooltip: "Reload Components",
					onclick: refreshProfiles
				});
				$$renderer.push(`<!---->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			CompactButton($$renderer, {
				icon: "/icons/btn-filter.svg",
				tooltip: "Filter...",
				onclick: (evt) => showFilterDlg = true
			});
			$$renderer.push(`<!----> `);
			FilterDialog($$renderer, {
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
			$$renderer.push(`<!----></div> <div class="components">`);
			await_block($$renderer, python?.ready, () => {}, (ready) => {
				await_block($$renderer, pending.components, () => {
					$$renderer.push(`<div class="message svelte-14x5eb5">Loading Components...</div>`);
				}, () => {
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(sortProfiles(profiles.components));
					for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
						let [categ, categProfiles] = each_array[$$index_1];
						if (filterProfiles(categProfiles).length) {
							$$renderer.push("<!--[0-->");
							Section($$renderer, {
								label: categ,
								children: ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array_1 = ensure_array_like(filterProfiles(categProfiles));
									for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
										let profile = each_array_1[$$index];
										if (profile["__class__"].startsWith("psychopy.experiment.components") || profile["__class__"].endsWith("omponent")) {
											$$renderer.push("<!--[0-->");
											ComponentButton($$renderer, { component: profile });
										} else {
											$$renderer.push("<!--[-1-->");
											RoutineButton($$renderer, { component: profile });
										}
										$$renderer.push(`<!--]-->`);
									}
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				});
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`<!--]--></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/flow/EntryPoint.svelte
function EntryPoint($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { index = void 0 } = $$props;
		let hovered = false;
		let moving = derived(() => current.moving && [
			Routine$1,
			StandaloneRoutine,
			LoopInitiator,
			LoopTerminator
		].includes(current.moving.constructor));
		let inserting = derived(() => current.inserting && [
			Routine$1,
			StandaloneRoutine,
			LoopInitiator,
			LoopTerminator
		].includes(current.inserting.constructor));
		$$renderer.push(`<div${attr_class("entry-point svelte-bbudjt", void 0, {
			"active": moving() || inserting(),
			"hovered": hovered
		})}><button class="hitbox svelte-bbudjt" aria-label="Entry point"${attr("tabindex", moving() || inserting() ? 0 : -1)}></button></div>`);
	});
}
//#endregion
//#region src/routes/builder/flow/Routine.svelte
function Routine($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { element = void 0 } = $$props;
		let show = {
			settingsDlg: false,
			contextMenu: false,
			tooltip: false
		};
		let contextMenuPos = {
			x: void 0,
			y: void 0
		};
		function removeRoutine(evt) {
			current.experiment.history.update(`remove ${element.name}`);
			current.experiment.flow.removeElement(element.index);
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			EntryPoint($$renderer, { index: element.index });
			$$renderer.push(`<!----> <button${attr_class("routine svelte-rk31uv", void 0, {
				"active": current.routine ? current.routine.name === element.name : false,
				"disabled": element.disabled
			})}${attr("draggable", true)}>`);
			if (element.settings && "desc" in element.settings.params && element.settings.params["desc"].val) {
				$$renderer.push("<!--[0-->");
				Tooltip($$renderer, {
					position: "bottom",
					get shown() {
						return show.tooltip;
					},
					set shown($$value) {
						show.tooltip = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						if (element.settings.params["desc"].val.length > 64) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`${escape_html(element.settings.params["desc"].val.slice(0, 64))}...`);
						} else {
							$$renderer.push("<!--[-1-->");
							$$renderer.push(`${escape_html(element.settings.params["desc"].val)}`);
						}
						$$renderer.push(`<!--]-->`);
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> ${escape_html(element.name)}</button> `);
			Menu($$renderer, {
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
				children: ($$renderer) => {
					if (element.settings) {
						$$renderer.push("<!--[0-->");
						Item($$renderer, {
							icon: "/icons/btn-edit.svg",
							label: "Routine settings",
							onclick: (evt) => show.settingsDlg = true
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					Item($$renderer, {
						icon: `/icons/sym-dot-${element.disabled ? "blue" : "light"}.svg`,
						label: `${element.disabled ? "Enable" : "Disable"} Routine`,
						onclick: (evt) => {
							current.experiment.history.update(`${element.disabled ? "enable" : "disable"} ${element.name}`);
							if (element.settings) element.settings.params.disabled.val = !element.disabled;
							else element.params.disabled.val = !element.disabled;
						}
					});
					$$renderer.push(`<!----> `);
					Item($$renderer, {
						icon: "/icons/btn-copy.svg",
						label: "Copy Routine",
						onclick: (evt) => copyRoutine(element)
					});
					$$renderer.push(`<!----> `);
					Item($$renderer, {
						icon: "/icons/btn-delete.svg",
						label: "Remove Routine",
						onclick: removeRoutine
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			if (element.settings) {
				$$renderer.push("<!--[0-->");
				ParamsDialog($$renderer, {
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
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { element });
	});
}
//#endregion
//#region src/routes/builder/flow/Loop.svelte
function Loop_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { element = void 0 } = $$props;
		let showDialog = false;
		let showContextMenu = false;
		let contextMenuPos = {
			x: void 0,
			y: void 0
		};
		function removeLoop(evt) {
			current.experiment.history.update(`remove ${element.name}`);
			if (current.experiment.flow.flat.includes(element.initiator)) current.experiment.flow.flat.splice(current.experiment.flow.flat.indexOf(element.initiator), 1);
			if (current.experiment.flow.flat.includes(element.terminator)) current.experiment.flow.flat.splice(current.experiment.flow.flat.indexOf(element.terminator), 1);
		}
		let edgeHovered = {
			left: false,
			right: false
		};
		let valid = derived(() => Object.values(element.params).every((param) => param.valid?.value));
		let btnsDisabled = derived(() => ({
			OK: !valid(),
			APPLY: !valid()
		}));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (element.complete) {
				$$renderer.push("<!--[0-->");
				EntryPoint($$renderer, { index: element.initiator.index });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div${attr_class("loop svelte-1118i51", void 0, { "incomplete": !element.complete })}>`);
			if (element) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="loop-name svelte-1118i51">${escape_html(element.name)}</button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="loop-arrow left svelte-1118i51"${attr("draggable", true)} role="none">`);
			Icon($$renderer, { src: `/icons/sym-arrow-up${edgeHovered.left ? "-hl" : ""}.svg` });
			$$renderer.push(`<!----></div> `);
			if (element) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(Object.keys(element.routines));
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let i = each_array[$$index];
					if (element.routines[i] instanceof FlowLoop) {
						$$renderer.push("<!--[0-->");
						Loop_1($$renderer, {
							get element() {
								return element.routines[i];
							},
							set element($$value) {
								element.routines[i] = $$value;
								$$settled = false;
							}
						});
					} else {
						$$renderer.push("<!--[-1-->");
						Routine($$renderer, {
							get element() {
								return element.routines[i];
							},
							set element($$value) {
								element.routines[i] = $$value;
								$$settled = false;
							}
						});
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (element.complete) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="loop-arrow right svelte-1118i51"${attr("draggable", true)} role="none">`);
				Icon($$renderer, { src: `/icons/sym-arrow-down${edgeHovered.right ? "-hl" : ""}.svg` });
				$$renderer.push(`<!----></div> `);
				EntryPoint($$renderer, { index: element.terminator.index });
				$$renderer.push(`<!---->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			Menu($$renderer, {
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
				children: ($$renderer) => {
					Item($$renderer, {
						icon: "/icons/btn-delete.svg",
						label: "Delete Loop",
						onclick: removeLoop
					});
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			Dialog($$renderer, {
				id: `loop-${stringify(element.name)}`,
				title: element.name,
				onopen: () => element.initiator.restore.set(),
				buttons: {
					OK: (evt) => {},
					APPLY: (evt) => element.initiator.restore.set(),
					CANCEL: (evt) => element.initiator.restore.apply()
				},
				buttonsDisabled: btnsDisabled(),
				get shown() {
					return showDialog;
				},
				set shown($$value) {
					showDialog = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					Notebook_1$1($$renderer, {
						element: element instanceof FlowLoop ? element.initiator : element,
						get valid() {
							return valid();
						},
						set valid($$value) {
							valid($$value);
							$$settled = false;
						}
					});
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { element });
	});
}
//#endregion
//#region src/routes/builder/flow/Flow.svelte
function Flow($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="flow-canvas svelte-1ymcx07"><div class="flow svelte-1ymcx07"><div class="flowline-container svelte-1ymcx07"><div class="flowline svelte-1ymcx07"></div> <div class="flowline-arrow svelte-1ymcx07">`);
			Icon($$renderer, {
				src: "/icons/sym-arrow-right.svg",
				size: ".75rem"
			});
			$$renderer.push(`<!----></div></div> `);
			if (current.experiment) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(current.experiment.flow.dynamic);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let emt = each_array[$$index];
					$$renderer.push(`<div class="flow-animation svelte-1ymcx07">`);
					if (emt instanceof FlowLoop) {
						$$renderer.push("<!--[0-->");
						Loop_1($$renderer, {
							get element() {
								return emt;
							},
							set element($$value) {
								emt = $$value;
								$$settled = false;
							}
						});
					} else {
						$$renderer.push("<!--[-1-->");
						Routine($$renderer, {
							get element() {
								return emt;
							},
							set element($$value) {
								emt = $$value;
								$$settled = false;
							}
						});
					}
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			EntryPoint($$renderer, { index: "-1" });
			$$renderer.push(`<!----></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/flow/controls/AddRoutine.svelte
function AddRoutine($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let showNewRoutineDialog = false;
		let showMenu = false;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="container svelte-1o4sr79">`);
			Button($$renderer, {
				label: "Add Routine",
				icon: "/icons/btn-routine.svg",
				tooltip: "Add a Routine to the experiment flow",
				onclick: () => {
					showMenu = true;
				},
				disabled: current.inserting,
				horizontal: true
			});
			$$renderer.push(`<!----> `);
			Menu($$renderer, {
				get shown() {
					return showMenu;
				},
				set shown($$value) {
					showMenu = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					Item($$renderer, {
						label: "New Routine...",
						onclick: () => {
							current.inserting = new Routine$1();
							showNewRoutineDialog = true;
						}
					});
					$$renderer.push(`<!----> <!--[-->`);
					const each_array = ensure_array_like(Object.entries(current.experiment.routines));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let [name, routine] = each_array[$$index];
						Item($$renderer, {
							label: name,
							onclick: () => {
								current.inserting = routine;
							}
						});
					}
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----></div> `);
			if (current.inserting instanceof Routine$1) {
				$$renderer.push("<!--[0-->");
				Dialog($$renderer, {
					id: "new-routine",
					title: "New Routine",
					onopen: () => current.inserting.settings.restore.set(),
					buttons: {
						OK: (evt) => {
							current.inserting.exp = current.experiment;
							current.experiment.routines[current.inserting.name] = current.inserting;
						},
						CANCEL: (evt) => {
							current.inserting.settings.restore.apply();
							current.inserting = void 0;
						},
						HELP: "https://www.psychopy.org/builder/routines.html#routines"
					},
					buttonsDisabled: {
						OK: !Object.values(current.inserting.settings.params).every((param) => param.valid?.value),
						APPLY: !Object.values(current.inserting.settings.params).every((param) => param.valid?.value)
					},
					get shown() {
						return showNewRoutineDialog;
					},
					set shown($$value) {
						showNewRoutineDialog = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						Notebook_1$1($$renderer, { element: current.inserting.settings });
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/flow/controls/AddLoop.svelte
function AddLoop($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let showDialog = false;
		let showMenu = false;
		let valid = derived(() => {
			if (current.inserting) return Object.values(current.inserting.params).every((param) => param.valid?.value);
		});
		let btnsDisabled = derived(() => ({
			OK: !valid(),
			APPLY: !valid()
		}));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="container svelte-i9bjwn">`);
			Button($$renderer, {
				label: "Add Loop",
				icon: "/icons/btn-loop.svg",
				tooltip: "Add a loop to the experiment flow",
				onclick: () => showMenu = true,
				disabled: current.inserting,
				horizontal: true
			});
			$$renderer.push(`<!----> `);
			Menu($$renderer, {
				get shown() {
					return showMenu;
				},
				set shown($$value) {
					showMenu = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					await_block($$renderer, pending.loops, () => {
						Item($$renderer, { label: "Loading loops..." });
					}, (loops) => {
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(Object.entries(loops));
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let [loopType, loopProfile] = each_array[$$index];
							if (!loopProfile.hidden) {
								$$renderer.push("<!--[0-->");
								Item($$renderer, {
									label: `New ${stringify(loopProfile.label?.toLowerCase?.() || loopType)}...`,
									onclick: () => {
										current.inserting = new LoopInitiator(loopType);
										current.inserting.exp = current.experiment;
										showDialog = true;
									}
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]-->`);
					});
					$$renderer.push(`<!--]-->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			if (current.inserting instanceof LoopInitiator) {
				$$renderer.push("<!--[0-->");
				Dialog($$renderer, {
					id: "new-loop",
					title: "New loop",
					onopen: () => current.inserting.restore.set(),
					buttons: {
						OK: (evt) => {},
						CANCEL: (evt) => {
							current.inserting.restore.apply();
							current.inserting = void 0;
						},
						HELP: "https://www.psychopy.org/builder/flow.html#loops"
					},
					buttonsDisabled: btnsDisabled(),
					get shown() {
						return showDialog;
					},
					set shown($$value) {
						showDialog = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						Notebook_1$1($$renderer, {
							element: current.inserting,
							get valid() {
								return valid();
							},
							set valid($$value) {
								valid($$value);
								$$settled = false;
							}
						});
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
//#region src/routes/builder/flow/controls/Panel.svelte
function Panel$1($$renderer) {
	$$renderer.push(`<div class="flow-buttons svelte-1af6kv0">`);
	AddRoutine($$renderer, {});
	$$renderer.push(`<!----> `);
	AddLoop($$renderer, {});
	$$renderer.push(`<!----></div>`);
}
//#endregion
//#region src/routes/builder/flow/Panel.svelte
function Panel($$renderer) {
	$$renderer.push(`<div class="flow-panel svelte-1lgnm09">`);
	Panel$1($$renderer, {});
	$$renderer.push(`<!----> `);
	Flow($$renderer, {});
	$$renderer.push(`<!----></div>`);
}
//#endregion
//#region src/lib/dialogs/readme/ReadMe.svelte
function ReadMe($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { script, shown = void 0 } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				title: script.file.name,
				buttons: {
					OK: (evt) => {},
					EXTRA: {
						Edit: (evt) => openIn(script.file, "coder"),
						Refresh: (evt) => script.fromFile(script.file)
					}
				},
				buttonsDisabled: { EXTRA: {
					Edit: !script.file?.parent,
					Refresh: !script.file?.parent
				} },
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="readme-preview svelte-h5cupi">${html(marked(script.content || ""))}</div>`);
				},
				$$slots: { default: true }
			});
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { shown });
	});
}
//#endregion
//#region src/routes/builder/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let params = new URLSearchParams(location.search);
		if (params.get("fileOpen")) openFile(params.get("fileOpen"));
		setContext("current", current);
		if (electron) {
			electron.windows.listen("fileOpen", (evt, file) => openFile(file));
			electron.windows.emit("ready", true);
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (current.experiment.file) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<title>PsychoPy Builder: ${escape_html(current.experiment.file?.name)}</title>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<title>PsychoPy Builder</title>`);
			}
			$$renderer.push(`<!--]--> `);
			{
				function ribbon($$renderer) {
					Ribbon_1($$renderer, {});
				}
				Frame($$renderer, {
					onFileDrop: (evt, file) => openFile(file),
					ribbon,
					children: ($$renderer) => {
						Pane_group($$renderer, {
							direction: "vertical",
							children: ($$renderer) => {
								Pane($$renderer, {
									defaultSize: 2 / 3,
									children: ($$renderer) => {
										Pane_group($$renderer, {
											direction: "horizontal",
											children: ($$renderer) => {
												Pane($$renderer, {
													defaultSize: 3 / 4,
													children: ($$renderer) => {
														Panel$3($$renderer, {
															title: "Routines",
															children: ($$renderer) => {
																Notebook_1($$renderer, {});
															},
															$$slots: { default: true }
														});
													},
													$$slots: { default: true }
												});
												$$renderer.push(`<!----> `);
												Pane_resizer($$renderer, { style: "width: .3rem;" });
												$$renderer.push(`<!----> `);
												Pane($$renderer, {
													defaultSize: 1 / 4,
													children: ($$renderer) => {
														Panel$3($$renderer, {
															title: "Components",
															children: ($$renderer) => {
																Panel$2($$renderer, {});
															},
															$$slots: { default: true }
														});
													},
													$$slots: { default: true }
												});
												$$renderer.push(`<!---->`);
											},
											$$slots: { default: true }
										});
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!----> `);
								Pane_resizer($$renderer, { style: "height: .3rem;" });
								$$renderer.push(`<!----> `);
								Pane($$renderer, {
									defaultSize: 1 / 3,
									children: ($$renderer) => {
										Panel$3($$renderer, {
											title: "Flow",
											hspan: 4,
											children: ($$renderer) => {
												Panel($$renderer, {});
											},
											$$slots: { default: true }
										});
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						ReadMe($$renderer, {
							script: current.readme.script,
							get shown() {
								return current.readme.shown;
							},
							set shown($$value) {
								current.readme.shown = $$value;
								$$settled = false;
							}
						});
						$$renderer.push(`<!----> `);
						TipsDialog($$renderer, {
							categories: [
								"general",
								"builder",
								"silly"
							],
							get shown() {
								return current.tip.shown;
							},
							set shown($$value) {
								current.tip.shown = $$value;
								$$settled = false;
							}
						});
						$$renderer.push(`<!----> `);
						Theme($$renderer, {});
						$$renderer.push(`<!----> `);
						Shortcuts($$renderer, { callbacks: shortcuts });
						$$renderer.push(`<!----> `);
						if (python) {
							$$renderer.push("<!--[0-->");
							SetupPython($$renderer, {});
							$$renderer.push(`<!----> `);
							PythonErrors($$renderer, {});
							$$renderer.push(`<!---->`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					},
					$$slots: {
						ribbon: true,
						default: true
					}
				});
			}
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
	});
}
//#endregion
export { _page as default };
