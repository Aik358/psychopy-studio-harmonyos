import "../../../chunks/internal.js";
import { D as escape_html, E as attr, a as bind_props, b as setContext, et as snapshot, f as stringify, i as await_block, n as attr_style, s as ensure_array_like, v as getContext } from "../../../chunks/server.js";
import { A as IconButton, B as Icon, F as CompactButton, H as openIn, K as electron, O as RadioButton, P as Menu, R as Button, U as showDevTools, W as showWindow, Y as python, c as CodeOutput, d as Version, f as browseFileOpen, h as parsePath, i as Experiment, k as SwitchButton, n as prefs, o as SetupPython, p as browseFileSave, q as git, r as Script, t as Theme, u as setupPython } from "../../../chunks/Theme.js";
import { C as Pane_resizer, D as Panel$1, E as Frame, S as Shortcuts, T as Pane_group, _ as Notebook, a as BugReport, b as Item, f as UserCtrl, h as Page, i as Ribbon, n as Gap, o as PrefsDialog, r as Section, t as TipsDialog, v as SubMenu, w as Pane, y as Separator } from "../../../chunks/TipsDialog.js";
import path from "path-browserify";
//#region src/routes/runner/outputs/AlertsOutput.svelte
function AlertsOutput($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		$$renderer.push(`<div class="alerts-output svelte-iw39i4"><div class="alerts-array svelte-iw39i4"><!--[-->`);
		const each_array = ensure_array_like(current.output.alerts);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let message = each_array[$$index];
			$$renderer.push(`<div class="alert svelte-iw39i4"><h3 class="svelte-iw39i4">${escape_html(message.cat)} Alert</h3> <code class="alert-code svelte-iw39i4">#${escape_html(message.code)}</code> <span class="alert-msg">${escape_html(message.msg)}</span> <a${attr("href", `https://docs.psychopy.org/alerts/${stringify(message.code)}.html`)} target="_blank"${attr_style("", { "grid-column-start": "content" })}>More info</a></div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="alerts-ctrls svelte-iw39i4">`);
		CompactButton($$renderer, {
			icon: "/icons/btn-clear.svg",
			onclick: (evt) => current.output.alerts.length = 0,
			tooltip: "Clear alerts"
		});
		$$renderer.push(`<!----></div></div>`);
	});
}
//#endregion
//#region src/routes/runner/globals.svelte.js
var current = {
	user: void 0,
	selection: void 0,
	runlist: [],
	file: void 0,
	tab: "alerts",
	output: {
		alerts: [],
		stdout: "",
		pavlovia: ""
	},
	awaiting: {
		runpy: Promise.resolve(""),
		runjs: Promise.resolve("")
	},
	tip: { shown: false }
};
//#endregion
//#region src/routes/runner/callbacks.svelte.js
async function addFile(file, pilotMode = void 0) {
	let item;
	if (typeof file === "string") file = parsePath(file);
	if (current.runlist.some((item) => item.file.file === file.file)) {
		current.selection = current.runlist.findIndex((item) => item.file.file === file.file);
		return;
	}
	if (file.ext === ".psyrun") {
		for (let subfile of await loadPsyrun(file)) addFile(subfile.file, subfile.pilotMode);
		return;
	}
	if (file.ext === ".psyexp") {
		item = new Experiment("untitled.psyexp");
		await item.fromFile(file);
	}
	if (file.ext === ".py") item = new Script(file);
	if (!item) return;
	if (pilotMode !== void 0) item.pilotMode = pilotMode;
	current.runlist.push(item);
	current.selection = current.runlist.length;
}
async function loadPsyrun(file) {
	let content = await electron.files.load(file.file);
	let output = [];
	for (let item of JSON.parse(content)) output.push({
		file: parsePath(path.join(item.path, item.file)),
		pilotMode: item.pilotMode
	});
	return output;
}
function fileNew() {
	current.runlist.length = 0;
	current.file = void 0;
}
/**
* Open a file browser to get files.
* 
* @param {object} current Current Runner setup (from getContext)
* @param {boolean} replace If true, then replace existing files with ones selected
*/
async function fileOpen(replace = false) {
	let allowedFiles;
	if (replace) allowedFiles = [{
		description: "PsychoPy Runner Configurations",
		accept: { "application/x-python-code": [".psyrun"] }
	}];
	else allowedFiles = [
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
	let file = await browseFileOpen(allowedFiles, "");
	if (file === void 0) return;
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
		if (electron) await electron.files.save(snapshot(current.file.file), output);
		else {
			let file = await current.file.handle.createWritable();
			file.seek(0);
			file.write(output);
			file.close();
		}
	} else return fileSaveAs();
}
async function fileSaveAs() {
	let file = await browseFileSave([{
		description: "PsychoPy Runner Configurations",
		accept: { "application/xml": [".psyrun"] }
	}], current.file?.file || "untitled.psyrun");
	if (file === void 0) return;
	current.file = file;
	await fileSave();
	return current.file;
}
function quit() {
	if (electron) electron.quit();
}
function togglePiloting() {
	if (current.runlist[current.selection]) current.runlist[current.selection].pilotMode = !current.runlist[current.selection]?.pilotMode;
}
var shortcuts = {
	new: fileNew,
	open: fileOpen,
	save: fileSave,
	saveAs: fileSaveAs,
	close,
	quit,
	togglePiloting,
	showDevTools
};
//#endregion
//#region src/routes/runner/files/Panel.svelte
function Panel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="panel svelte-q8ea2z"><div class="items svelte-q8ea2z"><!--[-->`);
			const each_array = ensure_array_like(Object.entries(current.runlist));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [i, item] = each_array[$$index];
				$$renderer.push(`<div class="item svelte-q8ea2z">`);
				Icon($$renderer, { src: `/icons/btn-${item.pilotMode ? "pilot" : "run"}py.svg` });
				$$renderer.push(`<!----> `);
				RadioButton($$renderer, {
					value: parseInt(i),
					label: `${item.file.name.length > 40 ? "..." : ""}${stringify(item.file.name.slice(-40))}`,
					tooltip: item.file.file,
					icon: `/icons/btn-${item instanceof Experiment ? "builder" : "coder"}.svg`,
					get selection() {
						return current.selection;
					},
					set selection($$value) {
						current.selection = $$value;
						$$settled = false;
					}
				});
				$$renderer.push(`<!----> `);
				CompactButton($$renderer, {
					icon: "/icons/btn-delete.svg",
					onclick: (evt) => delete current.runlist[parseInt(i)]
				});
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]--></div> <div class="ctrls svelte-q8ea2z">`);
			Button($$renderer, {
				label: "Add file",
				icon: "/icons/btn-add.svg",
				onclick: (evt) => fileOpen(false),
				horizontal: true
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
//#region src/routes/runner/outputs/StdoutOutput.svelte
function StdoutOutput($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function ctrls($$renderer) {
					CompactButton($$renderer, {
						icon: "/icons/btn-clear.svg",
						onclick: (evt) => current.output.stdout = "",
						tooltip: "Clear stdout"
					});
				}
				CodeOutput($$renderer, {
					get value() {
						return current.output.stdout;
					},
					set value($$value) {
						current.output.stdout = $$value;
						$$settled = false;
					},
					ctrls,
					$$slots: { ctrls: true }
				});
			}
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
//#region src/routes/runner/outputs/PavloviaOutput.svelte
function PavloviaOutput($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function ctrls($$renderer) {
					CompactButton($$renderer, {
						icon: "/icons/btn-clear.svg",
						onclick: (evt) => current.output.pavlovia = "",
						tooltip: "Clear pavlovia output"
					});
				}
				CodeOutput($$renderer, {
					get value() {
						return current.output.pavlovia;
					},
					set value($$value) {
						current.output.pavlovia = $$value;
						$$settled = false;
					},
					ctrls,
					$$slots: { ctrls: true }
				});
			}
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
//#region src/routes/runner/ribbon/Menu.svelte
function Menu_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { shown = void 0 } = $$props;
		let show = {
			prefsDlg: false,
			findDlg: false,
			settingsDlg: false,
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
								onclick: fileNew
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-open.svg",
								label: "Open file",
								shortcut: "open",
								onclick: fileOpen
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-save.svg",
								label: "Save file",
								shortcut: "save",
								onclick: fileSave
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								icon: "/icons/btn-saveas.svg",
								label: "Save file as",
								shortcut: "saveAs",
								onclick: fileSaveAs
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
							$$renderer.push(`<!----> `);
							if (electron) {
								$$renderer.push("<!--[0-->");
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
					SubMenu($$renderer, {
						label: "View",
						icon: "/icons/rbn-windows.svg",
						children: ($$renderer) => {
							Item($$renderer, {
								label: "Show Builder",
								onclick: (evt) => showWindow("builder")
							});
							$$renderer.push(`<!----> `);
							Item($$renderer, {
								label: "Show Coder",
								onclick: (evt) => showWindow("coder")
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
					if (electron) {
						$$renderer.push("<!--[0-->");
						SubMenu($$renderer, {
							label: "Run",
							icon: "/icons/btn-runpy.svg",
							disabled: current.selection === void 0,
							children: ($$renderer) => {
								Item($$renderer, {
									label: "Toggle pilot mode",
									onclick: togglePiloting,
									shortcut: "togglePilot",
									disabled: current.selection === void 0
								});
								$$renderer.push(`<!----> `);
								Separator($$renderer, {});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: `${current.runlist[current.selection]?.pilotMode ? "Pilot" : "Run"} in Python`,
									icon: `/icons/btn-${current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg`,
									onclick: (evt) => current.awaiting.runpy = current.runlist[current.selection]?.runPython(),
									shortcut: "runPython",
									disabled: current.selection === void 0
								});
								$$renderer.push(`<!----> `);
								Item($$renderer, {
									label: `${current.runlist[current.selection]?.pilotMode ? "Pilot" : "Run"} in browser`,
									icon: `/icons/btn-${current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg`,
									onclick: (evt) => current.awaiting.runjs = current.runlist[current.selection]?.runJS(),
									shortcut: "runJS",
									disabled: current.selection === void 0
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
										label: `PsychoPy ${stringify(version.major)}.${stringify(version.minor)}`,
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
			if (electron) {
				$$renderer.push("<!--[0-->");
				BugReport($$renderer, {
					user: current.user,
					context: current.runlist,
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
//#region src/routes/runner/ribbon/Ribbon.svelte
function Ribbon_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let { selection } = $$props;
		let show = {
			menu: false,
			settingsDlg: false,
			findDlg: false,
			deviceMgrDlg: false
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Ribbon($$renderer, {
				children: ($$renderer) => {
					Section($$renderer, {
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
					Section($$renderer, {
						label: "File",
						icon: "/icons/rbn-file.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-new.svg",
								label: "New configuration",
								onclick: (evt) => fileNew(),
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-open.svg",
								label: "Open configuration",
								onclick: (evt) => fileOpen(true).catch((err) => console.error(err)),
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-save.svg",
								label: "Save configuration",
								onclick: fileSave,
								borderless: true
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: "/icons/btn-saveas.svg",
								label: "Save configuration as",
								onclick: fileSaveAs,
								borderless: true
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Section($$renderer, {
						label: "Selection",
						icon: "/icons/rbn-experiment.svg",
						children: ($$renderer) => {
							var bind_get = () => current.runlist[current.selection]?.pilotMode;
							var bind_set = (value) => current.runlist[current.selection]?.setPilotMode(value);
							SwitchButton($$renderer, {
								labels: ["Pilot", "Run"],
								tooltip: `Experiment will run in ${current.runlist[current.selection]?.pilotMode ? "pilot" : "run"} mode`,
								get value() {
									return bind_get();
								},
								set value($$value) {
									bind_set($$value);
								},
								disabled: current.selection === void 0
							});
							$$renderer.push(`<!----> `);
							IconButton($$renderer, {
								icon: `/icons/btn-send${current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"}.svg`,
								label: `Open selection in ${current.runlist[current.selection]?.file.ext === ".psyexp" ? "Builder" : "Coder"}`,
								onclick: (evt) => openIn(current.runlist[current.selection]?.file.file, current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"),
								borderless: true,
								disabled: !current.runlist[current.selection]
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					if (python?.ready) {
						$$renderer.push("<!--[0-->");
						Section($$renderer, {
							label: "Run",
							icon: "/icons/btn-runpy.svg",
							children: ($$renderer) => {
								IconButton($$renderer, {
									icon: `/icons/btn-${current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg`,
									label: `${current.runlist[current.selection]?.pilotMode ? "Pilot" : "Run"} experiment locally`,
									onclick: (evt) => current.runlist[current.selection]?.runPython(),
									disabled: current.selection === void 0,
									cancel: python.scripts.stop,
									borderless: true,
									get awaiting() {
										return current.awaiting.runpy;
									},
									set awaiting($$value) {
										current.awaiting.runpy = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!----> `);
								IconButton($$renderer, {
									icon: `/icons/btn-${current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg`,
									label: `${current.runlist[current.selection]?.pilotMode ? "Pilot" : "Run"} experiment in browser`,
									onclick: (evt) => current.runlist[current.selection]?.runJS(),
									disabled: current.selection === void 0 || !(current.runlist[current.selection] instanceof Experiment),
									borderless: true,
									get awaiting() {
										return current.awaiting.runjs;
									},
									set awaiting($$value) {
										current.awaiting.runjs = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					Section($$renderer, {
						label: "Pavlovia",
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
						label: "Views",
						icon: "/icons/rbn-windows.svg",
						children: ($$renderer) => {
							IconButton($$renderer, {
								icon: "/icons/btn-builder.svg",
								label: "Builder view",
								onclick: (evt) => showWindow("builder"),
								borderless: true
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
									borderless: true,
									disabled: true
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
//#region src/routes/runner/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		setContext("current", current);
		let params = new URLSearchParams(location.search);
		if (params.get("fileOpen")) addFile(params.get("fileOpen"));
		if (electron) {
			electron.windows.listen("fileOpen", (evt, file) => addFile(file));
			electron.windows.emit("ready", true);
		}
		python.liaison.listen("alert", (evt, message) => {
			if (!current.output.alerts.some((item) => item.code === message.message.code)) current.output.alerts.push(message.message);
		});
		python.output.stdout.listen((evt, message) => current.output.stdout += `${message}\n`);
		python.output.stderr.listen((evt, message) => current.output.stdout += `${message}\n`);
		python.liaison.listen("error", (evt, message) => current.output.stdout += `${message.error}\n`);
		git.listen((evt, message) => {
			current.output.pavlovia += message + "\n";
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (current.runlist[current.selection]?.file?.name) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<title>PsychoPy Runner: ${escape_html(current.runlist[current.selection].file.name)}</title>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<title>PsychoPy Runner</title>`);
			}
			$$renderer.push(`<!--]--> `);
			{
				function ribbon($$renderer) {
					Ribbon_1($$renderer, {});
				}
				Frame($$renderer, {
					onFileDrop: (evt, file) => addFile(file),
					ribbon,
					children: ($$renderer) => {
						Pane_group($$renderer, {
							direction: "horizontal",
							children: ($$renderer) => {
								Pane($$renderer, {
									defaultSize: 1 / 3,
									children: ($$renderer) => {
										Panel$1($$renderer, {
											title: "Files",
											hspan: 1,
											vspan: 1,
											children: ($$renderer) => {
												Panel($$renderer, {});
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
									defaultSize: 2 / 3,
									children: ($$renderer) => {
										Panel$1($$renderer, {
											title: "Output",
											hspan: 2,
											vspan: 1,
											children: ($$renderer) => {
												Notebook($$renderer, {
													children: ($$renderer) => {
														var bind_get = () => current.tab === "alerts";
														var bind_set = (val) => {
															if (val) current.tab = "alerts";
														};
														var bind_get_1 = () => current.tab === "stdout";
														var bind_set_1 = (val) => {
															if (val) current.tab = "stdout";
														};
														var bind_get_2 = () => current.tab === "pavlovia";
														var bind_set_2 = (val) => {
															if (val) current.tab = "pavlovia";
														};
														Page($$renderer, {
															label: "Alerts",
															get selected() {
																return bind_get();
															},
															set selected($$value) {
																bind_set($$value);
															},
															children: ($$renderer) => {
																AlertsOutput($$renderer, {});
															},
															$$slots: { default: true }
														});
														$$renderer.push(`<!----> `);
														Page($$renderer, {
															label: "Stdout",
															get selected() {
																return bind_get_1();
															},
															set selected($$value) {
																bind_set_1($$value);
															},
															children: ($$renderer) => {
																StdoutOutput($$renderer, {});
															},
															$$slots: { default: true }
														});
														$$renderer.push(`<!----> `);
														Page($$renderer, {
															label: "Pavlovia",
															get selected() {
																return bind_get_2();
															},
															set selected($$value) {
																bind_set_2($$value);
															},
															children: ($$renderer) => {
																PavloviaOutput($$renderer, {});
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
									},
									$$slots: { default: true }
								});
								$$renderer.push(`<!---->`);
							},
							$$slots: { default: true }
						});
						$$renderer.push(`<!----> `);
						TipsDialog($$renderer, {
							categories: [
								"general",
								"runner",
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
