<script>
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";
    import { slide } from "svelte/transition";
    import Icon from "$lib/utils/icons/Icon.svelte";

    let {
        /** @prop @type {string} Label for this button */
        label,
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip=undefined,
        /** @bindable State controlling whether this panel button is open */
        open=$bindable(),
        /** @interface */
        children=undefined
    } = $props()
</script>

<button
    class=panel-button
    class:active={open}
    onclick={() => open = !open}
>
    {#if tooltip}
    <Tooltip>
        {tooltip}
    </Tooltip>
    {/if}
    {label}
    <span class=panel-indicator class:open={open}>
        <Icon src="/icons/sym-arrow-right.svg" size="0.5rem" />
    </span>
</button>
{#if open}
<div 
    class="toggled-panel"
    transition:slide
>
    {@render children?.()}
</div>
{/if}

<style>
    button {
        position: relative;
        width: 100%;
        background: linear-gradient(transparent 0%, transparent 75%, rgba(0, 0, 0, 0.025) 100%);
        margin: .5rem 0;
        margin-bottom: .5rem;
        outline: none;
        border: none;
        padding: .5rem;
        border-bottom: 1px solid var(--overlay);
        transition: border-color .2s, background .2s;
        border-radius: 0;
        box-shadow: none;
    }
    button:enabled:focus,
    button:enabled:hover {
        border-color: var(--blue);
        background: linear-gradient(transparent 0%, transparent 75%, rgba(0, 0, 0, 0.05) 100%);
        box-shadow: none;
    }
    .panel-indicator {
        position: absolute;
        left: 1rem;
        bottom: 1rem;
        height: .5rem;
        width: .5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform .2s;
    }
    .panel-indicator.open {
        transform: rotate(90deg);
    }
</style>