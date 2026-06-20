import { z as bind_props, F as attr_class, x as attr, G as ensure_array_like, J as stringify, y as await_block } from "./index.js";
import { b as MessageDialog, C as CodeOutput, B as Button, D as Dialog, N as Notebook, q as Page } from "./TipsDialog.js";
import { e as electron, p as python$1, k as html } from "./Theme.js";
import "@sveltejs/kit/internal/server";
import { j as getContext, k as escape_html, s as setContext } from "./context.js";
import "@monaco-editor/loader";
import { marked } from "marked";
function ProgressDlg($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { tag, shown = void 0 } = $$props;
    let output = "";
    electron.windows.listen(tag, (evt, value) => output += value);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      MessageDialog($$renderer3, {
        title: "Progress",
        buttons: { OK: (evt) => output = "" },
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="output-container svelte-bcfzsa">`);
          CodeOutput($$renderer4, {
            get value() {
              return output;
            },
            set value($$value) {
              output = $$value;
              $$settled = false;
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
function PluginItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { plugin, venv = void 0 } = $$props;
    let siblings = getContext("siblings");
    let showProgress = false;
    let installed = Object.keys(siblings.installed).includes(plugin.pipname);
    async function install(evt) {
      showProgress = true;
      return await python$1.venv.installPackage(venv, plugin.pipname).then((resp) => python$1.venv.getPackages(venv).then((packages) => siblings.installed = packages));
    }
    async function uninstall(evt) {
      showProgress = true;
      return await python$1.venv.uninstallPackage(venv, plugin.pipname).then((resp) => python$1.venv.getPackages(venv).then((packages) => siblings.installed = packages));
    }
    function page($$renderer3) {
      $$renderer3.push(`<div class="plugin-page svelte-9lg84r"><div class="title svelte-9lg84r"><img class="plugin-avatar svelte-9lg84r"${attr("src", plugin.icon)}${attr("alt", plugin.pipname)}/> <a${attr("href", plugin.homepage)} class="plugin-name svelte-9lg84r">${escape_html(plugin.name)}</a> <code class="plugin-pipname svelte-9lg84r">${escape_html(plugin.pipname)}</code> <div class="plugin-install-btn svelte-9lg84r">`);
      if (!installed) {
        $$renderer3.push("<!--[-->");
        Button($$renderer3, {
          label: "Install",
          icon: "/icons/btn-download.svg",
          onclick: install,
          horizontal: true,
          disabled: venv === void 0
        });
      } else {
        $$renderer3.push("<!--[!-->");
        Button($$renderer3, {
          label: "Uninstall",
          icon: "/icons/btn-delete.svg",
          onclick: uninstall,
          horizontal: true,
          disabled: venv === void 0
        });
      }
      $$renderer3.push(`<!--]--></div></div> <!--[-->`);
      const each_array = ensure_array_like((plugin.description || "").split("\n"));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let line = each_array[$$index];
        $$renderer3.push(`<p>${escape_html(line)}</p>`);
      }
      $$renderer3.push(`<!--]--> `);
      ProgressDlg($$renderer3, {
        tag: `uv:${stringify(plugin.pipname)}`,
        get shown() {
          return showProgress;
        },
        set shown($$value) {
          showProgress = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div>`);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button${attr_class("plugin-item svelte-9lg84r", void 0, {
        "selected": siblings.selected === page,
        "installed": installed
      })}><img class="plugin-avatar svelte-9lg84r"${attr("src", plugin.icon)}${attr("alt", plugin.pipname)}/> <div class="plugin-name svelte-9lg84r">${escape_html(plugin.name)}</div> <code class="plugin-pipname svelte-9lg84r">${escape_html(plugin.pipname)}</code> <div class="plugin-install-btn svelte-9lg84r"></div></button>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { venv });
  });
}
function PluginsPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { venv = void 0 } = $$props;
    let children = { selected: void 0, installed: {}, all: [] };
    setContext("siblings", children);
    let searchterm = "";
    function matches(term, profile) {
      return profile.name.toLowerCase().includes(term.toLowerCase()) || profile.pipname.toLowerCase().includes(term.toLowerCase()) || profile.description.toLowerCase().includes(term.toLowerCase()) || profile.keywords.includes(term) || term === "";
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="plugins-ctrl svelte-16dd1s5"><div class="plugin-list-ctrl svelte-16dd1s5"><input type="search"${attr("value", searchterm)}/> <div class="plugins-list svelte-16dd1s5">`);
      await_block(
        $$renderer3,
        fetch("/api/plugins").then((resp) => resp.json()),
        () => {
          $$renderer3.push(`<div class="message svelte-16dd1s5">Getting plugins...</div>`);
        },
        (plugins) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(plugins.sort((x, y) => +Object.keys(children.installed).includes(y.pipname) - +Object.keys(children.installed).includes(x.pipname)));
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let profile = each_array[$$index];
            if (matches(searchterm, profile)) {
              $$renderer3.push("<!--[-->");
              PluginItem($$renderer3, {
                plugin: profile,
                get venv() {
                  return venv;
                },
                set venv($$value) {
                  venv = $$value;
                  $$settled = false;
                }
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer3.push(`<!--]--></div></div> <div class="selected-plugin svelte-16dd1s5">`);
      children.selected?.($$renderer3);
      $$renderer3.push(`<!----></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { venv });
  });
}
function PackageItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    new TextDecoder();
    let { name, getProfile = (name2) => {
    }, venv = void 0 } = $$props;
    let siblings = getContext("siblings");
    siblings.all.push(name);
    let showProgress = false;
    let installed = Object.keys(siblings.installed).includes(name);
    async function install(evt) {
      showProgress = true;
      return await python.venv.installPackage(venv, name).then((resp) => python.venv.getPackages(venv).then((packages) => siblings.installed = packages));
    }
    async function uninstall(evt) {
      showProgress = true;
      return await python.venv.uninstallPackage(venv, name).then((resp) => python.venv.getPackages(venv).then((packages) => siblings.installed = packages));
    }
    function page($$renderer3) {
      $$renderer3.push(`<div class="package-page svelte-ijdwrr">`);
      await_block(
        $$renderer3,
        getProfile(name),
        () => {
          $$renderer3.push(`<h2>Getting package details...</h2>`);
        },
        (profile) => {
          $$renderer3.push(`<div class="package-name svelte-ijdwrr"><code>${escape_html(profile.info.name)}</code></div> <div class="ctrls">`);
          if (!installed) {
            $$renderer3.push("<!--[-->");
            Button($$renderer3, {
              label: "Install",
              icon: "/icons/btn-download.svg",
              onclick: install,
              horizontal: true
            });
          } else {
            $$renderer3.push("<!--[!-->");
            Button($$renderer3, {
              label: "Uninstall",
              icon: "/icons/btn-delete.svg",
              onclick: uninstall,
              horizontal: true
            });
          }
          $$renderer3.push(`<!--]--></div> <div class="package-desc svelte-ijdwrr">${html(marked(profile.info.description || ""))}</div>`);
        }
      );
      $$renderer3.push(`<!--]--> `);
      ProgressDlg($$renderer3, {
        tag: `uv:${stringify(name)}`,
        get shown() {
          return showProgress;
        },
        set shown($$value) {
          showProgress = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div>`);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button${attr_class("package-item svelte-ijdwrr", void 0, {
        "installed": installed,
        "selected": siblings.selected === page
      })}>${escape_html(name)}</button>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { venv });
  });
}
function PackagesPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    new TextDecoder();
    let { venv = void 0 } = $$props;
    let children = { selected: void 0, installed: {}, all: [] };
    setContext("siblings", children);
    let searchterm = "";
    function matches(term, name) {
      return name.includes(term.toLowerCase()) || term === "";
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="packages-ctrl svelte-1i487ih"><div class="package-list-ctrl svelte-1i487ih"><input type="search"${attr("value", searchterm)}/> <div class="packages-list svelte-1i487ih"><!--[-->`);
      const each_array = ensure_array_like(Object.keys(children.installed));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let name = each_array[$$index];
        if (matches(searchterm, name)) {
          $$renderer3.push("<!--[-->");
          PackageItem($$renderer3, {
            name,
            getProfile: (name2) => python$1.venv.getPackageDetails(venv, name2),
            get venv() {
              return venv;
            },
            set venv($$value) {
              venv = $$value;
              $$settled = false;
            }
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--> `);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div></div> <div class="package-details svelte-1i487ih">`);
      children.selected?.($$renderer3);
      $$renderer3.push(`<!----></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { venv });
  });
}
function Dialog_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0 } = $$props;
    let pages = { current: void 0 };
    let venv = "app";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "plugin-mgr",
        title: "Plugins & packages",
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
          $$renderer4.push(`<div class="container svelte-1kblc8q"><div class="environment-ctrl svelte-1kblc8q">Python environment: `);
          $$renderer4.select({ value: venv }, ($$renderer5) => {
            await_block($$renderer5, python$1.venv.executable("app"), () => {
            }, (appExecutable) => {
              await_block(
                $$renderer5,
                python$1.uv.getEnvironments(),
                () => {
                  $$renderer5.option({}, ($$renderer6) => {
                    $$renderer6.push(`Scanning Python environments...`);
                  });
                },
                (environments) => {
                  $$renderer5.push(`<!--[-->`);
                  const each_array = ensure_array_like(environments);
                  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                    let env = each_array[$$index];
                    $$renderer5.option(
                      {
                        value: env.executable === appExecutable ? "app" : env.psychopyVersion
                      },
                      ($$renderer6) => {
                        $$renderer6.push(`${escape_html(env.psychopyVersion)} `);
                        if (env.executable === appExecutable) {
                          $$renderer6.push("<!--[-->");
                          $$renderer6.push(`(default)`);
                        } else {
                          $$renderer6.push("<!--[!-->");
                        }
                        $$renderer6.push(`<!--]-->`);
                      }
                    );
                  }
                  $$renderer5.push(`<!--]-->`);
                }
              );
              $$renderer5.push(`<!--]-->`);
            });
            $$renderer5.push(`<!--]-->`);
          });
          $$renderer4.push(`</div> `);
          Notebook($$renderer4, {
            children: ($$renderer5) => {
              var bind_get = () => pages.current === "plugins";
              var bind_set = (value) => pages.current = "plugins";
              var bind_get_1 = () => pages.current === "packages";
              var bind_set_1 = (value) => pages.current = "packages";
              Page($$renderer5, {
                label: "Plugins",
                get selected() {
                  return bind_get();
                },
                set selected($$value) {
                  bind_set();
                },
                children: ($$renderer6) => {
                  PluginsPanel($$renderer6, {
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
              $$renderer5.push(`<!----> `);
              Page($$renderer5, {
                label: "Packages",
                get selected() {
                  return bind_get_1();
                },
                set selected($$value) {
                  bind_set_1();
                },
                children: ($$renderer6) => {
                  PackagesPanel($$renderer6, {
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
              $$renderer5.push(`<!---->`);
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
export {
  Dialog_1 as D
};
