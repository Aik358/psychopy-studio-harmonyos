<script>
    import { LoopInitiator } from '$lib/experiment/flow.svelte.js';
    import { t } from "$lib/i18n";
    import { ParamsNotebook } from '$lib/paramCtrls/index.js';
    import { Menu, MenuItem } from '$lib/utils/menu';
    import { Button } from '$lib/utils/buttons';
    import { getContext } from "svelte";
    import Dialog from "$lib/utils/dialog/Dialog.svelte";
    import { profiles, pending } from "$lib/experiment/profiles.svelte";
    
    let current = getContext("current");

    let showDialog = $state(false)
    let showMenu = $state(false);

    let valid = $derived.by(() => {
        if (current.inserting) {
            return Object.values(current.inserting.params).every(
                param => param.valid?.value
            )
        } else {
            true
        }
    })

    let btnsDisabled = $derived({
        OK: !valid,
        APPLY: !valid
    })

</script>

<div
    class=container
>
    <!-- button to open add Loop menu -->
    <Button 
        label={t("flow.addLoop")}
        icon="/icons/btn-loop.svg"
        tooltip="Add a loop to the experiment flow"
        onclick={() => showMenu = true}
        disabled={current.inserting}
        horizontal
    ></Button>

    <!-- menu for choosing new loop type -->
    <Menu 
        bind:shown={showMenu}
    >
        {#await pending.loops}
            <MenuItem 
                label={t("flow.loadingLoops")}
            />
        {:then loops}
            {#each Object.entries(loops) as [loopType, loopProfile]}
                {#if !loopProfile.hidden}
                    <MenuItem 
                        label={t("flow.newLoopNamed", { type: loopProfile.label?.toLowerCase?.() || loopType })}
                        onclick={() => {
                            // create blank Loop
                            current.inserting = new LoopInitiator(loopType)
                            current.inserting.exp = current.experiment;
                            // show dialog
                            showDialog = true
                        }}
                    />
                {/if}
            {/each}
        {/await}
    </Menu>

    <!-- dialog for creating a new Loop -->
    {#if current.inserting instanceof LoopInitiator}
    <Dialog 
        id=new-loop 
        title={t("flow.newLoop")}
        bind:shown={showDialog} 
        onopen={() => current.inserting.restore.set()}
        buttons={{
            OK: (evt) => {}, 
            CANCEL: (evt) => {
                current.inserting.restore.apply()
                // stop inserting
                current.inserting = undefined;
            }, 
            HELP: "https://www.psychopy.org/builder/flow.html#loops",
        }}
        buttonsDisabled={btnsDisabled}
    >
        <ParamsNotebook 
            bind:valid={valid}
            element={current.inserting}
        ></ParamsNotebook>
    </Dialog>
    {/if}
</div>

<style>
    .container {
        position: relative;
        display: grid;
        justify-content: stretch;
    }
</style>