import { D as escape_html, E as attr, i as await_block } from "../../chunks/server.js";
import { t as asset } from "../../chunks/paths.js";
import { B as Icon, K as electron, t as Theme } from "../../chunks/Theme.js";
//#region src/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let ready = {
			status: Promise.withResolvers(),
			message: ""
		};
		$$renderer.push(`<div class="container svelte-1uha8ag"><svg class="background svelte-1uha8ag"><use${attr("href", asset("/branding/component-wave.svg"))}></use></svg> <nav class="svelte-1uha8ag"><button class="view svelte-1uha8ag" aria-label="builder"><h3>Builder</h3> `);
		Icon($$renderer, {
			src: "/icons/btn-builder.svg",
			size: "10rem",
			";": true
		});
		$$renderer.push(`<!----> <p>Generate experiments easily using an intuitive graphical user interface (GUI).</p></button> <button class="view svelte-1uha8ag" aria-label="coder"><h3>Coder</h3> `);
		Icon($$renderer, {
			src: "/icons/btn-coder.svg",
			size: "10rem",
			";": true
		});
		$$renderer.push(`<!----> <p>Write and edit code directly in a variety of languages.</p></button> `);
		if (electron) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button class="view svelte-1uha8ag" aria-label="runner"><h3>Runner</h3> `);
			Icon($$renderer, {
				src: "/icons/btn-runner.svg",
				size: "10rem",
				";": true
			});
			$$renderer.push(`<!----> <p>Coordinate running experiments and scripts and view any warnings generated.</p></button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></nav> <div class="message svelte-1uha8ag">`);
		await_block($$renderer, ready.status.promise, () => {
			$$renderer.push(`${escape_html(ready.message)}`);
		}, () => {
			$$renderer.push(`Ready`);
		});
		$$renderer.push(`<!--]--></div> `);
		Theme($$renderer, {});
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
export { _page as default };
