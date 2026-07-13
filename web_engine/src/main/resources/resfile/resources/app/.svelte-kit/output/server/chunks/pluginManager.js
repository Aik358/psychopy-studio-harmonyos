import "./internal.js";
import { D as escape_html, E as attr, a as bind_props, b as setContext, f as stringify, i as await_block, m as html, o as derived, s as ensure_array_like, t as attr_class, v as getContext } from "./server.js";
import { K as electron, M as Dialog, R as Button, Y as python$1, c as CodeOutput, j as MessageDialog } from "./Theme.js";
import { _ as Notebook, h as Page } from "./TipsDialog.js";
import { marked } from "marked";
//#region src/lib/dialogs/pluginManager/ProgressDlg.svelte
function ProgressDlg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { tag, shown = void 0 } = $$props;
		let output = "";
		electron.windows.listen(tag, (evt, value) => output += value);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			MessageDialog($$renderer, {
				title: "Progress",
				buttons: { OK: (evt) => output = "" },
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="output-container svelte-bcfzsa">`);
					CodeOutput($$renderer, {
						get value() {
							return output;
						},
						set value($$value) {
							output = $$value;
							$$settled = false;
						}
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
//#region src/lib/dialogs/pluginManager/plugins/PluginItem.svelte
function PluginItem($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { plugin, venv = void 0 } = $$props;
		let siblings = getContext("siblings");
		let showProgress = false;
		let installed = derived(() => Object.keys(siblings.installed).includes(plugin.pipname));
		async function install(evt) {
			showProgress = true;
			return await python$1.venv.installPackage(venv, plugin.pipname).then((resp) => python$1.venv.getPackages(venv).then((packages) => siblings.installed = packages));
		}
		async function uninstall(evt) {
			showProgress = true;
			return await python$1.venv.uninstallPackage(venv, plugin.pipname).then((resp) => python$1.venv.getPackages(venv).then((packages) => siblings.installed = packages));
		}
		function page($$renderer) {
			$$renderer.push(`<div class="plugin-page svelte-9lg84r"><div class="title svelte-9lg84r"><img class="plugin-avatar svelte-9lg84r"${attr("src", plugin.icon)}${attr("alt", plugin.pipname)}/> <a${attr("href", plugin.homepage)} class="plugin-name svelte-9lg84r">${escape_html(plugin.name)}</a> <code class="plugin-pipname svelte-9lg84r">${escape_html(plugin.pipname)}</code> <div class="plugin-install-btn svelte-9lg84r">`);
			if (!installed()) {
				$$renderer.push("<!--[0-->");
				Button($$renderer, {
					label: "Install",
					icon: "/icons/btn-download.svg",
					onclick: install,
					horizontal: true,
					disabled: venv === void 0
				});
			} else {
				$$renderer.push("<!--[-1-->");
				Button($$renderer, {
					label: "Uninstall",
					icon: "/icons/btn-delete.svg",
					onclick: uninstall,
					horizontal: true,
					disabled: venv === void 0
				});
			}
			$$renderer.push(`<!--]--></div></div> <!--[-->`);
			const each_array = ensure_array_like((plugin.description || "").split("\n"));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let line = each_array[$$index];
				$$renderer.push(`<p>${escape_html(line)}</p>`);
			}
			$$renderer.push(`<!--]--> `);
			ProgressDlg($$renderer, {
				tag: `uv:${stringify(plugin.pipname)}`,
				get shown() {
					return showProgress;
				},
				set shown($$value) {
					showProgress = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----></div>`);
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<button${attr_class("plugin-item svelte-9lg84r", void 0, {
				"selected": siblings.selected === page,
				"installed": installed()
			})}><img class="plugin-avatar svelte-9lg84r"${attr("src", plugin.icon)}${attr("alt", plugin.pipname)}/> <div class="plugin-name svelte-9lg84r">${escape_html(plugin.name)}</div> <code class="plugin-pipname svelte-9lg84r">${escape_html(plugin.pipname)}</code> <div class="plugin-install-btn svelte-9lg84r"></div></button>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { venv });
	});
}
//#endregion
//#region src/lib/dialogs/pluginManager/plugins/PluginsPanel.svelte
function PluginsPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { venv = void 0 } = $$props;
		let children = {
			selected: void 0,
			installed: {},
			all: []
		};
		setContext("siblings", children);
		let searchterm = "";
		function matches(term, profile) {
			return profile.name.toLowerCase().includes(term.toLowerCase()) || profile.pipname.toLowerCase().includes(term.toLowerCase()) || profile.description.toLowerCase().includes(term.toLowerCase()) || profile.keywords.includes(term) || term === "";
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="plugins-ctrl svelte-16dd1s5"><div class="plugin-list-ctrl svelte-16dd1s5"><input type="search"${attr("value", searchterm)}/> <div class="plugins-list svelte-16dd1s5">`);
			await_block($$renderer, fetch("/api/plugins").then((resp) => resp.json()), () => {
				$$renderer.push(`<div class="message svelte-16dd1s5">Getting plugins...</div>`);
			}, (plugins) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(plugins.sort((x, y) => +Object.keys(children.installed).includes(y.pipname) - +Object.keys(children.installed).includes(x.pipname)));
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let profile = each_array[$$index];
					if (matches(searchterm, profile)) {
						$$renderer.push("<!--[0-->");
						PluginItem($$renderer, {
							plugin: profile,
							get venv() {
								return venv;
							},
							set venv($$value) {
								venv = $$value;
								$$settled = false;
							}
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`<!--]--></div></div> <div class="selected-plugin svelte-16dd1s5">`);
			children.selected?.($$renderer);
			$$renderer.push(`<!----></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { venv });
	});
}
//#endregion
//#region src/lib/dialogs/pluginManager/packages/PackageItem.svelte
function PackageItem($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		new TextDecoder();
		let { name, getProfile = (name) => {}, venv = void 0 } = $$props;
		let siblings = getContext("siblings");
		siblings.all.push(name);
		let showProgress = false;
		let installed = derived(() => Object.keys(siblings.installed).includes(name));
		async function install(evt) {
			showProgress = true;
			return await python.venv.installPackage(venv, name).then((resp) => python.venv.getPackages(venv).then((packages) => siblings.installed = packages));
		}
		async function uninstall(evt) {
			showProgress = true;
			return await python.venv.uninstallPackage(venv, name).then((resp) => python.venv.getPackages(venv).then((packages) => siblings.installed = packages));
		}
		function page($$renderer) {
			$$renderer.push(`<div class="package-page svelte-ijdwrr">`);
			await_block($$renderer, getProfile(name), () => {
				$$renderer.push(`<h2>Getting package details...</h2>`);
			}, (profile) => {
				$$renderer.push(`<div class="package-name svelte-ijdwrr"><code>${escape_html(profile.info.name)}</code></div> <div class="ctrls">`);
				if (!installed()) {
					$$renderer.push("<!--[0-->");
					Button($$renderer, {
						label: "Install",
						icon: "/icons/btn-download.svg",
						onclick: install,
						horizontal: true
					});
				} else {
					$$renderer.push("<!--[-1-->");
					Button($$renderer, {
						label: "Uninstall",
						icon: "/icons/btn-delete.svg",
						onclick: uninstall,
						horizontal: true
					});
				}
				$$renderer.push(`<!--]--></div> <div class="package-desc svelte-ijdwrr">${html(marked(profile.info.description || ""))}</div>`);
			});
			$$renderer.push(`<!--]--> `);
			ProgressDlg($$renderer, {
				tag: `uv:${stringify(name)}`,
				get shown() {
					return showProgress;
				},
				set shown($$value) {
					showProgress = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----></div>`);
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<button${attr_class("package-item svelte-ijdwrr", void 0, {
				"installed": installed(),
				"selected": siblings.selected === page
			})}>${escape_html(name)}</button>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { venv });
	});
}
//#endregion
//#region src/lib/dialogs/pluginManager/packages/PackagesPanel.svelte
function PackagesPanel($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		new TextDecoder();
		let { venv = void 0 } = $$props;
		let children = {
			selected: void 0,
			installed: {},
			all: []
		};
		setContext("siblings", children);
		let searchterm = "";
		function matches(term, name) {
			return name.includes(term.toLowerCase()) || term === "";
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="packages-ctrl svelte-1i487ih"><div class="package-list-ctrl svelte-1i487ih"><input type="search"${attr("value", searchterm)}/> <div class="packages-list svelte-1i487ih"><!--[-->`);
			const each_array = ensure_array_like(Object.keys(children.installed));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let name = each_array[$$index];
				if (matches(searchterm, name)) {
					$$renderer.push("<!--[0-->");
					PackageItem($$renderer, {
						name,
						getProfile: (name) => python$1.venv.getPackageDetails(venv, name),
						get venv() {
							return venv;
						},
						set venv($$value) {
							venv = $$value;
							$$settled = false;
						}
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div> <div class="package-details svelte-1i487ih">`);
			children.selected?.($$renderer);
			$$renderer.push(`<!----></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { venv });
	});
}
//#endregion
//#region src/lib/dialogs/pluginManager/Dialog.svelte
function Dialog_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0 } = $$props;
		let pages = { current: void 0 };
		let venv = "app";
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				id: "plugin-mgr",
				title: "Plugins & packages",
				buttons: { OK: (evt) => {} },
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="container svelte-1kblc8q"><div class="environment-ctrl svelte-1kblc8q">Python environment: `);
					$$renderer.select({ value: venv }, ($$renderer) => {
						await_block($$renderer, python$1.venv.executable("app"), () => {}, (appExecutable) => {
							await_block($$renderer, python$1.uv.getEnvironments(), () => {
								$$renderer.option({}, ($$renderer) => {
									$$renderer.push(`Scanning Python environments...`);
								});
							}, (environments) => {
								$$renderer.push(`<!--[-->`);
								const each_array = ensure_array_like(environments);
								for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
									let env = each_array[$$index];
									$$renderer.option({ value: env.executable === appExecutable ? "app" : env.psychopyVersion }, ($$renderer) => {
										$$renderer.push(`${escape_html(env.psychopyVersion)} `);
										if (env.executable === appExecutable) {
											$$renderer.push("<!--[0-->");
											$$renderer.push(`(default)`);
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]-->`);
									});
								}
								$$renderer.push(`<!--]-->`);
							});
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`<!--]-->`);
					});
					$$renderer.push(`</div> `);
					Notebook($$renderer, {
						children: ($$renderer) => {
							var bind_get = () => pages.current === "plugins";
							var bind_set = (value) => pages.current = "plugins";
							var bind_get_1 = () => pages.current === "packages";
							var bind_set_1 = (value) => pages.current = "packages";
							Page($$renderer, {
								label: "Plugins",
								get selected() {
									return bind_get();
								},
								set selected($$value) {
									bind_set($$value);
								},
								children: ($$renderer) => {
									PluginsPanel($$renderer, {
										get venv() {
											return venv;
										},
										set venv($$value) {
											venv = $$value;
											$$settled = false;
										}
									});
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!----> `);
							Page($$renderer, {
								label: "Packages",
								get selected() {
									return bind_get_1();
								},
								set selected($$value) {
									bind_set_1($$value);
								},
								children: ($$renderer) => {
									PackagesPanel($$renderer, {
										get venv() {
											return venv;
										},
										set venv($$value) {
											venv = $$value;
											$$settled = false;
										}
									});
								},
								$$slots: { default: true }
							});
							$$renderer.push(`<!---->`);
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
export { Dialog_1 as t };
