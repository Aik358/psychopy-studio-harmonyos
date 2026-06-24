import { x as attr, y as await_block } from "../../chunks/index.js";
import { a as asset, I as Icon, e as electron, T as Theme } from "../../chunks/Theme.js";
import { k as escape_html } from "../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let ready = { status: Promise.withResolvers(), message: "" };
    $$renderer2.push(`<div class="container svelte-1uha8ag"><svg class="background svelte-1uha8ag"><use${attr("href", asset("/branding/component-wave.svg"))}></use></svg> <nav class="svelte-1uha8ag"><button class="view svelte-1uha8ag" aria-label="builder"><h3>Builder</h3> `);
    Icon($$renderer2, { src: "/icons/btn-builder.svg", size: "10rem", ";": true });
    $$renderer2.push(`<!----> <p>Generate experiments easily using an intuitive graphical user interface (GUI).</p></button> <button class="view svelte-1uha8ag" aria-label="coder"><h3>Coder</h3> `);
    Icon($$renderer2, { src: "/icons/btn-coder.svg", size: "10rem", ";": true });
    $$renderer2.push(`<!----> <p>Write and edit code directly in a variety of languages.</p></button> `);
    if (electron) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="view svelte-1uha8ag" aria-label="runner"><h3>Runner</h3> `);
      Icon($$renderer2, { src: "/icons/btn-runner.svg", size: "10rem", ";": true });
      $$renderer2.push(`<!----> <p>Coordinate running experiments and scripts and view any warnings generated.</p></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></nav> <div class="message svelte-1uha8ag">`);
    await_block(
      $$renderer2,
      ready.status.promise,
      () => {
        $$renderer2.push(`${escape_html(ready.message)}`);
      },
      () => {
        $$renderer2.push(`Ready`);
      }
    );
    $$renderer2.push(`<!--]--></div> `);
    Theme($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
export {
  _page as default
};
