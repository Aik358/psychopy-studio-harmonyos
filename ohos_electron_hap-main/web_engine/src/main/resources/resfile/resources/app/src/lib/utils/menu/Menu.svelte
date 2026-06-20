<script>
    import { getContext, setContext } from "svelte";
    import { slide } from "svelte/transition";

    let {
        /** @public @type {import("svelte").store<boolean|undefined>} Whether this menu is shown */
        shown=$bindable(),
        position=$bindable({
            x: undefined,
            y: undefined
        }),
        children=undefined
    } = $props()

    // handle of this menu's div element (for checking clicks)
    let handle = $state();
    // get function to close parent, if there is one
    let closeParent = getContext("closeMenu")
    // define function for closing this menu and pass it to children
    export function close() {
        // close this menu
        shown = false;
        // close parent menu, if any
        if (closeParent) {
            closeParent()
        }
    }
    setContext("closeMenu", close)
</script>

{#if shown}
    <div 
        bind:this={handle}
        style:position={ position.x || position.y ? "fixed" : "absolute" }
        style:left={ position.x ? `${position.x}px` : "100%" }
        style:top={ position.y ? `${position.y}px` : "0" }
        class=menu
        transition:slide
    >
        {@render children?.()}
    </div>
{/if}

<svelte:window 
    onmousedown={(evt) => {
        // ignore clicks when element is not shown
        if (!handle) {
            return
        }
        // if clicked outside of itself, close
        if (!handle.contains(evt.target)) {
            shown = false
        }
    }} 
    onkeydown={(evt) => {
        // ignore clicks when element is not shown
        if (!handle) {
            return
        }
        // if escape is pressed, close
        if (evt.key === "Escape") {
            shown = false
        }
    }}
/>

<style>
    div {
        background: var(--base);
        border: 1px solid var(--overlay);
        border-radius: .1rem;
        z-index: 100;
        list-style-type: none;
        padding: .5rem 0;
    }
    div:focus {
        border-color: var(--blue)
    }

</style>