import { clsx } from "clsx";
import { e as electron, s as snapshot, r as resolve, I as Icon, a as asset, H as HasParams, p as python$1, l as status, k as html, d as parsePath, n as devices, w as writeFile, o as readFile, c as prefs, f as browseFileOpen, P as Param, j as profiles, i as pending, g as browseFileSave } from "./Theme.js";
import { N as ATTACHMENT_KEY, K as attr_style, z as bind_props, y as await_block, x as attr, F as attr_class, G as ensure_array_like, J as stringify, O as derived, P as props_id, Q as attributes, T as spread_props } from "./index.js";
import "@sveltejs/kit/internal/server";
import { l as ssr_context, k as escape_html, j as getContext, s as setContext, m as run, p as hasContext } from "./context.js";
import "@monaco-editor/loader";
import { marked } from "marked";
import parse from "style-to-object";
import path from "path-browserify";
import xmlFormat from "xml-formatter";
function createAttachmentKey() {
  return Symbol(ATTACHMENT_KEY);
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
async function tick() {
}
function newWindow(target) {
  if (electron) {
    return electron.windows.new(target);
  } else {
    return window.open(resolve(`/${target}`));
  }
}
async function openIn(file, target) {
  if (electron) {
    let windows = await electron.windows.get(target);
    let id;
    if (windows.length) {
      id = windows[0];
    } else {
      id = await electron.windows.new(target);
    }
    await electron.windows.send(id, "fileOpen", snapshot(file));
    await electron.windows.focus(id);
  }
}
async function showWindow(target) {
  if (electron) {
    let windows = await electron.windows.get(target);
    let id;
    if (windows.length) {
      id = windows[0];
    } else {
      id = await electron.windows.new(target);
    }
    await electron.windows.focus(id);
  }
}
function showDevTools() {
  if (electron) {
    electron.windows.devtools();
  }
}
function Tooltip($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** State to use to show/hide the tooltip */
      shown = false,
      /** @prop @type {number} Delay before showing this tooltip */
      delay = 0.5,
      /** @prop @type {string} Where to show the tooltip, relative to its parent */
      position = "right",
      /** @interface */
      children
    } = $$props;
    if (shown) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="tooltip svelte-1oc2e70"${attr_style("", {
        inset: {
          "top": "auto auto calc(100% + .5rem) 0",
          "top-right": "auto 0 calc(100% + .5rem) auto",
          "bottom": "calc(100% + .5rem) auto auto 0",
          "bottom-right": "calc(100% + .5rem) 0 auto auto",
          "left": "auto calc(100% + .5rem) auto auto",
          "right": "auto auto auto calc(100% + .5rem)"
        }[position]
      })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { shown });
  });
}
function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Label for this button */
      label,
      /** @prop @type {string|undefined} Path to icon for this button, if any */
      icon = void 0,
      /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
      onclick,
      /** @prop @type {string|undefined} Hover text for this button, if any */
      tooltip = void 0,
      /** @prop @type {boolean} Is this button the primary action? */
      primary = false,
      /** @prop @type {boolean} Is this button an affirmative response? */
      affirmative = false,
      /** @prop @type {boolean} Is this button a negative response? */
      negative = false,
      /** @prop @type {boolean} Set the layout of this button to horizontal */
      horizontal = false,
      /** @prop @type {boolean} Set the layout of this button to vertical */
      vertical = false,
      /** @prop @type {boolean} Are we awaiting execution of this button? */
      awaiting = void 0,
      /** If action is cancellable, supply a function to cancel it */
      cancel = void 0,
      /** @prop @type {boolean} Disable this button */
      disabled = false
    } = $$props;
    let show = { tooltip: false };
    function button($$renderer3, status2) {
      $$renderer3.push(`<button${attr("disabled", disabled, true)}${attr_class("svelte-ift51n", void 0, {
        "vertical": vertical,
        "horizontal": horizontal,
        "primary": primary,
        "affirmative": affirmative,
        "negative": negative
      })}>`);
      if (tooltip) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
          position: vertical ? "bottom" : "right",
          get shown() {
            return show.tooltip;
          },
          set shown($$value) {
            show.tooltip = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->${escape_html({
              ready: tooltip,
              awaiting: label + (cancel ? " (cancel)" : ""),
              error: "Failed, click to show error"
            }[status2])}`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (icon) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="icon-container svelte-ift51n">`);
        Icon($$renderer3, {
          src: {
            ready: icon,
            awaiting: show.tooltip && cancel ? "/icons/sym-cancel.svg" : "/icons/sym-pending.svg",
            error: "/icons/sym-error.svg"
          }[status2],
          size: vertical ? "2.75rem" : "2.25rem"
        });
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <span class="label svelte-ift51n">${escape_html(label)}</span></button>`);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      await_block(
        $$renderer3,
        awaiting,
        () => {
          button($$renderer3, "awaiting");
        },
        () => {
          button($$renderer3, "ready");
        }
      );
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { awaiting });
  });
}
function PanelButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Label for this button */
      label,
      /** @prop @type {string|undefined} Hover text for this button, if any */
      tooltip = void 0,
      /** @bindable State controlling whether this panel button is open */
      open = void 0,
      /** @interface */
      children = void 0
    } = $$props;
    $$renderer2.push(`<button${attr_class("panel-button svelte-ec1cpd", void 0, { "active": open })}>`);
    if (tooltip) {
      $$renderer2.push("<!--[-->");
      Tooltip($$renderer2, {
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->${escape_html(tooltip)}`);
        },
        $$slots: { default: true }
      });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> ${escape_html(label)} <svg${attr_class("panel-indicator svelte-ec1cpd", void 0, { "open": open })}><use${attr("href", asset("/icons/sym-arrow-right.svg"))}></use></svg></button> `);
    if (open) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="toggled-panel">`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { open });
  });
}
function CompactButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string|undefined} Path to icon for this button, if any */
      icon = void 0,
      /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
      onclick,
      /** @prop @type {string|undefined} Hover text for this button, if any */
      tooltip = void 0,
      /** Are we awaiting execution of this button? */
      awaiting = false,
      /** @prop @type {boolean} Disable this button */
      disabled = false
    } = $$props;
    let showTooltip = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button${attr("disabled", disabled, true)} class="svelte-l2irno"${attr_style("", { "z-index": showTooltip ? 10 : "inherit" })}>`);
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
        Icon($$renderer3, {
          src: icon,
          size: "1.25rem",
          get awaiting() {
            return awaiting;
          },
          set awaiting($$value) {
            awaiting = $$value;
            $$settled = false;
          }
        });
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
    bind_props($$props, { awaiting });
  });
}
function Menu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @public @type {import("svelte").store<boolean|undefined>} Whether this menu is shown */
      shown = void 0,
      position = { x: void 0, y: void 0 },
      children = void 0
    } = $$props;
    let closeParent = getContext("closeMenu");
    function close() {
      shown = false;
      if (closeParent) {
        closeParent();
      }
    }
    setContext("closeMenu", close);
    if (shown) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="menu svelte-1ggz3x8"${attr_style("", {
        position: position.x || position.y ? "fixed" : "absolute",
        left: position.x ? `${position.x}px` : "100%",
        top: position.y ? `${position.y}px` : "0"
      })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { shown, position, close });
  });
}
function DropdownButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Label for this button */
      label,
      /** @prop @type {string|undefined} Path to icon for this button, if any */
      icon = void 0,
      /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is pressed */
      onclick,
      /** @prop @type {string|undefined} Hover text for this button, if any */
      tooltip = void 0,
      /** Are we awaiting execution of this button? */
      awaiting = false,
      /** @prop @type {boolean} Disable this button */
      disabled = false,
      /** @interface Inner contents of menu to be shown when button is clicked */
      children = void 0
    } = $$props;
    let showTooltip = false;
    let showMenu = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="dropdown-button svelte-1ssdkei"><button class="action-btn svelte-1ssdkei"${attr("disabled", disabled, true)}>`);
      if (icon) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="icon-container svelte-1ssdkei">`);
        Icon($$renderer3, {
          src: icon,
          size: "2rem",
          get awaiting() {
            return awaiting;
          },
          set awaiting($$value) {
            awaiting = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <span class="label svelte-1ssdkei">`);
      await_block(
        $$renderer3,
        awaiting,
        () => {
          $$renderer3.push(`...`);
        },
        () => {
          $$renderer3.push(`${escape_html(label)}`);
        }
      );
      $$renderer3.push(`<!--]--></span> `);
      if (tooltip) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
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
      $$renderer3.push(`<!--]--></button> <button class="more-btn svelte-1ssdkei" aria-label="v"><div class="chevron svelte-1ssdkei">`);
      Icon($$renderer3, { src: "/icons/sym-arrow-down.svg" });
      $$renderer3.push(`<!----></div></button> `);
      Menu($$renderer3, {
        get shown() {
          return showMenu;
        },
        set shown($$value) {
          showMenu = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          children?.($$renderer4);
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { awaiting });
  });
}
function Message($$renderer, $$props) {
  let { message, icon = void 0, onclick = (evt) => {
  } } = $$props;
  $$renderer.push(`<button class="message svelte-mhbb2s">`);
  if (icon) {
    $$renderer.push("<!--[-->");
    Icon($$renderer, { src: icon, size: "1.5em" });
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> ${escape_html(message)}</button>`);
}
function MessageArray($$renderer, $$props) {
  let { children } = $$props;
  $$renderer.push(`<div class="message-array svelte-1859pst">`);
  children?.($$renderer);
  $$renderer.push(`<!----></div>`);
}
function Dialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      /** @prop @type {string} Text to display in the title bar of this dialog */
      title = "",
      /** @prop @type {OK: function|undefined, APPLY: function|undefined, CANCEL: function|undefined, HELP: string|undefined} Standard dialog buttons to display, with additional callback functions (or navigation link, in the case of HELP) */
      buttons = {
        OK: void 0,
        APPLY: void 0,
        YES: void 0,
        NO: void 0,
        CANCEL: void 0,
        HELP: void 0,
        EXTRA: []
      },
      /** @bindable State controlling whether each button is disabled */
      buttonsDisabled = {},
      /** @bindable @type {Boolean} State dictating whether this dialog is shown */
      shown = void 0,
      /** @prop @type {Function} Function to execute when this dialog is opened */
      onopen = () => {
      },
      /** @prop @type {Function} Function to execute when this dialog is closed */
      onclose = () => {
      },
      /** @prop @type {Boolean} Determines whether the dialog box should shrink to fit its contents */
      shrink = false,
      /** @interface */
      children = void 0
    } = $$props;
    $$renderer2.push(`<dialog${attr("id", id)} class="svelte-1ivrnji">`);
    if (shown) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="title svelte-1ivrnji"><label${attr("for", id)} class="svelte-1ivrnji">${escape_html(title)}</label> <div class="gap"></div> <div class="title-btns svelte-1ivrnji"><button id="close" class="svelte-1ivrnji">`);
      Icon($$renderer2, { src: "/icons/sym-close.svg", size: ".75rem" });
      $$renderer2.push(`<!----></button></div></div> <div class="content svelte-1ivrnji"${attr_style("", { height: shrink ? "fit-content" : "80vh" })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div> <div class="buttons svelte-1ivrnji"><div class="btn-array extra svelte-1ivrnji">`);
      if (buttons.HELP) {
        $$renderer2.push("<!--[-->");
        Button($$renderer2, {
          label: "Help",
          onclick: () => {
            window.open(buttons.HELP, "_blank").focus();
          },
          horizontal: true
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="gap"></div> <div class="btn-array standard svelte-1ivrnji">`);
      if (buttons.YES) {
        $$renderer2.push("<!--[-->");
        Button($$renderer2, {
          label: "Yes",
          onclick: (evt) => {
            buttons["YES"](evt);
            shown = false;
          },
          affirmative: true,
          horizontal: true,
          disabled: buttonsDisabled && buttonsDisabled["YES"]
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (buttons.NO) {
        $$renderer2.push("<!--[-->");
        Button($$renderer2, {
          label: "No",
          onclick: (evt) => {
            buttons["NO"](evt);
            shown = false;
          },
          horizontal: true,
          negative: true,
          disabled: buttonsDisabled && buttonsDisabled["NO"]
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (buttons.OK) {
        $$renderer2.push("<!--[-->");
        Button($$renderer2, {
          label: "OK",
          onclick: (evt) => {
            buttons["OK"](evt);
            shown = false;
          },
          primary: true,
          horizontal: true,
          disabled: buttonsDisabled && buttonsDisabled["OK"]
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (buttons.APPLY) {
        $$renderer2.push("<!--[-->");
        Button($$renderer2, {
          label: "Apply",
          onclick: (evt) => {
            buttons["APPLY"](evt);
          },
          horizontal: true,
          disabled: buttonsDisabled && buttonsDisabled["APPLY"]
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (buttons.EXTRA) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(Object.entries(buttons["EXTRA"]));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let [label, onclick] = each_array[$$index];
          Button($$renderer2, {
            label,
            onclick,
            horizontal: true,
            disabled: buttonsDisabled && buttonsDisabled["EXTRA"] && buttonsDisabled["EXTRA"][label]
          });
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (buttons.CANCEL) {
        $$renderer2.push("<!--[-->");
        Button($$renderer2, {
          label: "Cancel",
          onclick: (evt) => {
            buttons["CANCEL"](evt);
            shown = false;
          },
          horizontal: true,
          disabled: buttonsDisabled && buttonsDisabled["CANCEL"]
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></dialog>`);
    bind_props($$props, { shown });
  });
}
function MessageDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      /** @prop @type {String} Text to display in the title bar of this dialog */
      title = "",
      /** @prop @type {OK: function|undefined, APPLY: function|undefined, CANCEL: function|undefined, HELP: string|undefined} Standard dialog buttons to display, with additional callback functions (or navigation link, in the case of HELP) */
      buttons = {
        OK: void 0,
        APPLY: void 0,
        YES: void 0,
        NO: void 0,
        CANCEL: void 0,
        HELP: void 0
      },
      /** @bindable State controlling whether each button is disabled */
      buttonsDisabled = {},
      /** @returns @type {HTMLElement} Handle of this dialog's HTML Element */
      shown = void 0,
      /** @prop Children are assumed to be the message */
      children = void 0
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id,
        title,
        buttons,
        buttonsDisabled,
        shrink: true,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="dlg-message svelte-k1g2ah">`);
          children?.($$renderer4);
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
function IconButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Text label for this button, if any */
      label = "",
      /** @prop @type {string} Icon for this button, if any */
      icon = void 0,
      /** @prop @type {function} Function to call when this button is clicked */
      onclick = (evt) => {
      },
      /** @prop @type {boolean} Disable this button */
      disabled = false,
      /** @prop @type {boolean} Only show border when hovered (looks better in the ribbon) */
      borderless = false,
      /** Are we awaiting execution of this button? */
      awaiting = false,
      /** If action is cancellable, supply a function to cancel it */
      cancel = void 0,
      /** @interface */
      children = void 0
    } = $$props;
    let show = { tooltip: false };
    function button($$renderer3, status2) {
      $$renderer3.push(`<button${attr("disabled", disabled, true)}${attr_class("svelte-8kbl6a", void 0, { "borderless": borderless })}>`);
      Icon($$renderer3, {
        src: {
          ready: icon,
          awaiting: show.tooltip && cancel ? "/icons/sym-cancel.svg" : "/icons/sym-pending.svg",
          error: "/icons/sym-error.svg"
        }[status2],
        size: "2.25rem"
      });
      $$renderer3.push(`<!----> `);
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
          $$renderer4.push(`<!---->${escape_html({
            ready: label,
            awaiting: label + (cancel ? " (cancel)" : ""),
            error: "Failed, click to show error"
          }[status2])}`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      children?.($$renderer3);
      $$renderer3.push(`<!----></button>`);
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      await_block(
        $$renderer3,
        awaiting,
        () => {
          button($$renderer3, "awaiting");
        },
        () => {
          button($$renderer3, "ready");
        }
      );
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { awaiting });
  });
}
function SwitchButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Text label for this button, if any */
      labels = ["", ""],
      /** @prop @type {string|undefined} Hover text for this button, if any */
      tooltip = void 0,
      /** @prop @type {string} Starting  */
      value = void 0,
      /** @prop @type {function} Function to call when this switch is toggled */
      onclick = () => {
      },
      /** @prop @type {boolean} Disable this button */
      disabled = false
    } = $$props;
    let showTooltip = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button class="switch-ctrl svelte-gatz4b"${attr("disabled", disabled, true)}>`);
      if (tooltip) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
          position: "bottom",
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
      $$renderer3.push(`<!--]--> <span${attr_class(value ? "active" : "inactive", "svelte-gatz4b")}>${escape_html(labels[0])}</span> `);
      Icon($$renderer3, {
        src: `/icons/ctrl-switch-${stringify(value ? "left" : "right")}.svg`,
        size: "32px"
      });
      $$renderer3.push(`<!----> <span${attr_class(value ? "inactive" : "active", "svelte-gatz4b")}>${escape_html(labels[1])}</span></button>`);
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
function RadioButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      selection = void 0,
      value,
      label,
      icon = "",
      tooltip = "",
      disabled = false
    } = $$props;
    let hovered = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button${attr_class("radio-btn svelte-1kb9kki", void 0, { "selected": selection === value, "hovered": hovered })}${attr("disabled", disabled, true)}>`);
      if (tooltip) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
          position: "bottom-right",
          get shown() {
            return hovered;
          },
          set shown($$value) {
            hovered = $$value;
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
      $$renderer3.push(`<!--]--> ${escape_html(label)}</button>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { selection });
  });
}
class Device extends HasParams {
  constructor(tag, profile) {
    super(tag);
    this.profile = profile;
  }
  /**
   * @returns JSON object representing this element
   */
  toJSON() {
    let output = super.toJSON();
    output.profile = this.profile;
    return output;
  }
  /**
   * Populate this element from a JSON object
   *
   * @param {Object} node JSON object representing this element
   */
  fromJSON(node) {
    super.fromJSON(node);
    this.__cls__ = node.__cls__;
    this.profile = node.profile;
  }
}
class Component extends HasParams {
  constructor(tag) {
    super(tag);
    this.routine = void 0;
    this.exp = void 0;
  }
  #index = derived(() => this.routine.components.findIndex((element2) => element2 === this));
  get index() {
    return this.#index();
  }
  set index($$value) {
    return this.#index($$value);
  }
  #visualStart = derived(() => {
    let fr;
    if (this.exp && !this.exp.settings?.params?.["measureFrameRate"]?.val) {
      fr = parseInt(this.exp.settings.params["frameRate"]?.val || 60);
    } else {
      fr = 60;
    }
    if (!("startType" in this.params) || !("startVal" in this.params)) {
      return null;
    }
    let startType = this.params["startType"].val;
    let startVal = parseFloat(this.params["startVal"].val);
    let start_secs = null;
    if (startType === "time (s)") {
      start_secs = startVal;
    } else if (startType === "frames") {
      start_secs = startVal / fr;
    }
    if (isNaN(start_secs)) {
      start_secs = null;
    }
    return start_secs;
  });
  get visualStart() {
    return this.#visualStart();
  }
  set visualStart($$value) {
    return this.#visualStart($$value);
  }
  #visualStop = derived(() => {
    let fr;
    if (this.exp && !this.exp.settings?.params?.["measureFrameRate"]?.val) {
      fr = parseInt(this.exp.settings.params["frameRate"]?.val || 60);
    } else {
      fr = 60;
    }
    if (!("stopType" in this.params) || !("stopVal" in this.params)) {
      return null;
    }
    let stopType = this.params["stopType"].val;
    let stopVal = parseFloat(this.params["stopVal"].val);
    let stop_secs = null;
    if (stopType === "time (s)") {
      stop_secs = stopVal;
    } else if (stopType === "duration (s)") {
      stop_secs = this.visualStart + stopVal;
    } else if (stopType === "frames") {
      stop_secs = stopVal / fr;
    }
    if (isNaN(stop_secs)) {
      stop_secs = null;
    }
    return stop_secs;
  });
  get visualStop() {
    return this.#visualStop();
  }
  set visualStop($$value) {
    return this.#visualStop($$value);
  }
  #visualColor = derived(() => {
    if (this.tag === "StaticComponent") {
      return "red";
    } else if (this.disabled) {
      return "overlay";
    } else if (this.forceEnd) {
      return "orange";
    } else {
      return "blue";
    }
  });
  get visualColor() {
    return this.#visualColor();
  }
  set visualColor($$value) {
    return this.#visualColor($$value);
  }
  #forceEnd = derived(() => {
    let force_end = false;
    for (let attr2 of ["forceEndRoutine", "endRoutineOn", "forceEndRoutineOnPress"]) {
      if (attr2 in this.params) {
        if ([
          true,
          "true",
          "True",
          // alias of true
          "any click",
          "correct click",
          "valid click",
          // mouse
          "look at",
          "look away"
          // roi
        ].includes(this.params[attr2].val)) {
          force_end = true;
        }
      }
    }
    return force_end;
  });
  get forceEnd() {
    return this.#forceEnd();
  }
  set forceEnd($$value) {
    return this.#forceEnd($$value);
  }
}
class Routine {
  components = [];
  #visualStop = derived(() => {
    if (this.settings.visualStop) {
      return this.settings.visualStop;
    }
    let dur = 1;
    for (let comp of this.components) {
      if (comp.visualStop > dur) {
        dur = comp.visualStop;
      }
    }
    return dur;
  });
  get visualStop() {
    return this.#visualStop();
  }
  set visualStop($$value) {
    return this.#visualStop($$value);
  }
  #visualTicks = derived(() => {
    let increment;
    if (this.visualStop < 2) {
      increment = 0.1;
    } else if (this.visualStop < 20) {
      increment = 1;
    } else if (this.visualStop < 200) {
      increment = 10;
    } else {
      increment = 100;
    }
    let last_increment = Math.floor(this.visualStop / increment) * increment;
    var ticks = [];
    for (let tick2 = 0; tick2 <= last_increment - increment; tick2 += increment) {
      ticks.push({
        label: Math.round((tick2 + increment) * 100) / 100,
        proportion: 1
      });
    }
    let remainder = (this.visualStop - last_increment) / increment;
    return { labels: ticks, remainder };
  });
  get visualTicks() {
    return this.#visualTicks();
  }
  set visualTicks($$value) {
    return this.#visualTicks($$value);
  }
  #name = derived(() => {
    if (this.settings) {
      return this.settings.params["name"].val;
    }
  });
  get name() {
    return this.#name();
  }
  set name($$value) {
    return this.#name($$value);
  }
  #disabled = derived(() => this.settings.disabled);
  get disabled() {
    return this.#disabled();
  }
  set disabled($$value) {
    return this.#disabled($$value);
  }
  constructor() {
    this.tag = "Routine";
    this.exp = void 0;
    this.settings = new Component("RoutineSettingsComponent");
    this.settings.routine = this;
  }
  /**
   * Search this element for a particular phrase
   */
  search(searchTerm, useRegex = false, caseSensitive = false) {
    let results = [];
    for (let comp of this.components) {
      results.push(...comp.search(searchTerm, useRegex, caseSensitive));
    }
    results.push(...this.settings.search(searchTerm, useRegex, caseSensitive));
    return results;
  }
  #updateTargets = derived(
    /**
     * List of all Static Components in this Experiment
     */
    () => {
      let targets = [];
      for (let comp of this.components) {
        if (comp.tag === "StaticComponent") {
          targets.push(comp);
        }
      }
      return targets;
    }
  );
  get updateTargets() {
    return this.#updateTargets();
  }
  set updateTargets($$value) {
    return this.#updateTargets($$value);
  }
  addComponent(comp) {
    this.components.push(comp);
    comp.routine = this;
    comp.exp = this.exp;
  }
  insertComponent(comp, index) {
    index = parseInt(index);
    if (index < 0) {
      index = this.components.length;
    }
    this.components.splice(index, 0, comp);
    comp.routine = this;
  }
  removeComponent(comp) {
    let i = this.components.indexOf(comp);
    this.components.splice(i, 1);
  }
  get index() {
    for (let i in this.exp.flow.flat) {
      if (this.exp.flow.flat[i] === this) {
        return i;
      }
    }
  }
  relocateComponent(fromIndex, toIndex, toRoutine = this) {
    fromIndex = parseInt(fromIndex);
    toIndex = parseInt(toIndex);
    if (toIndex > fromIndex && toRoutine === this) {
      toIndex -= 1;
    }
    if (toIndex < 0) {
      toIndex = this.components.length;
    }
    let emt = this.components[fromIndex];
    this.removeComponent(emt);
    toRoutine.insertComponent(emt, toIndex);
  }
  /**
   * Get this Routine as a JSON string.
   */
  toJSON() {
    let node = {
      tag: this.tag,
      name: this.name,
      settings: this.settings.toJSON(),
      components: []
    };
    for (let component of this.components) {
      node.components.push(component.toJSON());
    }
    return node;
  }
  /**
   * Populate this Routine from a JSON
   *
   * @param {Object} node JSON object to populate from
   */
  fromJSON(node) {
    Object.keys(this.components).forEach((key) => delete this.components[key]);
    this.settings.fromJSON(node.settings);
    for (let compNode of node.components) {
      let comp = new Component(compNode.tag);
      comp.routine = this;
      comp.fromJSON(compNode);
      this.addComponent(comp);
    }
  }
  toXML() {
    let doc = document.implementation.createDocument(null, "xml");
    let node = doc.createElement("Routine");
    node.setAttribute("name", this.name);
    node.appendChild(this.settings.toXML());
    for (let component of this.components) {
      node.appendChild(component.toXML());
    }
    return node;
  }
  fromXML(node) {
    for (let compNode of node.childNodes) {
      if (compNode instanceof Text) {
        continue;
      }
      let comp = new Component(compNode.nodeName);
      comp.fromXML(compNode);
      if (comp.tag === "RoutineSettingsComponent") {
        this.settings = comp;
        comp.routine = this;
        comp.exp = this.exp;
      } else {
        this.addComponent(comp);
      }
    }
  }
}
class StandaloneRoutine extends HasParams {
  constructor(tag) {
    super(tag);
    this.tag = tag;
    this.exp = void 0;
  }
  get index() {
    for (let i in this.exp.flow.flat) {
      if (this.exp.flow.flat[i] === this) {
        return i;
      }
    }
  }
  #updateTargets = derived(
    /**
     * Mimicks Routine.updateTargets, but as StandaloneRoutine has no children,
     * returns `[this]` if this Routine can be an update target (which currently
     *  none can)
     */
    () => {
      let targets = [];
      return targets;
    }
  );
  get updateTargets() {
    return this.#updateTargets();
  }
  set updateTargets($$value) {
    return this.#updateTargets($$value);
  }
}
class Flow {
  flat = [];
  #dynamic = derived(() => {
    let dynamic = [];
    let currentLoop = this;
    for (let rt of this.flat) {
      if (rt instanceof LoopInitiator) {
        let loop = new FlowLoop(rt, currentLoop);
        loop.terminator = this.flat.find((emt) => emt instanceof LoopTerminator && emt.name === rt.name);
        if (currentLoop instanceof Flow) {
          dynamic.push(loop);
        } else {
          currentLoop.routines.push(loop);
        }
        if (rt.complete) {
          currentLoop = loop;
        }
      } else if (rt instanceof LoopTerminator) {
        if (currentLoop instanceof Flow) {
          logging.warn(`Found Loop Terminator (${rt.name}) with no matching Loop Initiator."`);
        } else {
          currentLoop = currentLoop.parent;
        }
      } else {
        if (currentLoop instanceof Flow) {
          dynamic.push(rt);
        } else {
          currentLoop.routines.push(rt);
        }
      }
    }
    return dynamic;
  });
  get dynamic() {
    return this.#dynamic();
  }
  set dynamic($$value) {
    return this.#dynamic($$value);
  }
  #loops = derived(() => this.flat.filter((item) => item instanceof LoopInitiator));
  get loops() {
    return this.#loops();
  }
  set loops($$value) {
    return this.#loops($$value);
  }
  constructor(exp) {
    this.exp = exp;
  }
  /**
   * Remove all items from the flow
   */
  clear() {
    this.flat.length = 0;
  }
  removeElement(index) {
    index = parseInt(index);
    this.flat.splice(index, 1);
  }
  relocateElement(element2, toIndex) {
    let fromIndex = this.flat.indexOf(element2);
    toIndex = parseInt(toIndex);
    if (toIndex > fromIndex) {
      toIndex -= 1;
    }
    if (toIndex < 0) {
      toIndex = this.flat.length;
    }
    this.flat.splice(fromIndex, 1);
    this.flat.splice(toIndex, 0, element2);
  }
  insertElement(element2, index) {
    index = parseInt(index);
    if (index < 0) {
      index = this.flat.length;
    }
    this.flat.splice(index, 0, element2);
  }
  toJSON() {
    let node = [];
    for (let item of this.flat) {
      if (item instanceof Routine || item instanceof StandaloneRoutine) {
        node.push({ ref: item.name });
        continue;
      }
      node.push(item.toJSON());
    }
    return node;
  }
  fromJSON(node) {
    this.clear();
    let initiators = {};
    for (let profile of node) {
      if ("ref" in profile && profile.ref in this.exp.routines) {
        this.flat.push(this.exp.routines[profile.ref]);
        continue;
      } else if ("ref" in profile) {
        throw Error(`Reference to nonexistant Routine ${profile.ref} in flow`);
      }
      if (LoopInitiator.tags.includes(profile.tag)) {
        let element2 = new LoopInitiator(profile.tag);
        element2.exp = this.exp;
        element2.fromJSON(profile);
        this.flat.push(element2);
        initiators[element2.name] = element2;
      }
      if (profile.tag === "LoopTerminator") {
        if (!(profile.name in initiators)) {
          throw Error(`Reference to nonexistant LoopInitiator ${profile.name} in LoopTerminator`);
        }
        initiators[profile.name].addTerminator();
        this.flat.push(initiators[profile.name].terminator);
      }
    }
  }
  toXML() {
    let doc = document.implementation.createDocument(null, "xml");
    let node = doc.createElement("Flow");
    for (let emt of this.flat) {
      if (emt instanceof Routine || emt instanceof StandaloneRoutine) {
        let subnode = doc.createElement(emt.tag);
        subnode.setAttribute("name", emt.name);
        node.appendChild(subnode);
      } else {
        node.appendChild(emt.toXML());
      }
    }
    return node;
  }
  fromXML(node) {
    this.clear();
    let initiators = {};
    for (let elementNode of node.childNodes) {
      if (elementNode instanceof Text) {
        continue;
      }
      let name = elementNode.getAttribute("name");
      if (elementNode.nodeName === "LoopInitiator") {
        let element2 = new LoopInitiator(elementNode.getAttribute("loopType"));
        element2.exp = this.exp;
        element2.fromXML(elementNode);
        this.flat.push(element2);
        initiators[name] = element2;
      } else if (elementNode.nodeName === "LoopTerminator") {
        if (!(name in initiators)) {
          throw Error(`Reference to nonexistant LoopInitiator ${name} in LoopTerminator`);
        }
        initiators[name].addTerminator();
        this.flat.push(initiators[name].terminator);
      } else {
        if (name in this.exp.routines) {
          this.flat.push(this.exp.routines[name]);
          continue;
        } else {
          throw Error(`Reference to nonexistant Routine ${name} in flow`);
        }
      }
    }
  }
}
class FlowLoop {
  constructor(initiator, parent) {
    this.loopType = initiator.loopType;
    this.name = initiator.name;
    this.params = initiator.params;
    this.parent = parent;
    this.initiator = initiator;
    this.terminator = void 0;
    this.routines = [];
  }
  get complete() {
    return this.terminator !== void 0;
  }
  flatten() {
    let flat = [];
    for (let rt of this.routines) {
      if (rt instanceof FlowLoop) {
        flat.push(rt.initiator);
        for (let subrt of rt.flatten()) {
          flat.push(subrt);
        }
        if (this.terminator !== void 0) {
          flat.push(rt.terminator);
        }
      } else {
        flat.push(rt);
      }
    }
    return flat;
  }
}
class LoopInitiator extends HasParams {
  #loopType = derived(() => () => this.params["loopType"].val);
  get loopType() {
    return this.#loopType();
  }
  set loopType($$value) {
    return this.#loopType($$value);
  }
  #complete = derived(() => this.terminator !== void 0);
  get complete() {
    return this.#complete();
  }
  set complete($$value) {
    return this.#complete($$value);
  }
  #index = derived(() => this.exp.flow.flat.indexOf(this));
  get index() {
    return this.#index();
  }
  set index($$value) {
    return this.#index($$value);
  }
  constructor(tag) {
    super(tag);
    this.exp = void 0;
    this.terminator = void 0;
  }
  addTerminator() {
    this.terminator = new LoopTerminator();
    this.terminator.exp = this.exp;
    this.terminator.initiator = this;
  }
  fromXML(node) {
    super.fromXML(node);
    this.tag = node.getAttribute("loopType");
  }
  toXML() {
    let node = super.toXML();
    let newNode = node.ownerDocument.createElement("LoopInitiator");
    newNode.innerHTML = node.innerHTML;
    for (let attr2 of node.attributes) {
      newNode.setAttribute(attr2.name, attr2.value);
    }
    newNode.setAttribute("loopType", this.tag);
    return newNode;
  }
}
class LoopTerminator {
  #name = derived(() => this.initiator?.name);
  get name() {
    return this.#name();
  }
  set name($$value) {
    return this.#name($$value);
  }
  constructor() {
    this.exp = void 0;
    this.initiator = void 0;
  }
  get index() {
    for (let i in this.exp.flow.flat) {
      if (this.exp.flow.flat[i] === this) {
        return i;
      }
    }
  }
  /**
   * Get this Component as a JSON string.
   */
  toJSON() {
    let node = { tag: "LoopTerminator", name: this.name };
    return node;
  }
  /**
   * Create a new Experiment from a JSON object
   *
   * @param {Object} node
   */
  static fromJSON(node) {
    let loop = new LoopTerminator();
    loop.name = node.name;
    return loop;
  }
  toXML() {
    let doc = document.implementation.createDocument(null, "xml");
    let node = doc.createElement("LoopTerminator");
    node.setAttribute("name", this.name);
    return node;
  }
  static fromXML(node) {
    let terminator = new LoopTerminator();
    terminator.name = node.getAttribute("name");
    return terminator;
  }
}
function ppy2py(version) {
  version = Version.parse(version);
  let updates = [
    ["2022.1.0", "3.8"],
    ["2024.2.0", "3.10"]
  ];
  let output = "3.8";
  for (let [ppy, py] of updates) {
    if (version.newerThan(ppy)) {
      output = py;
    }
  }
  return output;
}
class Version {
  // regex for a valid version
  static pattern = /(?<major>\d+)\.(?<minor>\d+)(?:\.(?<patch>(?:\d+|\*))(?<extra>[\d\w]+)?)?/;
  constructor(version) {
    let parts = version.match(Version.pattern).groups;
    this.major = parseInt(parts.major);
    this.minor = parseInt(parts.minor);
    this.patch = parts.patch === "*" ? Infinity : parseInt(parts.patch);
    this.extra = parts.extra;
  }
  /**
   * Parse a string into a Version object
   * 
   * @param {string|Version} version String to parse; if given a Version, will return it unchanged
   * 
   * @returns {Version}
   */
  static parse(version) {
    if (version instanceof Version) {
      return version;
    }
    return new Version(version);
  }
  /**
   * Format this version to a string
   * 
   * @param {string} upto How much of the version to include, options are:
   *   - "major": Include only the major version (2025.1.1beta -> 2025)
   *   - "major": Include up to the minor version (2025.1.1beta -> 2025.1)
   *   - "patch": Include up to the patch version (2025.1.1beta -> 2025.1.1)
   *   - "extra": Include up to the extra version, i.e. everything (2025.1.1beta -> 2025.1.1beta)
   */
  format(upto = "extra") {
    let output = "";
    output += `${this.major}`;
    if (upto === "major") {
      return output;
    }
    output += `.${this.minor}`;
    if (upto === "minor") {
      return output;
    }
    if (this.patch === Infinity) {
      output += ".*";
    } else if (this.patch !== void 0) {
      output += `.${this.patch}`;
    }
    if (upto === "patch") {
      return output;
    }
    output += `${this.extra || ""}`;
    return output;
  }
  /**
   * Returns true if the given version is the same as this one.
   * 
   * @param {Version|string} other Version to compare against
   * @param {string} upto How much of the version to check, options are:
   *   - "major": Only the major version (2025.1.1beta -> 2025)
   *   - "major": Up to the minor version (2025.1.1beta -> 2025.1)
   *   - "patch": Up to the patch version (2025.1.1beta -> 2025.1.1)
   *   - "extra": Up to the extra version, i.e. everything (2025.1.1beta -> 2025.1.1beta)
   */
  equal(other, upto = "extra") {
    other = Version.parse(other);
    let output = true;
    output &= this.major === other.major;
    if (upto === "major") {
      return output;
    }
    output &= this.minor === other.minor;
    if (upto === "minor") {
      return output;
    }
    output &= this.patch === other.patch;
    if (upto === "patch") {
      return output;
    }
    output &= this.extra === other.extra;
    return output;
  }
  /**
   * Returns true if this version is newer than the given version
   * 
   * @param {Version|string} other Version to compare against
   * @param {boolean} equal Whether to accept equal versions
   */
  newerThan(other, equal = false) {
    if (this.equal(other)) {
      return equal;
    }
    other = Version.parse(other);
    if (this.major > other.major) {
      return true;
    }
    if (this.major < other.major) {
      return false;
    }
    if ((this.minor || 0) > (other.minor || 0)) {
      return true;
    }
    if ((this.minor || 0) < (other.minor || 0)) {
      return false;
    }
    if ((this.patch || 0) > (other.patch || 0)) {
      return true;
    }
    if ((this.patch || 0) < (other.patch || 0)) {
      return false;
    }
    if (this.extra & !other.extra) {
      return true;
    }
    return false;
  }
  /**
   * Returns true if this version is older than the given version.
   * 
   * @param {Version|string} other Version to compare against
   * @param {boolean} equal Whether to accept equal versions
   */
  olderThan(other, equal = false) {
    if (this.equal(other)) {
      return equal;
    }
    other = Version.parse(other);
    if (this.major < other.major) {
      return true;
    }
    if (this.major > other.major) {
      return false;
    }
    if ((this.minor || 0) < (other.minor || 0)) {
      return true;
    }
    if ((this.minor || 0) > (other.minor || 0)) {
      return false;
    }
    if ((this.patch || 0) < (other.patch || 0)) {
      return true;
    }
    if ((this.patch || 0) > (other.patch || 0)) {
      return false;
    }
    if (this.extra & !other.extra) {
      return false;
    }
    return false;
  }
}
function handleError(err) {
  if ("error" in err) {
    err = err.error;
  }
  console.error(err);
  status.ready.reject(err);
}
async function installPython(version = void 0, forceReinstall = false) {
  if (!version || version === "app") {
    version = await electron.version();
  }
  let prerelease;
  if (version === "dev") {
    prerelease = true;
  } else if (Version.parse(version).extra) {
    prerelease = true;
    version = Version.parse(version).format("patch");
  } else {
    prerelease = false;
  }
  try {
    version = Version.parse(version).format("patch");
  } catch {
  }
  let pyVersion;
  if (version === "dev") {
    pyVersion = "3.10";
  } else {
    version = Version.parse(version);
    if (version.olderThan("2022.1.0")) {
      console.warn(`Version ${version.format()} of PsychoPy is not supported in PsychoPy Studio as it cannot run in Python >=3.8. Using the oldest compatible version (2022.1).`);
      version = new Version("2022.1.*");
    }
    pyVersion = ppy2py(version);
    version = version.format();
  }
  if (!forceReinstall) {
    if (await python$1.uv.findPython(version).catch(handleError)) {
      return;
    }
  }
  status.message = "Installing Python and PsychoPy library...";
  status.dlg.message = `### Installing Python (${pyVersion}) and PsychoPy library (${version ? version : "latest version"})...
This may take some time and, unfortunately, cannot be done in the background. Once it's finished installing, you won't have to see this message again.`;
  status.dlg.shown = true;
  status.dlg.busy = true;
  await python$1.uv.makeExecutable(version, pyVersion).catch(handleError);
  await python$1.venv.setup(version, prerelease);
  status.dlg.busy = false;
}
async function setupPython(version = void 0, forceReinstall = false) {
  if (!python$1) {
    status.ready.resolve();
    return;
  }
  status.ready = Promise.withResolvers();
  status.dismiss = Promise.withResolvers();
  status.ready.promise.finally((val) => setTimeout((evt) => status.dismiss.resolve(val), 2e3));
  if (!version || version === "app") {
    version = await electron.version();
  }
  status.message = "Checking Python...";
  let hasUV = await python$1.uv.exists().catch(handleError);
  if (!hasUV || forceReinstall) {
    status.message = "Downloading UV (a Python installer)...";
    status.dlg.message = "### Downloading UV (a Python installer)...\nThis is a program we use to install Python. Once it's finished installing, you won't have to see this message again.";
    status.dlg.shown = true;
    status.dlg.busy = true;
    await python$1.uv.install().catch(handleError);
    status.dlg.busy = false;
  }
  let hasPython = await python$1.uv.findPython(version).catch(handleError);
  if (!hasPython || forceReinstall) {
    await installPython(version, forceReinstall);
  }
  status.message = "Connecting Python";
  if (await python$1.liaison.started(version)) {
    status.message = "Connected Python";
    status.ready.resolve(true);
  } else {
    status.message = "Starting Python...";
    await python$1.liaison.start(version).catch(handleError);
    status.message = "Successfully started Python";
    status.ready.resolve(true);
  }
  python$1.liaison.ready(version).then((evt) => {
    python$1.ready = true;
  });
  return python$1;
}
function CodeEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = void 0,
      editor = void 0,
      theme = void 0,
      canUndo = void 0,
      canRedo = void 0,
      readonly = false,
      disabled = false,
      lineNumbers = true,
      language = void 0,
      resize = "none",
      file
    } = $$props;
    $$renderer2.push(`<div class="container svelte-1c1g3ov"${attr_style("", {
      // dynamically update value
      // not if editor is editable and has focus - will have updated already
      // dynamically update readonly
      resize,
      "overflow-y": resize !== "horizontal" ? "auto" : "hidden",
      "overflow-x": resize !== "vertical" ? "auto" : "hidden",
      opacity: disabled ? "50%" : "100%"
    })}></div>`);
    bind_props($$props, { value, editor, theme, canUndo, canRedo, readonly, disabled });
  });
}
function CodeOutput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = void 0,
      /** @interface */
      ctrls = void 0
    } = $$props;
    let editor = void 0;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="code-output svelte-1sxrckf">`);
      CodeEditor($$renderer3, {
        value,
        language: "shell",
        lineNumbers: false,
        readonly: true,
        get editor() {
          return editor;
        },
        set editor($$value) {
          editor = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (ctrls) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="ctrls svelte-1sxrckf">`);
        ctrls($$renderer3);
        $$renderer3.push(`<!----></div>`);
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
    bind_props($$props, { value });
  });
}
function SetupPython($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    electron.windows.listen("uv", (evt, message) => status.logs += `${message}
`);
    setupPython();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      MessageArray($$renderer3, {
        children: ($$renderer4) => {
          await_block(
            $$renderer4,
            status.ready.promise,
            () => {
              Message($$renderer4, {
                message: status.message,
                onclick: (evt) => status.dlg.shown = true
              });
            },
            (didSetup) => {
              await_block(
                $$renderer4,
                status.dismiss.promise,
                () => {
                  Message($$renderer4, {
                    message: status.message,
                    onclick: (evt) => status.dlg.shown = true,
                    icon: "/icons/sym-python.svg"
                  });
                },
                () => {
                }
              );
              $$renderer4.push(`<!--]-->`);
            }
          );
          $$renderer4.push(`<!--]-->`);
        }
      });
      $$renderer3.push(`<!----> `);
      MessageDialog($$renderer3, {
        buttons: { OK: (evt) => {
        } },
        buttonsDisabled: { OK: status.dlg.busy },
        get shown() {
          return status.dlg.shown;
        },
        set shown($$value) {
          status.dlg.shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`${html(marked(status.dlg.message || ""))} <p>See below for details:</p> <div class="output-container svelte-1r164rl">`);
          CodeOutput($$renderer4, {
            get value() {
              return status.logs;
            },
            set value($$value) {
              status.logs = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> `);
          await_block($$renderer4, status.ready.promise, () => {
          }, (ready) => {
            $$renderer4.push(`<div class="finished-msg svelte-1r164rl">Install completed successfully, you can safely close this window.</div>`);
          });
          $$renderer4.push(`<!--]-->`);
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
class Experiment {
  version = "2026.1.0";
  routines = {};
  file = void 0;
  running = void 0;
  /** store past and future states for this experiment */
  history = {
    past: [],
    future: [],
    update: (msg) => {
      this.history.past.push({ msg, state: this.toJSON() });
      while (this.history.past.length >= 16) {
        delete this.history.past[0];
        this.history.past = this.history.past.slice(1);
      }
      this.history.future = [];
    },
    clear: () => {
      this.history.past = [];
      this.history.future = [];
    },
    undo: () => {
      if (!this.history.past) {
        return;
      }
      let last = this.history.past.pop();
      this.history.future.unshift({ msg: last.msg, state: this.toJSON() });
      this.fromJSON(last.state);
    },
    redo: () => {
      if (!this.history.future) {
        return;
      }
      let next = this.history.future.shift();
      this.history.past.push({ msg: next.msg, state: this.toJSON() });
      this.fromJSON(next.state);
    }
  };
  #namespace = derived(
    /** Stores all names used in this experiment */
    () => {
      let names = {};
      for (let rt of Object.values(this.routines)) {
        if (rt instanceof Routine) {
          for (let comp of rt.components) {
            names[comp.name] = comp.params["name"];
          }
          names[rt.name] = rt.settings.params["name"];
        } else {
          names[rt.name] = rt.params["name"];
        }
      }
      for (let loop of Object.values(this.flow.loops)) {
        names[loop.name] = loop.params["name"];
      }
      for (let device of Object.values(devices)) {
        names[device.name] = device.params["name"];
      }
      return names;
    }
  );
  get namespace() {
    return this.#namespace();
  }
  set namespace($$value) {
    return this.#namespace($$value);
  }
  resolveNameConflict(name) {
    if (!Object.keys(this.namespace).includes(name)) {
      return name;
    }
    let index = 1;
    if (String(name).match(/\d+$/)) {
      index = parseInt(String(name).match(/\d+$/)[0]);
      name = String(name).replace(/\d+$/, "");
    }
    while (Object.keys(this.namespace).includes(`${name}${index}`)) {
      index += 1;
    }
    return `${name}${index}`;
  }
  /**
   *
   * @param {String} filename Name of the experiment file
   */
  constructor(filename) {
    this.settings = new Component("SettingsComponent");
    this.flow = new Flow(this);
    this.reset();
    if (filename) {
      this.file = parsePath(filename);
    }
  }
  /** 
   * Get a path relative to this experiment's root folder 
   */
  relativePath(value) {
    if (this.file?.parent && !path.isAbsolute(value)) {
      return path.join(this.file?.parent, value);
    } else {
      return value;
    }
  }
  /**
   * Reset this Experiment as if from new
   */
  reset(keepHistory = false) {
    this.file = {
      file: void 0,
      parent: void 0,
      name: "untitled.psyexp",
      stem: "untitled",
      ext: ".psyexp"
    };
    this.version = "2026.1.0";
    if (!keepHistory) {
      this.history.clear();
    }
    this.settings.reset();
    Object.keys(this.routines).forEach((key) => delete this.routines[key]);
    this.flow.clear();
    this.routines["trial"] = new Routine();
    this.routines["trial"].exp = this;
    this.routines["trial"].settings.params["name"].val = "trial";
    this.flow.flat.push(this.routines["trial"]);
  }
  /**
   * Search this experiment for a particular phrase
   */
  search(searchTerm, useRegex = false, caseSensitive = false) {
    let results = [];
    if (searchTerm === "") {
      return results;
    }
    for (let routine of Object.values(this.routines)) {
      results.push(...routine.search(searchTerm, useRegex, caseSensitive));
    }
    for (let element2 of Object.values(this.flow.flat)) {
      if (element2 instanceof LoopInitiator) {
        results.push(...element2.search(searchTerm, useRegex, caseSensitive));
      }
    }
    results.push(...this.settings.search());
    return results;
  }
  #pilotMode = derived(() => this.settings.params["runMode"].val);
  get pilotMode() {
    return this.#pilotMode();
  }
  set pilotMode($$value) {
    return this.#pilotMode($$value);
  }
  getPilotMode() {
    return this.settings.params["runMode"].val;
  }
  setPilotMode(value) {
    this.settings.params["runMode"].val = value;
  }
  #updateTargets = derived(
    /**
     * List of all Static Components in this Experiment
     */
    () => {
      let targets = [];
      for (let rt of Object.values(this.routines)) {
        targets.push(...rt.updateTargets);
      }
      return targets;
    }
  );
  get updateTargets() {
    return this.#updateTargets();
  }
  set updateTargets($$value) {
    return this.#updateTargets($$value);
  }
  toJSON() {
    let node = {
      filename: this.file.file,
      version: this.version,
      settings: this.settings.toJSON(),
      routines: {},
      flow: this.flow.toJSON()
    };
    for (let [name, routine] of Object.entries(this.routines)) {
      node.routines[name] = routine.toJSON();
    }
    return node;
  }
  /**
   * Populate this Experiment from a JSON object
   * 
   * @param {Object} node JSON object representing this Experiment
   */
  fromJSON(node) {
    this.reset(true);
    this.file = parsePath(node.filename);
    this.version = node.version;
    this.settings.fromJSON(node.settings);
    for (let [name, profile] of Object.entries(node.routines)) {
      let rt = new Routine();
      rt.exp = this;
      rt.fromJSON(profile);
      this.routines[name] = rt;
    }
    this.flow.fromJSON(node.flow);
  }
  /**
   * Populate this Experiment from an XML element
   * 
   * @param {Element} node XML element to create the Experiment from
   */
  fromXML(node) {
    if (typeof node === "string") {
      let document2 = new DOMParser().parseFromString(node, "application/xml");
      node = document2.getElementsByTagName("PsychoPy2experiment")[0];
    }
    this.reset();
    this.version = node.getAttribute("version");
    this.settings.fromXML(node.getElementsByTagName("Settings")[0]);
    let routinesNode = node.getElementsByTagName("Routines")[0];
    for (let routineNode of routinesNode.childNodes) {
      if (routineNode instanceof Text) {
        continue;
      }
      let routine;
      if (routineNode.nodeName === "Routine") {
        routine = new Routine();
      } else {
        routine = new StandaloneRoutine(routineNode.nodeName);
      }
      routine.exp = this;
      routine.fromXML(routineNode);
      this.routines[routine.name] = routine;
    }
    this.flow.fromXML(node.getElementsByTagName("Flow")[0]);
  }
  /**
   * Get this experiment as an XML element
   */
  toXML() {
    let doc = document.implementation.createDocument(null, "xml");
    let main = doc.createElement("PsychoPy2experiment");
    main.setAttribute("encoding", "utf-8");
    main.setAttribute("version", this.version);
    let settingsNode = this.settings.toXML();
    settingsNode.removeAttribute("name");
    settingsNode.removeAttribute("plugin");
    main.appendChild(settingsNode);
    let routinesNode = doc.createElement("Routines");
    for (let [name, routine] of Object.entries(this.routines)) {
      routinesNode.appendChild(routine.toXML());
    }
    main.appendChild(routinesNode);
    let flowNode = this.flow.toXML();
    main.appendChild(flowNode);
    return main;
  }
  async fromFile(file) {
    if (typeof file === "string") {
      file = parsePath(file);
    }
    let content;
    if (electron) {
      content = await electron.files.load(file.file);
    } else {
      content = await file.handle.text();
    }
    this.fromXML(content);
    this.file = file;
  }
  async toFile(file) {
    let node = this.toXML();
    let ser = new XMLSerializer();
    let content = ser.serializeToString(node);
    content = xmlFormat(content);
    if (electron) {
      await electron.files.save(snapshot(file.file), content);
    } else {
      file.writable = await file.handle.createWritable();
      file.writable.seek(0);
      file.writable.write(content);
      file.writable.close();
    }
    if (this.settings.params["exportHTML"].val === "on Save") {
      this.writeScript("PsychoJS");
    }
  }
  async writeScript(target = "PsychoPy", executable = void 0) {
    if (!python$1) {
      console.error("Script writing is not available in browser.");
      return;
    }
    if (!this.file.file) {
      console.error("Cannot compile to Python on an experiment with no psyexp file attached");
      return;
    }
    await this.toFile(this.file);
    let targetFile = path.join(this.file.parent, this.file.stem + (target === "PsychoJS" ? ".js" : ".py"));
    let version = this.settings.params["Use version"].val;
    if (version) {
      await setupPython(version);
    }
    version = version || "app";
    await python$1.liaison.send(
      version,
      {
        command: "try",
        args: [
          "prefs.setDevicesFile",
          path.join(await electron.paths.user(), "devices.json")
        ]
      },
      1e4
    ).catch((err) => logging.error([`Failed to set devices file`, err]));
    await python$1.liaison.send(
      version,
      {
        command: "init",
        args: ["currentExperiment", "psychopy.experiment:Experiment"]
      },
      1e4
    ).catch((reason) => console.error(reason));
    await python$1.liaison.send(
      version,
      {
        command: "run",
        args: ["currentExperiment.loadFromXML", snapshot(this.file.file)]
      },
      1e4
    ).catch((reason) => console.error(reason));
    let script = await python$1.liaison.send(
      version,
      {
        command: "run",
        args: ["currentExperiment.writeScript"],
        kwargs: { target, modular: true, expPath: this.file.file }
      },
      1e4
    ).catch((reason) => console.error(reason));
    if (typeof script === "string") {
      await electron.files.save(targetFile, script);
    } else {
      console.error(script);
    }
    return targetFile;
  }
  /**
   * Run this experiment in Python.
   * 
   * @param {boolean} compile If true, compile the experiment to Python before running
   */
  async runPython(compile = true) {
    if (!python$1) {
      console.error("Script running is not available in browser.");
      return;
    }
    let target;
    if (compile) {
      target = await this.writeScript("PsychoPy");
    } else {
      target = path.join(this.file.parent, this.file.stem + ".py");
    }
    let version = snapshot(this.settings.params["Use version"].val) || "app";
    {
      await setupPython(version);
    }
    await python$1.output.stdout.send(`--- Started experiment ${this.file.name} ---`);
    this.running = await python$1.scripts.run(version, target, ...this.pilotMode ? ["--pilot"] : [], "--prefs-json", await electron.paths.prefs());
    await python$1.scripts.finished(version, this.running);
    this.running = void 0;
    await python$1.output.stdout.send(`--- Finished experiment ${this.file.name} ---`);
  }
  async stopPython() {
    if (this.running === void 0) {
      return;
    }
    if (!python$1) {
      console.error("Script running is not available in browser.");
      return;
    }
    let version = snapshot(this.settings.params["Use version"].val) || "app";
    await python$1.scripts.stop(version, this.running);
    this.running = void 0;
    await python$1.output.stdout.send(`--- Stopped experiment ${this.file.name} ---`);
  }
  /**
   * Run this experiment in JS.
   * 
   * @param {boolean} compile If true, compile the experiment to JS before running
   */
  async runJS(compile = true) {
    if (compile) {
      await this.writeScript("PsychoJS");
    } else {
      path.join(this.file.parent, this.file.stem + ".py");
    }
    if (this.pilotMode) {
      if (!python$1) {
        console.error("Script running is not available in browser.");
        return;
      }
      await python$1.liaison.send(
        "app",
        {
          command: "run",
          args: ["psychopy.tools.servertools:getPsychoJS"],
          kwargs: {
            cwd: this.file.parent,
            useVersion: snapshot(this.settings.params["Use version"]?.val)
          }
        },
        1e5
      );
      let address = await python$1.psychojs.run(this.file.parent);
      let params = new URLSearchParams(this.pilotMode ? { __pilotToken: "local" } : {});
      window.open(`http://${address}?${params.toString()}`);
    }
  }
}
class Script {
  pilotMode = false;
  // file this script is saved to (if any)
  file;
  // text content of this script
  content = "";
  // these are only relevant if script is open in an editor
  canUndo = false;
  canRedo = false;
  editor;
  constructor(file) {
    this.file = file;
  }
  setPilotMode(value) {
    this.pilotMode = value;
  }
  /**
   * Run this script in Python.
   * 
   * @param {string } version PsychoPy version of the venv to run this in
   */
  async runPython(version = "app") {
    if (!python$1) {
      console.error("Script running is not available in browser.");
      return;
    }
    await python$1.output.stdout.send(`--- Started ${this.file.name} ---`);
    this.running = await python$1.scripts.run(version, this.file.file, ...this.pilotMode ? ["--pilot"] : [], "--prefs-json", await electron.paths.prefs());
    await python$1.scripts.finished(version, this.running);
    this.running = void 0;
    await python$1.output.stdout.send(`--- Finished ${this.file.name} ---`);
  }
  /**
   * Stop running this script
   * 
   * @param {string } version PsychoPy version of the venv to cancel run in
   */
  async stopPython(version = "app") {
    if (this.running === void 0) {
      return;
    }
    if (!python$1) {
      console.error("Script running is not available in browser.");
      return;
    }
    await python$1.scripts.stop(version, this.running);
    this.running = void 0;
    await python$1.output.stdout.send(`--- Stopped experiment ${this.file.name} ---`);
  }
  /**
   * Write the current contents of this script to a file
   */
  async toFile(file) {
    if (typeof file === "string") {
      file = parsePath(file);
    }
    this.canUndo = false;
    writeFile(snapshot(this.file.file), snapshot(this.content));
  }
  /**
   * Load the contents of a file to this script
   */
  async fromFile(file) {
    if (typeof file === "string") {
      file = parsePath(file);
    }
    this.content = await readFile(file);
    this.file = file;
  }
  toJSON() {
    return snapshot({
      pilotMode: this.pilotMode,
      file: this.file,
      content: this.content
    });
  }
}
function Panel($$renderer, $$props) {
  let {
    /** @prop @type {string} Text to display in this panel's sash */
    title,
    /** @interface */
    children = void 0
  } = $$props;
  $$renderer.push(`<div class="panel svelte-nal48f"><div class="pnl-title svelte-nal48f">${escape_html(title)}</div> <div class="pnl-content svelte-nal48f">`);
  children?.($$renderer);
  $$renderer.push(`<!----></div></div>`);
}
function Frame($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @param @type {function} Callback to execute when a file is dropped on this frame */
      onFileDrop = (evt, file) => {
      },
      /** @interface */
      ribbon = void 0,
      /** @interface */
      children
    } = $$props;
    $$renderer2.push(`<div id="frame" role="region" class="svelte-158299m">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (ribbon) {
      $$renderer2.push("<!--[-->");
      ribbon($$renderer2);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div id="content" class="svelte-158299m">`);
    children($$renderer2);
    $$renderer2.push(`<!----></div></div>`);
  });
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return value !== null && typeof value === "object";
}
const CLASS_VALUE_PRIMITIVE_TYPES = ["string", "number", "bigint", "boolean"];
function isClassValue(value) {
  if (value === null || value === void 0)
    return true;
  if (CLASS_VALUE_PRIMITIVE_TYPES.includes(typeof value))
    return true;
  if (Array.isArray(value))
    return value.every((item) => isClassValue(item));
  if (typeof value === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype)
      return false;
    return true;
  }
  return false;
}
const BoxSymbol = Symbol("box");
const isWritableSymbol = Symbol("is-writable");
function isBox(value) {
  return isObject(value) && BoxSymbol in value;
}
function isWritableBox(value) {
  return box.isBox(value) && isWritableSymbol in value;
}
function box(initialValue) {
  let current2 = initialValue;
  return {
    [BoxSymbol]: true,
    [isWritableSymbol]: true,
    get current() {
      return current2;
    },
    set current(v) {
      current2 = v;
    }
  };
}
function boxWith(getter, setter) {
  const derived2 = getter();
  if (setter) {
    return {
      [BoxSymbol]: true,
      [isWritableSymbol]: true,
      get current() {
        return derived2;
      },
      set current(v) {
        setter(v);
      }
    };
  }
  return {
    [BoxSymbol]: true,
    get current() {
      return getter();
    }
  };
}
function boxFrom(value) {
  if (box.isBox(value)) return value;
  if (isFunction(value)) return box.with(value);
  return box(value);
}
function boxFlatten(boxes) {
  return Object.entries(boxes).reduce(
    (acc, [key, b]) => {
      if (!box.isBox(b)) {
        return Object.assign(acc, { [key]: b });
      }
      if (box.isWritableBox(b)) {
        Object.defineProperty(acc, key, {
          get() {
            return b.current;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          set(v) {
            b.current = v;
          }
        });
      } else {
        Object.defineProperty(acc, key, {
          get() {
            return b.current;
          }
        });
      }
      return acc;
    },
    {}
  );
}
function toReadonlyBox(b) {
  if (!box.isWritableBox(b)) return b;
  return {
    [BoxSymbol]: true,
    get current() {
      return b.current;
    }
  };
}
box.from = boxFrom;
box.with = boxWith;
box.flatten = boxFlatten;
box.readonly = toReadonlyBox;
box.isBox = isBox;
box.isWritableBox = isWritableBox;
function composeHandlers(...handlers) {
  return function(e) {
    for (const handler of handlers) {
      if (!handler)
        continue;
      if (e.defaultPrevented)
        return;
      if (typeof handler === "function") {
        handler.call(this, e);
      } else {
        handler.current?.call(this, e);
      }
    }
  };
}
const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char))
    return void 0;
  return char !== char.toLowerCase();
}
function splitByCase(str) {
  const parts = [];
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = STR_SPLITTERS.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function pascalCase(str) {
  if (!str)
    return "";
  return splitByCase(str).map((p) => upperFirst(p)).join("");
}
function camelCase(str) {
  return lowerFirst(pascalCase(str || ""));
}
function upperFirst(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : "";
}
function lowerFirst(str) {
  return str ? str[0].toLowerCase() + str.slice(1) : "";
}
function cssToStyleObj(css) {
  if (!css)
    return {};
  const styleObj = {};
  function iterator(name, value) {
    if (name.startsWith("-moz-") || name.startsWith("-webkit-") || name.startsWith("-ms-") || name.startsWith("-o-")) {
      styleObj[pascalCase(name)] = value;
      return;
    }
    if (name.startsWith("--")) {
      styleObj[name] = value;
      return;
    }
    styleObj[camelCase(name)] = value;
  }
  parse(css, iterator);
  return styleObj;
}
function executeCallbacks(...callbacks) {
  return (...args) => {
    for (const callback of callbacks) {
      if (typeof callback === "function") {
        callback(...args);
      }
    }
  };
}
function addEventListener(target, event, handler, options) {
  const events = Array.isArray(event) ? event : [event];
  events.forEach((_event) => target.addEventListener(_event, handler, options));
  return () => {
    events.forEach((_event) => target.removeEventListener(_event, handler, options));
  };
}
function createParser(matcher, replacer) {
  const regex = RegExp(matcher, "g");
  return (str) => {
    if (typeof str !== "string") {
      throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
    }
    if (!str.match(regex))
      return str;
    return str.replace(regex, replacer);
  };
}
const camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
  if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) {
    throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
  }
  return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
function styleToString(style = {}) {
  return styleToCSS(style).replace("\n", " ");
}
const srOnlyStyles = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
  transform: "translateX(-100%)"
};
styleToString(srOnlyStyles);
const EVENT_LIST = [
  "onabort",
  "onanimationcancel",
  "onanimationend",
  "onanimationiteration",
  "onanimationstart",
  "onauxclick",
  "onbeforeinput",
  "onbeforetoggle",
  "onblur",
  "oncancel",
  "oncanplay",
  "oncanplaythrough",
  "onchange",
  "onclick",
  "onclose",
  "oncompositionend",
  "oncompositionstart",
  "oncompositionupdate",
  "oncontextlost",
  "oncontextmenu",
  "oncontextrestored",
  "oncopy",
  "oncuechange",
  "oncut",
  "ondblclick",
  "ondrag",
  "ondragend",
  "ondragenter",
  "ondragleave",
  "ondragover",
  "ondragstart",
  "ondrop",
  "ondurationchange",
  "onemptied",
  "onended",
  "onerror",
  "onfocus",
  "onfocusin",
  "onfocusout",
  "onformdata",
  "ongotpointercapture",
  "oninput",
  "oninvalid",
  "onkeydown",
  "onkeypress",
  "onkeyup",
  "onload",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onlostpointercapture",
  "onmousedown",
  "onmouseenter",
  "onmouseleave",
  "onmousemove",
  "onmouseout",
  "onmouseover",
  "onmouseup",
  "onpaste",
  "onpause",
  "onplay",
  "onplaying",
  "onpointercancel",
  "onpointerdown",
  "onpointerenter",
  "onpointerleave",
  "onpointermove",
  "onpointerout",
  "onpointerover",
  "onpointerup",
  "onprogress",
  "onratechange",
  "onreset",
  "onresize",
  "onscroll",
  "onscrollend",
  "onsecuritypolicyviolation",
  "onseeked",
  "onseeking",
  "onselect",
  "onselectionchange",
  "onselectstart",
  "onslotchange",
  "onstalled",
  "onsubmit",
  "onsuspend",
  "ontimeupdate",
  "ontoggle",
  "ontouchcancel",
  "ontouchend",
  "ontouchmove",
  "ontouchstart",
  "ontransitioncancel",
  "ontransitionend",
  "ontransitionrun",
  "ontransitionstart",
  "onvolumechange",
  "onwaiting",
  "onwebkitanimationend",
  "onwebkitanimationiteration",
  "onwebkitanimationstart",
  "onwebkittransitionend",
  "onwheel"
];
const EVENT_LIST_SET = new Set(EVENT_LIST);
function isEventHandler(key) {
  return EVENT_LIST_SET.has(key);
}
function mergeProps(...args) {
  const result = { ...args[0] };
  for (let i = 1; i < args.length; i++) {
    const props = args[i];
    if (!props)
      continue;
    for (const key of Object.keys(props)) {
      const a = result[key];
      const b = props[key];
      const aIsFunction = typeof a === "function";
      const bIsFunction = typeof b === "function";
      if (aIsFunction && typeof bIsFunction && isEventHandler(key)) {
        const aHandler = a;
        const bHandler = b;
        result[key] = composeHandlers(aHandler, bHandler);
      } else if (aIsFunction && bIsFunction) {
        result[key] = executeCallbacks(a, b);
      } else if (key === "class") {
        const aIsClassValue = isClassValue(a);
        const bIsClassValue = isClassValue(b);
        if (aIsClassValue && bIsClassValue) {
          result[key] = clsx(a, b);
        } else if (aIsClassValue) {
          result[key] = clsx(a);
        } else if (bIsClassValue) {
          result[key] = clsx(b);
        }
      } else if (key === "style") {
        const aIsObject = typeof a === "object";
        const bIsObject = typeof b === "object";
        const aIsString = typeof a === "string";
        const bIsString = typeof b === "string";
        if (aIsObject && bIsObject) {
          result[key] = { ...a, ...b };
        } else if (aIsObject && bIsString) {
          const parsedStyle = cssToStyleObj(b);
          result[key] = { ...a, ...parsedStyle };
        } else if (aIsString && bIsObject) {
          const parsedStyle = cssToStyleObj(a);
          result[key] = { ...parsedStyle, ...b };
        } else if (aIsString && bIsString) {
          const parsedStyleA = cssToStyleObj(a);
          const parsedStyleB = cssToStyleObj(b);
          result[key] = { ...parsedStyleA, ...parsedStyleB };
        } else if (aIsObject) {
          result[key] = a;
        } else if (bIsObject) {
          result[key] = b;
        } else if (aIsString) {
          result[key] = a;
        } else if (bIsString) {
          result[key] = b;
        }
      } else {
        result[key] = b !== void 0 ? b : a;
      }
    }
    for (const key of Object.getOwnPropertySymbols(props)) {
      const a = result[key];
      const b = props[key];
      result[key] = b !== void 0 ? b : a;
    }
  }
  if (typeof result.style === "object") {
    result.style = styleToString(result.style).replaceAll("\n", " ");
  }
  if (result.hidden !== true) {
    result.hidden = void 0;
    delete result.hidden;
  }
  if (result.disabled !== true) {
    result.disabled = void 0;
    delete result.disabled;
  }
  return result;
}
const defaultWindow$1 = void 0;
function getActiveElement$2(document2) {
  let activeElement = document2.activeElement;
  while (activeElement?.shadowRoot) {
    const node = activeElement.shadowRoot.activeElement;
    if (node === activeElement)
      break;
    else
      activeElement = node;
  }
  return activeElement;
}
function createSubscriber(_) {
  return () => {
  };
}
let ActiveElement$1 = class ActiveElement {
  #document;
  #subscribe;
  constructor(options = {}) {
    const { window: window2 = defaultWindow$1, document: document2 = window2?.document } = options;
    if (window2 === void 0) return;
    this.#document = document2;
    this.#subscribe = createSubscriber();
  }
  get current() {
    this.#subscribe?.();
    if (!this.#document) return null;
    return getActiveElement$2(this.#document);
  }
};
new ActiveElement$1();
function afterTick(fn) {
  tick().then(fn);
}
const DOCUMENT_NODE = 9;
function isDocument(node) {
  return isObject(node) && node.nodeType === DOCUMENT_NODE;
}
function isWindow(node) {
  return isObject(node) && node.constructor?.name === "VisualViewport";
}
function getDocument(node) {
  if (isDocument(node))
    return node;
  if (isWindow(node))
    return node.document;
  return node?.ownerDocument ?? document;
}
function getActiveElement$1(rootNode) {
  let activeElement = rootNode.activeElement;
  while (activeElement?.shadowRoot) {
    const el = activeElement.shadowRoot.activeElement;
    if (el === activeElement)
      break;
    else
      activeElement = el;
  }
  return activeElement;
}
class DOMContext {
  element;
  #root = derived(() => {
    if (!this.element.current) return document;
    const rootNode = this.element.current.getRootNode() ?? document;
    return rootNode;
  });
  get root() {
    return this.#root();
  }
  set root($$value) {
    return this.#root($$value);
  }
  constructor(element2) {
    if (typeof element2 === "function") {
      this.element = box.with(element2);
    } else {
      this.element = element2;
    }
  }
  getDocument = () => {
    return getDocument(this.root);
  };
  getWindow = () => {
    return this.getDocument().defaultView ?? window;
  };
  getActiveElement = () => {
    return getActiveElement$1(this.root);
  };
  isActiveElement = (node) => {
    return node === this.getActiveElement();
  };
  getElementById(id) {
    return this.root.getElementById(id);
  }
  querySelector = (selector) => {
    if (!this.root) return null;
    return this.root.querySelector(selector);
  };
  querySelectorAll = (selector) => {
    if (!this.root) return [];
    return this.root.querySelectorAll(selector);
  };
  setTimeout = (callback, delay) => {
    return this.getWindow().setTimeout(callback, delay);
  };
  clearTimeout = (timeoutId) => {
    return this.getWindow().clearTimeout(timeoutId);
  };
}
function attachRef(ref, onChange) {
  return {
    [createAttachmentKey()]: (node) => {
      if (box.isBox(ref)) {
        ref.current = node;
        run(() => onChange?.(node));
        return () => {
          if ("isConnected" in node && node.isConnected)
            return;
          ref.current = null;
        };
      }
      ref(node);
      run(() => onChange?.(node));
      return () => {
        if ("isConnected" in node && node.isConnected)
          return;
        ref(null);
      };
    }
  };
}
function calculateAriaValues({ layout, panesArray, pivotIndices }) {
  let currentMinSize = 0;
  let currentMaxSize = 100;
  let totalMinSize = 0;
  let totalMaxSize = 0;
  const firstIndex = pivotIndices[0];
  for (let i = 0; i < panesArray.length; i++) {
    const constraints = panesArray[i].constraints;
    const { maxSize = 100, minSize = 0 } = constraints;
    if (i === firstIndex) {
      currentMinSize = minSize;
      currentMaxSize = maxSize;
    } else {
      totalMinSize += minSize;
      totalMaxSize += maxSize;
    }
  }
  const valueMax = Math.min(currentMaxSize, 100 - totalMinSize);
  const valueMin = Math.max(currentMinSize, 100 - totalMaxSize);
  const valueNow = layout[firstIndex];
  return {
    valueMax,
    valueMin,
    valueNow
  };
}
function assert(expectedCondition, message = "Assertion failed!") {
  if (!expectedCondition) {
    console.error(message);
    throw new Error(message);
  }
}
const LOCAL_STORAGE_DEBOUNCE_INTERVAL = 100;
const PRECISION = 10;
function areNumbersAlmostEqual(actual, expected, fractionDigits = PRECISION) {
  return compareNumbersWithTolerance(actual, expected, fractionDigits) === 0;
}
function compareNumbersWithTolerance(actual, expected, fractionDigits = PRECISION) {
  const roundedActual = roundTo(actual, fractionDigits);
  const roundedExpected = roundTo(expected, fractionDigits);
  return Math.sign(roundedActual - roundedExpected);
}
function areArraysEqual(arrA, arrB) {
  if (arrA.length !== arrB.length)
    return false;
  for (let index = 0; index < arrA.length; index++) {
    if (arrA[index] !== arrB[index])
      return false;
  }
  return true;
}
function roundTo(value, decimals) {
  return Number.parseFloat(value.toFixed(decimals));
}
const isBrowser = typeof document !== "undefined";
function isHTMLElement(element2) {
  return element2 instanceof HTMLElement;
}
function isKeyDown(event) {
  return event.type === "keydown";
}
function isMouseEvent(event) {
  return event.type.startsWith("mouse");
}
function isTouchEvent(event) {
  return event.type.startsWith("touch");
}
function resizePane({ paneConstraints: paneConstraintsArray, paneIndex, initialSize }) {
  const paneConstraints = paneConstraintsArray[paneIndex];
  assert(paneConstraints != null, "Pane constraints should not be null.");
  const { collapsedSize = 0, collapsible, maxSize = 100, minSize = 0 } = paneConstraints;
  let newSize = initialSize;
  if (compareNumbersWithTolerance(newSize, minSize) < 0) {
    newSize = getAdjustedSizeForCollapsible(newSize, collapsible, collapsedSize, minSize);
  }
  newSize = Math.min(maxSize, newSize);
  return Number.parseFloat(newSize.toFixed(PRECISION));
}
function getAdjustedSizeForCollapsible(size, collapsible, collapsedSize, minSize) {
  if (!collapsible)
    return minSize;
  const halfwayPoint = (collapsedSize + minSize) / 2;
  return compareNumbersWithTolerance(size, halfwayPoint) < 0 ? collapsedSize : minSize;
}
function noop() {
}
function updateResizeHandleAriaValues({ groupId, layout, panesArray, domContext }) {
  const resizeHandleElements = getResizeHandleElementsForGroup(groupId, domContext);
  for (let index = 0; index < panesArray.length - 1; index++) {
    const { valueMax, valueMin, valueNow } = calculateAriaValues({
      layout,
      panesArray,
      pivotIndices: [index, index + 1]
    });
    const resizeHandleEl = resizeHandleElements[index];
    if (isHTMLElement(resizeHandleEl)) {
      const paneData = panesArray[index];
      resizeHandleEl.setAttribute("aria-controls", paneData.opts.id.current);
      resizeHandleEl.setAttribute("aria-valuemax", `${Math.round(valueMax)}`);
      resizeHandleEl.setAttribute("aria-valuemin", `${Math.round(valueMin)}`);
      resizeHandleEl.setAttribute("aria-valuenow", valueNow != null ? `${Math.round(valueNow)}` : "");
    }
  }
  return () => {
    for (const el of resizeHandleElements) {
      el.removeAttribute("aria-controls");
      el.removeAttribute("aria-valuemax");
      el.removeAttribute("aria-valuemin");
      el.removeAttribute("aria-valuenow");
    }
  };
}
function getResizeHandleElementsForGroup(groupId, domContext) {
  if (!isBrowser)
    return [];
  return Array.from(domContext.querySelectorAll(`[data-pane-resizer-id][data-pane-group-id="${groupId}"]`));
}
function getResizeHandleElementIndex({ groupId, id, domContext }) {
  if (!isBrowser)
    return null;
  const handles = getResizeHandleElementsForGroup(groupId, domContext);
  const index = handles.findIndex((handle) => handle.getAttribute("data-pane-resizer-id") === id);
  return index ?? null;
}
function getPivotIndices({ groupId, dragHandleId, domContext }) {
  const index = getResizeHandleElementIndex({
    groupId,
    id: dragHandleId,
    domContext
  });
  return index != null ? [index, index + 1] : [-1, -1];
}
function paneDataHelper(panesArray, pane, layout) {
  const paneConstraintsArray = panesArray.map((paneData) => paneData.constraints);
  const paneIndex = findPaneDataIndex(panesArray, pane);
  const paneConstraints = paneConstraintsArray[paneIndex];
  const isLastPane = paneIndex === panesArray.length - 1;
  const pivotIndices = isLastPane ? [paneIndex - 1, paneIndex] : [paneIndex, paneIndex + 1];
  const paneSize = layout[paneIndex];
  return {
    ...paneConstraints,
    paneSize,
    pivotIndices
  };
}
function findPaneDataIndex(panesArray, pane) {
  return panesArray.findIndex((prevPaneData) => prevPaneData.opts.id.current === pane.opts.id.current);
}
function callPaneCallbacks(panesArray, layout, paneIdToLastNotifiedSizeMap) {
  for (let index = 0; index < layout.length; index++) {
    const size = layout[index];
    const paneData = panesArray[index];
    assert(paneData);
    const { collapsedSize = 0, collapsible } = paneData.constraints;
    const lastNotifiedSize = paneIdToLastNotifiedSizeMap[paneData.opts.id.current];
    if (!(lastNotifiedSize == null || size !== lastNotifiedSize))
      continue;
    paneIdToLastNotifiedSizeMap[paneData.opts.id.current] = size;
    const { onCollapse, onExpand, onResize } = paneData.callbacks;
    onResize?.(size, lastNotifiedSize);
    if (collapsible && (onCollapse || onExpand)) {
      if (onExpand && (lastNotifiedSize == null || lastNotifiedSize === collapsedSize) && size !== collapsedSize) {
        onExpand();
      }
      if (onCollapse && (lastNotifiedSize == null || lastNotifiedSize !== collapsedSize) && size === collapsedSize) {
        onCollapse();
      }
    }
  }
}
function getUnsafeDefaultLayout({ panesArray }) {
  const layout = Array(panesArray.length);
  const paneConstraintsArray = panesArray.map((paneData) => paneData.constraints);
  let numPanesWithSizes = 0;
  let remainingSize = 100;
  for (let index = 0; index < panesArray.length; index++) {
    const paneConstraints = paneConstraintsArray[index];
    assert(paneConstraints);
    const { defaultSize } = paneConstraints;
    if (defaultSize != null) {
      numPanesWithSizes++;
      layout[index] = defaultSize;
      remainingSize -= defaultSize;
    }
  }
  for (let index = 0; index < panesArray.length; index++) {
    const paneConstraints = paneConstraintsArray[index];
    assert(paneConstraints);
    const { defaultSize } = paneConstraints;
    if (defaultSize != null) {
      continue;
    }
    const numRemainingPanes = panesArray.length - numPanesWithSizes;
    const size = remainingSize / numRemainingPanes;
    numPanesWithSizes++;
    layout[index] = size;
    remainingSize -= size;
  }
  return layout;
}
function validatePaneGroupLayout({ layout: prevLayout, paneConstraints }) {
  const nextLayout = [...prevLayout];
  const nextLayoutTotalSize = nextLayout.reduce((accumulated, current2) => accumulated + current2, 0);
  if (nextLayout.length !== paneConstraints.length) {
    throw new Error(`Invalid ${paneConstraints.length} pane layout: ${nextLayout.map((size) => `${size}%`).join(", ")}`);
  } else if (!areNumbersAlmostEqual(nextLayoutTotalSize, 100)) {
    for (let index = 0; index < paneConstraints.length; index++) {
      const unsafeSize = nextLayout[index];
      assert(unsafeSize != null);
      const safeSize = 100 / nextLayoutTotalSize * unsafeSize;
      nextLayout[index] = safeSize;
    }
  }
  let remainingSize = 0;
  for (let index = 0; index < paneConstraints.length; index++) {
    const unsafeSize = nextLayout[index];
    assert(unsafeSize != null);
    const safeSize = resizePane({
      paneConstraints,
      paneIndex: index,
      initialSize: unsafeSize
    });
    if (unsafeSize !== safeSize) {
      remainingSize += unsafeSize - safeSize;
      nextLayout[index] = safeSize;
    }
  }
  if (!areNumbersAlmostEqual(remainingSize, 0)) {
    for (let index = 0; index < paneConstraints.length; index++) {
      const prevSize = nextLayout[index];
      assert(prevSize != null);
      const unsafeSize = prevSize + remainingSize;
      const safeSize = resizePane({
        paneConstraints,
        paneIndex: index,
        initialSize: unsafeSize
      });
      if (prevSize !== safeSize) {
        remainingSize -= safeSize - prevSize;
        nextLayout[index] = safeSize;
        if (areNumbersAlmostEqual(remainingSize, 0)) {
          break;
        }
      }
    }
  }
  return nextLayout;
}
function getPaneGroupElement(id, domContext) {
  if (!isBrowser)
    return null;
  const element2 = domContext.querySelector(`[data-pane-group][data-pane-group-id="${id}"]`);
  if (element2)
    return element2;
  return null;
}
function getResizeHandleElement(id, domContext) {
  if (!isBrowser)
    return null;
  const element2 = domContext.querySelector(`[data-pane-resizer-id="${id}"]`);
  if (element2)
    return element2;
  return null;
}
function getDragOffsetPercentage({ event, dragHandleId, dir, initialDragState, domContext }) {
  const isHorizontal = dir === "horizontal";
  const handleElement = getResizeHandleElement(dragHandleId, domContext);
  assert(handleElement);
  const groupId = handleElement.getAttribute("data-pane-group-id");
  assert(groupId);
  const { initialCursorPosition } = initialDragState;
  const cursorPosition = getResizeEventCursorPosition(dir, event);
  const groupElement = getPaneGroupElement(groupId, domContext);
  assert(groupElement);
  const groupRect = groupElement.getBoundingClientRect();
  const groupSizeInPixels = isHorizontal ? groupRect.width : groupRect.height;
  const offsetPixels = cursorPosition - initialCursorPosition;
  const offsetPercentage = offsetPixels / groupSizeInPixels * 100;
  return offsetPercentage;
}
function getDeltaPercentage({ event, dragHandleId, dir, initialDragState, keyboardResizeBy, domContext }) {
  if (isKeyDown(event)) {
    const isHorizontal = dir === "horizontal";
    let delta = 0;
    if (event.shiftKey) {
      delta = 100;
    } else if (keyboardResizeBy != null) {
      delta = keyboardResizeBy;
    } else {
      delta = 10;
    }
    let movement = 0;
    switch (event.key) {
      case "ArrowDown":
        movement = isHorizontal ? 0 : delta;
        break;
      case "ArrowLeft":
        movement = isHorizontal ? -delta : 0;
        break;
      case "ArrowRight":
        movement = isHorizontal ? delta : 0;
        break;
      case "ArrowUp":
        movement = isHorizontal ? 0 : -delta;
        break;
      case "End":
        movement = 100;
        break;
      case "Home":
        movement = -100;
        break;
    }
    return movement;
  } else {
    if (initialDragState == null)
      return 0;
    return getDragOffsetPercentage({
      event,
      dragHandleId,
      dir,
      initialDragState,
      domContext
    });
  }
}
function getResizeEventCursorPosition(dir, e) {
  const isHorizontal = dir === "horizontal";
  if (isMouseEvent(e)) {
    return isHorizontal ? e.clientX : e.clientY;
  } else if (isTouchEvent(e)) {
    const firstTouch = e.touches[0];
    assert(firstTouch);
    return isHorizontal ? firstTouch.screenX : firstTouch.screenY;
  } else {
    throw new Error(`Unsupported event type "${e.type}"`);
  }
}
function getResizeHandlePaneIds({ groupId, handleId, panesArray, domContext }) {
  const handle = getResizeHandleElement(handleId, domContext);
  const handles = getResizeHandleElementsForGroup(groupId, domContext);
  const index = handle ? handles.indexOf(handle) : -1;
  const idBefore = panesArray[index]?.opts.id.current ?? null;
  const idAfter = panesArray[index + 1]?.opts.id.current ?? null;
  return [idBefore, idAfter];
}
const defaultWindow = void 0;
function getActiveElement(document2) {
  let activeElement = document2.activeElement;
  while (activeElement?.shadowRoot) {
    const node = activeElement.shadowRoot.activeElement;
    if (node === activeElement)
      break;
    else
      activeElement = node;
  }
  return activeElement;
}
class ActiveElement2 {
  #document;
  #subscribe;
  constructor(options = {}) {
    const { window: window2 = defaultWindow, document: document2 = window2?.document } = options;
    if (window2 === void 0) return;
    this.#document = document2;
    this.#subscribe = createSubscriber();
  }
  get current() {
    this.#subscribe?.();
    if (!this.#document) return null;
    return getActiveElement(this.#document);
  }
}
new ActiveElement2();
function runWatcher(sources, flush, effect, options = {}) {
  const { lazy = false } = options;
}
function watch(sources, effect, options) {
  runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
  runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
class Context {
  #name;
  #key;
  /**
   * @param name The name of the context.
   * This is used for generating the context key and error messages.
   */
  constructor(name) {
    this.#name = name;
    this.#key = Symbol(name);
  }
  /**
   * The key used to get and set the context.
   *
   * It is not recommended to use this value directly.
   * Instead, use the methods provided by this class.
   */
  get key() {
    return this.#key;
  }
  /**
   * Checks whether this has been set in the context of a parent component.
   *
   * Must be called during component initialisation.
   */
  exists() {
    return hasContext(this.#key);
  }
  /**
   * Retrieves the context that belongs to the closest parent component.
   *
   * Must be called during component initialisation.
   *
   * @throws An error if the context does not exist.
   */
  get() {
    const context = getContext(this.#key);
    if (context === void 0) {
      throw new Error(`Context "${this.#name}" not found`);
    }
    return context;
  }
  /**
   * Retrieves the context that belongs to the closest parent component,
   * or the given fallback value if the context does not exist.
   *
   * Must be called during component initialisation.
   */
  getOr(fallback) {
    const context = getContext(this.#key);
    if (context === void 0) {
      return fallback;
    }
    return context;
  }
  /**
   * Associates the given value with the current component and returns it.
   *
   * Must be called during component initialisation.
   */
  set(context) {
    return setContext(this.#key, context);
  }
}
function adjustLayoutByDelta({ delta, layout: prevLayout, paneConstraints: paneConstraintsArray, pivotIndices, trigger }) {
  if (areNumbersAlmostEqual(delta, 0))
    return prevLayout;
  const nextLayout = [...prevLayout];
  const [firstPivotIndex, secondPivotIndex] = pivotIndices;
  let deltaApplied = 0;
  {
    if (trigger === "keyboard") {
      {
        const index = delta < 0 ? secondPivotIndex : firstPivotIndex;
        const paneConstraints = paneConstraintsArray[index];
        assert(paneConstraints);
        if (paneConstraints.collapsible) {
          const prevSize = prevLayout[index];
          assert(prevSize != null);
          const paneConstraints2 = paneConstraintsArray[index];
          assert(paneConstraints2);
          const { collapsedSize = 0, minSize = 0 } = paneConstraints2;
          if (areNumbersAlmostEqual(prevSize, collapsedSize)) {
            const localDelta = minSize - prevSize;
            if (compareNumbersWithTolerance(localDelta, Math.abs(delta)) > 0) {
              delta = delta < 0 ? 0 - localDelta : localDelta;
            }
          }
        }
      }
      {
        const index = delta < 0 ? firstPivotIndex : secondPivotIndex;
        const paneConstraints = paneConstraintsArray[index];
        assert(paneConstraints);
        const { collapsible } = paneConstraints;
        if (collapsible) {
          const prevSize = prevLayout[index];
          assert(prevSize != null);
          const paneConstraints2 = paneConstraintsArray[index];
          assert(paneConstraints2);
          const { collapsedSize = 0, minSize = 0 } = paneConstraints2;
          if (areNumbersAlmostEqual(prevSize, minSize)) {
            const localDelta = prevSize - collapsedSize;
            if (compareNumbersWithTolerance(localDelta, Math.abs(delta)) > 0) {
              delta = delta < 0 ? 0 - localDelta : localDelta;
            }
          }
        }
      }
    }
  }
  {
    const increment = delta < 0 ? 1 : -1;
    let index = delta < 0 ? secondPivotIndex : firstPivotIndex;
    let maxAvailableDelta = 0;
    while (true) {
      const prevSize = prevLayout[index];
      assert(prevSize != null);
      const maxSafeSize = resizePane({
        paneConstraints: paneConstraintsArray,
        paneIndex: index,
        initialSize: 100
      });
      const delta2 = maxSafeSize - prevSize;
      maxAvailableDelta += delta2;
      index += increment;
      if (index < 0 || index >= paneConstraintsArray.length) {
        break;
      }
    }
    const minAbsDelta = Math.min(Math.abs(delta), Math.abs(maxAvailableDelta));
    delta = delta < 0 ? 0 - minAbsDelta : minAbsDelta;
  }
  {
    const pivotIndex = delta < 0 ? firstPivotIndex : secondPivotIndex;
    let index = pivotIndex;
    while (index >= 0 && index < paneConstraintsArray.length) {
      const deltaRemaining = Math.abs(delta) - Math.abs(deltaApplied);
      const prevSize = prevLayout[index];
      assert(prevSize != null);
      const unsafeSize = prevSize - deltaRemaining;
      const safeSize = resizePane({
        paneConstraints: paneConstraintsArray,
        paneIndex: index,
        initialSize: unsafeSize
      });
      if (!areNumbersAlmostEqual(prevSize, safeSize)) {
        deltaApplied += prevSize - safeSize;
        nextLayout[index] = safeSize;
        if (deltaApplied.toPrecision(3).localeCompare(Math.abs(delta).toPrecision(3), void 0, {
          numeric: true
        }) >= 0) {
          break;
        }
      }
      if (delta < 0) {
        index--;
      } else {
        index++;
      }
    }
  }
  if (areNumbersAlmostEqual(deltaApplied, 0)) {
    return prevLayout;
  }
  {
    const pivotIndex = delta < 0 ? secondPivotIndex : firstPivotIndex;
    const prevSize = prevLayout[pivotIndex];
    assert(prevSize != null);
    const unsafeSize = prevSize + deltaApplied;
    const safeSize = resizePane({
      paneConstraints: paneConstraintsArray,
      paneIndex: pivotIndex,
      initialSize: unsafeSize
    });
    nextLayout[pivotIndex] = safeSize;
    if (!areNumbersAlmostEqual(safeSize, unsafeSize)) {
      let deltaRemaining = unsafeSize - safeSize;
      const pivotIndex2 = delta < 0 ? secondPivotIndex : firstPivotIndex;
      let index = pivotIndex2;
      while (index >= 0 && index < paneConstraintsArray.length) {
        const prevSize2 = nextLayout[index];
        assert(prevSize2 != null);
        const unsafeSize2 = prevSize2 + deltaRemaining;
        const safeSize2 = resizePane({
          paneConstraints: paneConstraintsArray,
          paneIndex: index,
          initialSize: unsafeSize2
        });
        if (!areNumbersAlmostEqual(prevSize2, safeSize2)) {
          deltaRemaining -= safeSize2 - prevSize2;
          nextLayout[index] = safeSize2;
        }
        if (areNumbersAlmostEqual(deltaRemaining, 0))
          break;
        delta > 0 ? index-- : index++;
      }
    }
  }
  const totalSize = nextLayout.reduce((total, size) => size + total, 0);
  if (!areNumbersAlmostEqual(totalSize, 100))
    return prevLayout;
  return nextLayout;
}
let currentState = null;
let element = null;
function getCursorStyle(state) {
  switch (state) {
    case "horizontal":
      return "ew-resize";
    case "horizontal-max":
      return "w-resize";
    case "horizontal-min":
      return "e-resize";
    case "vertical":
      return "ns-resize";
    case "vertical-max":
      return "n-resize";
    case "vertical-min":
      return "s-resize";
  }
}
function resetGlobalCursorStyle() {
  if (element === null)
    return;
  document.head.removeChild(element);
  currentState = null;
  element = null;
}
function setGlobalCursorStyle(state, doc) {
  if (currentState === state)
    return;
  currentState = state;
  const style = getCursorStyle(state);
  if (element === null) {
    element = doc.createElement("style");
    doc.head.appendChild(element);
  }
  element.innerHTML = `*{cursor: ${style}!important;}`;
}
function computePaneFlexBoxStyle({ defaultSize, dragState, layout, panesArray, paneIndex, precision = 3 }) {
  const size = layout[paneIndex];
  let flexGrow;
  if (size == null) {
    flexGrow = defaultSize ?? "1";
  } else if (panesArray.length === 1) {
    flexGrow = "1";
  } else {
    flexGrow = size.toPrecision(precision);
  }
  return {
    flexBasis: 0,
    flexGrow,
    flexShrink: 1,
    // Without this, pane sizes may be unintentionally overridden by their content
    overflow: "hidden",
    // Disable pointer events inside of a pane during resize
    // This avoid edge cases like nested iframes
    pointerEvents: dragState !== null ? "none" : void 0
  };
}
function initializeStorage(storageObject) {
  try {
    if (typeof localStorage === "undefined") {
      throw new TypeError("localStorage is not supported in this environment");
    }
    storageObject.getItem = (name) => localStorage.getItem(name);
    storageObject.setItem = (name, value) => localStorage.setItem(name, value);
  } catch (err) {
    console.error(err);
    storageObject.getItem = () => null;
    storageObject.setItem = () => {
    };
  }
}
function getPaneGroupKey(autoSaveId) {
  return `paneforge:${autoSaveId}`;
}
function getPaneKey(panes) {
  const sortedPaneIds = panes.map((pane) => {
    return pane.opts.order.current ? `${pane.opts.order.current}:${JSON.stringify(pane.constraints)}` : JSON.stringify(pane.constraints);
  }).sort().join(",");
  return sortedPaneIds;
}
function loadSerializedPaneGroupState(autoSaveId, storage) {
  try {
    const paneGroupKey = getPaneGroupKey(autoSaveId);
    const serialized = storage.getItem(paneGroupKey);
    const parsed = JSON.parse(serialized || "");
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch {
  }
  return null;
}
function loadPaneGroupState(autoSaveId, panesArray, storage) {
  const state = loadSerializedPaneGroupState(autoSaveId, storage) || {};
  const paneKey = getPaneKey(panesArray);
  return state[paneKey] || null;
}
function savePaneGroupState(autoSaveId, panesArray, paneSizesBeforeCollapse, sizes, storage) {
  const paneGroupKey = getPaneGroupKey(autoSaveId);
  const paneKey = getPaneKey(panesArray);
  const state = loadSerializedPaneGroupState(autoSaveId, storage) || {};
  state[paneKey] = {
    expandToSizes: Object.fromEntries(paneSizesBeforeCollapse.entries()),
    layout: sizes
  };
  try {
    storage.setItem(paneGroupKey, JSON.stringify(state));
  } catch (error) {
    console.error(error);
  }
}
const debounceMap = {};
function debounce(callback, durationMs = 10) {
  let timeoutId = null;
  const callable = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
    }, durationMs);
  };
  return callable;
}
function updateStorageValues({ autoSaveId, layout, storage, panesArray, paneSizeBeforeCollapse }) {
  if (layout.length === 0 || layout.length !== panesArray.length)
    return;
  let debouncedSave = debounceMap[autoSaveId];
  if (debouncedSave == null) {
    debouncedSave = debounce(savePaneGroupState, LOCAL_STORAGE_DEBOUNCE_INTERVAL);
    debounceMap[autoSaveId] = debouncedSave;
  }
  const clonedPanesArray = [...panesArray];
  const clonedPaneSizesBeforeCollapse = new Map(paneSizeBeforeCollapse);
  debouncedSave(autoSaveId, clonedPanesArray, clonedPaneSizesBeforeCollapse, layout, storage);
}
const defaultStorage = {
  getItem: (name) => {
    initializeStorage(defaultStorage);
    return defaultStorage.getItem(name);
  },
  setItem: (name, value) => {
    initializeStorage(defaultStorage);
    defaultStorage.setItem(name, value);
  }
};
const PaneGroupContext = new Context("PaneGroup");
class PaneGroupState {
  static create(opts) {
    return PaneGroupContext.set(new PaneGroupState(opts));
  }
  opts;
  attachment;
  domContext;
  dragState = null;
  layout = [];
  panesArray = [];
  panesArrayChanged = false;
  paneIdToLastNotifiedSizeMap = {};
  paneSizeBeforeCollapseMap = /* @__PURE__ */ new Map();
  prevDelta = 0;
  constructor(opts) {
    this.opts = opts;
    this.attachment = attachRef(this.opts.ref);
    this.domContext = new DOMContext(this.opts.ref);
    watch(
      [
        () => this.opts.id.current,
        () => this.layout,
        () => this.panesArray
      ],
      () => {
        return updateResizeHandleAriaValues({
          groupId: this.opts.id.current,
          layout: this.layout,
          panesArray: this.panesArray,
          domContext: this.domContext
        });
      }
    );
    watch(
      [
        () => this.opts.autoSaveId.current,
        () => this.layout,
        () => this.opts.storage.current
      ],
      () => {
        if (!this.opts.autoSaveId.current) return;
        updateStorageValues({
          autoSaveId: this.opts.autoSaveId.current,
          layout: this.layout,
          storage: this.opts.storage.current,
          panesArray: this.panesArray,
          paneSizeBeforeCollapse: this.paneSizeBeforeCollapseMap
        });
      }
    );
    watch(() => this.panesArrayChanged, () => {
      if (!this.panesArrayChanged) return;
      this.panesArrayChanged = false;
      const prevLayout = this.layout;
      let unsafeLayout = null;
      if (this.opts.autoSaveId.current) {
        const state = loadPaneGroupState(this.opts.autoSaveId.current, this.panesArray, this.opts.storage.current);
        if (state) {
          this.paneSizeBeforeCollapseMap = new Map(Object.entries(state.expandToSizes));
          unsafeLayout = state.layout;
        }
      }
      if (unsafeLayout == null) {
        unsafeLayout = getUnsafeDefaultLayout({ panesArray: this.panesArray });
      }
      const nextLayout = validatePaneGroupLayout({
        layout: unsafeLayout,
        paneConstraints: this.panesArray.map((paneData) => paneData.constraints)
      });
      if (areArraysEqual(prevLayout, nextLayout)) return;
      this.layout = nextLayout;
      this.opts.onLayout.current?.(nextLayout);
      callPaneCallbacks(this.panesArray, nextLayout, this.paneIdToLastNotifiedSizeMap);
    });
  }
  setLayout = (newLayout) => {
    this.layout = newLayout;
  };
  registerResizeHandle = (dragHandleId) => {
    return (event) => {
      event.preventDefault();
      const direction = this.opts.direction.current;
      const dragState = this.dragState;
      const groupId = this.opts.id.current;
      const keyboardResizeBy = this.opts.keyboardResizeBy.current;
      const prevLayout = this.layout;
      const paneDataArray = this.panesArray;
      const { initialLayout } = dragState ?? {};
      const doc = this.domContext.getDocument();
      const pivotIndices = getPivotIndices({ groupId, dragHandleId, domContext: this.domContext });
      let delta = getDeltaPercentage({
        event,
        dragHandleId,
        dir: direction,
        initialDragState: dragState,
        keyboardResizeBy,
        domContext: this.domContext
      });
      if (delta === 0) return;
      const isHorizontal = direction === "horizontal";
      if (doc.dir === "rtl" && isHorizontal) {
        delta = -delta;
      }
      const paneConstraints = paneDataArray.map((paneData) => paneData.constraints);
      const nextLayout = adjustLayoutByDelta({
        delta,
        layout: initialLayout ?? prevLayout,
        paneConstraints,
        pivotIndices,
        trigger: isKeyDown(event) ? "keyboard" : "mouse-or-touch"
      });
      const layoutChanged = !areArraysEqual(prevLayout, nextLayout);
      if (isMouseEvent(event) || isTouchEvent(event)) {
        const prevDelta = this.prevDelta;
        if (prevDelta !== delta) {
          this.prevDelta = delta;
          if (!layoutChanged) {
            if (isHorizontal) {
              setGlobalCursorStyle(delta < 0 ? "horizontal-min" : "horizontal-max", doc);
            } else {
              setGlobalCursorStyle(delta < 0 ? "vertical-min" : "vertical-max", doc);
            }
          } else {
            setGlobalCursorStyle(isHorizontal ? "horizontal" : "vertical", doc);
          }
        }
      }
      if (layoutChanged) {
        this.setLayout(nextLayout);
        this.opts.onLayout.current?.(nextLayout);
        callPaneCallbacks(paneDataArray, nextLayout, this.paneIdToLastNotifiedSizeMap);
      }
    };
  };
  resizePane = (paneState, unsafePaneSize) => {
    const prevLayout = this.layout;
    const panesArray = this.panesArray;
    const paneConstraintsArr = panesArray.map((paneData) => paneData.constraints);
    const { paneSize, pivotIndices } = paneDataHelper(panesArray, paneState, prevLayout);
    assert(paneSize != null);
    const isLastPane = findPaneDataIndex(panesArray, paneState) === panesArray.length - 1;
    const delta = isLastPane ? paneSize - unsafePaneSize : unsafePaneSize - paneSize;
    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: prevLayout,
      paneConstraints: paneConstraintsArr,
      pivotIndices,
      trigger: "imperative-api"
    });
    if (areArraysEqual(prevLayout, nextLayout)) return;
    this.setLayout(nextLayout);
    this.opts.onLayout.current?.(nextLayout);
    callPaneCallbacks(panesArray, nextLayout, this.paneIdToLastNotifiedSizeMap);
  };
  startDragging = (dragHandleId, e) => {
    const direction = this.opts.direction.current;
    const layout = this.layout;
    const handleElement = getResizeHandleElement(dragHandleId, this.domContext);
    assert(handleElement);
    const initialCursorPosition = getResizeEventCursorPosition(direction, e);
    this.dragState = {
      dragHandleId,
      dragHandleRect: handleElement.getBoundingClientRect(),
      initialCursorPosition,
      initialLayout: layout
    };
  };
  stopDragging = () => {
    resetGlobalCursorStyle();
    this.dragState = null;
  };
  isPaneCollapsed = (pane) => {
    const paneDataArray = this.panesArray;
    const layout = this.layout;
    const { collapsedSize = 0, collapsible, paneSize } = paneDataHelper(paneDataArray, pane, layout);
    if (typeof paneSize !== "number" || typeof collapsedSize !== "number") return false;
    return collapsible === true && areNumbersAlmostEqual(paneSize, collapsedSize);
  };
  expandPane = (pane) => {
    const prevLayout = this.layout;
    const paneDataArray = this.panesArray;
    if (!pane.constraints.collapsible) return;
    const paneConstraintsArray = paneDataArray.map((paneData) => paneData.constraints);
    const { collapsedSize = 0, paneSize, minSize = 0, pivotIndices } = paneDataHelper(paneDataArray, pane, prevLayout);
    if (paneSize !== collapsedSize) return;
    const prevPaneSize = this.paneSizeBeforeCollapseMap.get(pane.opts.id.current);
    const baseSize = prevPaneSize != null && prevPaneSize >= minSize ? prevPaneSize : minSize;
    const isLastPane = findPaneDataIndex(paneDataArray, pane) === paneDataArray.length - 1;
    const delta = isLastPane ? paneSize - baseSize : baseSize - paneSize;
    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: prevLayout,
      paneConstraints: paneConstraintsArray,
      pivotIndices,
      trigger: "imperative-api"
    });
    if (areArraysEqual(prevLayout, nextLayout)) return;
    this.setLayout(nextLayout);
    this.opts.onLayout.current?.(nextLayout);
    callPaneCallbacks(paneDataArray, nextLayout, this.paneIdToLastNotifiedSizeMap);
  };
  collapsePane = (pane) => {
    const prevLayout = this.layout;
    const paneDataArray = this.panesArray;
    if (!pane.constraints.collapsible) return;
    const paneConstraintsArray = paneDataArray.map((paneData) => paneData.constraints);
    const { collapsedSize = 0, paneSize, pivotIndices } = paneDataHelper(paneDataArray, pane, prevLayout);
    assert(paneSize != null);
    if (paneSize === collapsedSize) return;
    this.paneSizeBeforeCollapseMap.set(pane.opts.id.current, paneSize);
    const isLastPane = findPaneDataIndex(paneDataArray, pane) === paneDataArray.length - 1;
    const delta = isLastPane ? paneSize - collapsedSize : collapsedSize - paneSize;
    const nextLayout = adjustLayoutByDelta({
      delta,
      layout: prevLayout,
      paneConstraints: paneConstraintsArray,
      pivotIndices,
      trigger: "imperative-api"
    });
    if (areArraysEqual(prevLayout, nextLayout)) return;
    this.layout = nextLayout;
    this.opts.onLayout.current?.(nextLayout);
    callPaneCallbacks(paneDataArray, nextLayout, this.paneIdToLastNotifiedSizeMap);
  };
  getPaneSize = (pane) => {
    return paneDataHelper(this.panesArray, pane, this.layout).paneSize;
  };
  getPaneStyle = (pane, defaultSize) => {
    const paneDataArray = this.panesArray;
    const layout = this.layout;
    const dragState = this.dragState;
    const paneIndex = findPaneDataIndex(paneDataArray, pane);
    return computePaneFlexBoxStyle({
      defaultSize,
      dragState,
      layout,
      panesArray: paneDataArray,
      paneIndex
    });
  };
  isPaneExpanded = (pane) => {
    const { collapsedSize = 0, collapsible, paneSize } = paneDataHelper(this.panesArray, pane, this.layout);
    return !collapsible || paneSize > collapsedSize;
  };
  registerPane = (pane) => {
    const newPaneDataArray = [...this.panesArray, pane];
    newPaneDataArray.sort((paneA, paneB) => {
      const orderA = paneA.opts.order.current;
      const orderB = paneB.opts.order.current;
      if (orderA == null && orderB == null) {
        return 0;
      } else if (orderA == null) {
        return -1;
      } else if (orderB == null) {
        return 1;
      } else {
        return orderA - orderB;
      }
    });
    this.panesArray = newPaneDataArray;
    this.panesArrayChanged = true;
    return () => {
      const paneDataArray = [...this.panesArray];
      const index = findPaneDataIndex(this.panesArray, pane);
      if (index < 0) return;
      paneDataArray.splice(index, 1);
      this.panesArray = paneDataArray;
      delete this.paneIdToLastNotifiedSizeMap[pane.opts.id.current];
      this.panesArrayChanged = true;
    };
  };
  #setResizeHandlerEventListeners = () => {
    const groupId = this.opts.id.current;
    const handles = getResizeHandleElementsForGroup(groupId, this.domContext);
    const paneDataArray = this.panesArray;
    const unsubHandlers = handles.map((handle) => {
      const handleId = handle.getAttribute("data-pane-resizer-id");
      if (!handleId) return noop;
      const [idBefore, idAfter] = getResizeHandlePaneIds({
        groupId,
        handleId,
        panesArray: paneDataArray,
        domContext: this.domContext
      });
      if (idBefore == null || idAfter == null) return noop;
      const onKeydown = (e) => {
        if (e.defaultPrevented || e.key !== "Enter") return;
        e.preventDefault();
        const paneDataArray2 = this.panesArray;
        const index = paneDataArray2.findIndex((paneData2) => paneData2.opts.id.current === idBefore);
        if (index < 0) return;
        const paneData = paneDataArray2[index];
        assert(paneData);
        const layout = this.layout;
        const size = layout[index];
        const { collapsedSize = 0, collapsible, minSize = 0 } = paneData.constraints;
        if (!(size != null && collapsible)) return;
        const nextLayout = adjustLayoutByDelta({
          delta: areNumbersAlmostEqual(size, collapsedSize) ? minSize - size : collapsedSize - size,
          layout,
          paneConstraints: paneDataArray2.map((paneData2) => paneData2.constraints),
          pivotIndices: getPivotIndices({ groupId, dragHandleId: handleId, domContext: this.domContext }),
          trigger: "keyboard"
        });
        if (layout !== nextLayout) {
          this.layout = nextLayout;
        }
      };
      const unsubListener = addEventListener(handle, "keydown", onKeydown);
      return () => {
        unsubListener();
      };
    });
    return () => {
      for (const unsub of unsubHandlers) {
        unsub();
      }
    };
  };
  #props = derived(() => ({
    id: this.opts.id.current,
    "data-pane-group": "",
    "data-direction": this.opts.direction.current,
    "data-pane-group-id": this.opts.id.current,
    style: {
      display: "flex",
      flexDirection: this.opts.direction.current === "horizontal" ? "row" : "column",
      height: "100%",
      overflow: "hidden",
      width: "100%"
    },
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
const resizeKeys = [
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home"
];
class PaneResizerState {
  static create(opts) {
    return new PaneResizerState(opts, PaneGroupContext.get());
  }
  opts;
  #group;
  attachment;
  domContext;
  #isDragging = derived(() => this.#group.dragState?.dragHandleId === this.opts.id.current);
  #isFocused = false;
  resizeHandler = null;
  constructor(opts, group) {
    this.opts = opts;
    this.#group = group;
    this.attachment = attachRef(this.opts.ref);
    this.domContext = new DOMContext(this.opts.ref);
  }
  #startDragging = (e) => {
    e.preventDefault();
    if (this.opts.disabled.current) return;
    this.#group.startDragging(this.opts.id.current, e);
    this.opts.onDraggingChange.current(true);
  };
  #stopDraggingAndBlur = () => {
    const node = this.opts.ref.current;
    if (!node) return;
    node.blur();
    this.#group.stopDragging();
    this.opts.onDraggingChange.current(false);
  };
  #onkeydown = (e) => {
    if (this.opts.disabled.current || !this.resizeHandler || e.defaultPrevented) return;
    if (resizeKeys.includes(e.key)) {
      e.preventDefault();
      this.resizeHandler(e);
      return;
    }
    if (e.key !== "F6") return;
    e.preventDefault();
    const handles = getResizeHandleElementsForGroup(this.#group.opts.id.current, this.domContext);
    const index = getResizeHandleElementIndex({
      groupId: this.#group.opts.id.current,
      id: this.opts.id.current,
      domContext: this.domContext
    });
    if (index === null) return;
    let nextIndex = 0;
    if (e.shiftKey) {
      if (index > 0) {
        nextIndex = index - 1;
      } else {
        nextIndex = handles.length - 1;
      }
    } else {
      if (index + 1 < handles.length) {
        nextIndex = index + 1;
      } else {
        nextIndex = 0;
      }
    }
    const nextHandle = handles[nextIndex];
    nextHandle.focus();
  };
  #onblur = () => {
    this.#isFocused = false;
  };
  #onfocus = () => {
    this.#isFocused = true;
  };
  #onmousedown = (e) => {
    this.#startDragging(e);
  };
  #onmouseup = () => {
    this.#stopDraggingAndBlur();
  };
  #ontouchcancel = () => {
    this.#stopDraggingAndBlur();
  };
  #ontouchend = () => {
    this.#stopDraggingAndBlur();
  };
  #ontouchstart = (e) => {
    this.#startDragging(e);
  };
  #props = derived(() => ({
    id: this.opts.id.current,
    role: "separator",
    "data-direction": this.#group.opts.direction.current,
    "data-pane-group-id": this.#group.opts.id.current,
    "data-active": this.#isDragging() ? "pointer" : this.#isFocused ? "keyboard" : void 0,
    "data-enabled": !this.opts.disabled.current,
    "data-pane-resizer-id": this.opts.id.current,
    "data-pane-resizer": "",
    tabIndex: this.opts.tabIndex.current,
    style: {
      cursor: getCursorStyle(this.#group.opts.direction.current),
      touchAction: "none",
      userSelect: "none",
      "-webkit-user-select": "none",
      "-webkit-touch-callout": "none"
    },
    onkeydown: this.#onkeydown,
    onblur: this.#onblur,
    onfocus: this.#onfocus,
    onmousedown: this.#onmousedown,
    onmouseup: this.#onmouseup,
    ontouchcancel: this.#ontouchcancel,
    ontouchend: this.#ontouchend,
    ontouchstart: this.#ontouchstart,
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
class PaneState {
  static create(opts) {
    return new PaneState(opts, PaneGroupContext.get());
  }
  opts;
  group;
  attachment;
  domContext;
  #paneTransitionState = "";
  #callbacks = derived(() => ({
    onCollapse: this.opts.onCollapse.current,
    onExpand: this.opts.onExpand.current,
    onResize: this.opts.onResize.current
  }));
  get callbacks() {
    return this.#callbacks();
  }
  set callbacks($$value) {
    return this.#callbacks($$value);
  }
  #constraints = derived(() => ({
    collapsedSize: this.opts.collapsedSize.current,
    collapsible: this.opts.collapsible.current,
    defaultSize: this.opts.defaultSize.current,
    maxSize: this.opts.maxSize.current,
    minSize: this.opts.minSize.current
  }));
  get constraints() {
    return this.#constraints();
  }
  set constraints($$value) {
    return this.#constraints($$value);
  }
  #handleTransition = (state) => {
    this.#paneTransitionState = state;
    afterTick(() => {
      if (this.opts.ref.current) {
        const element2 = this.opts.ref.current;
        const computedStyle = getComputedStyle(element2);
        const hasTransition = computedStyle.transitionDuration !== "0s";
        if (!hasTransition) {
          this.#paneTransitionState = "";
          return;
        }
        const handleTransitionEnd = (event) => {
          if (event.propertyName === "flex-grow") {
            this.#paneTransitionState = "";
            element2.removeEventListener("transitionend", handleTransitionEnd);
          }
        };
        element2.addEventListener("transitionend", handleTransitionEnd);
      } else {
        this.#paneTransitionState = "";
      }
    });
  };
  pane = {
    collapse: () => {
      this.#handleTransition("collapsing");
      this.group.collapsePane(this);
    },
    expand: () => {
      this.#handleTransition("expanding");
      this.group.expandPane(this);
    },
    getSize: () => this.group.getPaneSize(this),
    isCollapsed: () => this.group.isPaneCollapsed(this),
    isExpanded: () => this.group.isPaneExpanded(this),
    resize: (size) => this.group.resizePane(this, size),
    getId: () => this.opts.id.current
  };
  constructor(opts, group) {
    this.opts = opts;
    this.group = group;
    this.attachment = attachRef(this.opts.ref);
    this.domContext = new DOMContext(this.opts.ref);
    watch(() => snapshot(this.constraints), () => {
      this.group.panesArrayChanged = true;
    });
  }
  #isCollapsed = derived(() => this.group.isPaneCollapsed(this));
  #paneState = derived(() => this.#paneTransitionState !== "" ? this.#paneTransitionState : this.#isCollapsed() ? "collapsed" : "expanded");
  #props = derived(() => ({
    id: this.opts.id.current,
    style: this.group.getPaneStyle(this, this.opts.defaultSize.current),
    "data-pane": "",
    "data-pane-id": this.opts.id.current,
    "data-pane-group-id": this.group.opts.id.current,
    "data-collapsed": this.#isCollapsed() ? "" : void 0,
    "data-expanded": this.#isCollapsed() ? void 0 : "",
    "data-pane-state": this.#paneState(),
    ...this.attachment
  }));
  get props() {
    return this.#props();
  }
  set props($$value) {
    return this.#props($$value);
  }
}
function Pane_group($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      autoSaveId = null,
      direction,
      id = uid,
      keyboardResizeBy = null,
      onLayoutChange = noop,
      storage = defaultStorage,
      ref = null,
      child,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const paneGroupState = PaneGroupState.create({
      id: box.with(() => id ?? uid),
      ref: box.with(() => ref, (v) => ref = v),
      autoSaveId: box.with(() => autoSaveId),
      direction: box.with(() => direction),
      keyboardResizeBy: box.with(() => keyboardResizeBy),
      onLayout: box.with(() => onLayoutChange),
      storage: box.with(() => storage)
    });
    const getLayout = () => paneGroupState.layout;
    const setLayout = paneGroupState.setLayout;
    const getId = () => paneGroupState.opts.id.current;
    const mergedProps = mergeProps(restProps, paneGroupState.props);
    if (child) {
      $$renderer2.push("<!--[-->");
      child($$renderer2, { props: mergedProps });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref, getLayout, setLayout, getId });
  });
}
function Pane($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = uid,
      ref = null,
      collapsedSize,
      collapsible,
      defaultSize,
      maxSize,
      minSize,
      onCollapse = noop,
      onExpand = noop,
      onResize = noop,
      order,
      child,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const paneState = PaneState.create({
      id: box.with(() => id),
      ref: box.with(() => ref, (v) => ref = v),
      collapsedSize: box.with(() => collapsedSize),
      collapsible: box.with(() => collapsible),
      defaultSize: box.with(() => defaultSize),
      maxSize: box.with(() => maxSize),
      minSize: box.with(() => minSize),
      onCollapse: box.with(() => onCollapse),
      onExpand: box.with(() => onExpand),
      onResize: box.with(() => onResize),
      order: box.with(() => order)
    });
    const collapse = paneState.pane.collapse;
    const expand = paneState.pane.expand;
    const getSize = paneState.pane.getSize;
    const isCollapsed = paneState.pane.isCollapsed;
    const isExpanded = paneState.pane.isExpanded;
    const resize = paneState.pane.resize;
    const getId = paneState.pane.getId;
    const mergedProps = mergeProps(restProps, paneState.props);
    if (child) {
      $$renderer2.push("<!--[-->");
      child($$renderer2, { props: mergedProps });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      ref,
      collapse,
      expand,
      getSize,
      isCollapsed,
      isExpanded,
      resize,
      getId
    });
  });
}
function Pane_resizer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const uid = props_id($$renderer2);
    let {
      id = uid,
      ref = null,
      disabled = false,
      onDraggingChange = noop,
      tabindex = 0,
      child,
      children,
      $$slots,
      $$events,
      ...restProps
    } = $$props;
    const resizerState = PaneResizerState.create({
      id: box.with(() => id),
      ref: box.with(() => ref, (v) => ref = v),
      disabled: box.with(() => disabled),
      onDraggingChange: box.with(() => onDraggingChange),
      tabIndex: box.with(() => tabindex)
    });
    const mergedProps = mergeProps(restProps, resizerState.props);
    if (child) {
      $$renderer2.push("<!--[-->");
      child($$renderer2, { props: mergedProps });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div${attributes({ ...mergedProps })}>`);
      children?.($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { ref });
  });
}
function Shortcuts($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { callbacks } = $$props;
  });
}
class Clipboard {
  last = void 0;
  get() {
    if (electron) {
      return electron.clipboard.get().then(
        (resp) => this.last = resp
      );
    } else {
      return this.last;
    }
  }
  set(value) {
    this.last = value;
    if (electron) {
      return electron.clipboard.set(value);
    }
  }
}
let current = {
  user: void 0,
  file: void 0,
  project: void 0,
  experiment: new Experiment(),
  readme: { shown: false, script: new Script("readme.md") },
  tip: { shown: false },
  routine: void 0,
  moving: void 0,
  inserting: void 0,
  clipboard: new Clipboard()
};
function Item($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Label for this menu item */
      label,
      /** @prop @type {String|undefined} Path to an icon for this page's tab */
      icon = void 0,
      /** @prop @type {String} Name of the keyboard shortcut (if any) for this menu item */
      shortcut = void 0,
      /** 
       * @prop @type {function} Function to call when this item is clicked, given 3 params:
       * 
       * @param evt {MouseEvent} Event triggered on click
       * @param data {any} Arbitrary data associated with this menu item 
       */
      onclick = (evt, data2) => {
      },
      /** @prop @type {any} Arbitrary data associated with this menu item  */
      data = {},
      /** @prop @type {boolean} Close menu on click? */
      close = true,
      /** @prop @type {boolean} Is this item able to be clicked on? */
      disabled = void 0,
      /** @slot Render an optional submenu on this item */
      submenu = void 0
    } = $$props;
    getContext("closeMenu");
    let keyLabels = { CONTROL: "CTRL", META: "CMD" };
    $$renderer2.push(`<button class="menu-item svelte-afwc6o"${attr(
      "disabled",
      // execute the given function, with arbitrary data given on init
      // close menu if requested
      disabled,
      true
    )}>`);
    Icon($$renderer2, { src: icon, size: "1rem" });
    $$renderer2.push(`<!----> <span class="label svelte-afwc6o">${escape_html(label)}</span> <span class="shortcut svelte-afwc6o">`);
    if (shortcut in prefs.shortcuts) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`${escape_html(prefs.shortcuts[shortcut].val.map((item) => keyLabels[item] || item).join("+"))}`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></span> `);
    submenu?.($$renderer2);
    $$renderer2.push(`<!----></button>`);
    bind_props($$props, { disabled });
  });
}
function Separator($$renderer) {
  $$renderer.push(`<div class="menu-separator"><hr class="svelte-q0v1rm"/></div>`);
}
function SubMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {string} Label for this menu item */
      label,
      /** @prop @type {String|undefined} Path to an icon for this page's tab */
      icon = void 0,
      /** @prop @type {any} Arbitrary data associated with this menu item  */
      data = {},
      /** @prop @type {boolean} Is this item able to be clicked on? */
      disabled = void 0,
      children
    } = $$props;
    let shown = void 0;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      {
        let submenu = function($$renderer4) {
          Icon($$renderer4, { src: "/icons/sym-arrow-right.svg", size: ".5rem" });
          $$renderer4.push(`<!----> `);
          Menu($$renderer4, {
            get shown() {
              return shown;
            },
            set shown($$value) {
              shown = $$value;
              $$settled = false;
            },
            children: ($$renderer5) => {
              $$renderer5.push(`<div class="menu svelte-w8cfbk">`);
              children($$renderer5);
              $$renderer5.push(`<!----></div>`);
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!---->`);
        };
        Item($$renderer3, {
          label,
          icon,
          onclick: () => {
            shown = true;
          },
          data,
          close: false,
          disabled,
          submenu,
          $$slots: { submenu: true }
        });
      }
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { disabled });
  });
}
function SingleLineCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      /** @prop @type {Boolean} Should the code indicator ($) be shown? */
      codeIndicator = param.isCodeType,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    if (codeIndicator) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="code-indicator svelte-jguuf1">$</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <input${attributes(
      {
        class: "param-text-input-single",
        type: "text",
        value: param.val,
        disabled,
        ...attachments
      },
      "svelte-jguuf1",
      { valid: param.valid.value, code: param.isCode },
      void 0,
      4
    )}/>`);
    bind_props($$props, { param });
  });
}
function MultiLineCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      /** @prop @type {Boolean} Should the code indicator ($) be shown? */
      codeIndicator = param.isCodeType,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    if (codeIndicator) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="code-indicator svelte-pgnrou">$</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <textarea${attributes({ class: "param-text-input-multi", disabled, ...attachments }, "svelte-pgnrou", { valid: param.valid.value, code: param.isCode })}>`);
    const $$body = escape_html(param.val);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    } else {
      $$renderer2.push(`
`);
    }
    $$renderer2.push(`</textarea>`);
    bind_props($$props, { param });
  });
}
function NameCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    getContext("current");
    SingleLineCtrl($$renderer2, spread_props([
      {
        param,
        checkCode: (param2) => false,
        codeIndicator: false,
        disabled
      },
      attachments
    ]));
    bind_props($$props, { param });
  });
}
function BoolCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false
    } = $$props;
    $$renderer2.push(`<input class="param-bool-input svelte-1mhik0b" type="checkbox"${attr("checked", param.val, true)}${attr("disabled", disabled, true)}/>`);
    bind_props($$props, { param });
  });
}
function iterateName(name) {
  if (name.match(/\d+$/)) {
    return name.replace(
      /(\d+$)/,
      (num) => String(
        parseInt(num) + 1
      )
    );
  } else {
    return name + "_1";
  }
}
async function optionsFromPython(query) {
  let options = [];
  if (!python$1?.ready) {
    return options;
  }
  try {
    options = await python$1.liaison.send("app", {
      command: "run",
      args: [query.replace("python:///", "")]
    }, 1e4);
  } catch {
    options = await python$1.liaison.send("app", {
      command: "get",
      args: [query.replace("python:///", "")]
    }, 1e4);
  }
  return options;
}
async function optionsFromParam(param) {
  let output = [];
  if (typeof param.allowedVals === "string" && param.allowedVals.startsWith("python:///")) {
    try {
      param.allowedVals = await optionsFromPython(param.allowedVals);
    } catch (err) {
      console.log(`Failed to get allowedVals for param ${param.name} (${param.allowedVals}, ${err})`);
      param.allowedVals = [];
    }
  }
  if (typeof param.allowedLabels === "string" && param.allowedLabels.startsWith("python:///")) {
    try {
      param.allowedVals = await optionsFromPython(param.allowedLabels);
    } catch (err) {
      console.log(`Failed to get allowedVals for param ${param.name} (${param.allowedVals}, ${err})`);
      param.allowedVals = [];
    }
  }
  if (param.allowedLabels === void 0 || param.allowedLabels.length == 0) {
    param.allowedLabels = param.allowedVals;
  }
  if (param.allowedVals === void 0 || param.allowedVals.length == 0) {
    param.allowedVals = param.allowedLabels;
  }
  if (!param.allowedVals && !param.allowedLabels) {
    return output;
  }
  for (let i in param.allowedVals) {
    output.push(
      [param.allowedVals[i], param.allowedLabels[i]]
    );
  }
  if (Array.isArray(param.val)) {
    for (let item of param.val.filter(
      (item2) => !output.some((value) => value[0] === item2)
    )) {
      output.push(
        [item, item]
      );
    }
  } else if (!output.some((value) => value[0] === param.val)) {
    output.push(
      [param.val, param.val]
    );
  }
  return output;
}
function mimeTypesFromParam(param) {
  let types = [];
  if (Array.isArray(param.allowedVals) && Array.isArray(param.allowedLabels) && param.allowedVals.length === param.allowedLabels.length) {
    for (let i in param.allowedVals) {
      types.push({
        description: param.allowedLabels[i],
        accept: param.allowedVals[i]
      });
    }
  }
  return types;
}
function ChoiceCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface*/
      ...attachments
    } = $$props;
    $$renderer2.select(
      {
        class: "param-choice-input",
        disabled: disabled || param.allowedVals.length == 1 && param.allowedVals.includes(param.val),
        value: param.val,
        ...attachments
      },
      ($$renderer3) => {
        await_block(
          $$renderer3,
          optionsFromParam(param),
          () => {
            $$renderer3.option({}, ($$renderer4) => {
              $$renderer4.push(`Loading...`);
            });
          },
          (options) => {
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(options);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let [val, label] = each_array[$$index];
              $$renderer3.option({ value: val, selected: param.val === val }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(label)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-1upzpr2",
      void 0,
      { color: param.valid.value ? "inherit" : "var(--red)" }
    );
    bind_props($$props, { param });
  });
}
function VersionCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let options = (async () => {
      let resp = await fetch(`https://api.github.com/repos/${param.allowedVals}/tags`, { method: "GET" });
      let versions = (await resp.json()).map((ver) => new Version(ver.name)).toSorted((a, b) => a.olderThan(b) ? 1 : -1);
      options = {};
      for (let ver of versions) {
        if (!(ver.format("minor") in options)) {
          options[ver.format("minor")] = [];
        }
        options[ver.format("minor")].push([ver.format(), ver.format()]);
      }
    })();
    $$renderer2.select(
      {
        class: "param-version-input",
        disabled: disabled || param.allowedVals.length == 1,
        value: param.val,
        ...attachments
      },
      ($$renderer3) => {
        await_block(
          $$renderer3,
          options,
          () => {
            $$renderer3.option({ value: "" }, ($$renderer4) => {
              $$renderer4.push(`Fetching versions from GitHub...`);
            });
          },
          (options2) => {
            $$renderer3.option({ value: "" }, ($$renderer4) => {
              $$renderer4.push(`latest`);
            });
            $$renderer3.push(` <!--[-->`);
            const each_array = ensure_array_like(Object.entries(options2));
            for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
              let [minor, versions] = each_array[$$index_1];
              $$renderer3.push(`<optgroup${attr("label", minor)}>`);
              $$renderer3.option({ value: `${minor}.*`, selected: param.val === `${minor}.*` }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(minor)} (final)`);
              });
              $$renderer3.push(` <!--[-->`);
              const each_array_1 = ensure_array_like(versions);
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                let [version, label] = each_array_1[$$index];
                $$renderer3.option({ value: version, selected: param.val === version }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(label)}`);
                });
              }
              $$renderer3.push(`<!--]--></optgroup>`);
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-sh186d",
      void 0,
      { color: param.valid.value ? "inherit" : "var(--red)" }
    );
    bind_props($$props, { param });
  });
}
function FileCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      /** @bindable State tracking whether this param's value is valid */
      valid = void 0,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let current2 = getContext("current");
    async function getFile(evt) {
      let types = mimeTypesFromParam(param);
      let file = await browseFileOpen(types, current2.experiment?.file?.parent);
      if (file) {
        if (current2.experiment?.file?.parent) {
          param.val = file.file.replace(current2.experiment.file.parent, "").replace(/^\//, "");
        } else {
          param.val = file.file;
        }
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      SingleLineCtrl($$renderer3, spread_props([
        { disabled },
        attachments,
        {
          get param() {
            return param;
          },
          set param($$value) {
            param = $$value;
            $$settled = false;
          },
          get valid() {
            return valid;
          },
          set valid($$value) {
            valid = $$value;
            $$settled = false;
          }
        }
      ]));
      $$renderer3.push(`<!----> `);
      CompactButton($$renderer3, {
        icon: "/icons/btn-open.svg",
        tooltip: "Browse for file...",
        onclick: getFile,
        disabled
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { param, valid });
  });
}
function DictCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let entries = (() => {
      let entries2 = [];
      for (let [key, val] of Object.entries(param.val)) {
        entries2[key] = new Param(`${key}:value`);
        entries2[key].val = val;
        entries2[key].valType = "code";
      }
      return Object.entries(entries2);
    })();
    $$renderer2.push(`<div${attributes({ class: "dict-ctrl-layout", ...attachments }, "svelte-1xfs9n3")}><!--[-->`);
    const each_array = ensure_array_like(entries);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [label, value] = each_array[$$index];
      $$renderer2.push(`<input${attr("value", /* @__PURE__ */ (() => label)())}${attr("disabled", disabled, true)}/> <span class="dict-ctrl-label svelte-1xfs9n3">:</span> `);
      SingleLineCtrl($$renderer2, { param: value, codeIndicator: false, disabled });
      $$renderer2.push(`<!----> `);
      CompactButton($$renderer2, {
        icon: "/icons/btn-delete.svg",
        onclick: (evt) => {
          delete param.val[label];
        },
        disabled,
        tooltip: "Remove item"
      });
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]--> <div class="gap"></div> <div class="gap"></div> <div class="gap"></div> `);
    CompactButton($$renderer2, {
      icon: "/icons/btn-add.svg",
      onclick: (evt) => {
        let key = "field";
        while (key in param.val) {
          key = iterateName(key);
        }
        param.val[key] = "";
      },
      tooltip: "Add item",
      disabled
    });
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { param });
  });
}
function MultipleChoiceCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    $$renderer2.push(`<div${attributes({ class: "param-multi-choice-input", ...attachments }, "svelte-knio7e", void 0, { color: param.valid.value ? "inherit" : "var(--red)" })}>`);
    await_block(
      $$renderer2,
      optionsFromParam(param),
      () => {
        $$renderer2.push(`Loading...`);
      },
      (options) => {
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(options);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let [val, label] = each_array[$$index];
          $$renderer2.push(`<input type="checkbox"${attr("checked", (() => param.val.includes(val))(), true)}${attr("disabled", disabled, true)}/> ${escape_html(label)}`);
        }
        $$renderer2.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { param });
  });
}
function FileListCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let items = (() => {
      let items2 = [];
      for (let [i, val] of Object.entries(param.val)) {
        let item = new Param(`${param.name}:${i}`);
        item.val = val;
        item.valType = "str";
        items2.push(item);
      }
      return items2;
    })();
    $$renderer2.push(`<div${attributes({ class: "list-ctrl-layout", ...attachments }, "svelte-23pe19")}><!--[-->`);
    const each_array = ensure_array_like(Object.entries(items));
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [i, item] = each_array[$$index];
      FileCtrl($$renderer2, { param: item, disabled });
      $$renderer2.push(`<!----> `);
      CompactButton($$renderer2, {
        icon: "/icons/btn-delete.svg",
        onclick: (evt) => {
          param.val.splice(i, 1);
        },
        disabled,
        tooltip: "Remove item"
      });
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]--> <div class="gap"></div> `);
    CompactButton($$renderer2, {
      icon: "/icons/btn-add-many.svg",
      onclick: async (evt) => {
        let types = mimeTypesFromParam(param);
        let handles = await window.showOpenFilePicker({ types, multiple: true });
        for (let handle of handles) {
          let file = await handle.getFile();
          param.val.push(file.name);
        }
      },
      tooltip: "Add multiple items",
      disabled
    });
    $$renderer2.push(`<!----> `);
    CompactButton($$renderer2, {
      icon: "/icons/btn-add.svg",
      onclick: (evt) => {
        param.val.push("");
      },
      tooltip: "Add item",
      disabled
    });
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { param });
  });
}
function TableCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let current2 = getContext("current");
    let showPrompt = false;
    function openTable() {
      electron.files.openPath(current2.experiment.relativePath(param.val));
    }
    function newTable() {
      showPrompt = true;
      if (param?.ctrlParams?.template) {
        electron.files.openPath(param.ctrlParams.template).then((resp) => console.log(resp, param.ctrlParams.template));
      } else {
        python$1.liaison.send(
          "app",
          {
            command: "run",
            args: ["psychopy.experiment.utils:getBlankTemplate"]
          },
          1e3
        ).then(
          // ...and open it
          (resp) => electron.files.openPath(resp)
        );
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      FileCtrl($$renderer3, spread_props([{ param, disabled }, attachments]));
      $$renderer3.push(`<!----> `);
      if (electron) {
        $$renderer3.push("<!--[-->");
        CompactButton($$renderer3, {
          icon: `/icons/btn-${stringify(param.val ? "" : "new-")}table.svg`,
          tooltip: `${stringify(param.val ? "Open" : "Create")} table`,
          onclick: param.val ? openTable : newTable,
          disabled: disabled || param.isCode
        });
        $$renderer3.push(`<!----> `);
        MessageDialog($$renderer3, {
          title: "Reminder...",
          buttons: { OK: (evt) => {
          } },
          get shown() {
            return showPrompt;
          },
          set shown($$value) {
            showPrompt = $$value;
            $$settled = false;
          },
          children: ($$renderer4) => {
            $$renderer4.push(`<p>Once you have created and saved your table, please remember to add it.</p>`);
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
    bind_props($$props, { param });
  });
}
function Info($$renderer, $$props) {
  let {
    /** @interface */
    children
  } = $$props;
  $$renderer.push(`<div class="info svelte-1ho5yrp" role="none"${attr_style("", { opacity: 0.25 })}>`);
  Icon($$renderer, { src: "/icons/sym-info.svg" });
  $$renderer.push(`<!----> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div>`);
}
function ConditionsCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    $$renderer2.push(`<div class="wrapper svelte-6ybxcp">`);
    TableCtrl($$renderer2, spread_props([{ param, disabled }, attachments]));
    $$renderer2.push(`<!----> <div class="output svelte-6ybxcp">`);
    if (param.val) {
      $$renderer2.push("<!--[-->");
      await_block(
        $$renderer2,
        python$1.liaison.send("app", {
          command: "run",
          args: ["psychopy.data.utils:importConditions"],
          kwargs: {
            fileName: current.experiment.relativePath(param.val),
            returnFieldNames: true
          }
        }),
        () => {
          $$renderer2.push(`Loading...`);
        },
        (conditions) => {
          if (conditions) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`${escape_html(conditions[0].length)} conditions, with ${escape_html(conditions[1].length)} parameters `);
            Info($$renderer2, {
              children: ($$renderer3) => {
                $$renderer3.push(`<div class="more-info svelte-6ybxcp">${escape_html(conditions[1].join(", "))}</div>`);
              }
            });
            $$renderer2.push(`<!---->`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
      );
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
    bind_props($$props, { param });
  });
}
function DeviceProfile($$renderer, $$props) {
  let { profile } = $$props;
  $$renderer.push(`<table class="device-profile svelte-iajvsi">`);
  if (profile) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<tbody><!--[-->`);
    const each_array = ensure_array_like(Object.entries(profile));
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let [key, val] = each_array[$$index];
      $$renderer.push(`<tr><th class="key svelte-iajvsi">${escape_html(key)}</th><td class="value svelte-iajvsi">${escape_html(val)}</td></tr>`);
    }
    $$renderer.push(`<!--]--></tbody>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></table>`);
}
function DeviceDetails($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { device } = $$props;
    $$renderer2.push(`<div class="device-details-pnl svelte-1nwj607">`);
    Notebook_1($$renderer2, { element: device });
    $$renderer2.push(`<!----> `);
    DeviceProfile($$renderer2, { profile: device.profile });
    $$renderer2.push(`<!----></div>`);
  });
}
function Notebook($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {function} Function to execute when the page is changed */
      onselect = (index, data) => {
      },
      /** @interface @type {Array<HTMLElement>} Child elements of this notebook */
      children = void 0
    } = $$props;
    let pages = {
      selected: { index: void 0, data: void 0, page: void 0 },
      book: "notebook",
      all: []
    };
    setContext("siblings", pages);
    $$renderer2.push(`<div class="notebook svelte-1lc7bh8"><div class="notebook-tabs svelte-1lc7bh8">`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div> <div class="notebook-page svelte-1lc7bh8">`);
    pages.selected.page?.($$renderer2);
    $$renderer2.push(`<!----></div></div>`);
  });
}
function Listbook($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {function} Function to execute when the page is changed */
      onselect = (index, data) => {
      },
      /** @interface @type {Array<HTMLElement>} Child elements of this notebook */
      children = void 0
    } = $$props;
    let pages = {
      selected: { index: void 0, data: void 0, page: void 0 },
      book: "listbook",
      all: []
    };
    setContext("siblings", pages);
    $$renderer2.push(`<div class="listbook svelte-g709u4"><div class="listbook-tabs svelte-g709u4">`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div> <div class="listbook-page svelte-g709u4">`);
    pages.selected.page?.($$renderer2);
    $$renderer2.push(`<!----></div></div>`);
  });
}
function Page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {String} Label for this page's tab */
      label = void 0,
      /** @prop @type {String|undefined} Path to an icon for this page's tab */
      icon = void 0,
      /** @binding Control whether this page is selected */
      selected = void 0,
      /** @prop @type {function|undefined} Function to close the tab (setting this will show the 
       * close button) */
      close = void 0,
      /** @prop @type {string|undefined} Tooltip when hovered over close button */
      closeTooltip = void 0,
      /** @prop @type {any} Arbitrary data relating to this page */
      data = {},
      /** @interface @type {Array<HTMLElement>} Contents of this page */
      children = void 0,
      /** @interface @type {Array<HTMLElement>} Menu with which to replace the default context menu on this tab */
      contextMenu = void 0
    } = $$props;
    let siblings = getContext("siblings");
    let handle;
    onDestroy(() => {
      if (siblings.all[siblings.all.indexOf(handle)] !== void 0) {
        delete siblings.all[siblings.all.indexOf(handle)];
      }
    });
    let closeHovered = false;
    let contextMenuParams = { pos: { x: void 0, y: void 0 }, show: false };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Menu($$renderer3, {
        get shown() {
          return contextMenuParams.show;
        },
        set shown($$value) {
          contextMenuParams.show = $$value;
          $$settled = false;
        },
        get position() {
          return contextMenuParams.pos;
        },
        set position($$value) {
          contextMenuParams.pos = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          contextMenu?.($$renderer4);
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> <button${attr_class("notebook-tab svelte-1qcrcnu", void 0, {
        "current": selected,
        "listbook": siblings.book === "listbook",
        "notebook": siblings.book === "notebook"
      })}>`);
      if (icon) {
        $$renderer3.push("<!--[-->");
        Icon($$renderer3, { src: icon });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<span class="label svelte-1qcrcnu">${escape_html(label)}</span>`);
      }
      $$renderer3.push(`<!--]--> `);
      if (close !== void 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="close-btn svelte-1qcrcnu" role="none">`);
        Icon($$renderer3, { src: "/icons/sym-close.svg", size: ".75rem" });
        $$renderer3.push(`<!----> `);
        if (closeTooltip) {
          $$renderer3.push("<!--[-->");
          Tooltip($$renderer3, {
            position: "bottom",
            get shown() {
              return closeHovered;
            },
            set shown($$value) {
              closeHovered = $$value;
              $$settled = false;
            },
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(closeTooltip)}`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div>`);
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
    bind_props($$props, { label, selected });
  });
}
function ButtonTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { callback, tooltip = void 0, label = "+", disabled = false } = $$props;
    let hovered = false;
    let siblings = getContext("siblings");
    siblings.buttons += 1;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<button${attr_class("add-btn svelte-1tfbihw", void 0, {
        "listbook": siblings.book === "listbook",
        "notebook": siblings.book === "notebook"
      })}${attr("disabled", disabled, true)}>${escape_html(label)} `);
      if (tooltip) {
        $$renderer3.push("<!--[-->");
        Tooltip($$renderer3, {
          position: siblings.book === "listbook" ? "right" : "bottom",
          get shown() {
            return hovered;
          },
          set shown($$value) {
            hovered = $$value;
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
      $$renderer3.push(`<!--]--></button>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function sanitizeImportString(value) {
  if (!value.includes(":")) {
    let parts = value.split(".");
    value = parts.slice(0, -1).join(".") + ":" + parts.slice(-1);
  }
  return value;
}
function DeviceListItem($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { selection = void 0, device, backend } = $$props;
    onDestroy(() => {
      if (selection === device) {
        selection = void 0;
      }
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="device-list-item svelte-1vw0eko">`);
      RadioButton($$renderer3, {
        label: device.deviceName,
        value: { device, backend },
        get selection() {
          return selection;
        },
        set selection($$value) {
          selection = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      Info($$renderer3, {
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="details-panel svelte-1vw0eko">`);
          DeviceProfile($$renderer4, { profile: device });
          $$renderer4.push(`<!----></div>`);
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
    bind_props($$props, { selection });
  });
}
function AddDeviceDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0 } = $$props;
    let selection = void 0;
    let param = new Param("Device label");
    param.valType = "code";
    param.inputType = "name";
    let panelsOpen = {};
    let timeout = 6e4;
    function refresh(evt) {
      pending.devices = python$1.liaison.send("app", {
        command: "run",
        args: ["psychopy.experiment:getDeviceProfiles"]
      }).then((resp) => Object.assign(profiles.devices, resp));
    }
    let disableBtns = { OK: !param.valid.value || !selection };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "add-device",
        title: "Add device...",
        onopen: (evt) => {
          param.val = "";
          selection = void 0;
          for (let key in panelsOpen) {
            panelsOpen[key] = false;
          }
        },
        buttons: {
          OK: (evt) => {
            devices[param.val] = new Device(selection.backend.__name__, selection.device);
            devices[param.val].params["name"].val = param.val;
          },
          CANCEL: (evt) => {
          }
        },
        buttonsDisabled: disableBtns,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="container svelte-1wktsbq">`);
          ParamCtrl($$renderer4, { name: param.name, param });
          $$renderer4.push(`<!----> <div class="label svelte-1wktsbq"${attr_style("", { "margin-bottom": "-.5rem" })}><span${attr_style("", { "flex-grow": 1 })}>Available devices</span> `);
          CompactButton($$renderer4, {
            icon: "/icons/btn-refresh.svg",
            tooltip: "Refresh",
            onclick: refresh
          });
          $$renderer4.push(`<!----></div> <div class="devices-list svelte-1wktsbq">`);
          await_block(
            $$renderer4,
            pending.devices,
            () => {
              $$renderer4.push(`<div class="loading-msg svelte-1wktsbq">Getting device backends...</div>`);
            },
            () => {
              if (profiles.devices) {
                $$renderer4.push("<!--[-->");
                $$renderer4.push(`<!--[-->`);
                const each_array = ensure_array_like(Object.values(profiles.devices).filter((profile) => profile.device));
                for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
                  let backend = each_array[$$index_1];
                  await_block(
                    $$renderer4,
                    python$1.liaison.send(
                      "app",
                      {
                        command: "run",
                        args: [
                          `${sanitizeImportString(backend.device)}.getAvailableDevices`
                        ]
                      },
                      timeout
                    ),
                    () => {
                      PanelButton($$renderer4, {
                        label: `Getting ${stringify(backend.label)} devices...`,
                        open: false
                      });
                    },
                    (deviceProfiles) => {
                      if (deviceProfiles.length) {
                        $$renderer4.push("<!--[-->");
                        PanelButton($$renderer4, {
                          label: backend.label,
                          get open() {
                            return panelsOpen[backend.__name__];
                          },
                          set open($$value) {
                            panelsOpen[backend.__name__] = $$value;
                            $$settled = false;
                          },
                          children: ($$renderer5) => {
                            $$renderer5.push(`<div class="device-category svelte-1wktsbq"><!--[-->`);
                            const each_array_1 = ensure_array_like(Object.values(deviceProfiles));
                            for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                              let device = each_array_1[$$index];
                              DeviceListItem($$renderer5, {
                                device,
                                backend,
                                get selection() {
                                  return selection;
                                },
                                set selection($$value) {
                                  selection = $$value;
                                  $$settled = false;
                                }
                              });
                            }
                            $$renderer5.push(`<!--]--></div>`);
                          },
                          $$slots: { default: true }
                        });
                      } else {
                        $$renderer4.push("<!--[!-->");
                      }
                      $$renderer4.push(`<!--]-->`);
                    }
                  );
                  $$renderer4.push(`<!--]-->`);
                }
                $$renderer4.push(`<!--]-->`);
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]-->`);
            }
          );
          $$renderer4.push(`<!--]--></div></div>`);
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
function Dialog_1$2($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @bindable @type {boolean} State controlling when this dialog is shown */
      shown = void 0
    } = $$props;
    function className(name) {
      return String(name).match(/(?<=\.)\w+$/)?.[0];
    }
    let currentDevice = void 0;
    let showAddDeviceDialog = false;
    let valid = Object.values(devices).every((element2) => Object.values(element2.params).every((param) => param.valid.value));
    let restore = {
      set: () => Object.values(devices).forEach((value) => value.restore.set()),
      apply: () => Object.values(devices).forEach((value) => value.restore.apply())
    };
    let btnsDisabled = { OK: !valid, APPLY: !valid };
    async function saveDevices(evt) {
      if (!electron) {
        return;
      }
      let deviceData = {};
      for (let [key, device] of Object.entries(devices)) {
        deviceData[key] = device.toJSON();
      }
      let content = JSON.stringify(deviceData, null, 4);
      let path2 = await electron.paths.devices();
      await electron.files.save(path2, content);
    }
    async function openDevicesFile(evt) {
      let handle = await window.showOpenFilePicker({
        types: [
          {
            description: "PsychoPy Devices",
            accept: { "application/json": [".json"] }
          }
        ]
      });
      let file = await handle[0].getFile();
      let deviceData = JSON.parse(await file.text());
      devicesFromJSON(deviceData);
      console.log(`Loaded devices from ${file.name}:`, deviceData);
    }
    async function saveDevicesFile(evt) {
      let content = {};
      for (let [key, device] of Object.entries(devices)) {
        content[key] = device.toJSON();
      }
      content = JSON.stringify(content, null, 4);
      let handle = await window.showSaveFilePicker({
        types: [
          {
            description: "PsychoPy Devices",
            accept: { "application/json": [".json"] }
          }
        ],
        suggestedName: "devices.json"
      });
      let file = await handle.createWritable();
      file.seek(0);
      file.write(content);
      file.close();
    }
    function devicesFromJSON(deviceData) {
      Object.keys(devices).forEach((key) => delete devices[key]);
      currentDevice = void 0;
      for (let [key, dev] of Object.entries(deviceData)) {
        if ("deviceLabel" in dev.params) {
          dev.params.name = dev.params.deviceLabel;
          delete dev.params.deviceLabel;
        }
        if (dev.tag === void 0 && dev.__class__) {
          dev.tag = className(dev.__class__);
        }
        devices[key] = new Device(dev.tag, dev.profile);
        devices[key].fromJSON(dev);
        devices[key].restore.set();
        if (currentDevice === void 0) {
          currentDevice = devices[key];
        }
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "device-manager",
        title: "Device manager",
        buttons: {
          OK: (evt) => {
            restore.set();
            saveDevices();
          },
          APPLY: (evt) => {
            restore.set();
            saveDevices();
          },
          EXTRA: { Export: saveDevicesFile },
          CANCEL: restore.apply,
          HELP: ""
        },
        buttonsDisabled: btnsDisabled,
        onopen: restore.set,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="container svelte-w1te7f">`);
          Listbook($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array = ensure_array_like(Object.entries(devices));
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let [key, device] = each_array[$$index];
                var bind_get = () => {
                  return currentDevice === device;
                };
                var bind_set = (value) => {
                  currentDevice = device;
                };
                Page($$renderer5, {
                  get selected() {
                    return bind_get();
                  },
                  set selected($$value) {
                    bind_set($$value);
                  },
                  label: device.name,
                  data: device,
                  close: (evt) => delete devices[key],
                  children: ($$renderer6) => {
                    DeviceDetails($$renderer6, { device });
                  },
                  $$slots: { default: true }
                });
              }
              $$renderer5.push(`<!--]--> `);
              if (Object.keys(devices).length === 0) {
                $$renderer5.push("<!--[-->");
                Page($$renderer5, {
                  label: "",
                  selected: true,
                  children: ($$renderer6) => {
                    $$renderer6.push(`<div class="placeholder-page svelte-w1te7f"><p>No devices have been setup.</p> <p>Click "Add device" to add a new device, or import devices from a .json file.</p></div>`);
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]--> `);
              if (electron) {
                $$renderer5.push("<!--[-->");
                ButtonTab($$renderer5, {
                  callback: (evt) => showAddDeviceDialog = true,
                  label: "+ Add device",
                  tooltip: electron ? "Setup a currently connected device" : "Device setup not available in web-only",
                  disabled: !electron
                });
                $$renderer5.push(`<!----> `);
                AddDeviceDialog($$renderer5, {
                  get shown() {
                    return showAddDeviceDialog;
                  },
                  set shown($$value) {
                    showAddDeviceDialog = $$value;
                    $$settled = false;
                  }
                });
                $$renderer5.push(`<!---->`);
              } else {
                $$renderer5.push("<!--[!-->");
              }
              $$renderer5.push(`<!--]--> `);
              ButtonTab($$renderer5, {
                callback: openDevicesFile,
                label: "⭱ Import devices",
                tooltip: "Import devices from a .json file"
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
function DeviceCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let options = (() => {
      let output = [];
      for (let [name, device] of Object.entries(devices)) {
        for (let target of param.allowedVals) {
          if (String(target).endsWith(device.tag)) {
            output.push(name);
          }
        }
      }
      if (param.val !== "" && !output.includes(param.val)) {
        output.push(snapshot(param.val));
      }
      return output;
    })();
    let showDialog = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.select(
        {
          class: "param-device-input",
          disabled: disabled || options.length === 0,
          value: param.val,
          ...attachments
        },
        ($$renderer4) => {
          $$renderer4.option({ value: "", selected: param.val === "" }, ($$renderer5) => {
            $$renderer5.push(`Default`);
          });
          $$renderer4.push(`<!--[-->`);
          const each_array = ensure_array_like(options);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let option = each_array[$$index];
            $$renderer4.option({ value: option, selected: param.val === option }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(option)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        },
        "svelte-vskael",
        void 0,
        { color: param.valid.value ? "inherit" : "var(--red)" }
      );
      $$renderer3.push(` `);
      if (python$1?.ready) {
        $$renderer3.push("<!--[-->");
        CompactButton($$renderer3, {
          icon: "/icons/btn-devices.svg",
          onclick: (evt) => showDialog = true
        });
        $$renderer3.push(`<!----> `);
        Dialog_1$2($$renderer3, {
          get shown() {
            return showDialog;
          },
          set shown($$value) {
            showDialog = $$value;
            $$settled = false;
          }
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
    bind_props($$props, { param });
  });
}
function RichChoiceCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    $$renderer2.push(`<div${attributes({ class: "param-rich-choice-ctrl", ...attachments }, "svelte-shlk5g")}>`);
    await_block(
      $$renderer2,
      optionsFromParam(param),
      () => {
        $$renderer2.push(`Loading...`);
      },
      (options) => {
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(options);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let [val, details] = each_array[$$index];
          $$renderer2.push(`<button${attr_class("rich-ctrl-item svelte-shlk5g", void 0, { "selected": param.val === val })}><b>${escape_html(details.label)}</b> <p>${escape_html(details.body)}</p> `);
          if (details.link) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<a${attr("href", details.link)}>${escape_html(details.linkText)}</a>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></button>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { param });
  });
}
function UserCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let current2 = getContext("current");
    DropdownButton($$renderer2, {
      label: current2.user ? current2.user.profile.name : "No user",
      onclick: (evt) => {
        if (current2.user) {
          window.open(current2.user.profile.web_url);
        }
      },
      disabled: !current2.user,
      children: ($$renderer3) => {
        Item($$renderer3, {
          label: "Edit user...",
          icon: "/icons/btn-edit.svg",
          onclick: (evt) => window.open("https://gitlab.pavlovia.org/-/profile", "_blank")
        });
        $$renderer3.push(`<!----> `);
        SubMenu($$renderer3, {
          label: "Switch user...",
          children: ($$renderer4) => {
            $$renderer4.push(`<!--[-->`);
            const each_array = ensure_array_like(Object.values(users));
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let user = each_array[$$index];
              Item($$renderer4, {
                label: user.profile.name,
                onclick: (evt) => login(user.profile.username).then((username) => current2.user = users[username])
              });
            }
            $$renderer4.push(`<!--]--> `);
            Separator($$renderer4);
            $$renderer4.push(`<!----> `);
            Item($$renderer4, {
              label: "New user...",
              onclick: (evt) => login().then((username) => current2.user = users[username])
            });
            $$renderer4.push(`<!---->`);
          },
          $$slots: { default: true }
        });
        $$renderer3.push(`<!----> `);
        Separator($$renderer3);
        $$renderer3.push(`<!----> `);
        if (current2.user) {
          $$renderer3.push("<!--[-->");
          Item($$renderer3, {
            label: "Logout",
            onclick: (evt) => {
              logout();
              current2.user = void 0;
            }
          });
        } else {
          $$renderer3.push("<!--[!-->");
          Item($$renderer3, {
            label: "Login",
            onclick: (evt) => {
              if (Object.keys(users).length > 0) {
                const lastUser = Object.keys(users)[0];
                login(lastUser).then((username) => current2.user = users[username]);
              } else {
                login().then((username) => current2.user = users[username]);
              }
            }
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
  });
}
function randint(min, max) {
  return min + Math.floor(Math.random() * max);
}
function randof(arr) {
  {
    return arr.charAt(randint(0, arr.length));
  }
}
var users = {};
var auth = {
  root: "https://gitlab.pavlovia.org",
  client: "944b87ee0e6b4f510881d6f6bc082f64c7bba17d305efdb829e6e0e7ed466b34",
  state: "",
  challenge: "",
  verifier: "",
  code: void 0
};
async function getUserInfo(token) {
  const resp = await fetch(`${auth.root}/api/v4/user?access_token=${token}`);
  if (resp.ok) {
    return await resp.json();
  } else {
    throw new Error(resp.statusText || "Failed to get user info");
  }
}
async function refreshToken(username) {
  const resp = await fetch(
    `/api/token/refresh?${new URLSearchParams({
      root: auth.root,
      redirect: electron ? auth.root : window.location.href,
      client: auth.client,
      refresh: users[username].token.refresh,
      verifier: auth.verifier
    }).toString()}`,
    { method: "post" }
  );
  if (!resp.ok) {
    throw new Error(`Token refresh failed: ${resp.statusText}`);
  }
  const data = await resp.json();
  if (data.access_token && data.refresh_token) {
    users[username].token.access = data.access_token;
    users[username].token.refresh = data.refresh_token;
    return data;
  } else {
    throw new Error(data.message || "Token refresh failed");
  }
}
async function login(username, current2) {
  if (users[username]) {
    if (users[username].token?.access) {
      try {
        const profile = await getUserInfo(users[username].token.access);
        users[username].profile = profile;
      } catch (err) {
        try {
          await refreshToken(username);
          const profile = await getUserInfo(users[username].token.access);
          users[username].profile = profile;
        } catch (refreshErr) {
          delete users[username].token;
          return login(void 0);
        }
      }
    } else {
      return login(void 0);
    }
  } else {
    if (!auth.code) {
      auth.state = String(crypto.randomUUID());
      auth.verifier = Array.from({ length: randint(44, 127) }, () => randof("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")).join("");
      let hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(auth.verifier));
      auth.challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      let params = new URLSearchParams({
        client_id: auth.client,
        redirect_uri: electron ? auth.root : window.location.href,
        response_type: "code",
        state: auth.state,
        code_challenge: auth.challenge,
        code_challenge_method: "S256"
      });
      let url = `${auth.root}/oauth/authorize?${params.toString()}`;
      if (electron) {
        auth.code = await electron.authenticatePavlovia(url);
      } else {
        navigate(url);
        return;
      }
    }
    let tokens = await fetch(
      `/api/token/authorize?${new URLSearchParams({
        root: auth.root,
        redirect: electron ? auth.root : window.location.href,
        client: auth.client,
        code: auth.code,
        verifier: auth.verifier
      }).toString()}`,
      { method: "post" }
    ).then((resp) => resp.json());
    if (tokens.error) {
      throw new Error(`Token request failed: ${tokens.error}, ${tokens.error_description}`);
    }
    auth.code = void 0;
    let profileResp = await fetch(`${auth.root}/api/v4/user?access_token=${tokens.access_token}`);
    if (!profileResp.ok) {
      throw new Error(`Profile request failed: ${profileResp.statusText}`);
    }
    let profile = await profileResp.json();
    username = profile.username;
    if (username) {
      users[username] = {
        token: { access: tokens.access_token, refresh: tokens.refresh_token },
        profile
      };
    } else {
      throw new Error("Failed to login - no username returned");
    }
  }
  if (electron) {
    try {
      const file = await electron.paths.pavlovia.users();
      await electron.files.save(file, JSON.stringify(users, void 0, 4));
    } catch (err) {
      console.warn("Failed to save user data:", err);
    }
  }
  return username;
}
function logout() {
  Object.assign(auth, { state: "", challenge: "", verifier: "", code: void 0 });
}
function SurveyCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let current2 = getContext("current");
    let showSurveysDlg = void 0;
    let selected = { survey: void 0 };
    async function getSurveys() {
      let data = await fetch("/api/surveys", { headers: current2.user.token }).then((resp) => resp.json());
      return data.surveys;
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      SingleLineCtrl($$renderer3, spread_props([{ param, disabled }, attachments]));
      $$renderer3.push(`<!----> `);
      CompactButton($$renderer3, {
        icon: "/icons/btn-find.svg",
        tooltip: "Browse your projects on Pavlovia",
        onclick: (evt) => showSurveysDlg = true,
        disabled: disabled || current2.user === void 0
      });
      $$renderer3.push(`<!----> `);
      Dialog($$renderer3, {
        id: "browse-surveys",
        title: "Pavlovia surveys",
        buttons: {
          OK: (evt) => param.val = selected.survey.surveyId,
          CANCEL: (evt) => {
          }
        },
        buttonsDisabled: { OK: selected.survey === void 0 },
        get shown() {
          return showSurveysDlg;
        },
        set shown($$value) {
          showSurveysDlg = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="container svelte-pclrlt"><p>Below are all of the surveys linked to your Pavlovia account - select the one you want and press OK to add its ID. You can view and manage your Pavlovia surveys <a href="https://pavlovia.org/dashboard?tab=4" target="_blank">here</a></p> <div class="choice-group svelte-pclrlt">`);
          await_block(
            $$renderer4,
            getSurveys(),
            () => {
              $$renderer4.push(`Loading surveys...`);
            },
            (surveys) => {
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like(surveys);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let survey = each_array[$$index];
                RadioButton($$renderer4, {
                  value: survey,
                  label: survey.surveyName,
                  tooltip: survey.description,
                  get selection() {
                    return selected.survey;
                  },
                  set selection($$value) {
                    selected.survey = $$value;
                    $$settled = false;
                  }
                });
              }
              $$renderer4.push(`<!--]-->`);
            }
          );
          $$renderer4.push(`<!--]--></div></div>`);
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
    bind_props($$props, { param });
  });
}
function CodeCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let language = param.allowedVals ? param.allowedVals : "python";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div${attributes({ class: "param-code-input-multi", ...attachments }, "svelte-vz1slc")}>`);
      CodeEditor($$renderer3, {
        resize: "vertical",
        language,
        readonly: disabled,
        disabled,
        get value() {
          return param.val;
        },
        set value($$value) {
          param.val = $$value;
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
    bind_props($$props, { param });
  });
}
function ValidatorCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let current2 = getContext("current");
    let options = (() => {
      let output = [];
      for (let [name, rt] of Object.entries(current2.experiment.routines)) {
        if (param.allowedVals.includes(rt.tag)) {
          output.push(name);
        }
      }
      return output;
    })();
    $$renderer2.select(
      {
        class: "param-validator-input",
        disabled: disabled || options.length === 0,
        value: param.val,
        ...attachments
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "", selected: param.val === "" }, ($$renderer4) => {
          $$renderer4.push(`Do not validate`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(options);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let option = each_array[$$index];
          $$renderer3.option({ value: option, selected: param.val === option }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(option)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      "svelte-1rn2v93",
      void 0,
      { color: param.valid.value ? "inherit" : "var(--red)" }
    );
    bind_props($$props, { param });
  });
}
function KeyPressCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let selected = false;
    let hovered = false;
    $$renderer2.push(`<div${attributes({ class: "container", role: "none", ...attachments }, "svelte-1thftq5", { selected, hovered }, { color: param.valid.value ? "inherit" : "var(--red)" })}>`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<input type="text"${attr("value", param.val.join?.(" + "))} class="svelte-1thftq5"${attr_style("", { color: "inherit" })}/>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { param });
  });
}
function SoundCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      /** @bindable State tracking whether this param's value is valid */
      valid = void 0,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      FileCtrl($$renderer3, spread_props([
        { disabled },
        attachments,
        {
          get param() {
            return param;
          },
          set param($$value) {
            param = $$value;
            $$settled = false;
          },
          get valid() {
            return valid;
          },
          set valid($$value) {
            valid = $$value;
            $$settled = false;
          }
        }
      ]));
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { param, valid });
  });
}
class _FontManager {
  // fonts installed on the system
  system = {
    label: "System",
    description: "Fonts which are installed to your computer",
    fonts: [],
    scanning: Promise.resolve(true),
    refresh: () => {
      this.system.fonts.length = 0;
      this.system.scanning = python.liaison.send(
        "app",
        {
          command: "run",
          args: [`psychopy.tools.fontmanager:FontFinder.getSystemFonts`]
        },
        1e3
      ).then((resp) => this.system.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
    }
  };
  // fonts packaged with PsychoPy
  packaged = {
    label: "Packaged",
    description: "Fonts which come packaged with PsychoPy",
    fonts: [],
    scanning: Promise.resolve(true),
    refresh: () => {
      this.packaged.fonts.length = 0;
      this.packaged.scanning = python.liaison.send(
        "app",
        {
          command: "run",
          args: [`psychopy.tools.fontmanager:FontFinder.getPackagedFonts`]
        },
        1e3
      ).then((resp) => this.packaged.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
    }
  };
  // fonts downloaded to the user folder
  user = {
    label: "User",
    description: "Fonts saved to your PsychoPy user folder",
    fonts: [],
    scanning: Promise.resolve(true),
    refresh: () => {
      this.user.fonts.length = 0;
      this.user.scanning = python.liaison.send(
        "app",
        {
          command: "run",
          args: [`psychopy.tools.fontmanager:FontFinder.getUserFonts`]
        },
        1e3
      ).then((resp) => this.user.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
    },
    add: () => {
    }
  };
  // fonts in the current experiment folder
  experiment = {
    label: "Experiment",
    description: "Fonts in the current experiment folder",
    fonts: [],
    scanning: Promise.resolve(true),
    refresh: (experiment) => {
      this.experiment.fonts.length = 0;
      let folder = experiment.file.parent;
      if (folder) {
        this.experiment.scanning = python.liaison.send(
          "app",
          {
            command: "run",
            args: [
              `psychopy.tools.fontmanager:FontFinder.getFolderFonts`,
              [
                path.join(folder, "fonts"),
                path.join(folder, "assets", "fonts")
              ],
              false
            ]
          },
          1e3
        ).then((resp) => this.experiment.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
      }
    },
    add: (name) => {
    }
  };
  #all = derived(() => ({
    fonts: [
      ...this.system.fonts,
      ...this.packaged.fonts,
      ...this.user.fonts,
      ...this.experiment.fonts
    ],
    scanning: Promise.all([
      this.system.scanning,
      this.packaged.scanning,
      this.user.scanning,
      this.experiment.scanning
    ]),
    refresh: () => {
      this.system.refresh();
      this.packaged.refresh();
      this.user.refresh();
    }
  }));
  get all() {
    return this.#all();
  }
  set all($$value) {
    return this.#all($$value);
  }
}
const FontManager = new _FontManager();
function Dialog_1$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = void 0,
      /** @bindable State controlling whether each button is disabled */
      buttonsDisabled = {},
      /** @bindable @type {Boolean} State dictating whether this dialog is shown */
      shown = void 0
    } = $$props;
    let current2 = getContext("current");
    let restore = value;
    let searchTerm = "";
    let currentTab = void 0;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "font-manager",
        title: "Font Manager",
        onopen: (evt) => restore = snapshot(value),
        buttons: {
          OK: (evt) => restore = snapshot(value),
          APPLY: (evt) => restore = snapshot(value),
          CANCEL: (evt) => value = restore
        },
        buttonsDisabled,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="page svelte-ht5uro"><input type="search" class="search"${attr("value", searchTerm)}/> `);
          Notebook($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array = ensure_array_like(["system", "packaged", "user", "experiment"]);
              for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
                let source = each_array[$$index_1];
                var bind_get = () => currentTab === source;
                var bind_set = (value2) => currentTab = source;
                Page($$renderer5, {
                  label: FontManager[source].label,
                  get selected() {
                    return bind_get();
                  },
                  set selected($$value) {
                    bind_set($$value);
                  },
                  children: ($$renderer6) => {
                    $$renderer6.push(`<div class="page svelte-ht5uro"><div class="info svelte-ht5uro">${escape_html(FontManager[source].description)}</div> <!--[-->`);
                    const each_array_1 = ensure_array_like(FontManager[source].fonts.filter((name) => name.toLowerCase().replaceAll(" ", "").includes(searchTerm.toLowerCase().replaceAll(" ", ""))));
                    for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                      let name = each_array_1[$$index];
                      RadioButton($$renderer6, {
                        value: name,
                        label: name,
                        get selection() {
                          return value;
                        },
                        set selection($$value) {
                          value = $$value;
                          $$settled = false;
                        }
                      });
                    }
                    $$renderer6.push(`<!--]--> `);
                    if (FontManager[source].refresh) {
                      $$renderer6.push("<!--[-->");
                      Button($$renderer6, {
                        label: "Refresh",
                        icon: "/icons/btn-refresh.svg",
                        onclick: (evt) => FontManager[source].refresh(current2.experiment),
                        horizontal: true,
                        get awaiting() {
                          return FontManager[source].scanning;
                        },
                        set awaiting($$value) {
                          FontManager[source].scanning = $$value;
                          $$settled = false;
                        }
                      });
                    } else {
                      $$renderer6.push("<!--[!-->");
                    }
                    $$renderer6.push(`<!--]--></div>`);
                  },
                  $$slots: { default: true }
                });
              }
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
    bind_props($$props, { value, shown });
  });
}
function FontCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    getContext("current");
    let show = { dialog: false };
    FontManager.all.refresh();
    (() => {
      let found = false;
      for (let name of FontManager.all.fonts) {
        if (name.toLowerCase().replaceAll(" ", "") === String(param.val).toLowerCase().replaceAll(" ", "")) {
          found = true;
        }
      }
      return found;
    })();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      SingleLineCtrl($$renderer3, spread_props([
        { disabled },
        attachments,
        {
          get param() {
            return param;
          },
          set param($$value) {
            param = $$value;
            $$settled = false;
          }
        }
      ]));
      $$renderer3.push(`<!----> `);
      if (python$1?.ready) {
        $$renderer3.push("<!--[-->");
        CompactButton($$renderer3, {
          icon: "/icons/btn-case.svg",
          tooltip: "Open font manager",
          awaiting: FontManager.all.scanning,
          onclick: (evt) => show.dialog = true
        });
        $$renderer3.push(`<!----> `);
        Dialog_1$1($$renderer3, {
          buttonsDisabled: { OK: !param.valid, APPLY: !param.valid },
          get value() {
            return param.val;
          },
          set value($$value) {
            param.val = $$value;
            $$settled = false;
          },
          get shown() {
            return show.dialog;
          },
          set shown($$value) {
            show.dialog = $$value;
            $$settled = false;
          }
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
    bind_props($$props, { param });
  });
}
function NamedColor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, target = "param" } = $$props;
    let colorNames = [
      "transparent",
      "aliceblue",
      "antiquewhite",
      "aqua",
      "aquamarine",
      "azure",
      "beige",
      "bisque",
      "black",
      "blanchedalmond",
      "blue",
      "blueviolet",
      "brown",
      "burlywood",
      "cadetblue",
      "chartreuse",
      "chestnut",
      "chocolate",
      "coral",
      "cornflowerblue",
      "cornsilk",
      "crimson",
      "cyan",
      "darkblue",
      "darkcyan",
      "darkgoldenrod",
      "darkgray",
      "darkgreen",
      "darkgrey",
      "darkkhaki",
      "darkmagenta",
      "darkolivegreen",
      "darkorange",
      "darkorchid",
      "darkred",
      "darksalmon",
      "darkseagreen",
      "darkslateblue",
      "darkslategray",
      "darkslategrey",
      "darkturquoise",
      "darkviolet",
      "deeppink",
      "deepskyblue",
      "dimgray",
      "dimgrey",
      "dodgerblue",
      "firebrick",
      "floralwhite",
      "forestgreen",
      "fuchsia",
      "gainsboro",
      "ghostwhite",
      "gold",
      "goldenrod",
      "gray",
      "grey",
      "green",
      "greenyellow",
      "honeydew",
      "hotpink",
      "indigo",
      "ivory",
      "khaki",
      "lavender",
      "lavenderblush",
      "lawngreen",
      "lemonchiffon",
      "lightblue",
      "lightcoral",
      "lightcyan",
      "lightgoldenrodyellow",
      "lightgray",
      "lightgreen",
      "lightgrey",
      "lightpink",
      "lightsalmon",
      "lightseagreen",
      "lightskyblue",
      "lightslategray",
      "lightslategrey",
      "lightsteelblue",
      "lightyellow",
      "lime",
      "limegreen",
      "linen",
      "magenta",
      "maroon",
      "mediumaquamarine",
      "mediumblue",
      "mediumorchid",
      "mediumpurple",
      "mediumseagreen",
      "mediumslateblue",
      "mediumspringgreen",
      "mediumturquoise",
      "mediumvioletred",
      "midnightblue",
      "mintcream",
      "mistyrose",
      "moccasin",
      "navajowhite",
      "navy",
      "oldlace",
      "olive",
      "olivedrab",
      "orange",
      "orangered",
      "orchid",
      "palegoldenrod",
      "palegreen",
      "paleturquoise",
      "palevioletred",
      "papayawhip",
      "peachpuff",
      "peru",
      "pink",
      "plum",
      "powderblue",
      "purple",
      "red",
      "rosybrown",
      "royalblue",
      "saddlebrown",
      "salmon",
      "sandybrown",
      "seagreen",
      "seashell",
      "sienna",
      "silver",
      "skyblue",
      "slateblue",
      "slategray",
      "slategrey",
      "snow",
      "springgreen",
      "steelblue",
      "tan",
      "teal",
      "thistle",
      "tomato",
      "turquoise",
      "violet",
      "wheat",
      "white",
      "whitesmoke",
      "yellow",
      "yellowgreen"
    ];
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="page svelte-13002nv"><div class="ctrl svelte-13002nv"><!--[-->`);
      const each_array = ensure_array_like(colorNames);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let color = each_array[$$index];
        $$renderer3.push(`<div class="button-wrapper svelte-13002nv"${attr_style("", { "--responsive-color": color })}>`);
        RadioButton($$renderer3, {
          value: target === "param" ? color : `"${color}"`,
          label: color,
          icon: "/icons/sym-dot-responsive.svg",
          get selection() {
            return value;
          },
          set selection($$value) {
            value = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div>`);
      }
      $$renderer3.push(`<!--]--></div> <div class="preview svelte-13002nv"${attr_style("", { "background-color": value })}></div></div>`);
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
function HexColor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, target = "param" } = $$props;
    let rgb = [255, 255, 255];
    $$renderer2.push(`<div class="page svelte-p941k7"><div class="ctrls svelte-p941k7"><div class="ctrl svelte-p941k7"><div class="label svelte-p941k7">Red</div> <input type="number"${attr("value", rgb[0])} min="0" max="255"/> <code class="output">= ${escape_html(new Uint8Array([rgb[0]]).toHex())}</code></div> <div class="ctrl svelte-p941k7"><div class="label svelte-p941k7">Green</div> <input type="number"${attr("value", rgb[1])} min="0" max="255"/> <code class="output">= ${escape_html(new Uint8Array([rgb[1]]).toHex())}</code></div> <div class="ctrl svelte-p941k7"><div class="label svelte-p941k7">Blue</div> <input type="number"${attr("value", rgb[2])} min="0" max="255"/> <code class="output">= ${escape_html(new Uint8Array([rgb[2]]).toHex())}</code></div></div> <div class="preview svelte-p941k7"${attr_style("", { "background-color": value })}></div></div>`);
    bind_props($$props, { value });
  });
}
function RgbColor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, target = "param" } = $$props;
    let rgb = [1, 1, 1];
    let preview = rgb.map((val) => (val + 1) * 255 / 2);
    $$renderer2.push(`<div class="page svelte-1n436jl"><div class="ctrls svelte-1n436jl"><div class="ctrl svelte-1n436jl"><div class="label svelte-1n436jl">Red</div> <input type="number"${attr("value", rgb[0])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-1n436jl"><div class="label svelte-1n436jl">Green</div> <input type="number"${attr("value", rgb[1])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-1n436jl"><div class="label svelte-1n436jl">Blue</div> <input type="number"${attr("value", rgb[2])}${attr("min", -1)} max="1" step="0.05"/></div></div> <div class="preview svelte-1n436jl"${attr_style("", { "background-color": `rgba(${stringify(preview)})` })}></div></div>`);
    bind_props($$props, { value });
  });
}
function DklColor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, target = "param" } = $$props;
    let dkl = [90, 0, 1];
    let preview = (
      // send value to Python for conversion
      python$1.liaison.send(
        "app",
        {
          command: "init",
          args: [
            "rgb",
            "psychopy.tools.colorspacetools:dkl2rgb",
            snapshot(dkl)
          ]
        },
        1e3
      ).then((name) => {
        return python$1.liaison.send("app", { command: "run", args: ["numpy:ndarray.tolist", `$${name}`] }, 1e3).then(
          // transform the PsychoPy RGB values (-1:1) into CSS RGB (0:255)
          (rgb) => rgb.map((val) => (val + 1) * 255 / 2)
        );
      })
    );
    $$renderer2.push(`<div class="page svelte-17g6qx"><div class="ctrls svelte-17g6qx"><div class="ctrl svelte-17g6qx"><div class="label svelte-17g6qx">Elevation</div> <input type="number"${attr("value", dkl[0])} min="0" max="360"/></div> <div class="ctrl svelte-17g6qx"><div class="label svelte-17g6qx">Azimuth</div> <input type="number"${attr("value", dkl[1])} min="0" max="360"/></div> <div class="ctrl svelte-17g6qx"><div class="label svelte-17g6qx">Contrast</div> <input type="number"${attr("value", dkl[2])}${attr("min", -1)} max="1" step="0.05"/></div></div> `);
    if (python$1?.ready) {
      $$renderer2.push("<!--[-->");
      await_block(
        $$renderer2,
        preview,
        () => {
          $$renderer2.push(`<div class="preview svelte-17g6qx"></div>`);
        },
        (preview2) => {
          $$renderer2.push(`<div class="preview svelte-17g6qx"${attr_style("", { "background-color": `rgba(${stringify(preview2)})` })}></div>`);
        }
      );
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="preview svelte-17g6qx">DKL preview is not available in browser.</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}
function HsvColor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, target = "param" } = $$props;
    let hsv = [0, 1, 0.5];
    $$renderer2.push(`<div class="page svelte-ptki7j"><div class="ctrls svelte-ptki7j"><div class="ctrl svelte-ptki7j"><div class="label svelte-ptki7j">Hue</div> <input type="number"${attr("value", hsv[0])} min="0" max="360"/></div> <div class="ctrl svelte-ptki7j"><div class="label svelte-ptki7j">Saturation</div> <input type="number"${attr("value", hsv[1])} min="0" max="100"/></div> <div class="ctrl svelte-ptki7j"><div class="label svelte-ptki7j">Value</div> <input type="number"${attr("value", hsv[2])} min="0" max="100"/></div></div> <div class="preview svelte-ptki7j"${attr_style("", {
      "background-color": `hsl(${stringify(hsv[0])}, ${stringify(hsv[1] * 100)}%, ${stringify(hsv[2] * 100)}%)`
    })}></div></div>`);
    bind_props($$props, { value });
  });
}
function LmsColor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, target = "param" } = $$props;
    let lms = [1, 1, 1];
    let preview = (
      // send value to Python for conversion
      python$1.liaison.send(
        "app",
        {
          command: "init",
          args: [
            "rgb",
            "psychopy.tools.colorspacetools:lms2rgb",
            snapshot(lms)
          ]
        },
        1e3
      ).then((name) => {
        return python$1.liaison.send("app", { command: "run", args: ["numpy:ndarray.tolist", `$${name}`] }, 1e3).then(
          // transform the PsychoPy RGB values (-1:1) into CSS RGB (0:255)
          (rgb) => rgb.map((val) => (val + 1) * 255 / 2)
        );
      })
    );
    $$renderer2.push(`<div class="page svelte-fokebo"><div class="ctrls svelte-fokebo"><div class="ctrl svelte-fokebo"><div class="label svelte-fokebo">Long</div> <input type="number"${attr("value", lms[0])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-fokebo"><div class="label svelte-fokebo">Medium</div> <input type="number"${attr("value", lms[1])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-fokebo"><div class="label svelte-fokebo">Short</div> <input type="number"${attr("value", lms[2])}${attr("min", -1)} max="1" step="0.05"/></div></div> `);
    if (python$1?.ready) {
      $$renderer2.push("<!--[-->");
      await_block(
        $$renderer2,
        preview,
        () => {
          $$renderer2.push(`<div class="preview svelte-fokebo"></div>`);
        },
        (preview2) => {
          $$renderer2.push(`<div class="preview svelte-fokebo"${attr_style("", { "background-color": `rgba(${stringify(preview2)})` })}></div>`);
        }
      );
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="preview svelte-fokebo">LMS preview is not available in browser.</div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}
function Dialog_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      value = void 0,
      space = void 0,
      /** Color space options to show */
      allowedSpaces = ["named", "hex", "rgb", "dkl", "lms", "hsv"],
      /** Is output going to code or to a param? */
      target = "param",
      /** @bindable State controlling whether each button is disabled */
      buttonsDisabled = {},
      /** @bindable @type {Boolean} State dictating whether this dialog is shown */
      shown = void 0
    } = $$props;
    let restore = { color: snapshot(value), space: snapshot(space) };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: "color-picker",
        title: "Color Picker",
        onopen: (evt) => restore = { color: snapshot(value), space: snapshot(space) },
        buttons: {
          OK: (evt) => restore = { color: snapshot(value), space: snapshot(space) },
          APPLY: (evt) => restore = { color: snapshot(value), space: snapshot(space) },
          CANCEL: (evt) => {
            value = restore.color;
            space = restore.space;
          }
        },
        buttonsDisabled,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="page svelte-1t6wprj"><input${attr("value", value)}/> `);
          Notebook($$renderer4, {
            children: ($$renderer5) => {
              $$renderer5.push(`<!--[-->`);
              const each_array = ensure_array_like([
                ["named", NamedColor],
                ["hex", HexColor],
                ["rgb", RgbColor],
                ["dkl", DklColor],
                ["hsv", HsvColor],
                ["lms", LmsColor]
              ]);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let [thisSpace, Component2] = each_array[$$index];
                if (allowedSpaces.includes(thisSpace)) {
                  $$renderer5.push("<!--[-->");
                  var bind_get = () => space === thisSpace;
                  var bind_set = (value2) => space = thisSpace;
                  Page($$renderer5, {
                    label: thisSpace,
                    get selected() {
                      return bind_get();
                    },
                    set selected($$value) {
                      bind_set($$value);
                    },
                    children: ($$renderer6) => {
                      $$renderer6.push(`<div class="page svelte-1t6wprj"><!---->`);
                      Component2($$renderer6, {
                        target,
                        get value() {
                          return value;
                        },
                        set value($$value) {
                          value = $$value;
                          $$settled = false;
                        }
                      });
                      $$renderer6.push(`<!----></div>`);
                    },
                    $$slots: { default: true }
                  });
                } else {
                  $$renderer5.push("<!--[!-->");
                }
                $$renderer5.push(`<!--]-->`);
              }
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
    bind_props($$props, { value, space, shown });
  });
}
function ColorCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let show = { dialog: false };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      SingleLineCtrl($$renderer3, spread_props([
        { disabled },
        attachments,
        {
          get param() {
            return param;
          },
          set param($$value) {
            param = $$value;
            $$settled = false;
          }
        }
      ]));
      $$renderer3.push(`<!----> `);
      CompactButton($$renderer3, {
        icon: "/icons/btn-colors.svg",
        tooltip: "Open color picker",
        onclick: (evt) => show.dialog = true
      });
      $$renderer3.push(`<!----> `);
      Dialog_1($$renderer3, {
        allowedSpaces: param.siblings.colorSpace.allowedVals,
        target: "param",
        buttonsDisabled: { OK: !param.valid, APPLY: !param.valid },
        get value() {
          return param.val;
        },
        set value($$value) {
          param.val = $$value;
          $$settled = false;
        },
        get space() {
          return param.siblings.colorSpace.val;
        },
        set space($$value) {
          param.siblings.colorSpace.val = $$value;
          $$settled = false;
        },
        get shown() {
          return show.dialog;
        },
        set shown($$value) {
          show.dialog = $$value;
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
    bind_props($$props, { param });
  });
}
function UnknownCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {Boolean} Should the code indicator ($) be shown? */
      codeIndicator = param.isCodeType,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (param.deleted) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="deleted-lbl svelte-10dxg9f">Deleted</div> `);
        CompactButton($$renderer3, {
          icon: "/icons/btn-undo.svg",
          tooltip: "Unrecognised param deleted. Undo?",
          onclick: (evt) => param.deleted = false
        });
        $$renderer3.push(`<!---->`);
      } else {
        $$renderer3.push("<!--[!-->");
        SingleLineCtrl($$renderer3, spread_props([
          { codeIndicator: "codeIndicator", disabled: true },
          attachments,
          {
            get param() {
              return param;
            },
            set param($$value) {
              param = $$value;
              $$settled = false;
            }
          }
        ]));
        $$renderer3.push(`<!----> `);
        CompactButton($$renderer3, {
          icon: "/icons/btn-delete.svg",
          tooltip: "Delete unrecognised param?",
          onclick: (evt) => param.deleted = true
        });
        $$renderer3.push(`<!---->`);
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { param });
  });
}
function CalibrationCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
      param = void 0,
      /** @prop @type {boolean} Controls whether this control is disabled */
      disabled = false,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let labels = { cols: ["Min", "Max", "Gamma"], rows: ["lum", "R", "G", "B"] };
    $$renderer2.push(`<div class="param-gamma-input svelte-128tix9"><table class="svelte-128tix9"><tbody><tr><th class="svelte-128tix9"></th><!--[-->`);
    const each_array = ensure_array_like(labels.cols);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let col = each_array[$$index];
      $$renderer2.push(`<th class="svelte-128tix9">${escape_html(col)}</th>`);
    }
    $$renderer2.push(`<!--]--></tr><!--[-->`);
    const each_array_1 = ensure_array_like(Object.keys(labels.rows));
    for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
      let row = each_array_1[$$index_2];
      $$renderer2.push(`<tr><th class="svelte-128tix9">${escape_html(labels.rows[row])}</th><!--[-->`);
      const each_array_2 = ensure_array_like(Object.keys(labels.cols));
      for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
        let col = each_array_2[$$index_1];
        $$renderer2.push(`<td class="svelte-128tix9"><input type="number" max="1"${attr("min", -1)} step="0.01"${attr("value", param.val[row][col])}/></td>`);
      }
      $$renderer2.push(`<!--]--></tr>`);
    }
    $$renderer2.push(`<!--]--></tbody></table></div>`);
    bind_props($$props, { param });
  });
}
var mapping = {
  "single": SingleLineCtrl,
  "multi": MultiLineCtrl,
  "code": CodeCtrl,
  "name": NameCtrl,
  "choice": ChoiceCtrl,
  "version": VersionCtrl,
  "multiChoice": MultipleChoiceCtrl,
  "device": DeviceCtrl,
  "richChoice": RichChoiceCtrl,
  "bool": BoolCtrl,
  "file": FileCtrl,
  "soundFile": SoundCtrl,
  "font": FontCtrl,
  "survey": SurveyCtrl,
  "fileList": FileListCtrl,
  "table": TableCtrl,
  "conditions": ConditionsCtrl,
  "color": ColorCtrl,
  "dict": DictCtrl,
  "inv": UnknownCtrl,
  "validator": ValidatorCtrl,
  "keypress": KeyPressCtrl,
  "calibration": CalibrationCtrl
};
function ParamCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      name,
      param = void 0,
      $$slots,
      $$events,
      /** @interface */
      ...attachments
    } = $$props;
    let ValueCtrl = void 0;
    if (param.inputType in mapping) {
      ValueCtrl = mapping[param.inputType];
    } else {
      ValueCtrl = mapping["single"];
    }
    let inline = ["bool"].includes(param.inputType);
    function evaluateDepend(dep) {
      let target;
      if (typeof dep === "boolean") {
        return dep;
      }
      if (String(dep.condition).startsWith("==")) {
        target = String(dep.condition).replace(/== *['"](.*?)['"]|== *(.*?)/, "$1");
        if (target.trim() === "True") {
          target = true;
        } else if (target.trim() === "False") {
          target = false;
        }
        if (param.siblings[dep.param].val !== target) {
          return false;
        }
      } else if (String(dep.condition).startsWith("in")) {
        target = String(dep.condition).replace(/in [\[\(](.*?)[\]\)]/, "$1").split(/, ?/g).map((value) => value.replace(/['"](.*?)['"]/, "$1"));
        if (!target.includes(param.siblings[dep.param].val)) {
          return false;
        }
      } else {
        if (!param.siblings[dep.param].val) {
          return false;
        }
      }
      return true;
    }
    let shown = (() => {
      for (let dep of param.depends.shown) {
        if (!evaluateDepend(dep)) {
          return false;
        }
      }
      return true;
    })();
    let enabled = (() => {
      for (let dep of param.depends.enabled) {
        if (!evaluateDepend(dep)) {
          return false;
        }
      }
      return true;
    })();
    let showTooltip = false;
    let grow = ["code", "multi"].includes(param.inputType);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (shown && param.inputType !== "hidden") {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div${attributes({ class: "param-ctrl", id: name, ...attachments }, "svelte-a7rlw1", void 0, {
          "grid-template-rows": inline ? "[label] min-content [warning] min-content" : "[label] min-content [ctrl] auto [warning] min-content",
          "flex-grow": grow ? 1 : 0
        })}><label class="param-label svelte-a7rlw1"${attr("for", name)}${attr_style("", {
          "grid-column-start": inline ? "gap" : "label",
          "align-self": inline ? "center" : "end"
        })}>${escape_html(param.label ? param.label : name)} `);
        if (param.hint) {
          $$renderer3.push("<!--[-->");
          Tooltip($$renderer3, {
            position: "bottom",
            get shown() {
              return showTooltip;
            },
            set shown($$value) {
              showTooltip = $$value;
              $$settled = false;
            },
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->${escape_html(param.hint)}`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></label> `);
        if (param.allowedUpdates && param.allowedUpdates.length > 0) {
          $$renderer3.push("<!--[-->");
          $$renderer3.select(
            {
              class: "param-updates",
              id: `${stringify(name)}-updates`,
              disabled: param.allowedUpdates.length == 1,
              value: param.updates
            },
            ($$renderer4) => {
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like(param.allowedUpdates);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let ud = each_array[$$index];
                $$renderer4.option({ value: ud }, ($$renderer5) => {
                  $$renderer5.push(`${escape_html(ud)}`);
                });
              }
              $$renderer4.push(`<!--]--><!--[-->`);
              const each_array_1 = ensure_array_like(current.experiment.updateTargets);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let ud = each_array_1[$$index_1];
                $$renderer4.option({ value: `set during: ${stringify(ud.name)}` }, ($$renderer5) => {
                  $$renderer5.push(`set during: ${escape_html(ud.name)}`);
                });
              }
              $$renderer4.push(`<!--]-->`);
            },
            "svelte-a7rlw1"
          );
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> <div class="param-value svelte-a7rlw1"${attr_style("", {
          "grid-row-start": inline ? "label" : "ctrl",
          "grid-column-end": inline ? "gap" : "end"
        })}><!---->`);
        ValueCtrl($$renderer3, {
          disabled: !enabled,
          get param() {
            return param;
          },
          set param($$value) {
            param = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div> <div class="warning svelte-a7rlw1">`);
        if (param.valid.warning) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`${escape_html(param.valid.warning)}`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div></div>`);
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
    bind_props($$props, { param });
  });
}
function StartStopCtrl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let name = $$props["name"];
    let params = $$props["params"];
    $$renderer2.push(`<div class="start-stop-ctrl svelte-1fa03mg"${attr("id", name)}><label class="param-label svelte-1fa03mg"${attr("for", name)}>${escape_html(name)} `);
    if (params.valueParam !== null && params.valueParam.hint) {
      $$renderer2.push("<!--[-->");
      Tooltip($$renderer2, {
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->${escape_html(params.valueParam.hint)}`);
        },
        $$slots: { default: true }
      });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></label> <div class="param-gap svelte-1fa03mg"></div> `);
    if (params.typeParam !== null) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="param-type svelte-1fa03mg">`);
      if (params.typeParam.hint) {
        $$renderer2.push("<!--[-->");
        Tooltip($$renderer2, {
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->${escape_html(params.typeParam.hint)}`);
          },
          $$slots: { default: true }
        });
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      $$renderer2.select(
        {
          disabled: params.typeParam.allowedVals.length == 1,
          value: params.typeParam.val,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(params.typeParam.allowedVals);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let val = each_array[$$index];
            $$renderer3.option({ value: val, selected: params.typeParam.val === val }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(val)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        },
        "svelte-1fa03mg"
      );
      $$renderer2.push(`</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (params.valueParam !== null) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<input class="param-value svelte-1fa03mg" type="text"${attr("value", params.valueParam.val)}/>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (params.expectedParam !== null) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<label class="param-estim-label svelte-1fa03mg"${attr("for", `${stringify(name)}-type`)}>${escape_html(params.expectedParam.label)}</label> <input class="param-estim svelte-1fa03mg" type="text"${attr("value", params.expectedParam.val)}${attr("id", `${stringify(name)}-type`)}/>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { name, params });
  });
}
function Notebook_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      element: element2 = void 0,
      /** @prop @type {array<string>} List of param names not to show */
      hideParams = []
    } = $$props;
    let pageIndex = void 0;
    let horizontal = element2.tag === "CodeComponent";
    let categOrder = {
      // put these categories at the beginning
      Basic: -5,
      Layout: -4,
      Appearance: -3,
      Formatting: -2,
      Texture: -1,
      // put these categories at the end
      Data: 1,
      Custom: 2,
      Hardware: 3,
      Testing: 4
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="params-container svelte-tsgnvi"><div class="uncategorised-params-panel svelte-tsgnvi">`);
      if (element2.sortedParams.uncategorised) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(Object.entries(element2.sortedParams.uncategorised));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let [name, param] = each_array[$$index];
          if (![...hideParams].includes(name)) {
            $$renderer3.push("<!--[-->");
            ParamCtrl($$renderer3, { name, param });
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> `);
      if (Object.keys(element2.sortedParams).filter((value) => value !== "uncategorised").length) {
        $$renderer3.push("<!--[-->");
        Notebook($$renderer3, {
          children: ($$renderer4) => {
            $$renderer4.push(`<!--[-->`);
            const each_array_1 = ensure_array_like(Object.entries(element2.sortedParams).sort((left, right) => (categOrder[left[0]] || 0) - (categOrder[right[0]] || 0)));
            for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
              let [categ, params] = each_array_1[$$index_2];
              if (!Object.keys(params).every((value) => hideParams.includes(value)) && categ !== "uncategorised") {
                $$renderer4.push("<!--[-->");
                var bind_get = () => {
                  return pageIndex === categ;
                };
                var bind_set = (value) => {
                  pageIndex = categ;
                };
                Page($$renderer4, {
                  label: categ,
                  data: element2,
                  get selected() {
                    return bind_get();
                  },
                  set selected($$value) {
                    bind_set($$value);
                  },
                  children: ($$renderer5) => {
                    $$renderer5.push(`<div class="params-panel svelte-tsgnvi"${attr_style("", {
                      "flex-direction": horizontal ? "row" : "column",
                      width: horizontal ? "65rem" : "45rem"
                    })}>`);
                    if ("startVal" in params) {
                      $$renderer5.push("<!--[-->");
                      StartStopCtrl($$renderer5, { name: "Start", params: element2.startParams });
                    } else {
                      $$renderer5.push("<!--[!-->");
                    }
                    $$renderer5.push(`<!--]--> `);
                    if ("stopVal" in params) {
                      $$renderer5.push("<!--[-->");
                      StartStopCtrl($$renderer5, { name: "Stop", params: element2.stopParams });
                    } else {
                      $$renderer5.push("<!--[!-->");
                    }
                    $$renderer5.push(`<!--]--> <!--[-->`);
                    const each_array_2 = ensure_array_like(Object.entries(params));
                    for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                      let [name, param] = each_array_2[$$index_1];
                      if (![
                        "startVal",
                        "startType",
                        "startEstim",
                        "stopVal",
                        "stopType",
                        "durationEstim",
                        ...hideParams
                      ].includes(name)) {
                        $$renderer5.push("<!--[-->");
                        ParamCtrl($$renderer5, {
                          name,
                          get param() {
                            return element2.params[name];
                          },
                          set param($$value) {
                            element2.params[name] = $$value;
                            $$settled = false;
                          }
                        });
                      } else {
                        $$renderer5.push("<!--[!-->");
                      }
                      $$renderer5.push(`<!--]-->`);
                    }
                    $$renderer5.push(`<!--]--></div>`);
                  },
                  $$slots: { default: true }
                });
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]-->`);
            }
            $$renderer4.push(`<!--]-->`);
          }
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
    bind_props($$props, { element: element2 });
  });
}
function ParamsDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      /** @prop @type {import("$lib/experiment/param.svelte.js")<HasParams>} Element which this dialog edits */
      element: element2,
      /** @bindable State controlling this dialog's visibility */
      shown = void 0,
      /** @prop @type {object} Additional buttons beyond the standard OK, APPLY, CANCEL and HELP */
      extraButtons = {},
      /** @prop @type {function} Function to execute when param changes are applied */
      onapply = (evt) => {
      },
      /** @prop @type {function} Function to execute when this dialog closes */
      onclose = (evt) => {
      }
    } = $$props;
    let valid = Object.values(element2.params).every((param) => param.valid.value);
    let btnsDisabled = { OK: !valid, APPLY: !valid };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        id: `${stringify(element2.name)}-parameters`,
        title: `Editing: ${stringify(element2.name || element2.tag)}`,
        onclose,
        onopen: () => element2.restore.set(),
        buttons: {
          OK: (evt) => {
            element2.trim();
            element2.restore.set();
            onapply(evt);
          },
          APPLY: (evt) => {
            element2.trim();
            element2.restore.set();
            onapply(evt);
          },
          EXTRA: extraButtons,
          CANCEL: (evt) => {
            element2.restore.apply();
          },
          HELP: element2.helpLink
        },
        buttonsDisabled: btnsDisabled,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Notebook_1($$renderer4, { element: element2 });
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
function PrefsDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { shown = void 0 } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      await_block(
        $$renderer3,
        prefs.ready,
        () => {
          $$renderer3.push(`Loading...`);
        },
        () => {
          ParamsDialog($$renderer3, {
            element: prefs,
            onapply: (evt) => prefs.save(),
            extraButtons: { Reset: (evt) => prefs.reset() },
            get shown() {
              return shown;
            },
            set shown($$value) {
              shown = $$value;
              $$settled = false;
            }
          });
        }
      );
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
function BugReport($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { user = {}, context = {}, shown = void 0 } = $$props;
    let report = {
      version: "",
      username: "",
      email: "",
      title: "",
      description: "",
      priority: "",
      message: "",
      logs: { app: "", liaison: "" }
    };
    let err = { shown: false, message: void 0 };
    async function populate() {
      report.title = "";
      report.message = "";
      report.priority = "";
      report.version = await electron.version();
      report.username = user?.profile?.username;
      report.email = user?.profile?.email || "";
      if (context instanceof Experiment) {
        report.context = context.toJSON();
      }
      if (Array.isArray(context)) {
        report.context = context.map((page) => page.toJSON?.());
      }
      if (electron) {
        let folder = await electron.paths.user();
        report.logs.app = await electron.files.load(path.join(folder, "last_app_load.log"));
        report.logs.liaison = await electron.files.load(path.join(folder, "liaison.log"));
      }
      report.logs.browser = "";
    }
    async function submit(evt) {
      console.log("Sending bug report:", snapshot(report));
      let resp = await fetch("/api/report", { method: "POST", body: JSON.stringify(snapshot(report)) }).then((resp2) => resp2.json());
      console.log("Bug report sent", resp);
      if (resp.err) {
        err.shown = true;
        err.message = resp.err;
      }
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Dialog($$renderer3, {
        title: "Submit bug report",
        buttons: { OK: submit, CANCEL: (evt) => {
        } },
        onopen: populate,
        shrink: true,
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="content svelte-8xvegw"><div class="ctrl svelte-8xvegw"><span>ClickUp access token (<a href="https://app.clickup.com/4570406/settings/apps" target="_blank">click here to log in and get one</a>)</span> <input${attr("value", report.token)}/></div> <div class="ctrl svelte-8xvegw">Provide a contact email <input${attr("value", report.email)}/></div> <div class="ctrl svelte-8xvegw">Briefly summarise the bug <input${attr("value", report.title)}/></div> <div class="ctrl svelte-8xvegw">Provide a more detailed description (optional) <textarea class="svelte-8xvegw">`);
          const $$body = escape_html(report.description);
          if ($$body) {
            $$renderer4.push(`${$$body}`);
          }
          $$renderer4.push(`</textarea></div> <div class="ctrl svelte-8xvegw">How severe is the bug? `);
          $$renderer4.select({ value: report.priority }, ($$renderer5) => {
            $$renderer5.option({ value: 1 }, ($$renderer6) => {
              $$renderer6.push(`Totally prevents me from progressing`);
            });
            $$renderer5.option({ value: 2 }, ($$renderer6) => {
              $$renderer6.push(`Requires a hacky workaround to progress`);
            });
            $$renderer5.option({ value: 3 }, ($$renderer6) => {
              $$renderer6.push(`Can progress but there's confusing errors/warnings`);
            });
            $$renderer5.option({ value: 4 }, ($$renderer6) => {
              $$renderer6.push(`Works but something is unintuitive / could be prettier`);
            });
          });
          $$renderer4.push(`</div></div>`);
        },
        $$slots: { default: true }
      });
      $$renderer3.push(`<!----> `);
      MessageDialog($$renderer3, {
        get shown() {
          return err.shown;
        },
        set shown($$value) {
          err.shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<p>Failed to send report.</p> <pre>${escape_html(err.ECODE)}: ${escape_html(err.message)}</pre> <p>Click below to download the report so you can send it manually:</p> `);
          Button($$renderer4, {
            label: "Download",
            icon: "/icons/btn-download.svg",
            onclick: (evt) => browseFileSave(
              [
                { description: "JSON file", accept: { "text/json": [".json"] } }
              ],
              "./bug_report.json"
            ).then((file) => writeFile(file, JSON.stringify(report, void 0, 4))),
            horizontal: true
          });
          $$renderer4.push(`<!---->`);
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
    bind_props($$props, { shown });
  });
}
function Ribbon($$renderer, $$props) {
  let {
    /** @interface */
    children
  } = $$props;
  $$renderer.push(`<div id="ribbon" class="svelte-106am9m">`);
  children($$renderer);
  $$renderer.push(`<!----></div>`);
}
function Section($$renderer, $$props) {
  let {
    /** @prop @type {string} Label for this section */
    label = "",
    /** @prop @type {string|undefined} Icon for this section, if any */
    icon = void 0,
    /** @interface */
    children = void 0
  } = $$props;
  $$renderer.push(`<div class="ribbon-section svelte-j7if95">`);
  children?.($$renderer);
  $$renderer.push(`<!----> <div class="ribbon-section-label svelte-j7if95">`);
  if (icon) {
    $$renderer.push("<!--[-->");
    Icon($$renderer, { src: icon });
  } else {
    $$renderer.push("<!--[!-->");
    $$renderer.push(`<div></div>`);
  }
  $$renderer.push(`<!--]--> ${escape_html(label)}</div></div>`);
}
function Gap($$renderer) {
  $$renderer.push(`<div class="section-gap svelte-1y8fdye"></div>`);
}
const tips = /* @__PURE__ */ JSON.parse(`[{"message":"Most buttons have helpful usage tips if you hover over them","categories":["general"]},{"message":"PsychoPy can handle many different units (degrees of visual angle, cm...) for your stimuli. But you need to tell it about your monitor first (see the online documentation on General > Units)","categories":["general"]},{"message":"Menu items show you the current key bindings (which can be configured in preferences)","categories":["general"]},{"message":"It's a really good idea to run in pilot mode and check your data are all being saved as you like BEFORE running all of your participants!","categories":["general"]},{"message":"You can control what is different in pilot mode (compared than run mode) in the 'Piloting' section of Preferences","icon":"/icons/btn-pilotpy.svg","categories":["general"]},{"message":"The [user forum](https://discourse.psychopy.org) is a great place to ask questions and receive updates","categories":["general"]},{"message":"If you write to the forum, make it clear whether you're running locally or online.","categories":["general"]},{"message":"You can use the source. PsychoPy comes with all its source code included. If you know Python, you'd be surprised how easy it is to find your own bug-fixes.","categories":["general"]},{"message":"Degrees of visual angle are 'device independent'. Normalized units mean that your stimulus will be different on each different computer. Do you really want that?","categories":["general"]},{"message":"PsychoPy is free. Please [cite the most recent paper](https://psychopy.org/about/index.html#citing-psychopy) if you use PsychoPy in published work","categories":["general"]},{"message":"In Python, the values True and False must have capitals and really just stand for 1 and 0.","categories":["general"]},{"message":"Did your stimulus not appear? Was it really tiny? Is it the same color as your background?","categories":["general"]},{"message":"The default color values in PsychoPy range from -1 to +1, with 0 being the mean grey of the screen. So black is like the maximum decrement from grey and white is an increment. Right?","categories":["general"]},{"message":"Data can be output in many different formats, but it's worth saving the 'psydat' (aka pickle) format as well as the others. Although this isn't 'human readable' it stores more information than excel/csv files including an entire copy of your actual experiment!","categories":["general"]},{"message":"You can see how many people used PsychoPy this month at [usage.psychopy.org](https://usage.psychopy.org)","categories":["general"]},{"message":"If you like PsychoPy spread the word","categories":["general"]},{"message":"For the best audio timing you need to use the 'PTB' backend (set this in the app Preferences).","categories":["general"]},{"message":"Get your department to buy a site licence for Pavlovia.org. You'll be helping fund PsychoPy development and you'll be able to run unlimited online studies.","categories":["general"]},{"message":"Use informative variable and Component names. You don't want to be trawling through your experiment looking for 'text_32'...","categories":["general"]},{"message":"Friend of the show Wakefield has been posting daily tips on the forum. [Give them a look!](https://discourse.psychopy.org/t/wakefields-daily-tips-index/43722)","categories":["general"]},{"message":"If you're running in a browser and can't find an error message, try [opening your browser's developer tools](https://balsamiq.com/support/faqs/browser-console); it may be in the console.","categories":["general"]},{"message":"Open Science Tools (that's us, the makers of PsychoPy!) offer [consultancy](https://psychopy.org/consultancy); we can teach you to use PsychoPy and even help you build an experiment","categories":["general"]},{"message":"Check out [demo experiments on Pavlovia](https://pavlovia.org/explore/demos?sort=DEFAULT) for a useful starting point","categories":["general"]},{"message":"It's entirely possible that someone has made an experiment similar to what you want to do, so its worth [browsing public projects](https://pavlovia.org/explore?sort=DEFAULT) on Pavlovia before you start","icon":"/branding/pavlovia.svg","categories":["general"]},{"message":"Stay in the loop on upcoming training events via [our workshops site](https://workshops.psychopy.org/)","categories":["general"]},{"message":"Sites like [itch.io](https://itch.io/) and [Pexels](https://www.pexels.com/) can be a great resource for stimuli, especially if you want to gamify your experiment, but you should always check the license and be sure to credit the authors in your README file.","categories":["general"]},{"message":"Chocolate probably won't help, but does that mean you shouldn't try it?","categories":["silly"]},{"message":"You should avoid snorting Pepsi","categories":["silly"]},{"message":"You should wear sunscreen. (Where does it say these tips have to be original?!)","categories":["silly"]},{"message":"Debugging is like a murder mystery, except you're the murderer...","categories":["silly"]},{"message":"Most dialogs have a help button that takes you to the relevant online documentation","categories":["builder"]},{"message":"From Builder you can use 'Compile' to generate the Python script that controls your experiment, and view or edit it in the Coder. Any edits are not reflected back in the Builder, however. [The answer is (almost) never to edit the generated code](https://discourse.psychopy.org/t/wakefields-daily-tips/43371/17).","icon":"/icons/btn-compilepy.svg","categories":["builder"]},{"message":"Need sub-millisecond timing? Use Validator Routines to make sure you're *getting* sub-millisecond timing!","categories":["builder"]},{"message":"For fMRI block designs you want to use non-slip timing (trials of pre-determined duration). Builder indicates these with a green icon in the Flow panel","categories":["builder"]},{"message":"You can often right click on things to bring up a menu, e.g., to remove a trial.","categories":["builder"]},{"message":"To set stimulus position to your variables X and Y, you can use either $[X,Y] or [$X,Y]. (A $ anywhere indicates that the entire entry box is Python code)","categories":["builder"]},{"message":"The contents of the dialog box at the start of your experiment are controlled from the Experiment Settings button. You can use these values in your study by referring to the value in expInfo e.g. expInfo['participant']","icon":"/icons/btn-settings.svg","categories":["builder"]},{"message":"If you set a description for a Routine in its Routine Settings, whatever you wrote will appear when you hover over that Routine in the flow","categories":["builder"]},{"message":"To put a $ symbol in a stimulus, you need to use \\\\$, like this: 'You win \\\\$5.00!'. (This is only for input boxes, and not for code components.)","categories":["builder"]},{"message":"You can use 'Ctrl + Z' and 'Ctrl + Shift + Z' to undo and redo many of the actions in the Builder, such as adding, deleting, or changing something.","categories":["builder"]},{"message":"In Builder you can control what appears in the 'Experiment Info' dialog box in the Experiment Settings","categories":["builder"]},{"message":"Sometimes the correct response on a given trial is not to respond at all, such as in a go/no-go task. To score such responses properly, enter 'None' as the correct answer (no quotes) in the Builder dialog box.","categories":["builder"]},{"message":"Is your experiment tedious to run? Check out the [psychopy-monkeys](https://teparsons.github.io/psychopy-monkeys/) plugin - adding a monkey to your experiment makes it easy to skip some parts in pilot mode.","icon":"https://raw.githubusercontent.com/TEParsons/psychopy-monkeys/refs/heads/main/branding/plugin_icon%402x.png","categories":["builder"]},{"message":"Reusing Routines wherever possible will make your experiment","categories":["builder"]},{"message":"Did you know you can disable Routines and Components? Check the 'Testing' tab of the Component or Routine Settings","categories":["builder"]},{"message":"Setting 'nReps' in a loop to 0 means the whole loop is skipped","categories":["builder"]},{"message":"You can use a Survey Routine to embed a [Pavlovia Survey](https://pavlovia.org/docs/surveys/overview) in your experiment. Perfect for consent/debrief forms when running online!","icon":"/branding/pavlovia.svg","categories":["builder"]},{"message":"You can comment/uncomment entire blocks of code with 'Ctrl + ?'","categories":["coder"]},{"message":"Comments are a love note to future you. Always comment your code!","categories":["coder"]}]`);
function TipsDialog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { categories = ["general", "silly"], shown = void 0 } = $$props;
    let hide = void 0;
    if (electron) {
      electron.windows.listen("showTips", (evt, value) => shown = value);
    }
    let tip = void 0;
    function chooseTip() {
      let options = tips.filter((tip2) => categories.some((categ) => tip2.categories.includes(categ)));
      tip = options[Math.floor(Math.random() * options.length)];
    }
    chooseTip();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      MessageDialog($$renderer3, {
        title: "PsychoPy Tips",
        buttons: {
          OK: (evt) => {
          },
          EXTRA: { Refresh: chooseTip }
        },
        get shown() {
          return shown;
        },
        set shown($$value) {
          shown = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="tip svelte-st75mq"><span${attr_style("", { color: "var(--blue)" })}>`);
          Icon($$renderer4, { src: tip.icon || "/icons/sym-info.svg", size: "3rem" });
          $$renderer4.push(`<!----></span> ${html(marked(tip.message))}</div> <div class="stop svelte-st75mq"><input type="checkbox"${attr("checked", hide, true)}/> Don't show startup tips</div>`);
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
  CodeEditor as $,
  PanelButton as A,
  Button as B,
  CodeOutput as C,
  Dialog as D,
  LoopInitiator as E,
  LoopTerminator as F,
  Gap as G,
  FlowLoop as H,
  Item as I,
  Frame as J,
  Pane_group as K,
  Listbook as L,
  MessageArray as M,
  Notebook as N,
  Pane as O,
  PrefsDialog as P,
  Panel as Q,
  Routine as R,
  Separator as S,
  Tooltip as T,
  UserCtrl as U,
  Version as V,
  Pane_resizer as W,
  TipsDialog as X,
  Shortcuts as Y,
  SetupPython as Z,
  Script as _,
  Message as a,
  Experiment as a0,
  RadioButton as a1,
  MessageDialog as b,
  current as c,
  CompactButton as d,
  auth as e,
  DropdownButton as f,
  Menu as g,
  SubMenu as h,
  showDevTools as i,
  setupPython as j,
  ParamsDialog as k,
  Dialog_1$2 as l,
  BugReport as m,
  newWindow as n,
  openIn as o,
  ParamCtrl as p,
  Page as q,
  Ribbon as r,
  showWindow as s,
  Section as t,
  IconButton as u,
  SwitchButton as v,
  Component as w,
  Notebook_1 as x,
  StandaloneRoutine as y,
  ButtonTab as z
};
