<script>
    import ChoiceCtrl from "./ctrls/ChoiceCtrl.svelte";
    import SingleLineCtrl from "./ctrls/SingleLineCtrl.svelte";
    import Tooltip from "$lib/utils/tooltip/Tooltip.svelte";

    /** @prop @type {string} Name (Start or Stop)*/
    export let name;
    /** @prop @type {{valueParam: import("$lib/experiment").Param|null, typeParam: import("$lib/experiment").Param|null, expectedParam: import("$lib/experiment").Param|null}}*/
    export let params;
</script>

<div class=start-stop-ctrl id={name}>
    <label class=param-label for={name}>
        {name}
        {#if params.valueParam !== null && params.valueParam.hint}
        <Tooltip>
            {params.valueParam.hint}
        </Tooltip>
        {/if}
    </label>
    <div class=param-gap></div>
    {#if params.typeParam !== null}
    <div class=param-type>
        {#if params.typeParam.hint}
        <Tooltip>
            {params.typeParam.hint}
        </Tooltip>
        {/if}
        <select disabled={params.typeParam.allowedVals.length == 1} bind:value={params.typeParam.val}>
            {#each params.typeParam.allowedVals as val}
            <option value={val} selected={params.typeParam.val === val}>{val}</option>
            {/each}
        </select>
    </div>
    {/if}
    {#if params.valueParam !== null}
    <input class=param-value type="text" bind:value={params.valueParam.val} />
    {/if}
    {#if params.expectedParam !== null}
    <label class=param-estim-label for="{name}-type">{params.expectedParam.label}</label>
    <input class=param-estim type="text" bind:value={params.expectedParam.val} id="{name}-type" />
    {/if}
</div>

<style>
    .start-stop-ctrl {
        display: grid;
        grid-template-columns: [before] min-content [label] min-content [ctrl] auto [end];
        grid-template-rows: [label] min-content [ctrl] auto [estim] auto;
        grid-gap: .5rem;
        align-items: end;
        min-width: 20rem;
        color: var(--text);
    }

    .start-stop-ctrl .param-label {
        position: relative;
        grid-column-start: label;
        grid-row-start: label;
        align-content: end;
    }
    .start-stop-ctrl .param-gap {
        grid-column-start: ctrl;
        grid-column-end: end;
        grid-row-start: label;
    }
    .start-stop-ctrl .param-type {
        position: relative;
        grid-column-start: label;
        grid-row-start: ctrl;
    }
    .start-stop-ctrl .param-type select {
        width: 100%;
        min-width: 8rem;
        color: var(--text);
    }
    .start-stop-ctrl .param-value {
        grid-column-start: ctrl;
        grid-row-start: ctrl;
        color: var(--text);
    }
    .start-stop-ctrl .param-estim-label {
        position: relative;
        grid-column-start: label;
        grid-row-start: estim;
        align-self: center;
        justify-self: end;
        padding: 0 .5rem;
        white-space: nowrap;
        opacity: 50%;
    }
    .start-stop-ctrl .param-estim {
        grid-column-start: ctrl;
        grid-row-start: estim;
        color: var(--text);
    }
</style>