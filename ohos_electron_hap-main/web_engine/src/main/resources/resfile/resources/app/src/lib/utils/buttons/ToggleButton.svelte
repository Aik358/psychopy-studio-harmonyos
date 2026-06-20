<script>
    import Icon from "$lib/utils/icons/Icon.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";

    let {
        value=$bindable(),
        /** @prop @type {string|undefined} Path to icon for this button, if any */
        icon = undefined,
        /** @prop @type {(evt: PointerEvent) => undefined} Function to call when this button is toggled */
        ontoggle = (evt) => {},
        /** @prop @type {string|undefined} Hover text for this button, if any */
        tooltip = undefined,
        /** @prop @type {boolean} Is this button the primary action? */
        primary = false,
        /** @prop @type {boolean} Is this button an affirmative response? */
        affirmative = false,
        /** @prop @type {boolean} Is this button a negative response? */
        negative = false,
        /** @prop @type {boolean} Disable this button */
        disabled = false
    } = $props()

    let showTooltip = $state(false)
</script>


<button
    class:primary
    class:affirmative
    class:negative
    disabled={disabled}
    onmouseenter={() => {showTooltip = true}}
    onmouseleave={() => {showTooltip = false}}
    onfocusin={() => {showTooltip = true}}
    onfocusout={() => {showTooltip = false}}
    onclick={(evt) => {
        value = !value;
        ontoggle($state.snapshot(value));
    }}
    class:active={value}
>
    {#if tooltip}
    <Tooltip
        bind:shown={showTooltip}
        position="bottom-right"
    >
        {tooltip}
    </Tooltip>
    {/if}
    {#if icon}
        <Icon 
            src={icon}
            size=1rem
        />
    {/if}
</button>

<style>
    button {
        position: relative;
        background-color: transparent;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        transition: border-color .2s, box-shadow .2s, background-color .2s, color .2s;
        box-shadow: 
            inset -1px -1px 2px rgba(0, 0, 0, 0.025)
        ;
    }

    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }

    button.primary {
        color: var(--text-on-blue);
        background-color: var(--blue);
        border-width: 0;
    }
    button:enabled:hover.primary, button:enabled:focus.primary,
    button:enabled:hover.affirmative, button:enabled:focus.affirmative,
    button:enabled:hover.negative, button:enabled:focus.negative {
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.1)
        ;
    }

    button:enabled:hover.affirmative,
    button:enabled:focus.affirmative {
        color: var(--text-on-blue);
        background-color: var(--blue);
        border-color: var(--blue);
    }

    button:enabled:hover.negative,
    button:enabled:focus.negative {
        color: var(--text-on-red);
        background-color: var(--red);
        border-color: var(--red);
    }

    button:disabled {
        opacity: 50%;
    }
    button:enabled:hover,
    button:enabled:focus {
        outline: none;
        border-color: var(--blue);
        box-shadow: 
            inset 1px 1px 10px rgba(0, 0, 0, 0.05)
        ;
    }

    button.active {
        background-color: var(--crust);
        box-shadow: 
        inset 1px 1px 5px rgba(0, 0, 0, 0.15)
    ;
    }
</style>