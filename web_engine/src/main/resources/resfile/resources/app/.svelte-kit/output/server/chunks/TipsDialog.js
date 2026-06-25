import { a as tick, c as on, i as onDestroy } from "./internal.js";
import { D as escape_html, E as attr, St as run, a as bind_props, b as setContext, d as spread_props, et as snapshot, f as stringify, i as await_block, l as props_id, m as html, n as attr_style, o as derived, r as attributes, s as ensure_array_like, t as attr_class, ut as ATTACHMENT_KEY, v as getContext, y as hasContext } from "./server.js";
import "./client.js";
import { B as Icon, C as Device, D as profiles, E as pending, F as CompactButton, G as devices, I as PanelButton, J as projects$1, K as electron, M as Dialog, N as DropdownButton, O as RadioButton, P as Menu, R as Button, T as Param, Y as python$1, d as Version, f as browseFileOpen, g as writeFile, i as Experiment, j as MessageDialog, l as CodeEditor, n as prefs, p as browseFileSave, q as git$1, r as Script, z as Tooltip } from "./Theme.js";
import { clsx } from "clsx";
import path from "path-browserify";
import { marked } from "marked";
import parse from "style-to-object";
//#region src/lib/utils/Panel.svelte
function Panel($$renderer, $$props) {
	let { title, children = void 0 } = $$props;
	$$renderer.push(`<div class="panel svelte-nal48f"><div class="pnl-title svelte-nal48f">${escape_html(title)}</div> <div class="pnl-content svelte-nal48f">`);
	children?.($$renderer);
	$$renderer.push(`<!----></div></div>`);
}
//#endregion
//#region src/lib/utils/Frame.svelte
function Frame($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { currentView = "builder", onFileDrop = (evt, file) => {}, ribbon = void 0, children } = $$props;
		let hover = {
			show: false,
			indicator: void 0
		};
		const views = [
			"builder",
			"coder",
			"runner"
		];
		$$renderer.push(`<div id="frame" role="region" class="svelte-158299m">`);
		if (hover.show) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="hover-indicator svelte-158299m"></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <nav id="view-nav" class="svelte-158299m"><!--[-->`);
		const each_array = ensure_array_like(views);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let view = each_array[$$index];
			$$renderer.push(`<button${attr_class("nav-btn svelte-158299m", void 0, { "active": currentView === view })}>${escape_html(view.charAt(0).toUpperCase() + view.slice(1))}</button>`);
		}
		$$renderer.push(`<!--]--></nav> `);
		if (ribbon) {
			$$renderer.push("<!--[0-->");
			ribbon($$renderer);
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div id="content" class="svelte-158299m">`);
		children($$renderer);
		$$renderer.push(`<!----></div></div>`);
		bind_props($$props, { currentView });
	});
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/is.js
function isFunction(value) {
	return typeof value === "function";
}
function isObject(value) {
	return value !== null && typeof value === "object";
}
var CLASS_VALUE_PRIMITIVE_TYPES = [
	"string",
	"number",
	"bigint",
	"boolean"
];
function isClassValue(value) {
	if (value === null || value === void 0) return true;
	if (CLASS_VALUE_PRIMITIVE_TYPES.includes(typeof value)) return true;
	if (Array.isArray(value)) return value.every((item) => isClassValue(item));
	if (typeof value === "object") {
		if (Object.getPrototypeOf(value) !== Object.prototype) return false;
		return true;
	}
	return false;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/box/box.svelte.js
var BoxSymbol = Symbol("box");
var isWritableSymbol = Symbol("is-writable");
function isBox(value) {
	return isObject(value) && BoxSymbol in value;
}
/**
* @returns Whether the value is a WritableBox
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function isWritableBox(value) {
	return box.isBox(value) && isWritableSymbol in value;
}
function box(initialValue) {
	let current = initialValue;
	return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return current;
		},
		set current(v) {
			current = v;
		}
	};
}
function boxWith(getter, setter) {
	const derived$1 = derived(getter);
	if (setter) return {
		[BoxSymbol]: true,
		[isWritableSymbol]: true,
		get current() {
			return derived$1();
		},
		set current(v) {
			setter(v);
		}
	};
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
/**
* Function that gets an object of boxes, and returns an object of reactive values
*
* @example
* const count = box(0)
* const flat = box.flatten({ count, double: box.with(() => count.current) })
* // type of flat is { count: number, readonly double: number }
*
* @see {@link https://runed.dev/docs/functions/box}
*/
function boxFlatten(boxes) {
	return Object.entries(boxes).reduce((acc, [key, b]) => {
		if (!box.isBox(b)) return Object.assign(acc, { [key]: b });
		if (box.isWritableBox(b)) Object.defineProperty(acc, key, {
			get() {
				return b.current;
			},
			set(v) {
				b.current = v;
			}
		});
		else Object.defineProperty(acc, key, { get() {
			return b.current;
		} });
		return acc;
	}, {});
}
/**
* Function that converts a box to a readonly box.
*
* @example
* const count = box(0) // WritableBox<number>
* const countReadonly = box.readonly(count) // ReadableBox<number>
*
* @see {@link https://runed.dev/docs/functions/box}
*/
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
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/compose-handlers.js
/**
* Composes event handlers into a single function that can be called with an event.
* If the previous handler cancels the event using `event.preventDefault()`, the handlers
* that follow will not be called.
*/
function composeHandlers(...handlers) {
	return function(e) {
		for (const handler of handlers) {
			if (!handler) continue;
			if (e.defaultPrevented) return;
			if (typeof handler === "function") handler.call(this, e);
			else handler.current?.call(this, e);
		}
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/strings.js
var NUMBER_CHAR_RE = /\d/;
var STR_SPLITTERS = [
	"-",
	"_",
	"/",
	"."
];
function isUppercase(char = "") {
	if (NUMBER_CHAR_RE.test(char)) return void 0;
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
	if (!str) return "";
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
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/css-to-style-obj.js
function cssToStyleObj(css) {
	if (!css) return {};
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
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/execute-callbacks.js
/**
* Executes an array of callback functions with the same arguments.
* @template T The types of the arguments that the callback functions take.
* @param callbacks array of callback functions to execute.
* @returns A new function that executes all of the original callback functions with the same arguments.
*/
function executeCallbacks(...callbacks) {
	return (...args) => {
		for (const callback of callbacks) if (typeof callback === "function") callback(...args);
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/events.js
/**
* Adds an event listener to the specified target element(s) for the given event(s), and returns a function to remove it.
* @param target The target element(s) to add the event listener to.
* @param event The event(s) to listen for.
* @param handler The function to be called when the event is triggered.
* @param options An optional object that specifies characteristics about the event listener.
* @returns A function that removes the event listener from the target element(s).
*/
function addEventListener$1(target, event, handler, options) {
	const events = Array.isArray(event) ? event : [event];
	events.forEach((_event) => target.addEventListener(_event, handler, options));
	return () => {
		events.forEach((_event) => target.removeEventListener(_event, handler, options));
	};
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style-to-css.js
function createParser(matcher, replacer) {
	const regex = RegExp(matcher, "g");
	return (str) => {
		if (typeof str !== "string") throw new TypeError(`expected an argument of type string, but got ${typeof str}`);
		if (!str.match(regex)) return str;
		return str.replace(regex, replacer);
	};
}
var camelToKebab = createParser(/[A-Z]/, (match) => `-${match.toLowerCase()}`);
function styleToCSS(styleObj) {
	if (!styleObj || typeof styleObj !== "object" || Array.isArray(styleObj)) throw new TypeError(`expected an argument of type object, but got ${typeof styleObj}`);
	return Object.keys(styleObj).map((property) => `${camelToKebab(property)}: ${styleObj[property]};`).join("\n");
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/style.js
function styleToString(style = {}) {
	return styleToCSS(style).replace("\n", " ");
}
styleToString({
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
});
var EVENT_LIST_SET = new Set([
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
]);
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/merge-props.js
/**
* Modified from https://github.com/adobe/react-spectrum/blob/main/packages/%40react-aria/utils/src/mergeProps.ts (see NOTICE.txt for source)
*/
function isEventHandler(key) {
	return EVENT_LIST_SET.has(key);
}
/**
* Given a list of prop objects, merges them into a single object.
* - Automatically composes event handlers (e.g. `onclick`, `oninput`, etc.)
* - Chains regular functions with the same name so they are called in order
* - Merges class strings with `clsx`
* - Merges style objects and converts them to strings
* - Handles a bug with Svelte where setting the `hidden` attribute to `false` doesn't remove it
* - Overrides other values with the last one
*/
function mergeProps(...args) {
	const result = { ...args[0] };
	for (let i = 1; i < args.length; i++) {
		const props = args[i];
		if (!props) continue;
		for (const key of Object.keys(props)) {
			const a = result[key];
			const b = props[key];
			const aIsFunction = typeof a === "function";
			const bIsFunction = typeof b === "function";
			if (aIsFunction && typeof bIsFunction && isEventHandler(key)) result[key] = composeHandlers(a, b);
			else if (aIsFunction && bIsFunction) result[key] = executeCallbacks(a, b);
			else if (key === "class") {
				const aIsClassValue = isClassValue(a);
				const bIsClassValue = isClassValue(b);
				if (aIsClassValue && bIsClassValue) result[key] = clsx(a, b);
				else if (aIsClassValue) result[key] = clsx(a);
				else if (bIsClassValue) result[key] = clsx(b);
			} else if (key === "style") {
				const aIsObject = typeof a === "object";
				const bIsObject = typeof b === "object";
				const aIsString = typeof a === "string";
				const bIsString = typeof b === "string";
				if (aIsObject && bIsObject) result[key] = {
					...a,
					...b
				};
				else if (aIsObject && bIsString) {
					const parsedStyle = cssToStyleObj(b);
					result[key] = {
						...a,
						...parsedStyle
					};
				} else if (aIsString && bIsObject) result[key] = {
					...cssToStyleObj(a),
					...b
				};
				else if (aIsString && bIsString) {
					const parsedStyleA = cssToStyleObj(a);
					const parsedStyleB = cssToStyleObj(b);
					result[key] = {
						...parsedStyleA,
						...parsedStyleB
					};
				} else if (aIsObject) result[key] = a;
				else if (bIsObject) result[key] = b;
				else if (aIsString) result[key] = a;
				else if (bIsString) result[key] = b;
			} else result[key] = b !== void 0 ? b : a;
		}
		for (const key of Object.getOwnPropertySymbols(props)) {
			const a = result[key];
			const b = props[key];
			result[key] = b !== void 0 ? b : a;
		}
	}
	if (typeof result.style === "object") result.style = styleToString(result.style).replaceAll("\n", " ");
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
//#endregion
//#region node_modules/svelte-toolbelt/node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow$1 = void 0;
//#endregion
//#region node_modules/svelte-toolbelt/node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement$2(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
globalThis.Date;
globalThis.Set;
globalThis.Map;
globalThis.URL;
globalThis.URLSearchParams;
/**
* @param {any} _
*/
function createSubscriber(_) {
	return () => {};
}
//#endregion
//#region node_modules/svelte-toolbelt/node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement$1 = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow$1, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber((update) => {
			const cleanupFocusIn = on(window, "focusin", update);
			const cleanupFocusOut = on(window, "focusout", update);
			return () => {
				cleanupFocusIn();
				cleanupFocusOut();
			};
		});
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement$2(this.#document);
	}
};
new ActiveElement$1();
//#endregion
//#region node_modules/svelte-toolbelt/node_modules/runed/dist/utilities/watch/watch.svelte.js
function runWatcher$1(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
}
function watch$1(sources, effect, options) {
	runWatcher$1(sources, "post", effect, options);
}
function watchPre$1(sources, effect, options) {
	runWatcher$1(sources, "pre", effect, options);
}
watch$1.pre = watchPre$1;
function watchOnce$1(source, effect) {}
function watchOncePre$1(source, effect) {}
watchOnce$1.pre = watchOncePre$1;
//#endregion
//#region node_modules/svelte-toolbelt/node_modules/runed/dist/utilities/resource/resource.svelte.js
function debounce$1(fn, delay) {
	let timeoutId;
	let lastResolve = null;
	return (...args) => {
		return new Promise((resolve) => {
			if (lastResolve) lastResolve(void 0);
			lastResolve = resolve;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(async () => {
				const result = await fn(...args);
				if (lastResolve) {
					lastResolve(result);
					lastResolve = null;
				}
			}, delay);
		});
	};
}
function throttle(fn, delay) {
	let lastRun = 0;
	let lastPromise = null;
	return (...args) => {
		const now = Date.now();
		if (lastRun && now - lastRun < delay) return lastPromise ?? Promise.resolve(void 0);
		lastRun = now;
		lastPromise = fn(...args);
		return lastPromise;
	};
}
function runResource(source, fetcher, options = {}, effectFn) {
	const { lazy = false, once = false, initialValue, debounce: debounceTime, throttle: throttleTime } = options;
	let current = initialValue;
	let loading = false;
	let error = void 0;
	let cleanupFns = [];
	const runCleanup = () => {
		cleanupFns.forEach((fn) => fn());
		cleanupFns = [];
	};
	const onCleanup = (fn) => {
		cleanupFns = [...cleanupFns, fn];
	};
	const baseFetcher = async (value, previousValue, refetching = false) => {
		try {
			loading = true;
			error = void 0;
			runCleanup();
			const controller = new AbortController();
			onCleanup(() => controller.abort());
			const result = await fetcher(value, previousValue, {
				data: current,
				refetching,
				onCleanup,
				signal: controller.signal
			});
			current = result;
			return result;
		} catch (e) {
			if (!(e instanceof DOMException && e.name === "AbortError")) error = e;
			return;
		} finally {
			loading = false;
		}
	};
	const runFetcher = debounceTime ? debounce$1(baseFetcher, debounceTime) : throttleTime ? throttle(baseFetcher, throttleTime) : baseFetcher;
	const sources = Array.isArray(source) ? source : [source];
	let prevValues;
	effectFn((values, previousValues) => {
		if (once && prevValues) return;
		prevValues = values;
		runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? previousValues : previousValues?.[0]);
	}, { lazy });
	return {
		get current() {
			return current;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		mutate: (value) => {
			current = value;
		},
		refetch: (info) => {
			const values = sources.map((s) => s());
			return runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? values : values[0], info ?? true);
		}
	};
}
function resource(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getters = () => sources.map((s) => s());
		watch$1(getters, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
function resourcePre(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getter = () => sources.map((s) => s());
		watch$1.pre(getter, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
resource.pre = resourcePre;
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/after-tick.js
function afterTick(fn) {
	(/* @__PURE__ */ tick()).then(fn);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom.js
var DOCUMENT_NODE = 9;
function isDocument(node) {
	return isObject(node) && node.nodeType === DOCUMENT_NODE;
}
function isWindow(node) {
	return isObject(node) && node.constructor?.name === "VisualViewport";
}
function getDocument(node) {
	if (isDocument(node)) return node;
	if (isWindow(node)) return node.document;
	return node?.ownerDocument ?? document;
}
function getActiveElement$1(rootNode) {
	let activeElement = rootNode.activeElement;
	while (activeElement?.shadowRoot) {
		const el = activeElement.shadowRoot.activeElement;
		if (el === activeElement) break;
		else activeElement = el;
	}
	return activeElement;
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/dom-context.svelte.js
var DOMContext = class {
	element;
	#root = derived(() => {
		if (!this.element.current) return document;
		return this.element.current.getRootNode() ?? document;
	});
	get root() {
		return this.#root();
	}
	set root($$value) {
		return this.#root($$value);
	}
	constructor(element) {
		if (typeof element === "function") this.element = box.with(element);
		else this.element = element;
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
};
if (typeof HTMLElement === "function");
//#endregion
//#region node_modules/svelte/src/attachments/index.js
/**
* Creates an object key that will be recognised as an attachment when the object is spread onto an element,
* as a programmatic alternative to using `{@attach ...}`. This can be useful for library authors, though
* is generally not needed when building an app.
*
* ```svelte
* <script>
* 	import { createAttachmentKey } from 'svelte/attachments';
*
* 	const props = {
* 		class: 'cool',
* 		onclick: () => alert('clicked'),
* 		[createAttachmentKey()]: (node) => {
* 			node.textContent = 'attached!';
* 		}
* 	};
* <\/script>
*
* <button {...props}>click me</button>
* ```
* @since 5.29
*/
function createAttachmentKey() {
	return Symbol(ATTACHMENT_KEY);
}
//#endregion
//#region node_modules/svelte-toolbelt/dist/utils/attach-ref.js
/**
* Creates a Svelte Attachment that attaches a DOM element to a ref.
* The ref can be either a WritableBox or a callback function.
*
* @param ref - Either a WritableBox to store the element in, or a callback function that receives the element
* @param onChange - Optional callback that fires when the ref changes
* @returns An object with a spreadable attachment key that should be spread onto the element
*
* @example
* // Using with WritableBox
* const ref = box<HTMLDivElement | null>(null);
* <div {...attachRef(ref)}>Content</div>
*
* @example
* // Using with callback
* <div {...attachRef((node) => myNode = node)}>Content</div>
*
* @example
* // Using with onChange
* <div {...attachRef(ref, (node) => console.log(node))}>Content</div>
*/
function attachRef(ref, onChange) {
	return { [createAttachmentKey()]: (node) => {
		if (box.isBox(ref)) {
			ref.current = node;
			run(() => onChange?.(node));
			return () => {
				if ("isConnected" in node && node.isConnected) return;
				ref.current = null;
				onChange?.(null);
			};
		}
		ref(node);
		run(() => onChange?.(node));
		return () => {
			if ("isConnected" in node && node.isConnected) return;
			ref(null);
			onChange?.(null);
		};
	} };
}
//#endregion
//#region node_modules/paneforge/dist/internal/utils/aria.js
/**
* A utility function that calculates the `aria-valuemax`, `aria-valuemin`,
* and `aria-valuenow` values for a pane based on its layout and constraints.
*/
function calculateAriaValues({ layout, panesArray, pivotIndices }) {
	let currentMinSize = 0;
	let currentMaxSize = 100;
	let totalMinSize = 0;
	let totalMaxSize = 0;
	const firstIndex = pivotIndices[0];
	for (let i = 0; i < panesArray.length; i++) {
		const { maxSize = 100, minSize = 0 } = panesArray[i].constraints;
		if (i === firstIndex) {
			currentMinSize = minSize;
			currentMaxSize = maxSize;
		} else {
			totalMinSize += minSize;
			totalMaxSize += maxSize;
		}
	}
	return {
		valueMax: Math.min(currentMaxSize, 100 - totalMinSize),
		valueMin: Math.max(currentMinSize, 100 - totalMaxSize),
		valueNow: layout[firstIndex]
	};
}
//#endregion
//#region node_modules/paneforge/dist/internal/utils/assert.js
function assert(expectedCondition, message = "Assertion failed!") {
	if (!expectedCondition) {
		console.error(message);
		throw new Error(message);
	}
}
//#endregion
//#region node_modules/paneforge/dist/internal/utils/compare.js
/**
* Compares two numbers for equality with a given fractional precision.
*/
function areNumbersAlmostEqual(actual, expected, fractionDigits = 10) {
	return compareNumbersWithTolerance(actual, expected, fractionDigits) === 0;
}
/**
* Compares two numbers with a given tolerance.
*
* @returns `-1` if `actual` is less than `expected`, `0` if they are equal,
* and `1` if `actual` is greater than `expected`.
*/
function compareNumbersWithTolerance(actual, expected, fractionDigits = 10) {
	const roundedActual = roundTo(actual, fractionDigits);
	const roundedExpected = roundTo(expected, fractionDigits);
	return Math.sign(roundedActual - roundedExpected);
}
/**
* Compares two arrays for equality.
*/
function areArraysEqual(arrA, arrB) {
	if (arrA.length !== arrB.length) return false;
	for (let index = 0; index < arrA.length; index++) if (arrA[index] !== arrB[index]) return false;
	return true;
}
/**
* Rounds a number to a given number of decimal places.
*/
function roundTo(value, decimals) {
	return Number.parseFloat(value.toFixed(decimals));
}
//#endregion
//#region node_modules/paneforge/dist/internal/utils/is.js
var isBrowser = typeof document !== "undefined";
function isHTMLElement(element) {
	return element instanceof HTMLElement;
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
//#endregion
//#region node_modules/paneforge/dist/internal/utils/resize.js
/**
* Resizes a pane based on its constraints.
*/
function resizePane({ paneConstraints: paneConstraintsArray, paneIndex, initialSize }) {
	const paneConstraints = paneConstraintsArray[paneIndex];
	assert(paneConstraints != null, "Pane constraints should not be null.");
	const { collapsedSize = 0, collapsible, maxSize = 100, minSize = 0 } = paneConstraints;
	let newSize = initialSize;
	if (compareNumbersWithTolerance(newSize, minSize) < 0) newSize = getAdjustedSizeForCollapsible(newSize, collapsible, collapsedSize, minSize);
	newSize = Math.min(maxSize, newSize);
	return Number.parseFloat(newSize.toFixed(10));
}
/**
* Adjusts the size of a pane based on its collapsible state.
*
* If the pane is collapsible, the size will be snapped to the collapsed size
* or the minimum size based on the halfway point.
*/
function getAdjustedSizeForCollapsible(size, collapsible, collapsedSize, minSize) {
	if (!collapsible) return minSize;
	return compareNumbersWithTolerance(size, (collapsedSize + minSize) / 2) < 0 ? collapsedSize : minSize;
}
//#endregion
//#region node_modules/paneforge/dist/internal/helpers.js
function noop() {}
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
	if (!isBrowser) return [];
	return Array.from(domContext.querySelectorAll(`[data-pane-resizer-id][data-pane-group-id="${groupId}"]`));
}
function getResizeHandleElementIndex({ groupId, id, domContext }) {
	if (!isBrowser) return null;
	return getResizeHandleElementsForGroup(groupId, domContext).findIndex((handle) => handle.getAttribute("data-pane-resizer-id") === id) ?? null;
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
	const pivotIndices = paneIndex === panesArray.length - 1 ? [paneIndex - 1, paneIndex] : [paneIndex, paneIndex + 1];
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
		if (!(lastNotifiedSize == null || size !== lastNotifiedSize)) continue;
		paneIdToLastNotifiedSizeMap[paneData.opts.id.current] = size;
		const { onCollapse, onExpand, onResize } = paneData.callbacks;
		onResize?.(size, lastNotifiedSize);
		if (collapsible && (onCollapse || onExpand)) {
			if (onExpand && (lastNotifiedSize == null || lastNotifiedSize === collapsedSize) && size !== collapsedSize) onExpand();
			if (onCollapse && (lastNotifiedSize == null || lastNotifiedSize !== collapsedSize) && size === collapsedSize) onCollapse();
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
		if (defaultSize != null) continue;
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
	const nextLayoutTotalSize = nextLayout.reduce((accumulated, current) => accumulated + current, 0);
	if (nextLayout.length !== paneConstraints.length) throw new Error(`Invalid ${paneConstraints.length} pane layout: ${nextLayout.map((size) => `${size}%`).join(", ")}`);
	else if (!areNumbersAlmostEqual(nextLayoutTotalSize, 100)) for (let index = 0; index < paneConstraints.length; index++) {
		const unsafeSize = nextLayout[index];
		assert(unsafeSize != null);
		nextLayout[index] = 100 / nextLayoutTotalSize * unsafeSize;
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
	if (!areNumbersAlmostEqual(remainingSize, 0)) for (let index = 0; index < paneConstraints.length; index++) {
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
			if (areNumbersAlmostEqual(remainingSize, 0)) break;
		}
	}
	return nextLayout;
}
function getPaneGroupElement(id, domContext) {
	if (!isBrowser) return null;
	const element = domContext.querySelector(`[data-pane-group][data-pane-group-id="${id}"]`);
	if (element) return element;
	return null;
}
function getResizeHandleElement(id, domContext) {
	if (!isBrowser) return null;
	const element = domContext.querySelector(`[data-pane-resizer-id="${id}"]`);
	if (element) return element;
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
	return (cursorPosition - initialCursorPosition) / groupSizeInPixels * 100;
}
function getDeltaPercentage({ event, dragHandleId, dir, initialDragState, keyboardResizeBy, domContext }) {
	if (isKeyDown(event)) {
		const isHorizontal = dir === "horizontal";
		let delta = 0;
		if (event.shiftKey) delta = 100;
		else if (keyboardResizeBy != null) delta = keyboardResizeBy;
		else delta = 10;
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
		if (initialDragState == null) return 0;
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
	if (isMouseEvent(e)) return isHorizontal ? e.clientX : e.clientY;
	else if (isTouchEvent(e)) {
		const firstTouch = e.touches[0];
		assert(firstTouch);
		return isHorizontal ? firstTouch.screenX : firstTouch.screenY;
	} else throw new Error(`Unsupported event type "${e.type}"`);
}
function getResizeHandlePaneIds({ groupId, handleId, panesArray, domContext }) {
	const handle = getResizeHandleElement(handleId, domContext);
	const handles = getResizeHandleElementsForGroup(groupId, domContext);
	const index = handle ? handles.indexOf(handle) : -1;
	return [panesArray[index]?.opts.id.current ?? null, panesArray[index + 1]?.opts.id.current ?? null];
}
//#endregion
//#region node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
//#endregion
//#region node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber((update) => {
			const cleanupFocusIn = on(window, "focusin", update);
			const cleanupFocusOut = on(window, "focusout", update);
			return () => {
				cleanupFocusIn();
				cleanupFocusOut();
			};
		});
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement(this.#document);
	}
};
new ActiveElement();
//#endregion
//#region node_modules/runed/dist/utilities/watch/watch.svelte.js
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
function watchOnce(source, effect) {}
function watchOncePre(source, effect) {}
watchOnce.pre = watchOncePre;
//#endregion
//#region node_modules/runed/dist/utilities/context/context.js
var Context = class {
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
		if (context === void 0) throw new Error(`Context "${this.#name}" not found`);
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
		if (context === void 0) return fallback;
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
};
//#endregion
//#region node_modules/paneforge/dist/internal/utils/adjust-layout.js
/**
* Adjusts the layout of panes based on the delta of the resize handle.
* All units must be in percentages; pixel values should be pre-converted.
*
* Credit: https://github.com/bvaughn/react-resizable-panels
*/
function adjustLayoutByDelta({ delta, layout: prevLayout, paneConstraints: paneConstraintsArray, pivotIndices, trigger }) {
	if (areNumbersAlmostEqual(delta, 0)) return prevLayout;
	const nextLayout = [...prevLayout];
	const [firstPivotIndex, secondPivotIndex] = pivotIndices;
	let deltaApplied = 0;
	if (trigger === "keyboard") {
		{
			const index = delta < 0 ? secondPivotIndex : firstPivotIndex;
			const paneConstraints = paneConstraintsArray[index];
			assert(paneConstraints);
			if (paneConstraints.collapsible) {
				const prevSize = prevLayout[index];
				assert(prevSize != null);
				const paneConstraints = paneConstraintsArray[index];
				assert(paneConstraints);
				const { collapsedSize = 0, minSize = 0 } = paneConstraints;
				if (areNumbersAlmostEqual(prevSize, collapsedSize)) {
					const localDelta = minSize - prevSize;
					if (compareNumbersWithTolerance(localDelta, Math.abs(delta)) > 0) delta = delta < 0 ? 0 - localDelta : localDelta;
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
				const paneConstraints = paneConstraintsArray[index];
				assert(paneConstraints);
				const { collapsedSize = 0, minSize = 0 } = paneConstraints;
				if (areNumbersAlmostEqual(prevSize, minSize)) {
					const localDelta = prevSize - collapsedSize;
					if (compareNumbersWithTolerance(localDelta, Math.abs(delta)) > 0) delta = delta < 0 ? 0 - localDelta : localDelta;
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
			const delta = resizePane({
				paneConstraints: paneConstraintsArray,
				paneIndex: index,
				initialSize: 100
			}) - prevSize;
			maxAvailableDelta += delta;
			index += increment;
			if (index < 0 || index >= paneConstraintsArray.length) break;
		}
		const minAbsDelta = Math.min(Math.abs(delta), Math.abs(maxAvailableDelta));
		delta = delta < 0 ? 0 - minAbsDelta : minAbsDelta;
	}
	{
		let index = delta < 0 ? firstPivotIndex : secondPivotIndex;
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
				if (deltaApplied.toPrecision(3).localeCompare(Math.abs(delta).toPrecision(3), void 0, { numeric: true }) >= 0) break;
			}
			if (delta < 0) index--;
			else index++;
		}
	}
	if (areNumbersAlmostEqual(deltaApplied, 0)) return prevLayout;
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
			let index = delta < 0 ? secondPivotIndex : firstPivotIndex;
			while (index >= 0 && index < paneConstraintsArray.length) {
				const prevSize = nextLayout[index];
				assert(prevSize != null);
				const unsafeSize = prevSize + deltaRemaining;
				const safeSize = resizePane({
					paneConstraints: paneConstraintsArray,
					paneIndex: index,
					initialSize: unsafeSize
				});
				if (!areNumbersAlmostEqual(prevSize, safeSize)) {
					deltaRemaining -= safeSize - prevSize;
					nextLayout[index] = safeSize;
				}
				if (areNumbersAlmostEqual(deltaRemaining, 0)) break;
				delta > 0 ? index-- : index++;
			}
		}
	}
	if (!areNumbersAlmostEqual(nextLayout.reduce((total, size) => size + total, 0), 100)) return prevLayout;
	return nextLayout;
}
//#endregion
//#region node_modules/paneforge/dist/internal/utils/style.js
var currentState = null;
var element = null;
/**
* Returns the cursor style for a given cursor state.
*/
function getCursorStyle(state) {
	switch (state) {
		case "horizontal": return "ew-resize";
		case "horizontal-max": return "w-resize";
		case "horizontal-min": return "e-resize";
		case "vertical": return "ns-resize";
		case "vertical-max": return "n-resize";
		case "vertical-min": return "s-resize";
	}
}
/**
* Resets the global cursor style to the default.
*/
function resetGlobalCursorStyle() {
	if (element === null) return;
	document.head.removeChild(element);
	currentState = null;
	element = null;
}
/**
* Sets the global cursor style to the given state.
*/
function setGlobalCursorStyle(state, doc) {
	if (currentState === state) return;
	currentState = state;
	const style = getCursorStyle(state);
	if (element === null) {
		element = doc.createElement("style");
		doc.head.appendChild(element);
	}
	element.innerHTML = `*{cursor: ${style}!important;}`;
}
/**
* Computes the flexbox style for a pane given its layout and drag state.
*/
function computePaneFlexBoxStyle({ defaultSize, dragState, layout, panesArray, paneIndex, precision = 3 }) {
	const size = layout[paneIndex];
	let flexGrow;
	if (size == null) flexGrow = defaultSize ?? "1";
	else if (panesArray.length === 1) flexGrow = "1";
	else flexGrow = size.toPrecision(precision);
	return {
		flexBasis: 0,
		flexGrow,
		flexShrink: 1,
		overflow: "hidden",
		pointerEvents: dragState !== null ? "none" : void 0
	};
}
//#endregion
//#region node_modules/paneforge/dist/internal/utils/storage.js
/**
* Initializes the storage object with the appropriate getItem
*  and setItem functions depending on the environment (browser or not).
*/
function initializeStorage(storageObject) {
	try {
		if (typeof localStorage === "undefined") throw new TypeError("localStorage is not supported in this environment");
		storageObject.getItem = (name) => localStorage.getItem(name);
		storageObject.setItem = (name, value) => localStorage.setItem(name, value);
	} catch (err) {
		console.error(err);
		storageObject.getItem = () => null;
		storageObject.setItem = () => {};
	}
}
/**
* Returns the key to use for storing the pane group state in local storage.
*/
function getPaneGroupKey(autoSaveId) {
	return `paneforge:${autoSaveId}`;
}
/**
* Returns a key to use for storing the pane state in local storage.
* The key is based on the pane order and constraints.
*/
function getPaneKey(panes) {
	return panes.map((pane) => {
		return pane.opts.order.current ? `${pane.opts.order.current}:${JSON.stringify(pane.constraints)}` : JSON.stringify(pane.constraints);
	}).sort().join(",");
}
/**
* Loads the serialized pane group state from local storage.
* If the state is not found, returns null.
*/
function loadSerializedPaneGroupState(autoSaveId, storage) {
	try {
		const paneGroupKey = getPaneGroupKey(autoSaveId);
		const serialized = storage.getItem(paneGroupKey);
		const parsed = JSON.parse(serialized || "");
		if (typeof parsed === "object" && parsed !== null) return parsed;
	} catch {}
	return null;
}
/**
* Loads the pane group state from local storage.
* If the state is not found, returns null.
*/
function loadPaneGroupState(autoSaveId, panesArray, storage) {
	return (loadSerializedPaneGroupState(autoSaveId, storage) || {})[getPaneKey(panesArray)] || null;
}
/**
* Saves the pane group state to local storage.
*/
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
var debounceMap = {};
/**
* Returns a debounced version of the given function.
*/
function debounce(callback, durationMs = 10) {
	let timeoutId = null;
	const callable = (...args) => {
		if (timeoutId !== null) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			callback(...args);
		}, durationMs);
	};
	return callable;
}
/**
* Updates the values in local storage based on the current state of
* the pane group.
* This function is debounced to limit the frequency of local storage writes.
*/
function updateStorageValues({ autoSaveId, layout, storage, panesArray, paneSizeBeforeCollapse }) {
	if (layout.length === 0 || layout.length !== panesArray.length) return;
	let debouncedSave = debounceMap[autoSaveId];
	if (debouncedSave == null) {
		debouncedSave = debounce(savePaneGroupState, 100);
		debounceMap[autoSaveId] = debouncedSave;
	}
	const clonedPanesArray = [...panesArray];
	const clonedPaneSizesBeforeCollapse = new Map(paneSizeBeforeCollapse);
	debouncedSave(autoSaveId, clonedPanesArray, clonedPaneSizesBeforeCollapse, layout, storage);
}
//#endregion
//#region node_modules/paneforge/dist/paneforge.svelte.js
var defaultStorage = {
	getItem: (name) => {
		initializeStorage(defaultStorage);
		return defaultStorage.getItem(name);
	},
	setItem: (name, value) => {
		initializeStorage(defaultStorage);
		defaultStorage.setItem(name, value);
	}
};
var PaneGroupContext = new Context("PaneGroup");
var PaneGroupState = class PaneGroupState {
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
		watch([
			() => this.opts.id.current,
			() => this.layout,
			() => this.panesArray
		], () => {
			return updateResizeHandleAriaValues({
				groupId: this.opts.id.current,
				layout: this.layout,
				panesArray: this.panesArray,
				domContext: this.domContext
			});
		});
		watch([
			() => this.opts.autoSaveId.current,
			() => this.layout,
			() => this.opts.storage.current
		], () => {
			if (!this.opts.autoSaveId.current) return;
			updateStorageValues({
				autoSaveId: this.opts.autoSaveId.current,
				layout: this.layout,
				storage: this.opts.storage.current,
				panesArray: this.panesArray,
				paneSizeBeforeCollapse: this.paneSizeBeforeCollapseMap
			});
		});
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
			if (unsafeLayout == null) unsafeLayout = getUnsafeDefaultLayout({ panesArray: this.panesArray });
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
			const pivotIndices = getPivotIndices({
				groupId,
				dragHandleId,
				domContext: this.domContext
			});
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
			if (doc.dir === "rtl" && isHorizontal) delta = -delta;
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
				if (this.prevDelta !== delta) {
					this.prevDelta = delta;
					if (!layoutChanged) if (isHorizontal) setGlobalCursorStyle(delta < 0 ? "horizontal-min" : "horizontal-max", doc);
					else setGlobalCursorStyle(delta < 0 ? "vertical-min" : "vertical-max", doc);
					else setGlobalCursorStyle(isHorizontal ? "horizontal" : "vertical", doc);
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
		const nextLayout = adjustLayoutByDelta({
			delta: findPaneDataIndex(panesArray, paneState) === panesArray.length - 1 ? paneSize - unsafePaneSize : unsafePaneSize - paneSize,
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
		const nextLayout = adjustLayoutByDelta({
			delta: findPaneDataIndex(paneDataArray, pane) === paneDataArray.length - 1 ? paneSize - baseSize : baseSize - paneSize,
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
		const nextLayout = adjustLayoutByDelta({
			delta: findPaneDataIndex(paneDataArray, pane) === paneDataArray.length - 1 ? paneSize - collapsedSize : collapsedSize - paneSize,
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
		return computePaneFlexBoxStyle({
			defaultSize,
			dragState,
			layout,
			panesArray: paneDataArray,
			paneIndex: findPaneDataIndex(paneDataArray, pane)
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
			if (orderA == null && orderB == null) return 0;
			else if (orderA == null) return -1;
			else if (orderB == null) return 1;
			else return orderA - orderB;
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
				const paneDataArray = this.panesArray;
				const index = paneDataArray.findIndex((paneData) => paneData.opts.id.current === idBefore);
				if (index < 0) return;
				const paneData = paneDataArray[index];
				assert(paneData);
				const layout = this.layout;
				const size = layout[index];
				const { collapsedSize = 0, collapsible, minSize = 0 } = paneData.constraints;
				if (!(size != null && collapsible)) return;
				const nextLayout = adjustLayoutByDelta({
					delta: areNumbersAlmostEqual(size, collapsedSize) ? minSize - size : collapsedSize - size,
					layout,
					paneConstraints: paneDataArray.map((paneData) => paneData.constraints),
					pivotIndices: getPivotIndices({
						groupId,
						dragHandleId: handleId,
						domContext: this.domContext
					}),
					trigger: "keyboard"
				});
				if (layout !== nextLayout) this.layout = nextLayout;
			};
			const unsubListener = addEventListener$1(handle, "keydown", onKeydown);
			return () => {
				unsubListener();
			};
		});
		return () => {
			for (const unsub of unsubHandlers) unsub();
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
};
var resizeKeys = [
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"ArrowUp",
	"End",
	"Home"
];
var PaneResizerState = class PaneResizerState {
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
		if (e.shiftKey) if (index > 0) nextIndex = index - 1;
		else nextIndex = handles.length - 1;
		else if (index + 1 < handles.length) nextIndex = index + 1;
		else nextIndex = 0;
		handles[nextIndex].focus();
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
};
var PaneState = class PaneState {
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
				const element = this.opts.ref.current;
				if (!(getComputedStyle(element).transitionDuration !== "0s")) {
					this.#paneTransitionState = "";
					return;
				}
				const handleTransitionEnd = (event) => {
					if (event.propertyName === "flex-grow") {
						this.#paneTransitionState = "";
						element.removeEventListener("transitionend", handleTransitionEnd);
					}
				};
				element.addEventListener("transitionend", handleTransitionEnd);
			} else this.#paneTransitionState = "";
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
};
//#endregion
//#region node_modules/paneforge/dist/components/pane-group.svelte
function Pane_group($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { autoSaveId = null, direction, id = uid, keyboardResizeBy = null, onLayoutChange = noop, storage = defaultStorage, ref = null, child, children, $$slots, $$events, ...restProps } = $$props;
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
		const mergedProps = derived(() => mergeProps(restProps, paneGroupState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			ref,
			getLayout,
			setLayout,
			getId
		});
	});
}
//#endregion
//#region node_modules/paneforge/dist/components/pane.svelte
function Pane($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = uid, ref = null, collapsedSize, collapsible, defaultSize, maxSize, minSize, onCollapse = noop, onExpand = noop, onResize = noop, order, child, children, $$slots, $$events, ...restProps } = $$props;
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
		const mergedProps = derived(() => mergeProps(restProps, paneState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
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
//#endregion
//#region node_modules/paneforge/dist/components/pane-resizer.svelte
function Pane_resizer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = uid, ref = null, disabled = false, onDraggingChange = noop, tabindex = 0, child, children, $$slots, $$events, ...restProps } = $$props;
		const resizerState = PaneResizerState.create({
			id: box.with(() => id),
			ref: box.with(() => ref, (v) => ref = v),
			disabled: box.with(() => disabled),
			onDraggingChange: box.with(() => onDraggingChange),
			tabIndex: box.with(() => tabindex)
		});
		const mergedProps = derived(() => mergeProps(restProps, resizerState.props));
		if (child) {
			$$renderer.push("<!--[0-->");
			child($$renderer, { props: mergedProps() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attributes({ ...mergedProps() })}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref });
	});
}
//#endregion
//#region src/lib/utils/Shortcuts.svelte
function Shortcuts($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { callbacks } = $$props;
	});
}
//#endregion
//#region src/lib/utils/clipboard.js
var Clipboard = class {
	last = void 0;
	get() {
		if (electron) return electron.clipboard.get().then((resp) => this.last = resp);
		else return this.last;
	}
	set(value) {
		this.last = value;
		if (electron) return electron.clipboard.set(value);
	}
};
//#endregion
//#region src/routes/builder/globals.svelte.js
var current = {
	user: void 0,
	file: void 0,
	project: void 0,
	experiment: new Experiment(),
	readme: {
		shown: false,
		script: new Script("readme.md")
	},
	tip: { shown: false },
	routine: void 0,
	moving: void 0,
	inserting: void 0,
	clipboard: new Clipboard()
};
//#endregion
//#region src/lib/utils/menu/Item.svelte
function Item($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { label, icon = void 0, shortcut = void 0, onclick = (evt, data) => {}, data = {}, close = true, disabled = void 0, submenu = void 0 } = $$props;
		getContext("closeMenu");
		let keyLabels = {
			CONTROL: "CTRL",
			META: "CMD"
		};
		$$renderer.push(`<button class="menu-item svelte-afwc6o"${attr("disabled", disabled, true)}>`);
		Icon($$renderer, {
			src: icon,
			size: "1rem"
		});
		$$renderer.push(`<!----> <span class="label svelte-afwc6o">${escape_html(label)}</span> <span class="shortcut svelte-afwc6o">`);
		if (shortcut in prefs.shortcuts) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`${escape_html(prefs.shortcuts[shortcut].val.map((item) => keyLabels[item] || item).join("+"))}`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></span> `);
		submenu?.($$renderer);
		$$renderer.push(`<!----></button>`);
		bind_props($$props, { disabled });
	});
}
//#endregion
//#region src/lib/utils/menu/Separator.svelte
function Separator($$renderer) {
	$$renderer.push(`<div class="menu-separator"><hr class="svelte-q0v1rm"/></div>`);
}
//#endregion
//#region src/lib/utils/menu/SubMenu.svelte
function SubMenu($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { label, icon = void 0, data = {}, disabled = void 0, children } = $$props;
		let shown = void 0;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function submenu($$renderer) {
					Icon($$renderer, {
						src: "/icons/sym-arrow-right.svg",
						size: ".5rem"
					});
					$$renderer.push(`<!----> `);
					Menu($$renderer, {
						get shown() {
							return shown;
						},
						set shown($$value) {
							shown = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							$$renderer.push(`<div class="menu svelte-w8cfbk">`);
							children($$renderer);
							$$renderer.push(`<!----></div>`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				}
				Item($$renderer, {
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
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { disabled });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/SingleLineCtrl.svelte
function SingleLineCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, codeIndicator = param.isCodeType, $$slots, $$events, ...attachments } = $$props;
		if (codeIndicator) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="code-indicator svelte-jguuf1">$</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <input${attributes({
			class: "param-text-input-single",
			type: "text",
			value: param.val,
			disabled,
			...attachments
		}, "svelte-jguuf1", {
			valid: param.valid.value,
			code: param.isCode
		}, void 0, 4)}/>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/MultiLineCtrl.svelte
function MultiLineCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, codeIndicator = param.isCodeType, $$slots, $$events, ...attachments } = $$props;
		if (codeIndicator) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="code-indicator svelte-pgnrou">$</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <textarea${attributes({
			class: "param-text-input-multi",
			disabled,
			...attachments
		}, "svelte-pgnrou", {
			valid: param.valid.value,
			code: param.isCode
		})}>`);
		const $$body = escape_html(param.val);
		if ($$body) $$renderer.push(`${$$body}`);
		else $$renderer.push(`
`);
		$$renderer.push(`</textarea>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/NameCtrl.svelte
function NameCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		getContext("current");
		SingleLineCtrl($$renderer, spread_props([{
			param,
			checkCode: (param) => false,
			codeIndicator: false,
			disabled
		}, attachments]));
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/BoolCtrl.svelte
function BoolCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false } = $$props;
		$$renderer.push(`<input class="param-bool-input svelte-1mhik0b" type="checkbox"${attr("checked", param.val, true)}${attr("disabled", disabled, true)}/>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/utils.js
/**
* Iterate a name by +1 (e.g. "field_1" becomes "field_2")
* 
* @param name Name to be iterated
*/
function iterateName(name) {
	if (name.match(/\d+$/)) return name.replace(/(\d+$)/, (num) => String(parseInt(num) + 1));
	else return name + "_1";
}
/**
* Get param options from Python using a query string (will try calling first, then will get if 
* that fails)
* 
* @param {string} query Query string to send to Python (including the python:/// prefix)
*/
async function optionsFromPython(query) {
	let options = [];
	if (!python$1?.ready) return options;
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
/**
* Get an object mapping options from a parameter
* 
* @param param Param to get options for
*/
async function optionsFromParam(param) {
	let output = [];
	if (typeof param.allowedVals === "string" && param.allowedVals.startsWith("python:///")) try {
		param.allowedVals = await optionsFromPython(param.allowedVals);
	} catch (err) {
		console.log(`Failed to get allowedVals for param ${param.name} (${param.allowedVals}, ${err})`);
		param.allowedVals = [];
	}
	if (typeof param.allowedLabels === "string" && param.allowedLabels.startsWith("python:///")) try {
		param.allowedVals = await optionsFromPython(param.allowedLabels);
	} catch (err) {
		console.log(`Failed to get allowedVals for param ${param.name} (${param.allowedVals}, ${err})`);
		param.allowedVals = [];
	}
	if (param.allowedLabels === void 0 || param.allowedLabels.length == 0) param.allowedLabels = param.allowedVals;
	if (param.allowedVals === void 0 || param.allowedVals.length == 0) param.allowedVals = param.allowedLabels;
	if (!param.allowedVals && !param.allowedLabels) return output;
	for (let i in param.allowedVals) output.push([param.allowedVals[i], param.allowedLabels[i]]);
	if (Array.isArray(param.val)) for (let item of param.val.filter((item) => !output.some((value) => value[0] === item))) output.push([item, item]);
	else if (!output.some((value) => value[0] === param.val)) output.push([param.val, param.val]);
	return output;
}
function mimeTypesFromParam(param) {
	let types = [];
	if (Array.isArray(param.allowedVals) && Array.isArray(param.allowedLabels) && param.allowedVals.length === param.allowedLabels.length) for (let i in param.allowedVals) types.push({
		description: param.allowedLabels[i],
		accept: param.allowedVals[i]
	});
	return types;
}
//#endregion
//#region src/lib/paramCtrls/ctrls/ChoiceCtrl.svelte
function ChoiceCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		$$renderer.select({
			class: "param-choice-input",
			disabled: disabled || param.allowedVals.length == 1 && param.allowedVals.includes(param.val),
			value: param.val,
			...attachments
		}, ($$renderer) => {
			await_block($$renderer, optionsFromParam(param), () => {
				$$renderer.option({}, ($$renderer) => {
					$$renderer.push(`Loading...`);
				});
			}, (options) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(options);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let [val, label] = each_array[$$index];
					$$renderer.option({
						value: val,
						selected: param.val === val
					}, ($$renderer) => {
						$$renderer.push(`${escape_html(label)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`<!--]-->`);
		}, "svelte-1upzpr2", void 0, { color: param.valid.value ? "inherit" : "var(--red)" });
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/VersionCtrl.svelte
function VersionCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let options = derived(async () => {
			let versions = (await (await fetch(`https://api.github.com/repos/${param.allowedVals}/tags`, { method: "GET" })).json()).map((ver) => new Version(ver.name)).toSorted((a, b) => a.olderThan(b) ? 1 : -1);
			options({});
			for (let ver of versions) {
				if (!(ver.format("minor") in options())) options()[ver.format("minor")] = [];
				options()[ver.format("minor")].push([ver.format(), ver.format()]);
			}
		});
		$$renderer.select({
			class: "param-version-input",
			disabled: disabled || param.allowedVals.length == 1,
			value: param.val,
			...attachments
		}, ($$renderer) => {
			await_block($$renderer, options(), () => {
				$$renderer.option({ value: "" }, ($$renderer) => {
					$$renderer.push(`Fetching versions from GitHub...`);
				});
			}, (options) => {
				$$renderer.option({ value: "" }, ($$renderer) => {
					$$renderer.push(`latest`);
				});
				$$renderer.push(` <!--[-->`);
				const each_array = ensure_array_like(Object.entries(options));
				for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
					let [minor, versions] = each_array[$$index_1];
					$$renderer.push(`<optgroup${attr("label", minor)}>`);
					$$renderer.option({
						value: `${minor}.*`,
						selected: param.val === `${minor}.*`
					}, ($$renderer) => {
						$$renderer.push(`${escape_html(minor)} (final)`);
					});
					$$renderer.push(` <!--[-->`);
					const each_array_1 = ensure_array_like(versions);
					for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
						let [version, label] = each_array_1[$$index];
						$$renderer.option({
							value: version,
							selected: param.val === version
						}, ($$renderer) => {
							$$renderer.push(`${escape_html(label)}`);
						});
					}
					$$renderer.push(`<!--]--></optgroup>`);
				}
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`<!--]-->`);
		}, "svelte-sh186d", void 0, { color: param.valid.value ? "inherit" : "var(--red)" });
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/FileCtrl.svelte
function FileCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, valid = void 0, $$slots, $$events, ...attachments } = $$props;
		let current = getContext("current");
		async function getFile(evt) {
			let file = await browseFileOpen(mimeTypesFromParam(param), current.experiment?.file?.parent);
			if (file) if (current.experiment?.file?.parent) param.val = file.file.replace(current.experiment.file.parent, "").replace(/^\//, "");
			else param.val = file.file;
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			SingleLineCtrl($$renderer, spread_props([
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
			$$renderer.push(`<!----> `);
			CompactButton($$renderer, {
				icon: "/icons/btn-open.svg",
				tooltip: "Browse for file...",
				onclick: getFile,
				disabled
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			param,
			valid
		});
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/DictCtrl.svelte
function DictCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let entries = derived(() => {
			let entries = [];
			for (let [key, val] of Object.entries(param.val)) {
				entries[key] = new Param(`${key}:value`);
				entries[key].val = val;
				entries[key].valType = "code";
			}
			return Object.entries(entries);
		});
		$$renderer.push(`<div${attributes({
			class: "dict-ctrl-layout",
			...attachments
		}, "svelte-1xfs9n3")}><!--[-->`);
		const each_array = ensure_array_like(entries());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let [label, value] = each_array[$$index];
			$$renderer.push(`<input${attr("value", (() => label)())}${attr("disabled", disabled, true)}/> <span class="dict-ctrl-label svelte-1xfs9n3">:</span> `);
			SingleLineCtrl($$renderer, {
				param: value,
				codeIndicator: false,
				disabled
			});
			$$renderer.push(`<!----> `);
			CompactButton($$renderer, {
				icon: "/icons/btn-delete.svg",
				onclick: (evt) => {
					delete param.val[label];
				},
				disabled,
				tooltip: "Remove item"
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--> <div class="gap"></div> <div class="gap"></div> <div class="gap"></div> `);
		CompactButton($$renderer, {
			icon: "/icons/btn-add.svg",
			onclick: (evt) => {
				let key = "field";
				while (key in param.val) key = iterateName(key);
				param.val[key] = "";
			},
			tooltip: "Add item",
			disabled
		});
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/MultipleChoiceCtrl.svelte
function MultipleChoiceCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		$$renderer.push(`<div${attributes({
			class: "param-multi-choice-input",
			...attachments
		}, "svelte-knio7e", void 0, { color: param.valid.value ? "inherit" : "var(--red)" })}>`);
		await_block($$renderer, optionsFromParam(param), () => {
			$$renderer.push(`Loading...`);
		}, (options) => {
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(options);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [val, label] = each_array[$$index];
				$$renderer.push(`<input type="checkbox"${attr("checked", (() => param.val.includes(val))(), true)}${attr("disabled", disabled, true)}/> ${escape_html(label)}`);
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/FileListCtrl.svelte
function FileListCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let items = derived(() => {
			let items = [];
			for (let [i, val] of Object.entries(param.val)) {
				let item = new Param(`${param.name}:${i}`);
				item.val = val;
				item.valType = "str";
				items.push(item);
			}
			return items;
		});
		$$renderer.push(`<div${attributes({
			class: "list-ctrl-layout",
			...attachments
		}, "svelte-23pe19")}><!--[-->`);
		const each_array = ensure_array_like(Object.entries(items()));
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let [i, item] = each_array[$$index];
			FileCtrl($$renderer, {
				param: item,
				disabled
			});
			$$renderer.push(`<!----> `);
			CompactButton($$renderer, {
				icon: "/icons/btn-delete.svg",
				onclick: (evt) => {
					param.val.splice(i, 1);
				},
				disabled,
				tooltip: "Remove item"
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--> <div class="gap"></div> `);
		CompactButton($$renderer, {
			icon: "/icons/btn-add-many.svg",
			onclick: async (evt) => {
				let types = mimeTypesFromParam(param);
				let handles = await window.showOpenFilePicker({
					types,
					multiple: true
				});
				for (let handle of handles) {
					let file = await handle.getFile();
					param.val.push(file.name);
				}
			},
			tooltip: "Add multiple items",
			disabled
		});
		$$renderer.push(`<!----> `);
		CompactButton($$renderer, {
			icon: "/icons/btn-add.svg",
			onclick: (evt) => {
				param.val.push("");
			},
			tooltip: "Add item",
			disabled
		});
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/TableCtrl.svelte
function TableCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let current = getContext("current");
		let showPrompt = false;
		function openTable() {
			electron.files.openPath(current.experiment.relativePath(param.val));
		}
		function newTable() {
			showPrompt = true;
			if (param?.ctrlParams?.template) electron.files.openPath(param.ctrlParams.template).then((resp) => console.log(resp, param.ctrlParams.template));
			else python$1.liaison.send("app", {
				command: "run",
				args: ["psychopy.experiment.utils:getBlankTemplate"]
			}, 1e3).then((resp) => electron.files.openPath(resp));
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			FileCtrl($$renderer, spread_props([{
				param,
				disabled
			}, attachments]));
			$$renderer.push(`<!----> `);
			if (electron) {
				$$renderer.push("<!--[0-->");
				CompactButton($$renderer, {
					icon: `/icons/btn-${param.val ? "" : "new-"}table.svg`,
					tooltip: `${param.val ? "Open" : "Create"} table`,
					onclick: param.val ? openTable : newTable,
					disabled: disabled || param.isCode
				});
				$$renderer.push(`<!----> `);
				MessageDialog($$renderer, {
					title: "Reminder...",
					buttons: { OK: (evt) => {} },
					get shown() {
						return showPrompt;
					},
					set shown($$value) {
						showPrompt = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						$$renderer.push(`<p>Once you have created and saved your table, please remember to add it.</p>`);
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
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/utils/tooltip/Info.svelte
function Info($$renderer, $$props) {
	let { children } = $$props;
	$$renderer.push(`<div class="info svelte-1ho5yrp" role="none"${attr_style("", { opacity: .25 })}>`);
	Icon($$renderer, { src: "/icons/sym-info.svg" });
	$$renderer.push(`<!----> `);
	$$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></div>`);
}
//#endregion
//#region src/lib/paramCtrls/ctrls/ConditionsCtrl.svelte
function ConditionsCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		$$renderer.push(`<div class="wrapper svelte-6ybxcp">`);
		TableCtrl($$renderer, spread_props([{
			param,
			disabled
		}, attachments]));
		$$renderer.push(`<!----> <div class="output svelte-6ybxcp">`);
		if (param.val) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, python$1.liaison.send("app", {
				command: "run",
				args: ["psychopy.data.utils:importConditions"],
				kwargs: {
					fileName: current.experiment.relativePath(param.val),
					returnFieldNames: true
				}
			}), () => {
				$$renderer.push(`Loading...`);
			}, (conditions) => {
				if (conditions) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`${escape_html(conditions[0].length)} conditions, with ${escape_html(conditions[1].length)} parameters `);
					Info($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<div class="more-info svelte-6ybxcp">${escape_html(conditions[1].join(", "))}</div>`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			});
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/dialogs/deviceManager/DeviceProfile.svelte
function DeviceProfile($$renderer, $$props) {
	let { profile } = $$props;
	$$renderer.push(`<table class="device-profile svelte-iajvsi">`);
	if (profile) {
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<tbody><!--[-->`);
		const each_array = ensure_array_like(Object.entries(profile));
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let [key, val] = each_array[$$index];
			$$renderer.push(`<tr><th class="key svelte-iajvsi">${escape_html(key)}</th><td class="value svelte-iajvsi">${escape_html(val)}</td></tr>`);
		}
		$$renderer.push(`<!--]--></tbody>`);
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--></table>`);
}
//#endregion
//#region src/lib/dialogs/deviceManager/DeviceDetails.svelte
function DeviceDetails($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { device } = $$props;
		$$renderer.push(`<div class="device-details-pnl svelte-1nwj607">`);
		Notebook_1($$renderer, { element: device });
		$$renderer.push(`<!----> `);
		DeviceProfile($$renderer, { profile: device.profile });
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
//#region src/lib/utils/notebook/Notebook.svelte
function Notebook($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { onselect = (index, data) => {}, children = void 0 } = $$props;
		let pages = {
			selected: {
				index: void 0,
				data: void 0,
				page: void 0
			},
			book: "notebook",
			all: []
		};
		setContext("siblings", pages);
		$$renderer.push(`<div class="notebook svelte-1lc7bh8"><div class="notebook-tabs svelte-1lc7bh8">`);
		children?.($$renderer);
		$$renderer.push(`<!----></div> <div class="notebook-page svelte-1lc7bh8">`);
		pages.selected.page?.($$renderer);
		$$renderer.push(`<!----></div></div>`);
	});
}
//#endregion
//#region src/lib/utils/notebook/Listbook.svelte
function Listbook($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { onselect = (index, data) => {}, children = void 0 } = $$props;
		let pages = {
			selected: {
				index: void 0,
				data: void 0,
				page: void 0
			},
			book: "listbook",
			all: []
		};
		setContext("siblings", pages);
		$$renderer.push(`<div class="listbook svelte-g709u4"><div class="listbook-tabs svelte-g709u4">`);
		children?.($$renderer);
		$$renderer.push(`<!----></div> <div class="listbook-page svelte-g709u4">`);
		pages.selected.page?.($$renderer);
		$$renderer.push(`<!----></div></div>`);
	});
}
//#endregion
//#region src/lib/utils/notebook/Page.svelte
function Page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { label = void 0, icon = void 0, selected = void 0, close = void 0, closeTooltip = void 0, data = {}, children = void 0, contextMenu = void 0 } = $$props;
		let siblings = getContext("siblings");
		let handle;
		onDestroy(() => {
			if (siblings.all[siblings.all.indexOf(handle)] !== void 0) delete siblings.all[siblings.all.indexOf(handle)];
		});
		let closeHovered = false;
		let contextMenuParams = {
			pos: {
				x: void 0,
				y: void 0
			},
			show: false
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Menu($$renderer, {
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
				children: ($$renderer) => {
					contextMenu?.($$renderer);
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> <button${attr_class("notebook-tab svelte-1qcrcnu", void 0, {
				"current": selected,
				"listbook": siblings.book === "listbook",
				"notebook": siblings.book === "notebook"
			})}>`);
			if (icon) {
				$$renderer.push("<!--[0-->");
				Icon($$renderer, { src: icon });
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<span class="label svelte-1qcrcnu">${escape_html(label)}</span>`);
			$$renderer.push(`<!--]--> `);
			if (close !== void 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="close-btn svelte-1qcrcnu" role="none">`);
				Icon($$renderer, {
					src: "/icons/sym-close.svg",
					size: ".75rem"
				});
				$$renderer.push(`<!----> `);
				if (closeTooltip) {
					$$renderer.push("<!--[0-->");
					Tooltip($$renderer, {
						position: "bottom",
						get shown() {
							return closeHovered;
						},
						set shown($$value) {
							closeHovered = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(closeTooltip)}`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			label,
			selected
		});
	});
}
//#endregion
//#region src/lib/utils/notebook/ButtonTab.svelte
function ButtonTab($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { callback, tooltip = void 0, label = "+", disabled = false } = $$props;
		let hovered = false;
		let siblings = getContext("siblings");
		siblings.buttons += 1;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<button${attr_class("add-btn svelte-1tfbihw", void 0, {
				"listbook": siblings.book === "listbook",
				"notebook": siblings.book === "notebook"
			})}${attr("disabled", disabled, true)}>${escape_html(label)} `);
			if (tooltip) {
				$$renderer.push("<!--[0-->");
				Tooltip($$renderer, {
					position: siblings.book === "listbook" ? "right" : "bottom",
					get shown() {
						return hovered;
					},
					set shown($$value) {
						hovered = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(tooltip)}`);
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button>`);
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
//#region src/lib/utils/tools/imports.js
/**
* Tools for working with Python import strings
*/
/**
* Make sure an import string is in a useable state. Namely:
* - In entry points format (module.submodule:Class.method) rather than flat import format (module.submodule.Class.method)
* 
* @param {string} value Import string to sanitize
*/
function sanitizeImportString(value) {
	if (!value.includes(":")) {
		let parts = value.split(".");
		value = parts.slice(0, -1).join(".") + ":" + parts.slice(-1);
	}
	return value;
}
//#endregion
//#region src/lib/dialogs/deviceManager/addDevice/DeviceListItem.svelte
function DeviceListItem($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { selection = void 0, device, backend } = $$props;
		onDestroy(() => {
			if (selection === device) selection = void 0;
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="device-list-item svelte-1vw0eko">`);
			RadioButton($$renderer, {
				label: device.deviceName,
				value: {
					device,
					backend
				},
				get selection() {
					return selection;
				},
				set selection($$value) {
					selection = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			Info($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<div class="details-panel svelte-1vw0eko">`);
					DeviceProfile($$renderer, { profile: device });
					$$renderer.push(`<!----></div>`);
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
		bind_props($$props, { selection });
	});
}
//#endregion
//#region src/lib/dialogs/deviceManager/addDevice/AddDeviceDialog.svelte
function AddDeviceDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
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
		let disableBtns = derived(() => ({ OK: !param.valid.value || !selection }));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				id: "add-device",
				title: "Add device...",
				onopen: (evt) => {
					param.val = "";
					selection = void 0;
					for (let key in panelsOpen) panelsOpen[key] = false;
				},
				buttons: {
					OK: (evt) => {
						devices[param.val] = new Device(selection.backend.__name__, selection.device);
						devices[param.val].params["name"].val = param.val;
					},
					CANCEL: (evt) => {}
				},
				buttonsDisabled: disableBtns(),
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="container svelte-1wktsbq">`);
					ParamCtrl($$renderer, {
						name: param.name,
						param
					});
					$$renderer.push(`<!----> <div class="label svelte-1wktsbq"${attr_style("", { "margin-bottom": "-.5rem" })}><span${attr_style("", { "flex-grow": 1 })}>Available devices</span> `);
					CompactButton($$renderer, {
						icon: "/icons/btn-refresh.svg",
						tooltip: "Refresh",
						onclick: refresh
					});
					$$renderer.push(`<!----></div> <div class="devices-list svelte-1wktsbq">`);
					await_block($$renderer, pending.devices, () => {
						$$renderer.push(`<div class="loading-msg svelte-1wktsbq">Getting device backends...</div>`);
					}, () => {
						if (profiles.devices) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like(Object.values(profiles.devices).filter((profile) => profile.device));
							for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
								let backend = each_array[$$index_1];
								await_block($$renderer, python$1.liaison.send("app", {
									command: "run",
									args: [`${sanitizeImportString(backend.device)}.getAvailableDevices`]
								}, timeout), () => {
									PanelButton($$renderer, {
										label: `Getting ${stringify(backend.label)} devices...`,
										open: false
									});
								}, (deviceProfiles) => {
									if (deviceProfiles.length) {
										$$renderer.push("<!--[0-->");
										PanelButton($$renderer, {
											label: backend.label,
											get open() {
												return panelsOpen[backend.__name__];
											},
											set open($$value) {
												panelsOpen[backend.__name__] = $$value;
												$$settled = false;
											},
											children: ($$renderer) => {
												$$renderer.push(`<div class="device-category svelte-1wktsbq"><!--[-->`);
												const each_array_1 = ensure_array_like(Object.values(deviceProfiles));
												for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
													let device = each_array_1[$$index];
													DeviceListItem($$renderer, {
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
												$$renderer.push(`<!--]--></div>`);
											},
											$$slots: { default: true }
										});
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]-->`);
								});
								$$renderer.push(`<!--]-->`);
							}
							$$renderer.push(`<!--]-->`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					});
					$$renderer.push(`<!--]--></div></div>`);
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
//#region src/lib/dialogs/deviceManager/Dialog.svelte
function Dialog_1$2($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0 } = $$props;
		function className(name) {
			return String(name).match(/(?<=\.)\w+$/)?.[0];
		}
		let currentDevice = void 0;
		let showAddDeviceDialog = false;
		let valid = derived(() => Object.values(devices).every((element) => Object.values(element.params).every((param) => param.valid.value)));
		let restore = {
			set: () => Object.values(devices).forEach((value) => value.restore.set()),
			apply: () => Object.values(devices).forEach((value) => value.restore.apply())
		};
		let btnsDisabled = derived(() => ({
			OK: !valid(),
			APPLY: !valid()
		}));
		async function saveDevices(evt) {
			if (!electron) return;
			let deviceData = {};
			for (let [key, device] of Object.entries(devices)) deviceData[key] = device.toJSON();
			let content = JSON.stringify(deviceData, null, 4);
			let path = await electron.paths.devices();
			await electron.files.save(path, content);
		}
		async function openDevicesFile(evt) {
			let file = await (await window.showOpenFilePicker({ types: [{
				description: "PsychoPy Devices",
				accept: { "application/json": [".json"] }
			}] }))[0].getFile();
			let deviceData = JSON.parse(await file.text());
			devicesFromJSON(deviceData);
			console.log(`Loaded devices from ${file.name}:`, deviceData);
		}
		async function saveDevicesFile(evt) {
			let content = {};
			for (let [key, device] of Object.entries(devices)) content[key] = device.toJSON();
			content = JSON.stringify(content, null, 4);
			let file = await (await window.showSaveFilePicker({
				types: [{
					description: "PsychoPy Devices",
					accept: { "application/json": [".json"] }
				}],
				suggestedName: "devices.json"
			})).createWritable();
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
				if (dev.tag === void 0 && dev.__class__) dev.tag = className(dev.__class__);
				devices[key] = new Device(dev.tag, dev.profile);
				devices[key].fromJSON(dev);
				devices[key].restore.set();
				if (currentDevice === void 0) currentDevice = devices[key];
			}
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
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
				buttonsDisabled: btnsDisabled(),
				onopen: restore.set,
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="container svelte-w1te7f">`);
					Listbook($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like(Object.entries(devices));
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let [key, device] = each_array[$$index];
								var bind_get = () => {
									return currentDevice === device;
								};
								var bind_set = (value) => {
									currentDevice = device;
								};
								Page($$renderer, {
									get selected() {
										return bind_get();
									},
									set selected($$value) {
										bind_set($$value);
									},
									label: device.name,
									data: device,
									close: (evt) => delete devices[key],
									children: ($$renderer) => {
										DeviceDetails($$renderer, { device });
									},
									$$slots: { default: true }
								});
							}
							$$renderer.push(`<!--]--> `);
							if (Object.keys(devices).length === 0) {
								$$renderer.push("<!--[0-->");
								Page($$renderer, {
									label: "",
									selected: true,
									children: ($$renderer) => {
										$$renderer.push(`<div class="placeholder-page svelte-w1te7f"><p>No devices have been setup.</p> <p>Click "Add device" to add a new device, or import devices from a .json file.</p></div>`);
									},
									$$slots: { default: true }
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (electron) {
								$$renderer.push("<!--[0-->");
								ButtonTab($$renderer, {
									callback: (evt) => showAddDeviceDialog = true,
									label: "+ Add device",
									tooltip: electron ? "Setup a currently connected device" : "Device setup not available in web-only",
									disabled: !electron
								});
								$$renderer.push(`<!----> `);
								AddDeviceDialog($$renderer, {
									get shown() {
										return showAddDeviceDialog;
									},
									set shown($$value) {
										showAddDeviceDialog = $$value;
										$$settled = false;
									}
								});
								$$renderer.push(`<!---->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							ButtonTab($$renderer, {
								callback: openDevicesFile,
								label: "⭱ Import devices",
								tooltip: "Import devices from a .json file"
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
//#region src/lib/paramCtrls/ctrls/DeviceCtrl.svelte
function DeviceCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let options = derived(() => {
			let output = [];
			for (let [name, device] of Object.entries(devices)) for (let target of param.allowedVals) if (String(target).endsWith(device.tag)) output.push(name);
			if (param.val !== "" && !output.includes(param.val)) output.push(snapshot(param.val));
			return output;
		});
		let showDialog = false;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.select({
				class: "param-device-input",
				disabled: disabled || options().length === 0,
				value: param.val,
				...attachments
			}, ($$renderer) => {
				$$renderer.option({
					value: "",
					selected: param.val === ""
				}, ($$renderer) => {
					$$renderer.push(`Default`);
				});
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(options());
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let option = each_array[$$index];
					$$renderer.option({
						value: option,
						selected: param.val === option
					}, ($$renderer) => {
						$$renderer.push(`${escape_html(option)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			}, "svelte-vskael", void 0, { color: param.valid.value ? "inherit" : "var(--red)" });
			$$renderer.push(` `);
			if (python$1?.ready) {
				$$renderer.push("<!--[0-->");
				CompactButton($$renderer, {
					icon: "/icons/btn-devices.svg",
					onclick: (evt) => showDialog = true
				});
				$$renderer.push(`<!----> `);
				Dialog_1$2($$renderer, {
					get shown() {
						return showDialog;
					},
					set shown($$value) {
						showDialog = $$value;
						$$settled = false;
					}
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
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/RichChoiceCtrl.svelte
function RichChoiceCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		$$renderer.push(`<div${attributes({
			class: "param-rich-choice-ctrl",
			...attachments
		}, "svelte-shlk5g")}>`);
		await_block($$renderer, optionsFromParam(param), () => {
			$$renderer.push(`Loading...`);
		}, (options) => {
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(options);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let [val, details] = each_array[$$index];
				$$renderer.push(`<button${attr_class("rich-ctrl-item svelte-shlk5g", void 0, { "selected": param.val === val })}><b>${escape_html(details.label)}</b> <p>${escape_html(details.body)}</p> `);
				if (details.link) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<a${attr("href", details.link)}>${escape_html(details.linkText)}</a>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></button>`);
			}
			$$renderer.push(`<!--]-->`);
		});
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/pavlovia/UserCtrl.svelte
function UserCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		DropdownButton($$renderer, {
			label: current.user ? current.user.profile.name : "No user",
			onclick: (evt) => {
				if (current.user) window.open(current.user.profile.web_url);
			},
			disabled: !current.user,
			children: ($$renderer) => {
				Item($$renderer, {
					label: "Edit user...",
					icon: "/icons/btn-edit.svg",
					onclick: (evt) => window.open("https://gitlab.pavlovia.org/-/profile", "_blank")
				});
				$$renderer.push(`<!----> `);
				SubMenu($$renderer, {
					label: "Switch user...",
					children: ($$renderer) => {
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(Object.values(users));
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let user = each_array[$$index];
							Item($$renderer, {
								label: user.profile.name,
								onclick: (evt) => login(user.profile.username).then((username) => current.user = users[username])
							});
						}
						$$renderer.push(`<!--]--> `);
						Separator($$renderer, {});
						$$renderer.push(`<!----> `);
						Item($$renderer, {
							label: "New user...",
							onclick: (evt) => login().then((username) => current.user = users[username])
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
				$$renderer.push(`<!----> `);
				Separator($$renderer, {});
				$$renderer.push(`<!----> `);
				if (current.user) {
					$$renderer.push("<!--[0-->");
					Item($$renderer, {
						label: "Logout",
						onclick: (evt) => {
							logout();
							current.user = void 0;
						}
					});
				} else {
					$$renderer.push("<!--[-1-->");
					Item($$renderer, {
						label: "Login",
						onclick: (evt) => {
							if (Object.keys(users).length > 0) {
								const lastUser = Object.keys(users)[0];
								login(lastUser).then((username) => current.user = users[username]);
							} else login().then((username) => current.user = users[username]);
						}
					});
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region src/lib/dialogs/projects/manage/Project.svelte
function Project($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { project } = $$props;
		$$renderer.push(`<div class="local-project svelte-u6bvaj"><div class="project-header svelte-u6bvaj"><h3 class="svelte-u6bvaj">${escape_html(project.id)}</h3> `);
		CompactButton($$renderer, {
			icon: "/icons/btn-delete.svg",
			onclick: (evt) => delete projects$1[project.id]
		});
		$$renderer.push(`<!----></div> <div>Local folder:</div> <input${attr("value", project.localRoot)}/></div>`);
	});
}
//#endregion
//#region src/lib/dialogs/projects/manage/ManageProjectsDlg.svelte
function ManageProjectsDlg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0 } = $$props;
		async function openProjectsFile(evt) {
			let file = await (await window.showOpenFilePicker({ types: [{
				description: "PsychoPy Projects",
				accept: { "application/json": [".json"] }
			}] }))[0].getFile();
			let data = JSON.parse(await file.text());
			projectsFromJSON(data);
			console.log(`Loaded devices from ${file.name}:`, data);
		}
		function projectsFromJSON(data) {
			Object.keys(projects$1).forEach((key) => delete projects$1[key]);
			for (let [key, proj] of Object.entries(data)) projects$1[key] = proj;
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				id: "manageProjects",
				title: "Local projects",
				buttons: { OK: (evt) => {} },
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="projects-list svelte-g2xi4q"><!--[-->`);
					const each_array = ensure_array_like(Object.values(projects$1));
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let profile = each_array[$$index];
						Project($$renderer, { project: profile });
					}
					$$renderer.push(`<!--]--> `);
					Button($$renderer, {
						label: "Import projects",
						onclick: openProjectsFile
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
//#region src/lib/pavlovia/NewProjectDlg.svelte
function NewProjectDlg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0, awaiting = void 0 } = $$props;
		let current = getContext("current");
		let details = {
			name: void 0,
			group: void 0,
			root: void 0
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				title: "New project",
				buttons: {
					OK: async (evt) => {
						await git$1.newProject(snapshot(details), current.experiment.file.parent, snapshot(current.user));
						current.project = await findProject(current.experiment, current.user);
						awaiting.resolve(true);
					},
					CANCEL: (evt) => awaiting.resolve(false)
				},
				onopen: (evt) => {
					details.name = current.experiment.file.stem;
					details.group = current.user?.profile.username;
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
				children: ($$renderer) => {
					$$renderer.push(`<div class="content svelte-17tp8bm"><div class="ctrl svelte-17tp8bm">pavlovia.org / `);
					$$renderer.select({
						value: details.group,
						style: ""
					}, ($$renderer) => {
						$$renderer.option({ value: current.user.profile.username }, ($$renderer) => {
							$$renderer.push(`${escape_html(current.user.profile.username)}`);
						});
						await_block($$renderer, fetch(`${auth.root}/api/v4/groups?access_token=${current.user.token.access}`), () => {}, (resp) => {
							await_block($$renderer, resp.json(), () => {}, (groups) => {
								$$renderer.push(`<!--[-->`);
								const each_array = ensure_array_like(groups);
								for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
									let group = each_array[$$index];
									$$renderer.option({ value: group.path }, ($$renderer) => {
										$$renderer.push(`${escape_html(group.path)}`);
									});
								}
								$$renderer.push(`<!--]-->`);
							});
							$$renderer.push(`<!--]-->`);
						});
						$$renderer.push(`<!--]-->`);
					}, void 0, void 0, { "flex-grow": "1" });
					$$renderer.push(` / <input${attr("value", details.name)}/></div></div>`);
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
//#region src/lib/pavlovia/ProjectCtrl.svelte
function ProjectCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let current = getContext("current");
		let show = {
			newProjectDlg: false,
			manageProjectsDlg: false
		};
		let awaiting = { newProjectDlg: Promise.withResolvers() };
		let label = derived(() => {
			if (current.project) if (current.project.owner?.username === current.user?.profile?.username) return current.project.path;
			else return `${current.project.namespace?.path}/${current.project.path}`;
			else return "No project";
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			DropdownButton($$renderer, {
				label: label(),
				onclick: (evt) => {
					if (current.project) window.open(current.project.web_url.replace("gitlab.pavlovia", "pavlovia"));
				},
				disabled: !current.project,
				children: ($$renderer) => {
					Item($$renderer, {
						label: "New project",
						icon: "/icons/btn-add.svg",
						onclick: (evt) => show.newProjectDlg = true,
						disabled: !current.user || !current.experiment?.file?.file
					});
					$$renderer.push(`<!----> `);
					Item($$renderer, {
						label: "Edit project",
						icon: "/icons/btn-edit.svg",
						onclick: (evt) => window.open(`${current.project.web_url}/edit`, "_blank"),
						disabled: !current.project
					});
					$$renderer.push(`<!----> `);
					Separator($$renderer, {});
					$$renderer.push(`<!----> `);
					Item($$renderer, {
						label: "Search projects...",
						icon: "/icons/btn-find.svg",
						onclick: (evt) => window.open("https://pavlovia.org/explore", "_blank")
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			ManageProjectsDlg($$renderer, {
				get shown() {
					return show.manageProjectsDlg;
				},
				set shown($$value) {
					show.manageProjectsDlg = $$value;
					$$settled = false;
				}
			});
			$$renderer.push(`<!----> `);
			NewProjectDlg($$renderer, {
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
//#region src/lib/utils/tools/random.js
/** 
* Generate a random integer in the given range
* 
* @param {number} min Minimum integer to return
* @param {number} max Maximum integer to return
*  
* @returns A random integer from the given range
*/
function randint(min, max) {
	return min + Math.floor(Math.random() * max);
}
/**
* Choose a random value from the given iterable
* 
* @param {string|array} arr Iterate (string or array) to choose from
*  
* @returns A random value from this iterable
*/
function randof(arr) {
	if (typeof arr === "string") return arr.charAt(randint(0, arr.length));
	else return arr[randint(0, arr.length)];
}
//#endregion
//#region src/lib/pavlovia/pavlovia.svelte.js
var users = {};
var auth = {
	root: "https://gitlab.pavlovia.org",
	client: "944b87ee0e6b4f510881d6f6bc082f64c7bba17d305efdb829e6e0e7ed466b34",
	state: "",
	challenge: "",
	verifier: "",
	code: void 0
};
/**
* Get the information for the current user as a catchable promise
*/
async function getUserInfo(token) {
	const resp = await fetch(`${auth.root}/api/v4/user?access_token=${token}`);
	if (resp.ok) return await resp.json();
	else throw new Error(resp.statusText || "Failed to get user info");
}
/**
* Uses the stored refresh token to refresh the stored access token
*/
async function refreshToken(username) {
	const resp = await fetch(`/api/token/refresh?${new URLSearchParams({
		root: auth.root,
		redirect: electron ? auth.root : window.location.href,
		client: auth.client,
		refresh: users[username].token.refresh,
		verifier: auth.verifier
	}).toString()}`, { method: "post" });
	if (!resp.ok) throw new Error(`Token refresh failed: ${resp.statusText}`);
	const data = await resp.json();
	if (data.access_token && data.refresh_token) {
		users[username].token.access = data.access_token;
		users[username].token.refresh = data.refresh_token;
		return data;
	} else throw new Error(data.message || "Token refresh failed");
}
async function login(username, current) {
	if (users[username]) if (users[username].token?.access) try {
		const profile = await getUserInfo(users[username].token.access);
		users[username].profile = profile;
	} catch (err) {
		try {
			await refreshToken(username);
			const profile = await getUserInfo(users[username].token.access);
			users[username].profile = profile;
		} catch (refreshErr) {
			delete users[username].token;
			return login(void 0, current);
		}
	}
	else return login(void 0, current);
	else {
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
			if (electron) auth.code = await electron.authenticatePavlovia(url);
			else {
				navigate(url);
				return;
			}
		}
		let tokens = await fetch(`/api/token/authorize?${new URLSearchParams({
			root: auth.root,
			redirect: electron ? auth.root : window.location.href,
			client: auth.client,
			code: auth.code,
			verifier: auth.verifier
		}).toString()}`, { method: "post" }).then((resp) => resp.json());
		if (tokens.error) throw new Error(`Token request failed: ${tokens.error}, ${tokens.error_description}`);
		auth.code = void 0;
		let profileResp = await fetch(`${auth.root}/api/v4/user?access_token=${tokens.access_token}`);
		if (!profileResp.ok) throw new Error(`Profile request failed: ${profileResp.statusText}`);
		let profile = await profileResp.json();
		username = profile.username;
		if (username) users[username] = {
			token: {
				access: tokens.access_token,
				refresh: tokens.refresh_token
			},
			profile
		};
		else throw new Error("Failed to login - no username returned");
	}
	if (electron) try {
		const file = await electron.paths.pavlovia.users();
		await electron.files.save(file, JSON.stringify(users, void 0, 4));
	} catch (err) {
		console.warn("Failed to save user data:", err);
	}
	return username;
}
function logout() {
	Object.assign(auth, {
		state: "",
		challenge: "",
		verifier: "",
		code: void 0
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/SurveyCtrl.svelte
function SurveyCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let current = getContext("current");
		let showSurveysDlg = void 0;
		let selected = { survey: void 0 };
		async function getSurveys() {
			return (await fetch("/api/surveys", { headers: current.user.token }).then((resp) => resp.json())).surveys;
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			SingleLineCtrl($$renderer, spread_props([{
				param,
				disabled
			}, attachments]));
			$$renderer.push(`<!----> `);
			CompactButton($$renderer, {
				icon: "/icons/btn-find.svg",
				tooltip: "Browse your projects on Pavlovia",
				onclick: (evt) => showSurveysDlg = true,
				disabled: disabled || current.user === void 0
			});
			$$renderer.push(`<!----> `);
			Dialog($$renderer, {
				id: "browse-surveys",
				title: "Pavlovia surveys",
				buttons: {
					OK: (evt) => param.val = selected.survey.surveyId,
					CANCEL: (evt) => {}
				},
				buttonsDisabled: { OK: selected.survey === void 0 },
				get shown() {
					return showSurveysDlg;
				},
				set shown($$value) {
					showSurveysDlg = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="container svelte-pclrlt"><p>Below are all of the surveys linked to your Pavlovia account - select the one you want and press OK to add its ID. You can view and manage your Pavlovia surveys <a href="https://pavlovia.org/dashboard?tab=4" target="_blank">here</a></p> <div class="choice-group svelte-pclrlt">`);
					await_block($$renderer, getSurveys(), () => {
						$$renderer.push(`Loading surveys...`);
					}, (surveys) => {
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(surveys);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let survey = each_array[$$index];
							RadioButton($$renderer, {
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
						$$renderer.push(`<!--]-->`);
					});
					$$renderer.push(`<!--]--></div></div>`);
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
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/CodeCtrl.svelte
function CodeCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let language = derived(() => param.allowedVals ? param.allowedVals : "python");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div${attributes({
				class: "param-code-input-multi",
				...attachments
			}, "svelte-vz1slc")}>`);
			CodeEditor($$renderer, {
				resize: "vertical",
				language: language(),
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
			$$renderer.push(`<!----></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/ValidatorCtrl.svelte
function ValidatorCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let current = getContext("current");
		let options = derived(() => {
			let output = [];
			for (let [name, rt] of Object.entries(current.experiment.routines)) if (param.allowedVals.includes(rt.tag)) output.push(name);
			return output;
		});
		$$renderer.select({
			class: "param-validator-input",
			disabled: disabled || options().length === 0,
			value: param.val,
			...attachments
		}, ($$renderer) => {
			$$renderer.option({
				value: "",
				selected: param.val === ""
			}, ($$renderer) => {
				$$renderer.push(`Do not validate`);
			});
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(options());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let option = each_array[$$index];
				$$renderer.option({
					value: option,
					selected: param.val === option
				}, ($$renderer) => {
					$$renderer.push(`${escape_html(option)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-1rn2v93", void 0, { color: param.valid.value ? "inherit" : "var(--red)" });
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/KeyPressCtrl.svelte
function KeyPressCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let selected = false;
		let hovered = false;
		$$renderer.push(`<div${attributes({
			class: "container",
			role: "none",
			...attachments
		}, "svelte-1thftq5", {
			selected,
			hovered
		}, { color: param.valid.value ? "inherit" : "var(--red)" })}>`);
		if (selected) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<input type="text"${attr("value", param.val.length ? param.val.join?.(" + ") : "Press keys, then click the tick to accept")} class="svelte-1thftq5"${attr_style("", { color: param.val.length ? "inherit" : "var(--outline)" })}/> `);
			CompactButton($$renderer, {
				onclick: (evt) => param.val.length = 0,
				icon: "/icons/btn-clear.svg",
				tooltip: "Clear keypresses"
			});
			$$renderer.push(`<!----> `);
			CompactButton($$renderer, {
				onclick: (evt) => selected = false,
				icon: "/icons/btn-tick.svg",
				tooltip: "Done",
				disabled: !param.valid.value
			});
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<input type="text"${attr("value", param.val.join?.(" + "))} class="svelte-1thftq5"${attr_style("", { color: "inherit" })}/>`);
		}
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/SoundCtrl.svelte
function SoundCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, valid = void 0, $$slots, $$events, ...attachments } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			FileCtrl($$renderer, spread_props([
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
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			param,
			valid
		});
	});
}
//#endregion
//#region src/lib/dialogs/fontManager/manager.svelte.js
var _FontManager = class {
	system = {
		label: "System",
		description: "Fonts which are installed to your computer",
		fonts: [],
		scanning: Promise.resolve(true),
		refresh: () => {
			this.system.fonts.length = 0;
			this.system.scanning = python.liaison.send("app", {
				command: "run",
				args: [`psychopy.tools.fontmanager:FontFinder.getSystemFonts`]
			}, 1e3).then((resp) => this.system.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
		}
	};
	packaged = {
		label: "Packaged",
		description: "Fonts which come packaged with PsychoPy",
		fonts: [],
		scanning: Promise.resolve(true),
		refresh: () => {
			this.packaged.fonts.length = 0;
			this.packaged.scanning = python.liaison.send("app", {
				command: "run",
				args: [`psychopy.tools.fontmanager:FontFinder.getPackagedFonts`]
			}, 1e3).then((resp) => this.packaged.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
		}
	};
	user = {
		label: "User",
		description: "Fonts saved to your PsychoPy user folder",
		fonts: [],
		scanning: Promise.resolve(true),
		refresh: () => {
			this.user.fonts.length = 0;
			this.user.scanning = python.liaison.send("app", {
				command: "run",
				args: [`psychopy.tools.fontmanager:FontFinder.getUserFonts`]
			}, 1e3).then((resp) => this.user.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
		},
		add: () => {}
	};
	experiment = {
		label: "Experiment",
		description: "Fonts in the current experiment folder",
		fonts: [],
		scanning: Promise.resolve(true),
		refresh: (experiment) => {
			this.experiment.fonts.length = 0;
			let folder = experiment.file.parent;
			if (folder) this.experiment.scanning = python.liaison.send("app", {
				command: "run",
				args: [
					`psychopy.tools.fontmanager:FontFinder.getFolderFonts`,
					[path.join(folder, "fonts"), path.join(folder, "assets", "fonts")],
					false
				]
			}, 1e3).then((resp) => this.experiment.fonts.push(...Object.keys(resp))).catch((err) => console.error(err));
		},
		add: (name) => {}
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
};
var FontManager = new _FontManager();
//#endregion
//#region src/lib/dialogs/fontManager/Dialog.svelte
function Dialog_1$1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, buttonsDisabled = {}, shown = void 0 } = $$props;
		let current = getContext("current");
		let restore = value;
		let searchTerm = "";
		let currentTab = void 0;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
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
				children: ($$renderer) => {
					$$renderer.push(`<div class="page svelte-ht5uro"><input type="search" class="search"${attr("value", searchTerm)}/> `);
					Notebook($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like([
								"system",
								"packaged",
								"user",
								"experiment"
							]);
							for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
								let source = each_array[$$index_1];
								var bind_get = () => currentTab === source;
								var bind_set = (value) => currentTab = source;
								Page($$renderer, {
									label: FontManager[source].label,
									get selected() {
										return bind_get();
									},
									set selected($$value) {
										bind_set($$value);
									},
									children: ($$renderer) => {
										$$renderer.push(`<div class="page svelte-ht5uro"><div class="info svelte-ht5uro">${escape_html(FontManager[source].description)}</div> <!--[-->`);
										const each_array_1 = ensure_array_like(FontManager[source].fonts.filter((name) => name.toLowerCase().replaceAll(" ", "").includes(searchTerm.toLowerCase().replaceAll(" ", ""))));
										for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
											let name = each_array_1[$$index];
											RadioButton($$renderer, {
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
										$$renderer.push(`<!--]--> `);
										if (FontManager[source].refresh) {
											$$renderer.push("<!--[0-->");
											Button($$renderer, {
												label: "Refresh",
												icon: "/icons/btn-refresh.svg",
												onclick: (evt) => FontManager[source].refresh(current.experiment),
												horizontal: true,
												get awaiting() {
													return FontManager[source].scanning;
												},
												set awaiting($$value) {
													FontManager[source].scanning = $$value;
													$$settled = false;
												}
											});
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--></div>`);
									},
									$$slots: { default: true }
								});
							}
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
		bind_props($$props, {
			value,
			shown
		});
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/FontCtrl.svelte
function FontCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		getContext("current");
		let show = { dialog: false };
		FontManager.all.refresh();
		derived(() => {
			let found = false;
			for (let name of FontManager.all.fonts) if (name.toLowerCase().replaceAll(" ", "") === String(param.val).toLowerCase().replaceAll(" ", "")) found = true;
			return found;
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			SingleLineCtrl($$renderer, spread_props([
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
			$$renderer.push(`<!----> `);
			if (python$1?.ready) {
				$$renderer.push("<!--[0-->");
				CompactButton($$renderer, {
					icon: "/icons/btn-case.svg",
					tooltip: "Open font manager",
					awaiting: FontManager.all.scanning,
					onclick: (evt) => show.dialog = true
				});
				$$renderer.push(`<!----> `);
				Dialog_1$1($$renderer, {
					buttonsDisabled: {
						OK: !param.valid,
						APPLY: !param.valid
					},
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
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/NamedColor.svelte
function NamedColor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
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
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="page svelte-13002nv"><div class="ctrl svelte-13002nv"><!--[-->`);
			const each_array = ensure_array_like(colorNames);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let color = each_array[$$index];
				$$renderer.push(`<div class="button-wrapper svelte-13002nv"${attr_style("", { "--responsive-color": color })}>`);
				RadioButton($$renderer, {
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
				$$renderer.push(`<!----></div>`);
			}
			$$renderer.push(`<!--]--></div> <div class="preview svelte-13002nv"${attr_style("", { "background-color": value })}></div></div>`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/HexColor.svelte
function HexColor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, target = "param" } = $$props;
		let rgb = [
			255,
			255,
			255
		];
		$$renderer.push(`<div class="page svelte-p941k7"><div class="ctrls svelte-p941k7"><div class="ctrl svelte-p941k7"><div class="label svelte-p941k7">Red</div> <input type="number"${attr("value", rgb[0])} min="0" max="255"/> <code class="output">= ${escape_html(new Uint8Array([rgb[0]]).toHex())}</code></div> <div class="ctrl svelte-p941k7"><div class="label svelte-p941k7">Green</div> <input type="number"${attr("value", rgb[1])} min="0" max="255"/> <code class="output">= ${escape_html(new Uint8Array([rgb[1]]).toHex())}</code></div> <div class="ctrl svelte-p941k7"><div class="label svelte-p941k7">Blue</div> <input type="number"${attr("value", rgb[2])} min="0" max="255"/> <code class="output">= ${escape_html(new Uint8Array([rgb[2]]).toHex())}</code></div></div> <div class="preview svelte-p941k7"${attr_style("", { "background-color": value })}></div></div>`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/RgbColor.svelte
function RgbColor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, target = "param" } = $$props;
		let rgb = [
			1,
			1,
			1
		];
		let preview = derived(() => rgb.map((val) => (val + 1) * 255 / 2));
		$$renderer.push(`<div class="page svelte-1n436jl"><div class="ctrls svelte-1n436jl"><div class="ctrl svelte-1n436jl"><div class="label svelte-1n436jl">Red</div> <input type="number"${attr("value", rgb[0])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-1n436jl"><div class="label svelte-1n436jl">Green</div> <input type="number"${attr("value", rgb[1])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-1n436jl"><div class="label svelte-1n436jl">Blue</div> <input type="number"${attr("value", rgb[2])}${attr("min", -1)} max="1" step="0.05"/></div></div> <div class="preview svelte-1n436jl"${attr_style("", { "background-color": `rgba(${stringify(preview())})` })}></div></div>`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/DklColor.svelte
function DklColor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, target = "param" } = $$props;
		let dkl = [
			90,
			0,
			1
		];
		let preview = derived(() => python$1.liaison.send("app", {
			command: "init",
			args: [
				"rgb",
				"psychopy.tools.colorspacetools:dkl2rgb",
				snapshot(dkl)
			]
		}, 1e3).then((name) => {
			return python$1.liaison.send("app", {
				command: "run",
				args: ["numpy:ndarray.tolist", `\$${name}`]
			}, 1e3).then((rgb) => rgb.map((val) => (val + 1) * 255 / 2));
		}));
		$$renderer.push(`<div class="page svelte-17g6qx"><div class="ctrls svelte-17g6qx"><div class="ctrl svelte-17g6qx"><div class="label svelte-17g6qx">Elevation</div> <input type="number"${attr("value", dkl[0])} min="0" max="360"/></div> <div class="ctrl svelte-17g6qx"><div class="label svelte-17g6qx">Azimuth</div> <input type="number"${attr("value", dkl[1])} min="0" max="360"/></div> <div class="ctrl svelte-17g6qx"><div class="label svelte-17g6qx">Contrast</div> <input type="number"${attr("value", dkl[2])}${attr("min", -1)} max="1" step="0.05"/></div></div> `);
		if (python$1?.ready) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, preview(), () => {
				$$renderer.push(`<div class="preview svelte-17g6qx"></div>`);
			}, (preview) => {
				$$renderer.push(`<div class="preview svelte-17g6qx"${attr_style("", { "background-color": `rgba(${stringify(preview)})` })}></div>`);
			});
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="preview svelte-17g6qx">DKL preview is not available in browser.</div>`);
		}
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/HsvColor.svelte
function HsvColor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, target = "param" } = $$props;
		let hsv = [
			0,
			1,
			.5
		];
		$$renderer.push(`<div class="page svelte-ptki7j"><div class="ctrls svelte-ptki7j"><div class="ctrl svelte-ptki7j"><div class="label svelte-ptki7j">Hue</div> <input type="number"${attr("value", hsv[0])} min="0" max="360"/></div> <div class="ctrl svelte-ptki7j"><div class="label svelte-ptki7j">Saturation</div> <input type="number"${attr("value", hsv[1])} min="0" max="100"/></div> <div class="ctrl svelte-ptki7j"><div class="label svelte-ptki7j">Value</div> <input type="number"${attr("value", hsv[2])} min="0" max="100"/></div></div> <div class="preview svelte-ptki7j"${attr_style("", { "background-color": `hsl(${stringify(hsv[0])}, ${stringify(hsv[1] * 100)}%, ${stringify(hsv[2] * 100)}%)` })}></div></div>`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/LmsColor.svelte
function LmsColor($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, target = "param" } = $$props;
		let lms = [
			1,
			1,
			1
		];
		let preview = derived(() => python$1.liaison.send("app", {
			command: "init",
			args: [
				"rgb",
				"psychopy.tools.colorspacetools:lms2rgb",
				snapshot(lms)
			]
		}, 1e3).then((name) => {
			return python$1.liaison.send("app", {
				command: "run",
				args: ["numpy:ndarray.tolist", `\$${name}`]
			}, 1e3).then((rgb) => rgb.map((val) => (val + 1) * 255 / 2));
		}));
		$$renderer.push(`<div class="page svelte-fokebo"><div class="ctrls svelte-fokebo"><div class="ctrl svelte-fokebo"><div class="label svelte-fokebo">Long</div> <input type="number"${attr("value", lms[0])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-fokebo"><div class="label svelte-fokebo">Medium</div> <input type="number"${attr("value", lms[1])}${attr("min", -1)} max="1" step="0.05"/></div> <div class="ctrl svelte-fokebo"><div class="label svelte-fokebo">Short</div> <input type="number"${attr("value", lms[2])}${attr("min", -1)} max="1" step="0.05"/></div></div> `);
		if (python$1?.ready) {
			$$renderer.push("<!--[0-->");
			await_block($$renderer, preview(), () => {
				$$renderer.push(`<div class="preview svelte-fokebo"></div>`);
			}, (preview) => {
				$$renderer.push(`<div class="preview svelte-fokebo"${attr_style("", { "background-color": `rgba(${stringify(preview)})` })}></div>`);
			});
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="preview svelte-fokebo">LMS preview is not available in browser.</div>`);
		}
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { value });
	});
}
//#endregion
//#region src/lib/dialogs/colorPicker/Dialog.svelte
function Dialog_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = void 0, space = void 0, allowedSpaces = [
			"named",
			"hex",
			"rgb",
			"dkl",
			"lms",
			"hsv"
		], target = "param", buttonsDisabled = {}, shown = void 0 } = $$props;
		let restore = {
			color: snapshot(value),
			space: snapshot(space)
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				id: "color-picker",
				title: "Color Picker",
				onopen: (evt) => restore = {
					color: snapshot(value),
					space: snapshot(space)
				},
				buttons: {
					OK: (evt) => restore = {
						color: snapshot(value),
						space: snapshot(space)
					},
					APPLY: (evt) => restore = {
						color: snapshot(value),
						space: snapshot(space)
					},
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
				children: ($$renderer) => {
					$$renderer.push(`<div class="page svelte-1t6wprj"><input${attr("value", value)}/> `);
					Notebook($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like([
								["named", NamedColor],
								["hex", HexColor],
								["rgb", RgbColor],
								["dkl", DklColor],
								["hsv", HsvColor],
								["lms", LmsColor]
							]);
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let [thisSpace, Component] = each_array[$$index];
								if (allowedSpaces.includes(thisSpace)) {
									$$renderer.push("<!--[0-->");
									var bind_get = () => space === thisSpace;
									var bind_set = (value) => space = thisSpace;
									Page($$renderer, {
										label: thisSpace,
										get selected() {
											return bind_get();
										},
										set selected($$value) {
											bind_set($$value);
										},
										children: ($$renderer) => {
											$$renderer.push(`<div class="page svelte-1t6wprj">`);
											if (Component) {
												$$renderer.push("<!--[-->");
												Component($$renderer, {
													target,
													get value() {
														return value;
													},
													set value($$value) {
														value = $$value;
														$$settled = false;
													}
												});
												$$renderer.push("<!--]-->");
											} else {
												$$renderer.push("<!--[!-->");
												$$renderer.push("<!--]-->");
											}
											$$renderer.push(`</div>`);
										},
										$$slots: { default: true }
									});
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							}
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
		bind_props($$props, {
			value,
			space,
			shown
		});
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/ColorCtrl.svelte
function ColorCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let show = { dialog: false };
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			SingleLineCtrl($$renderer, spread_props([
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
			$$renderer.push(`<!----> `);
			CompactButton($$renderer, {
				icon: "/icons/btn-colors.svg",
				tooltip: "Open color picker",
				onclick: (evt) => show.dialog = true
			});
			$$renderer.push(`<!----> `);
			Dialog_1($$renderer, {
				allowedSpaces: param.siblings.colorSpace.allowedVals,
				target: "param",
				buttonsDisabled: {
					OK: !param.valid,
					APPLY: !param.valid
				},
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
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/UnknownCtrl.svelte
function UnknownCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, codeIndicator = param.isCodeType, $$slots, $$events, ...attachments } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (param.deleted) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="deleted-lbl svelte-10dxg9f">Deleted</div> `);
				CompactButton($$renderer, {
					icon: "/icons/btn-undo.svg",
					tooltip: "Unrecognised param deleted. Undo?",
					onclick: (evt) => param.deleted = false
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				SingleLineCtrl($$renderer, spread_props([
					{
						codeIndicator: "codeIndicator",
						disabled: true
					},
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
				$$renderer.push(`<!----> `);
				CompactButton($$renderer, {
					icon: "/icons/btn-delete.svg",
					tooltip: "Delete unrecognised param?",
					onclick: (evt) => param.deleted = true
				});
				$$renderer.push(`<!---->`);
			}
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/CalibrationCtrl.svelte
function CalibrationCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { param = void 0, disabled = false, $$slots, $$events, ...attachments } = $$props;
		let labels = {
			cols: [
				"Min",
				"Max",
				"Gamma"
			],
			rows: [
				"lum",
				"R",
				"G",
				"B"
			]
		};
		$$renderer.push(`<div class="param-gamma-input svelte-128tix9"><table class="svelte-128tix9"><tbody><tr><th class="svelte-128tix9"></th><!--[-->`);
		const each_array = ensure_array_like(labels.cols);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let col = each_array[$$index];
			$$renderer.push(`<th class="svelte-128tix9">${escape_html(col)}</th>`);
		}
		$$renderer.push(`<!--]--></tr><!--[-->`);
		const each_array_1 = ensure_array_like(Object.keys(labels.rows));
		for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
			let row = each_array_1[$$index_2];
			$$renderer.push(`<tr><th class="svelte-128tix9">${escape_html(labels.rows[row])}</th><!--[-->`);
			const each_array_2 = ensure_array_like(Object.keys(labels.cols));
			for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
				let col = each_array_2[$$index_1];
				$$renderer.push(`<td class="svelte-128tix9"><input type="number" max="1"${attr("min", -1)} step="0.01"${attr("value", param.val[row][col])}/></td>`);
			}
			$$renderer.push(`<!--]--></tr>`);
		}
		$$renderer.push(`<!--]--></tbody></table></div>`);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/ctrls/index.js
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
//#endregion
//#region src/lib/paramCtrls/ParamCtrl.svelte
function ParamCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { name, param = void 0, $$slots, $$events, ...attachments } = $$props;
		let ValueCtrl = void 0;
		if (param.inputType in mapping) ValueCtrl = mapping[param.inputType];
		else ValueCtrl = mapping["single"];
		let inline = derived(() => ["bool"].includes(param.inputType));
		function evaluateDepend(dep) {
			let target;
			if (typeof dep === "boolean") return dep;
			if (String(dep.condition).startsWith("==")) {
				target = String(dep.condition).replace(/== *['"](.*?)['"]|== *(.*?)/, "$1");
				if (target.trim() === "True") target = true;
				else if (target.trim() === "False") target = false;
				if (param.siblings[dep.param].val !== target) return false;
			} else if (String(dep.condition).startsWith("in")) {
				target = String(dep.condition).replace(/in [\[\(](.*?)[\]\)]/, "$1").split(/, ?/g).map((value) => value.replace(/['"](.*?)['"]/, "$1"));
				if (!target.includes(param.siblings[dep.param].val)) return false;
			} else if (!param.siblings[dep.param].val) return false;
			return true;
		}
		let shown = derived(() => {
			for (let dep of param.depends.shown) if (!evaluateDepend(dep)) return false;
			return true;
		});
		let enabled = derived(() => {
			for (let dep of param.depends.enabled) if (!evaluateDepend(dep)) return false;
			return true;
		});
		let showTooltip = false;
		let grow = derived(() => ["code", "multi"].includes(param.inputType));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (shown() && param.inputType !== "hidden") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div${attributes({
					class: "param-ctrl",
					id: name,
					...attachments
				}, "svelte-a7rlw1", void 0, {
					"grid-template-rows": inline() ? "[label] min-content [warning] min-content" : "[label] min-content [ctrl] auto [warning] min-content",
					"flex-grow": grow() ? 1 : 0
				})}><label class="param-label svelte-a7rlw1"${attr("for", name)}${attr_style("", {
					"grid-column-start": inline() ? "gap" : "label",
					"align-self": inline() ? "center" : "end"
				})}>${escape_html(param.label ? param.label : name)} `);
				if (param.hint) {
					$$renderer.push("<!--[0-->");
					Tooltip($$renderer, {
						position: "bottom",
						get shown() {
							return showTooltip;
						},
						set shown($$value) {
							showTooltip = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							$$renderer.push(`<!---->${escape_html(param.hint)}`);
						},
						$$slots: { default: true }
					});
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></label> `);
				if (param.allowedUpdates && param.allowedUpdates.length > 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.select({
						class: "param-updates",
						id: `${stringify(name)}-updates`,
						disabled: param.allowedUpdates.length == 1,
						value: param.updates
					}, ($$renderer) => {
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(param.allowedUpdates);
						for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
							let ud = each_array[$$index];
							$$renderer.option({ value: ud }, ($$renderer) => {
								$$renderer.push(`${escape_html(ud)}`);
							});
						}
						$$renderer.push(`<!--]--><!--[-->`);
						const each_array_1 = ensure_array_like(current.experiment.updateTargets);
						for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
							let ud = each_array_1[$$index_1];
							$$renderer.option({ value: `set during: ${stringify(ud.name)}` }, ($$renderer) => {
								$$renderer.push(`set during: ${escape_html(ud.name)}`);
							});
						}
						$$renderer.push(`<!--]-->`);
					}, "svelte-a7rlw1");
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="param-value svelte-a7rlw1"${attr_style("", {
					"grid-row-start": inline() ? "label" : "ctrl",
					"grid-column-end": inline() ? "gap" : "end"
				})}>`);
				if (ValueCtrl) {
					$$renderer.push("<!--[-->");
					ValueCtrl($$renderer, {
						disabled: !enabled(),
						get param() {
							return param;
						},
						set param($$value) {
							param = $$value;
							$$settled = false;
						}
					});
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
				$$renderer.push(`</div> <div class="warning svelte-a7rlw1">`);
				if (param.valid.warning) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`${escape_html(param.valid.warning)}`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { param });
	});
}
//#endregion
//#region src/lib/paramCtrls/StartStopCtrl.svelte
function StartStopCtrl($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		/** @prop @type {string} Name (Start or Stop)*/
		let name = $$props["name"];
		/** @prop @type {{valueParam: import("$lib/experiment").Param|null, typeParam: import("$lib/experiment").Param|null, expectedParam: import("$lib/experiment").Param|null}}*/
		let params = $$props["params"];
		$$renderer.push(`<div class="start-stop-ctrl svelte-1fa03mg"${attr("id", name)}><label class="param-label svelte-1fa03mg"${attr("for", name)}>${escape_html(name)} `);
		if (params.valueParam !== null && params.valueParam.hint) {
			$$renderer.push("<!--[0-->");
			Tooltip($$renderer, {
				children: ($$renderer) => {
					$$renderer.push(`<!---->${escape_html(params.valueParam.hint)}`);
				},
				$$slots: { default: true }
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></label> <div class="param-gap svelte-1fa03mg"></div> `);
		if (params.typeParam !== null) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="param-type svelte-1fa03mg">`);
			if (params.typeParam.hint) {
				$$renderer.push("<!--[0-->");
				Tooltip($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!---->${escape_html(params.typeParam.hint)}`);
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			$$renderer.select({
				disabled: params.typeParam.allowedVals.length == 1,
				value: params.typeParam.val,
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(params.typeParam.allowedVals);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let val = each_array[$$index];
					$$renderer.option({
						value: val,
						selected: params.typeParam.val === val
					}, ($$renderer) => {
						$$renderer.push(`${escape_html(val)}`);
					});
				}
				$$renderer.push(`<!--]-->`);
			}, "svelte-1fa03mg");
			$$renderer.push(`</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (params.valueParam !== null) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<input class="param-value svelte-1fa03mg" type="text"${attr("value", params.valueParam.val)}/>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (params.expectedParam !== null) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<label class="param-estim-label svelte-1fa03mg"${attr("for", `${stringify(name)}-type`)}>${escape_html(params.expectedParam.label)}</label> <input class="param-estim svelte-1fa03mg" type="text"${attr("value", params.expectedParam.val)}${attr("id", `${stringify(name)}-type`)}/>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, {
			name,
			params
		});
	});
}
//#endregion
//#region src/lib/paramCtrls/Notebook.svelte
function Notebook_1($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { element = void 0, hideParams = [] } = $$props;
		let pageIndex = void 0;
		let horizontal = derived(() => element.tag === "CodeComponent");
		let categOrder = {
			Basic: -5,
			Layout: -4,
			Appearance: -3,
			Formatting: -2,
			Texture: -1,
			Data: 1,
			Custom: 2,
			Hardware: 3,
			Testing: 4
		};
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			$$renderer.push(`<div class="params-container svelte-tsgnvi"><div class="uncategorised-params-panel svelte-tsgnvi">`);
			if (element.sortedParams.uncategorised) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(Object.entries(element.sortedParams.uncategorised));
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let [name, param] = each_array[$$index];
					if (![...hideParams].includes(name)) {
						$$renderer.push("<!--[0-->");
						ParamCtrl($$renderer, {
							name,
							param
						});
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> `);
			if (Object.keys(element.sortedParams).filter((value) => value !== "uncategorised").length) {
				$$renderer.push("<!--[0-->");
				Notebook($$renderer, {
					children: ($$renderer) => {
						$$renderer.push(`<!--[-->`);
						const each_array_1 = ensure_array_like(Object.entries(element.sortedParams).sort((left, right) => (categOrder[left[0]] || 0) - (categOrder[right[0]] || 0)));
						for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
							let [categ, params] = each_array_1[$$index_2];
							if (!Object.keys(params).every((value) => hideParams.includes(value)) && categ !== "uncategorised") {
								$$renderer.push("<!--[0-->");
								var bind_get = () => {
									return pageIndex === categ;
								};
								var bind_set = (value) => {
									pageIndex = categ;
								};
								Page($$renderer, {
									label: categ,
									data: element,
									get selected() {
										return bind_get();
									},
									set selected($$value) {
										bind_set($$value);
									},
									children: ($$renderer) => {
										$$renderer.push(`<div class="params-panel svelte-tsgnvi"${attr_style("", {
											"flex-direction": horizontal() ? "row" : "column",
											width: horizontal() ? "65rem" : "45rem"
										})}>`);
										if ("startVal" in params) {
											$$renderer.push("<!--[0-->");
											StartStopCtrl($$renderer, {
												name: "Start",
												params: element.startParams
											});
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--> `);
										if ("stopVal" in params) {
											$$renderer.push("<!--[0-->");
											StartStopCtrl($$renderer, {
												name: "Stop",
												params: element.stopParams
											});
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--> <!--[-->`);
										const each_array_2 = ensure_array_like(Object.entries(params));
										for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
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
												$$renderer.push("<!--[0-->");
												ParamCtrl($$renderer, {
													name,
													get param() {
														return element.params[name];
													},
													set param($$value) {
														element.params[name] = $$value;
														$$settled = false;
													}
												});
											} else $$renderer.push("<!--[-1-->");
											$$renderer.push(`<!--]-->`);
										}
										$$renderer.push(`<!--]--></div>`);
									},
									$$slots: { default: true }
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]-->`);
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
		bind_props($$props, { element });
	});
}
//#endregion
//#region src/lib/paramCtrls/ParamsDialog.svelte
function ParamsDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { element, shown = void 0, extraButtons = {}, onapply = (evt) => {}, onclose = (evt) => {} } = $$props;
		let valid = derived(() => Object.values(element.params).every((param) => param.valid.value));
		let btnsDisabled = derived(() => ({
			OK: !valid(),
			APPLY: !valid()
		}));
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				id: `${stringify(element.name)}-parameters`,
				title: `Editing: ${stringify(element.name || element.tag)}`,
				onclose,
				onopen: () => element.restore.set(),
				buttons: {
					OK: (evt) => {
						element.trim();
						element.restore.set();
						onapply(evt);
					},
					APPLY: (evt) => {
						element.trim();
						element.restore.set();
						onapply(evt);
					},
					EXTRA: extraButtons,
					CANCEL: (evt) => {
						element.restore.apply();
					},
					HELP: element.helpLink
				},
				buttonsDisabled: btnsDisabled(),
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					Notebook_1($$renderer, { element });
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
//#region src/lib/dialogs/preferences/PrefsDialog.svelte
function PrefsDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { shown = void 0 } = $$props;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			await_block($$renderer, prefs.ready, () => {
				$$renderer.push(`Loading...`);
			}, () => {
				ParamsDialog($$renderer, {
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
			});
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
//#region src/lib/dialogs/bugReport/BugReport.svelte
function BugReport($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { user = {}, context = {}, shown = void 0 } = $$props;
		let report = {
			version: "",
			username: "",
			email: "",
			title: "",
			description: "",
			priority: "",
			message: "",
			logs: {
				app: "",
				liaison: ""
			}
		};
		let err = {
			shown: false,
			message: void 0
		};
		async function populate() {
			report.title = "";
			report.message = "";
			report.priority = "";
			report.version = await electron.version();
			report.username = user?.profile?.username;
			report.email = user?.profile?.email || "";
			if (context instanceof Experiment) report.context = context.toJSON();
			if (Array.isArray(context)) report.context = context.map((page) => page.toJSON?.());
			if (electron) {
				let folder = await electron.paths.user();
				report.logs.app = await electron.files.load(path.join(folder, "last_app_load.log"));
				report.logs.liaison = await electron.files.load(path.join(folder, "liaison.log"));
			}
			report.logs.browser = "";
		}
		async function submit(evt) {
			console.log("Sending bug report:", snapshot(report));
			let resp = await fetch("/api/report", {
				method: "POST",
				body: JSON.stringify(snapshot(report))
			}).then((resp) => resp.json());
			console.log("Bug report sent", resp);
			if (resp.err) {
				err.shown = true;
				err.message = resp.err;
			}
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Dialog($$renderer, {
				title: "Submit bug report",
				buttons: {
					OK: submit,
					CANCEL: (evt) => {}
				},
				onopen: populate,
				shrink: true,
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="content svelte-8xvegw"><div class="ctrl svelte-8xvegw"><span>ClickUp access token (<a href="https://app.clickup.com/4570406/settings/apps" target="_blank">click here to log in and get one</a>)</span> <input${attr("value", report.token)}/></div> <div class="ctrl svelte-8xvegw">Provide a contact email <input${attr("value", report.email)}/></div> <div class="ctrl svelte-8xvegw">Briefly summarise the bug <input${attr("value", report.title)}/></div> <div class="ctrl svelte-8xvegw">Provide a more detailed description (optional) <textarea class="svelte-8xvegw">`);
					const $$body = escape_html(report.description);
					if ($$body) $$renderer.push(`${$$body}`);
					$$renderer.push(`</textarea></div> <div class="ctrl svelte-8xvegw">How severe is the bug? `);
					$$renderer.select({ value: report.priority }, ($$renderer) => {
						$$renderer.option({ value: 1 }, ($$renderer) => {
							$$renderer.push(`Totally prevents me from progressing`);
						});
						$$renderer.option({ value: 2 }, ($$renderer) => {
							$$renderer.push(`Requires a hacky workaround to progress`);
						});
						$$renderer.option({ value: 3 }, ($$renderer) => {
							$$renderer.push(`Can progress but there's confusing errors/warnings`);
						});
						$$renderer.option({ value: 4 }, ($$renderer) => {
							$$renderer.push(`Works but something is unintuitive / could be prettier`);
						});
					});
					$$renderer.push(`</div></div>`);
				},
				$$slots: { default: true }
			});
			$$renderer.push(`<!----> `);
			MessageDialog($$renderer, {
				get shown() {
					return err.shown;
				},
				set shown($$value) {
					err.shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<p>Failed to send report.</p> <pre>${escape_html(err.ECODE)}: ${escape_html(err.message)}</pre> <p>Click below to download the report so you can send it manually:</p> `);
					Button($$renderer, {
						label: "Download",
						icon: "/icons/btn-download.svg",
						onclick: (evt) => browseFileSave([{
							description: "JSON file",
							accept: { "text/json": [".json"] }
						}], "./bug_report.json").then((file) => writeFile(file, JSON.stringify(report, void 0, 4))),
						horizontal: true
					});
					$$renderer.push(`<!---->`);
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
		bind_props($$props, { shown });
	});
}
//#endregion
//#region src/lib/utils/ribbon/Ribbon.svelte
function Ribbon($$renderer, $$props) {
	let { children } = $$props;
	$$renderer.push(`<div id="ribbon" class="svelte-106am9m">`);
	children($$renderer);
	$$renderer.push(`<!----></div>`);
}
//#endregion
//#region src/lib/utils/ribbon/Section.svelte
function Section($$renderer, $$props) {
	let { label = "", icon = void 0, children = void 0 } = $$props;
	$$renderer.push(`<div class="ribbon-section svelte-j7if95">`);
	children?.($$renderer);
	$$renderer.push(`<!----> <div class="ribbon-section-label svelte-j7if95">`);
	if (icon) {
		$$renderer.push("<!--[0-->");
		Icon($$renderer, { src: icon });
	} else {
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<div></div>`);
	}
	$$renderer.push(`<!--]--> ${escape_html(label)}</div></div>`);
}
//#endregion
//#region src/lib/utils/ribbon/Gap.svelte
function Gap($$renderer) {
	$$renderer.push(`<div class="section-gap svelte-1y8fdye"></div>`);
}
//#endregion
//#region src/lib/dialogs/tips/tips.json
var tips_default = /*#__PURE__*/ JSON.parse("[{\"message\":\"Most buttons have helpful usage tips if you hover over them\",\"categories\":[\"general\"]},{\"message\":\"PsychoPy can handle many different units (degrees of visual angle, cm...) for your stimuli. But you need to tell it about your monitor first (see the online documentation on General > Units)\",\"categories\":[\"general\"]},{\"message\":\"Menu items show you the current key bindings (which can be configured in preferences)\",\"categories\":[\"general\"]},{\"message\":\"It's a really good idea to run in pilot mode and check your data are all being saved as you like BEFORE running all of your participants!\",\"categories\":[\"general\"]},{\"message\":\"You can control what is different in pilot mode (compared than run mode) in the 'Piloting' section of Preferences\",\"icon\":\"/icons/btn-pilotpy.svg\",\"categories\":[\"general\"]},{\"message\":\"The [user forum](https://discourse.psychopy.org) is a great place to ask questions and receive updates\",\"categories\":[\"general\"]},{\"message\":\"If you write to the forum, make it clear whether you're running locally or online.\",\"categories\":[\"general\"]},{\"message\":\"You can use the source. PsychoPy comes with all its source code included. If you know Python, you'd be surprised how easy it is to find your own bug-fixes.\",\"categories\":[\"general\"]},{\"message\":\"Degrees of visual angle are 'device independent'. Normalized units mean that your stimulus will be different on each different computer. Do you really want that?\",\"categories\":[\"general\"]},{\"message\":\"PsychoPy is free. Please [cite the most recent paper](https://psychopy.org/about/index.html#citing-psychopy) if you use PsychoPy in published work\",\"categories\":[\"general\"]},{\"message\":\"In Python, the values True and False must have capitals and really just stand for 1 and 0.\",\"categories\":[\"general\"]},{\"message\":\"Did your stimulus not appear? Was it really tiny? Is it the same color as your background?\",\"categories\":[\"general\"]},{\"message\":\"The default color values in PsychoPy range from -1 to +1, with 0 being the mean grey of the screen. So black is like the maximum decrement from grey and white is an increment. Right?\",\"categories\":[\"general\"]},{\"message\":\"Data can be output in many different formats, but it's worth saving the 'psydat' (aka pickle) format as well as the others. Although this isn't 'human readable' it stores more information than excel/csv files including an entire copy of your actual experiment!\",\"categories\":[\"general\"]},{\"message\":\"You can see how many people used PsychoPy this month at [usage.psychopy.org](https://usage.psychopy.org)\",\"categories\":[\"general\"]},{\"message\":\"If you like PsychoPy spread the word\",\"categories\":[\"general\"]},{\"message\":\"For the best audio timing you need to use the 'PTB' backend (set this in the app Preferences).\",\"categories\":[\"general\"]},{\"message\":\"Get your department to buy a site licence for Pavlovia.org. You'll be helping fund PsychoPy development and you'll be able to run unlimited online studies.\",\"categories\":[\"general\"]},{\"message\":\"Use informative variable and Component names. You don't want to be trawling through your experiment looking for 'text_32'...\",\"categories\":[\"general\"]},{\"message\":\"Friend of the show Wakefield has been posting daily tips on the forum. [Give them a look!](https://discourse.psychopy.org/t/wakefields-daily-tips-index/43722)\",\"categories\":[\"general\"]},{\"message\":\"If you're running in a browser and can't find an error message, try [opening your browser's developer tools](https://balsamiq.com/support/faqs/browser-console); it may be in the console.\",\"categories\":[\"general\"]},{\"message\":\"Open Science Tools (that's us, the makers of PsychoPy!) offer [consultancy](https://psychopy.org/consultancy); we can teach you to use PsychoPy and even help you build an experiment\",\"categories\":[\"general\"]},{\"message\":\"Check out [demo experiments on Pavlovia](https://pavlovia.org/explore/demos?sort=DEFAULT) for a useful starting point\",\"categories\":[\"general\"]},{\"message\":\"It's entirely possible that someone has made an experiment similar to what you want to do, so its worth [browsing public projects](https://pavlovia.org/explore?sort=DEFAULT) on Pavlovia before you start\",\"icon\":\"/branding/pavlovia.svg\",\"categories\":[\"general\"]},{\"message\":\"Stay in the loop on upcoming training events via [our workshops site](https://workshops.psychopy.org/)\",\"categories\":[\"general\"]},{\"message\":\"Sites like [itch.io](https://itch.io/) and [Pexels](https://www.pexels.com/) can be a great resource for stimuli, especially if you want to gamify your experiment, but you should always check the license and be sure to credit the authors in your README file.\",\"categories\":[\"general\"]},{\"message\":\"Chocolate probably won't help, but does that mean you shouldn't try it?\",\"categories\":[\"silly\"]},{\"message\":\"You should avoid snorting Pepsi\",\"categories\":[\"silly\"]},{\"message\":\"You should wear sunscreen. (Where does it say these tips have to be original?!)\",\"categories\":[\"silly\"]},{\"message\":\"Debugging is like a murder mystery, except you're the murderer...\",\"categories\":[\"silly\"]},{\"message\":\"Most dialogs have a help button that takes you to the relevant online documentation\",\"categories\":[\"builder\"]},{\"message\":\"From Builder you can use 'Compile' to generate the Python script that controls your experiment, and view or edit it in the Coder. Any edits are not reflected back in the Builder, however. [The answer is (almost) never to edit the generated code](https://discourse.psychopy.org/t/wakefields-daily-tips/43371/17).\",\"icon\":\"/icons/btn-compilepy.svg\",\"categories\":[\"builder\"]},{\"message\":\"Need sub-millisecond timing? Use Validator Routines to make sure you're *getting* sub-millisecond timing!\",\"categories\":[\"builder\"]},{\"message\":\"For fMRI block designs you want to use non-slip timing (trials of pre-determined duration). Builder indicates these with a green icon in the Flow panel\",\"categories\":[\"builder\"]},{\"message\":\"You can often right click on things to bring up a menu, e.g., to remove a trial.\",\"categories\":[\"builder\"]},{\"message\":\"To set stimulus position to your variables X and Y, you can use either $[X,Y] or [$X,Y]. (A $ anywhere indicates that the entire entry box is Python code)\",\"categories\":[\"builder\"]},{\"message\":\"The contents of the dialog box at the start of your experiment are controlled from the Experiment Settings button. You can use these values in your study by referring to the value in expInfo e.g. expInfo['participant']\",\"icon\":\"/icons/btn-settings.svg\",\"categories\":[\"builder\"]},{\"message\":\"If you set a description for a Routine in its Routine Settings, whatever you wrote will appear when you hover over that Routine in the flow\",\"categories\":[\"builder\"]},{\"message\":\"To put a $ symbol in a stimulus, you need to use \\\\$, like this: 'You win \\\\$5.00!'. (This is only for input boxes, and not for code components.)\",\"categories\":[\"builder\"]},{\"message\":\"You can use 'Ctrl + Z' and 'Ctrl + Shift + Z' to undo and redo many of the actions in the Builder, such as adding, deleting, or changing something.\",\"categories\":[\"builder\"]},{\"message\":\"In Builder you can control what appears in the 'Experiment Info' dialog box in the Experiment Settings\",\"categories\":[\"builder\"]},{\"message\":\"Sometimes the correct response on a given trial is not to respond at all, such as in a go/no-go task. To score such responses properly, enter 'None' as the correct answer (no quotes) in the Builder dialog box.\",\"categories\":[\"builder\"]},{\"message\":\"Is your experiment tedious to run? Check out the [psychopy-monkeys](https://teparsons.github.io/psychopy-monkeys/) plugin - adding a monkey to your experiment makes it easy to skip some parts in pilot mode.\",\"icon\":\"https://raw.githubusercontent.com/TEParsons/psychopy-monkeys/refs/heads/main/branding/plugin_icon%402x.png\",\"categories\":[\"builder\"]},{\"message\":\"Reusing Routines wherever possible will make your experiment\",\"categories\":[\"builder\"]},{\"message\":\"Did you know you can disable Routines and Components? Check the 'Testing' tab of the Component or Routine Settings\",\"categories\":[\"builder\"]},{\"message\":\"Setting 'nReps' in a loop to 0 means the whole loop is skipped\",\"categories\":[\"builder\"]},{\"message\":\"You can use a Survey Routine to embed a [Pavlovia Survey](https://pavlovia.org/docs/surveys/overview) in your experiment. Perfect for consent/debrief forms when running online!\",\"icon\":\"/branding/pavlovia.svg\",\"categories\":[\"builder\"]},{\"message\":\"You can comment/uncomment entire blocks of code with 'Ctrl + ?'\",\"categories\":[\"coder\"]},{\"message\":\"Comments are a love note to future you. Always comment your code!\",\"categories\":[\"coder\"]}]");
//#endregion
//#region src/lib/dialogs/tips/TipsDialog.svelte
function TipsDialog($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { categories = ["general", "silly"], shown = void 0 } = $$props;
		let hide = void 0;
		if (electron) electron.windows.listen("showTips", (evt, value) => shown = value);
		let tip = void 0;
		function chooseTip() {
			let options = tips_default.filter((tip) => categories.some((categ) => tip.categories.includes(categ)));
			tip = options[Math.floor(Math.random() * options.length)];
		}
		chooseTip();
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			MessageDialog($$renderer, {
				title: "PsychoPy Tips",
				buttons: {
					OK: (evt) => {},
					EXTRA: { Refresh: chooseTip }
				},
				get shown() {
					return shown;
				},
				set shown($$value) {
					shown = $$value;
					$$settled = false;
				},
				children: ($$renderer) => {
					$$renderer.push(`<div class="tip svelte-st75mq"><span${attr_style("", { color: "var(--blue)" })}>`);
					Icon($$renderer, {
						src: tip.icon || "/icons/sym-info.svg",
						size: "3rem"
					});
					$$renderer.push(`<!----></span> ${html(marked(tip.message))}</div> <div class="stop svelte-st75mq"><input type="checkbox"${attr("checked", hide, true)}/> Don't show startup tips</div>`);
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
export { Pane_resizer as C, Panel as D, Frame as E, Shortcuts as S, Pane_group as T, Notebook as _, BugReport as a, Item as b, Notebook_1 as c, NewProjectDlg as d, UserCtrl as f, Listbook as g, Page as h, Ribbon as i, ParamCtrl as l, ButtonTab as m, Gap as n, PrefsDialog as o, Dialog_1$2 as p, Section as r, ParamsDialog as s, TipsDialog as t, ProjectCtrl as u, SubMenu as v, Pane as w, current as x, Separator as y };
