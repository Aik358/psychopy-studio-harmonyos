<script>
    import { Button } from "$lib/utils/buttons";
    import Component from './Component.svelte';
    import TimelineHeader from './Timeline.svelte';
    import EntryPoint from './EntryPoint.svelte';
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";

    let {
        routine=undefined
    } = $props()

    let showDialog = $state(false);
</script>

<div 
    class=routine-canvas
    style:grid-template-rows="min-content [timeline-top] min-content repeat({routine.components.length}, min-content) [timeline-bottom] min-content"
>
    <div class=button-container>
        <Button 
            label="Routine settings"
            icon="/icons/btn-settings.svg"
            tooltip="Edit settings for this Routine"
            onclick={() => showDialog = true}
            horizontal 
        ></Button>
    </div>

    <ParamsDialog
        element={routine.settings}
        bind:shown={showDialog}
    ></ParamsDialog>

    {#if routine.components}
    <TimelineHeader routine={routine}></TimelineHeader>
    {/if}

    {#each routine.components as component}
        <Component component={component}></Component>
    {/each}
    <EntryPoint routine={routine} index=-1></EntryPoint>
</div>

<style>
    .routine-canvas {
        display: grid;
        grid-template-columns: [entrypoints] 1rem [name] min-content [undershoot] 3rem [timeline] 1fr [overshoot] 3rem;
        grid-gap: 0;
        padding-bottom: 2rem;
    }
    .button-container {
        grid-column-start: entrypoints;
        grid-column-end: undershoot;
        justify-self: start;
        margin: .5rem;
        z-index: 2;
    }
</style>