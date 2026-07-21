import "../../../chunks/internal.js";
import { D as escape_html, E as attr, a as bind_props, b as setContext, et as snapshot, f as stringify, i as await_block, s as ensure_array_like, t as attr_class, v as getContext } from "../../../chunks/server.js";
import { A as SwitchButton, J as showDevTools, P as t, Q as store, R as Menu, W as Icon, X as consumeCurrentFile, Y as showWindow, Z as setActiveView, c as CodeOutput, et as electron$1, f as Version, g as parsePath, h as mime, j as IconButton, l as CodeEditor, m as browseFileSave, n as prefs, o as SetupPython, p as browseFileOpen, q as openIn, r as Script, rt as python, s as CodeInput, t as Theme, u as setupPython, z as CompactButton } from "../../../chunks/Theme.js";
import { C as Pane_resizer, D as Panel, E as Frame, S as Shortcuts, T as Pane_group, _ as Notebook, a as BugReport, b as Item, f as UserCtrl, h as Page, i as Ribbon, m as ButtonTab, n as Gap, o as PrefsDialog, r as Section, t as TipsDialog, v as SubMenu, w as Pane, y as Separator } from "../../../chunks/TipsDialog.js";
import { t as Dialog_1 } from "../../../chunks/pluginManager.js";
import path from "path-browserify";
//#region src/routes/coder/globals.svelte.js
var current = {
	pages: [],
	tab: 0,
	_lastGeneratedFile: null,
	openFile: async (file) => {
		if (typeof file === "string") file = parsePath(file);
		if (file.ext === ".psyexp") {
			openIn(file.file, "builder");
			return;
		}
		if (file.ext === ".psyrun") {
			openIn(file.file, "runner");
			return;
		}
		if (file.ext === ".psydat") file = parsePath(await python.liaison.send("app", {
			command: "run",
			args: ["psychopy.tools.filetools:psydat2csv", file.file]
		}));
		let mimeType = mime.getType(file.name) || "unknown";
		if (!(mimeType.startsWith("text") || ["application/json", "application/xml"].includes(mimeType))) {
			electron$1.files.openExternal(file.file);
			return;
		}
		if (!current.pages.some((item) => item.file.file === file.file)) current.pages.push(new Script(file));
		current.tab = current.pages.findIndex((item) => item.file.file === file.file);
		await current.pages[current.tab].fromFile(file);
	},
	tip: { shown: false }
};
//#endregion
//#region src/routes/coder/callbacks.svelte.js
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
	let file = await browseFileOpen([
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
			accept: {
				"text/csv": [".csv"],
				"application/json": [".json"]
			}
		}
	], current.pages[current.tab]?.file?.parent);
	if (file === void 0) return;
	current.openFile(file);
}
async function revealFolder() {
	if (electron$1 && current.pages[current.tab].file) electron$1.files.showItemInFolder(current.pages[current.tab].file.file);
}
async function fileSave() {
	if (!current.pages[current.tab]?.file?.file) return fileSaveAs();
	current.pages[current.tab].toFile(current.pages[current.tab].file);
}
async function fileSaveAs() {
	let file = await browseFileSave([
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
			accept: {
				"text/csv": [".csv"],
				"application/json": [".json"]
			}
		}
	], current.pages[current.tab]?.file?.file || "untitled.py");
	if (file === void 0) return;
	current.pages[current.tab].file = file;
	await fileSave();
}
function quit() {
	if (electron$1) electron$1.quit();
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
	if (current.pages[current.tab]) current.pages[current.tab].pilotMode = !current.pages[current.tab].pilotMode;
}
async function sendToRunner() {
	const f = current.pages[current.tab]?.file;
	if (f) f.source = "coder";
	await openIn(f, "runner");
}
async function runPython(version) {
	if (!python) return;
	if (current.pages[current.tab]) await current.pages[current.tab].runPython(version);
	return true;
}
async function stopPython(version) {
	if (!python) return;
	if (current.pages[current.tab]) await current.pages[current.tab].stopPython(version);
	return true;
}
async function runJS() {
	if (!python) return;
	if (current.pages[current.tab]) await current.pages[current.tab].runJS(false);
}
var shortcuts = {
	new: fileNew,
	open: fileOpen,
	revealFolder,
	save: fileSave,
	saveAs: fileSaveAs,
	close,
	quit,
	undo,
	redo,
	togglePiloting,
	sendToRunner,
	runPython,
	stopPython,
	runJS,
	showDevTools
};
//#endregion
//#region src/routes/coder/ribbon/Menu.svelte
function Menu_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { shown = void 0 } = $$props;
		let show = {
			prefsDlg: false,
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
						label: t("menu.file"),
						icon: "/icons/rbn-file.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								icon: "/icons/btn-new.svg",
								label: t("file.new"),
								shortcut: "new",
								onclick: fileNew
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-open.svg",
								label: t("file.open"),
								shortcut: "open",
								onclick: fileOpen
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-save.svg",
								label: t("file.save"),
								shortcut: "save",
								onclick: fileSave,
								disabled: Object.values(current.pages).length === 0 || !current.pages[current.tab]?.canUndo && current.pages[current.tab]?.file?.file
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-saveas.svg",
								label: t("file.saveAs"),
								shortcut: "saveAs",
								onclick: fileSaveAs,
								disabled: Object.values(current.pages).length === 0
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("file.reveal"),
								onclick: revealFolder,
								shortcut: "revealFolder",
								disabled: current.pages[current.tab]?.file?.parent === void 0
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("file.close"),
								onclick: close,
								shortcut: "close"
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-settings.svg",
								label: t("file.preferences"),
								onclick: (evt) => {
									show.prefsDlg = true;
								}
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("file.resetPrefs"),
								onclick: (evt) => prefs.reset()
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: t("menu.edit"),
						icon: "/icons/rbn-edit.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: t("edit.undo"),
								icon: "/icons/btn-undo.svg",
								disabled: !current.pages[current.tab]?.canUndo,
								onclick: undo,
								shortcut: "undo"
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("edit.redo"),
								icon: "/icons/btn-redo.svg",
								onclick: redo,
								disabled: !current.pages[current.tab]?.redo,
								shortcut: "redo"
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("edit.find"),
								icon: "/icons/btn-find.svg",
								onclick: find,
								disabled: !current.pages[current.tab]?.editor,
								shortcut: "find"
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: t("menu.view"),
						icon: "/icons/rbn-windows.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: t("view.showBuilder"),
								onclick: (evt) => showWindow("builder")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("view.showRunner"),
								onclick: (evt) => showWindow("runner")
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("view.devTools"),
								onclick: showDevTools,
								shortcut: "showDevTools"
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (electron$1) {
						$$renderer.push("<!--[0-->");
						SubMenu($$renderer, {
							label: t("menu.run"),
							icon: "/icons/btn-runpy.svg",
							children: ($$renderer) => {
								Item($$renderer, {
									label: t("run.togglePilot"),
									onclick: togglePiloting,
									shortcut: "togglePilot",
									disabled: !current.pages[current.tab]
								});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: t("run.sendToRunner"),
									icon: `/icons/btn-send${current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg`,
									onclick: sendToRunner,
									shortcut: "sendToRunner",
									disabled: !current.pages[current.tab]
								});
								$$renderer.push(`<!----> `);
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: t(current.pages[current.tab]?.pilotMode ? "run.pilotInPython" : "run.runInPython"),
									icon: `/icons/btn-${current.pages[current.tab]?.pilotMode?.pilotMode ? "pilot" : "run"}py.svg`,
									onclick: (evt) => runPython(),
									shortcut: "runPython",
									disabled: !current.pages[current.tab] || current.pages[current.tab].file.ext !== ".py"
								});
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					SubMenu($$renderer, {
						label: t("menu.tools"),
						icon: "/icons/btn-hamburger.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: t("tools.plugins"),
								icon: "/icons/btn-plugin.svg",
								onclick: (evt) => show.pluginMgr = true,
								disabled: !python?.ready
							});
							$$renderer.push(`<!----> `);
							if (electron$1) {
								$$renderer.push("<!--[0-->");
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: t("tools.userFolder"),
									onclick: (evt) => electron$1.paths.user().then((folder) => electron$1.files.openPath(folder))
								});
								$$renderer.push(`<!---->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (python) {
								$$renderer.push("<!--[0-->");
								Item($$renderer, {
									label: t("tools.reinstallPy"),
									onclick: (evt) => setupPython("app", true)
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					SubMenu($$renderer, {
						label: t("menu.help"),
						children: ($$renderer) => {
							Item($$renderer, {
								label: t("help.homepage"),
								onclick: (evt) => open("https://www.psychopy.org/")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("help.docs"),
								onclick: (evt) => open("https://www.psychopy.org/documentation")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: t("help.forum"),
								onclick: (evt) => open("https://discourse.psychopy.org/")
							});
							$$renderer.push(`<!----> `);
							Separator($$renderer, {});
							$$renderer.push(`<!----> `);
							if (electron$1) {
								$$renderer.push("<!--[0-->");
								await_block($$renderer, electron$1.version(), () => {}, (version) => {
									Item($$renderer, {
										label: t("help.aboutShort", { version: `${version.major}.${version.minor}` }),
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
					if (electron$1) {
						$$renderer.push("<!--[0-->");
						await_block($$renderer, electron$1.version(), () => {}, (version) => {
							if (version === "dev" || Version.parse(version).extra) {
								$$renderer.push("<!--[0-->");
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: t("help.reportBug"),
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
							label: t("file.quit"),
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
			if (python) {
				$$renderer.push("<!--[0-->");
				Dialog_1($$renderer, {
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
			if (electron$1) {
				$$renderer.push("<!--[0-->");
				BugReport($$renderer, {
					user: current.user,
					context: current.pages,
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
//#region src/routes/coder/ribbon/Ribbon.svelte
function Ribbon_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let show = {};
		let awaiting = { runpy: Promise.resolve(false) };
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Ribbon($$renderer, {
				children: ($$renderer) => {
					Section($$renderer, {
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-hamburger.svg",
								label: t("tb.menu"),
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
					Section($$renderer, {
						label: t("tb.file"),
						icon: "/icons/rbn-file.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-new.svg",
								label: t("tb.newFile"),
								onclick: fileNew,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-open.svg",
								label: t("tb.openFile"),
								onclick: fileOpen,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-save.svg",
								label: t("tb.saveFile"),
								onclick: fileSave,
								borderless: true,
								disabled: Object.values(current.pages).length === 0 || !current.pages[current.tab]?.canUndo && current.pages[current.tab]?.file?.file
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-saveas.svg",
								label: t("tb.saveFileAs"),
								onclick: fileSaveAs,
								borderless: true,
								disabled: Object.values(current.pages).length === 0
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Section($$renderer, {
						label: t("tb.edit"),
						icon: "/icons/rbn-edit.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-undo.svg",
								label: t("tb.undo"),
								onclick: undo,
								disabled: !current.pages[current.tab]?.canUndo,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-redo.svg",
								label: t("tb.redo"),
								onclick: redo,
								disabled: !current.pages[current.tab]?.canRedo,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-find.svg",
								label: t("tb.find"),
								onclick: find,
								disabled: !current.pages[current.tab]?.editor,
								borderless: true
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Section($$renderer, {
						label: t("tb.experiment"),
						icon: "/icons/rbn-experiment.svg",
						children: ($$renderer) => {
							var bind_get = () => current.pages[current.tab]?.pilotMode;
							var bind_set = (value) => current.pages[current.tab].pilotMode = value;
							SwitchButton($$renderer, {
								labels: [t("tb.pilot"), t("tb.run")],
								tooltip: t(current.pages[current.tab]?.pilotMode ? "tip.pilotMode" : "tip.runMode"),
								get value() {
									return bind_get();
								},
								set value($$value) {
									bind_set($$value);
								},
								disabled: !current.pages[current.tab]
							});
							$$renderer.push(`<!----> `);
							if (python?.ready) {
								$$renderer.push("<!--[0-->");
								IconButton($$renderer, {
									icon: `/icons/btn-send${current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg`,
									label: t("tb.sendToRunner"),
									onclick: sendToRunner,
									disabled: !current.pages[current.tab]?.file?.file,
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
						Section($$renderer, {
							label: t("tb.run"),
							icon: "/icons/btn-runpy.svg",
							children: ($$renderer) => {
								IconButton($$renderer, {
									icon: `/icons/btn-${current.pages[current.tab]?.pilotMode ? "pilot" : "run"}py.svg`,
									label: t(current.pages[current.tab]?.pilotMode ? "tb.pilotLocal" : "tb.runLocal"),
									onclick: (evt) => runPython(),
									disabled: !current.pages[current.tab]?.file?.file || current.pages[current.tab]?.file?.ext !== ".py",
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
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					Section($$renderer, {
						label: t("tb.pavlovia"),
						icon: "/icons/rbn-pavlovia.svg",
						children: ($$renderer) => {
							UserCtrl($$renderer, {});
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Gap($$renderer, {});
					$$renderer.push(`<!----> `);
					Section($$renderer, {
						label: t("tb.views"),
						icon: "/icons/rbn-windows.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-builder.svg",
								label: t("tb.builderView"),
								onclick: (evt) => showWindow("builder"),
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-coder.svg",
								label: t("tb.coderView"),
								onclick: (evt) => showWindow("coder"),
								borderless: true,
								disabled: true
							});
							$$renderer.push(`<!----> `);
							if (electron$1) {
								$$renderer.push("<!--[0-->");
								IconButton($$renderer, {
									icon: "/icons/btn-runner.svg",
									label: t("tb.runnerView"),
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
//#region src/routes/coder/notebook/CoderNotebook.svelte
function CoderNotebook($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Notebook($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(Object.entries(current.pages));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let [i, page] = each_array[$$index];
						var bind_get = () => current.tab === parseInt(i);
						var bind_set = (val) => {
							if (val) current.tab = parseInt(i);
						};
						Page($$renderer, {
							label: page.file.name,
							close: (evt) => current.pages.splice(i, 1),
							get selected() {
								return bind_get();
							},
							set selected($$value) {
								bind_set($$value);
							},
							children: ($$renderer) => {
								CodeEditor($$renderer, {
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
					$$renderer.push(`<!--]--> `);
					ButtonTab($$renderer, {
						callback: (evt) => current.pages.push(new Script({
							file: void 0,
							parent: void 0,
							name: "untitled.py",
							stem: "untitled",
							ext: ".py"
						})),
						tooltip: "New file..."
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
//#region src/routes/coder/shell/Shell.svelte
function Shell($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { id } = $$props;
		let output = { content: "" };
		let input = {
			past: [],
			present: "",
			future: []
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="shell-ctrl svelte-3nwxar"><div class="output svelte-3nwxar">`);
			{
				function ctrls($$renderer) {
					CompactButton($$renderer, {
						icon: "/icons/btn-clear.svg",
						onclick: (evt) => output.content = "",
						tooltip: "Clear output"
					});
				}
				CodeOutput($$renderer, {
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
			$$renderer.push(`<!----></div> `);
			CodeInput($$renderer, {
				onsubmit: (evt) => {
					let cmd = input.present;
					let resp = python.shell.send("app", id, cmd);
					input.past.push(cmd);
					input.future = [];
					input.present = "";
					resp.then((resp) => output.content += resp.join("\n") + "\n").catch((err) => console.log(err));
				},
				onprevious: (evt) => {
					if (!input.past.length) return;
					input.future.unshift(input.present);
					input.present = input.past.pop();
				},
				onnext: (evt) => {
					if (!input.future.length) return;
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
//#region src/routes/coder/shell/ShellNotebook.svelte
function ShellNotebook($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let shells = {};
		let currentTab = void 0;
		python.shell.open("app").then((id) => {
			shells[id] = "Python";
			currentTab = id;
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Notebook($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(Object.entries(shells));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let [id, label] = each_array[$$index];
						var bind_get = () => currentTab === id;
						var bind_set = (value) => {
							if (value) currentTab = id;
						};
						Page($$renderer, {
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
							children: ($$renderer) => {
								Shell($$renderer, { id });
							},
							$$slots: { default: true }
						});
					}
					$$renderer.push(`<!--]--> `);
					ButtonTab($$renderer, { callback: async (evt) => shells[await python.shell.open("app")] = "Python" });
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
//#region src/lib/utils/tree/TreeRoot.svelte
function TreeRoot($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children } = $$props;
		setContext("siblings", { selected: void 0 });
		$$renderer.push(`<div class="tree-root svelte-1vc3saq">`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
//#region src/lib/utils/tree/TreeNode.svelte
function TreeNode($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { label, data = void 0, icon = void 0, onselect = (evt, data) => {}, onactivate = (evt, data) => {}, disabled = false, chevron } = $$props;
		let handle = void 0;
		let siblings = getContext("siblings");
		$$renderer.push(`<button${attr_class("tree-node svelte-s0a6w2", void 0, {
			"disabled": disabled,
			"selected": siblings.selected === handle
		})}${attr("disabled", disabled, true)}>`);
		chevron?.($$renderer);
		$$renderer.push(`<!----> `);
		if (icon) {
			$$renderer.push("<!--[0-->");
			Icon($$renderer, {
				src: icon,
				size: "1.25rem"
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <span class="node-label svelte-s0a6w2">${escape_html(label)}</span></button>`);
	});
}
//#endregion
//#region src/lib/utils/tree/TreeBranch.svelte
function TreeBranch($$renderer, $$props) {
	let { label, icon = void 0, children } = $$props;
	let open = false;
	$$renderer.push(`<div class="tree-branch svelte-hzgo4u">`);
	{
		function chevron($$renderer) {
			Icon($$renderer, {
				src: `/icons/sym-arrow-${open ? "down" : "right"}.svg`,
				size: ".5rem"
			});
		}
		TreeNode($$renderer, {
			label,
			icon,
			onselect: (evt, data) => open = !open,
			chevron,
			$$slots: { chevron: true }
		});
	}
	$$renderer.push(`<!----> `);
	if (open) {
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<div class="tree-branch-nodes svelte-hzgo4u">`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
//#region src/routes/coder/files/DirCtrl.svelte
function DirCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, onchange = (value) => {} } = $$props;
		let current = getContext("current");
		$$renderer.push(`<div class="dir-ctrl svelte-rlum3y"><input class="directory svelte-rlum3y"${attr("value", value)} disabled=""/> `);
		CompactButton($$renderer, {
			icon: "/icons/btn-open.svg",
			tooltip: "Open folder...",
			onclick: async (evt) => {
				let folder = await electron$1.files.openDialog({ properties: ["openDirectory"] });
				if (folder === void 0) return;
				value = folder[0];
				onchange(snapshot(value));
			}
		});
		$$renderer.push(`<!----> `);
		CompactButton($$renderer, {
			icon: "/icons/btn-target.svg",
			tooltip: "Navigate to current file",
			onclick: (evt) => {
				value = current.pages[current.tab].file.parent;
				onchange(snapshot(value));
			},
			disabled: current.pages[current.tab] === void 0
		});
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/routes/coder/files/FolderNode.svelte
function FolderNode_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0 } = $$props;
		let fileIcons = {
			".txt": "text",
			".md": "text",
			".log": "text",
			".json": "json",
			".yaml": "json",
			".yml": "json",
			".toml": "json",
			".tml": "json",
			".xml": "json",
			".psydat": "json",
			".csv": "table",
			".xlsx": "table",
			".xls": "table",
			".tsv": "table",
			".png": "image",
			".jpeg": "image",
			".jpg": "image",
			".bmp": "image",
			".tiff": "image",
			".tif": "image",
			".ppm": "image",
			".gif": "image",
			".svg": "design",
			".psd": "design",
			".ai": "design",
			".afdesign": "design",
			".afphoto": "design",
			".xcf": "design",
			".vsd": "design",
			".cdr": "design",
			".cdx": "design",
			".drawio": "design",
			".mp4": "video",
			".mov": "video",
			".avi": "video",
			".wmv": "video",
			".webm": "video",
			".mpeg": "video",
			".mp3": "audio",
			".wav": "audio",
			".aac": "audio",
			".wma": "audio",
			".flac": "audio",
			".m4a": "audio",
			".psyexp": "psyexp",
			".psyrun": "psyrun",
			".py": "python",
			"pyproject.toml": "packaging",
			".whl": "packaging",
			".wheel": "packaging",
			".js": "js",
			".html": "html",
			".css": "css",
			".git": "git",
			".gitignore": "git",
			".gitattributes": "git",
			"README.md": "info",
			"readme.md": "info"
		};
		let current = getContext("current");
		function selectFile(evt, data) {
			for (let [i, page] of Object.entries(current.pages)) if (page.file.file === data.file) {
				current.tab = parseInt(i);
				return true;
			}
		}
		function openFile(evt, data) {
			if (selectFile(evt, data)) return;
			current.openFile(data);
		}
		TreeBranch($$renderer, {
			label: parsePath(value || "").name,
			children: ($$renderer) => {
				await_block($$renderer, electron.files.scandir(value), () => {
					$$renderer.push(`Scanning...`);
				}, (files) => {
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(files);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let file = each_array[$$index];
						await_block($$renderer, electron.files.stat(path.join(value, file)), () => {}, (stat) => {
							if (stat.isDirectory) {
								$$renderer.push("<!--[0-->");
								FolderNode_1($$renderer, { value: path.join(value, file) });
							} else {
								$$renderer.push("<!--[-1-->");
								TreeNode($$renderer, {
									label: file,
									icon: `/icons/filetypes/${stringify(fileIcons[parsePath(file || "").ext] || "unknown")}.svg`,
									data: parsePath(path.join(value, file)),
									onselect: selectFile,
									onactivate: openFile
								});
							}
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				});
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/routes/coder/files/FileExplorer.svelte
function FileExplorer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		getContext("current");
		let directory = void 0;
		electron$1.paths.documents().then((resp) => directory = resp);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="file-explorer svelte-vnimlf">`);
			DirCtrl($$renderer, {
				get value() {
					return directory;
				},
				set value($$value) {
					directory = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			TreeRoot($$renderer, {
				children: ($$renderer) => {
					FolderNode_1($$renderer, {
						get value() {
							return directory;
						},
						set value($$value) {
							directory = $$value;
							$$settled = false;
						}
					});
				},
				$$slots: { default: true }
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
//#region src/routes/coder/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		setActiveView("coder");
		if (store.coderState.saved && store.coderState.pages) {
			current.pages = store.coderState.pages;
			current.tab = store.coderState.tab;
		}
		(async () => {
			if (current.pages.length === 0 && electron$1 && typeof electron$1.windows.state?.load === "function") {
				let savedCode = await electron$1.windows.state.load("generatedCode");
				if (savedCode?.experimentJSON) {
					let label = savedCode.sourceFile ? savedCode.sourceFile.replace(/\.psyexp$/, "") + " (from Builder)" : "Experiment (from Builder)";
					let content = JSON.stringify(savedCode.experimentJSON, null, 2);
					let script = new Script(label);
					script.content = content;
					current.pages.push(script);
					current.tab = current.pages.length - 1;
				}
			}
		})();
		if (store.generatedCode.experimentJSON && store.generatedCode.sourceFile !== current._lastGeneratedFile) {
			current._lastGeneratedFile = store.generatedCode.sourceFile;
			let label = store.generatedCode.sourceFile ? store.generatedCode.sourceFile.replace(/\.psyexp$/, "") + " (from Builder)" : "Experiment (from Builder)";
			let content = JSON.stringify(store.generatedCode.experimentJSON, null, 2);
			let script = new Script(label);
			script.content = content;
			current.pages.push(script);
			current.tab = current.pages.length - 1;
		}
		{
			const inherited = consumeCurrentFile("coder");
			if (inherited && current.pages.length === 0) {
				let script = new Script(inherited.name ? inherited.name.replace(/\.[^.]+$/, "") + " (from " + inherited.source + ")" : "Experiment (from " + inherited.source + ")");
				script.file = inherited.file;
				current.pages.push(script);
				current.tab = current.pages.length - 1;
			}
		}
		setContext("current", current);
		let params = new URLSearchParams(location.search);
		if (params.get("fileOpen")) current.openFile(params.get("fileOpen"));
		if (electron$1) {
			electron$1.windows.listen("fileOpen", (evt, file) => current.openFile(file));
			electron$1.windows.emit("ready", true);
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<title>PsychoPy Coder</title> `);
			{
				function ribbon($$renderer) {
					Ribbon_1($$renderer, {});
				}
				Frame($$renderer, {
					onFileDrop: (evt, file) => current.openFile(file),
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
												if (electron$1) {
													$$renderer.push("<!--[0-->");
													Pane($$renderer, {
														defaultSize: 1 / 4,
														children: ($$renderer) => {
															Panel($$renderer, {
																title: "Files",
																hspan: 1,
																vspan: 2,
																children: ($$renderer) => {
																	FileExplorer($$renderer, {});
																},
																$$slots: { default: true }
															});
														},
														$$slots: { default: true }
													});
												} else $$renderer.push("<!--[-1-->");
												$$renderer.push(`<!--]--> `);
												Pane_resizer($$renderer, { style: "width: .3rem;" });
												$$renderer.push(`<!----> `);
												Pane($$renderer, {
													defaultSize: 3 / 4,
													children: ($$renderer) => {
														Panel($$renderer, {
															title: "Editor",
															hspan: electron$1 ? 3 : 4,
															vspan: python ? 2 : 3,
															children: ($$renderer) => {
																CoderNotebook($$renderer, {});
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
								if (python?.ready) {
									$$renderer.push("<!--[0-->");
									Pane($$renderer, {
										defaultSize: 1 / 3,
										children: ($$renderer) => {
											Panel($$renderer, {
												title: "Console",
												hspan: 5,
												vspan: 1,
												children: ($$renderer) => {
													ShellNotebook($$renderer, {});
												},
												$$slots: { default: true }
											});
										},
										$$slots: { default: true }
									});
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						TipsDialog($$renderer, {
							categories: [
								"general",
								"coder",
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
						SetupPython($$renderer, {});
						$$renderer.push(`<!---->`);
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
