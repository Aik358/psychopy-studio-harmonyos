<script>
    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        // edit
        undo,
        redo,
        find,
        // experiment
        sendToRunner,
        // run
        runPython,
        stopPython,
        // views
        showWindow
    } from '../callbacks.svelte.js'
    
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/utils/ribbon';
    import Menu from "./Menu.svelte";
    import { getContext } from "svelte";
    import { IconButton, SwitchButton } from '$lib/utils/buttons';
    import { t } from "$lib/i18n";
    import { UserCtrl } from '$lib/pavlovia/pavlovia.svelte';
    import { electron, python } from "$lib/globals.svelte";

    let current = getContext("current");

    let show = $state({
    })

    let awaiting = $state({
        runpy: Promise.resolve(false)
    })
</script>

<Ribbon>
    <RibbonSection>
        <IconButton 
            icon="/icons/btn-hamburger.svg"
            label={t("tb.menu")}
            onclick={() => show.menu = true} 
            borderless
        />
        <Menu 
            bind:shown={show.menu} 
        />
    </RibbonSection>
    
    <RibbonSection label={t("tb.file")} icon="/icons/rbn-file.svg">
        <IconButton 
            icon="/icons/btn-new.svg" 
            label={t("tb.newFile")} 
            onclick={fileNew}
            borderless
        /> 
        <IconButton 
            icon="/icons/btn-open.svg" 
            label={t("tb.openFile")} 
            onclick={fileOpen} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-save.svg" 
            label={t("tb.saveFile")} 
            onclick={fileSave}
            borderless
            disabled={
                Object.values(current.pages).length === 0 ||
                (!current.pages[current.tab]?.canUndo && current.pages[current.tab]?.file?.file)
            }
        />
        <IconButton 
            icon="/icons/btn-saveas.svg" 
            label={t("tb.saveFileAs")}
            onclick={fileSaveAs} 
            borderless
            disabled={Object.values(current.pages).length === 0}
        />
    </RibbonSection>

    <RibbonSection label={t("tb.edit")} icon="/icons/rbn-edit.svg">
        <IconButton 
            icon="/icons/btn-undo.svg" 
            label={t("tb.undo")}
            onclick={undo} 
            disabled={!current.pages[current.tab]?.canUndo} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-redo.svg" 
            label={t("tb.redo")} 
            onclick={redo} 
            disabled={!current.pages[current.tab]?.canRedo} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-find.svg" 
            label={t("tb.find")} 
            onclick={find}
            disabled={!current.pages[current.tab]?.editor}
            borderless
        />
    </RibbonSection>

    <RibbonSection label={t("tb.experiment")} icon="/icons/rbn-experiment.svg">
        <SwitchButton 
            labels={[t("tb.pilot"), t("tb.run")]} 
            tooltip={t(current.pages[current.tab]?.pilotMode ? "tip.pilotMode" : "tip.runMode")}
            bind:value={
                () => current.pages[current.tab]?.pilotMode,
                (value) => current.pages[current.tab].pilotMode = value
            } 
            disabled={!current.pages[current.tab]}
        />  
        
        {#if python?.ready}
            <IconButton 
                icon="/icons/btn-send{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg" 
                label={t("tb.sendToRunner")} 
                onclick={sendToRunner}
                disabled={!current.pages[current.tab]?.file?.file}
                borderless
            /> 
        {/if}
    </RibbonSection>
    {#if python?.ready}
        <RibbonSection label={t("tb.run")} icon="/icons/btn-runpy.svg">
            <IconButton 
                icon="/icons/btn-{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}py.svg" 
                label={t(current.pages[current.tab]?.pilotMode ? "tb.pilotLocal" : "tb.runLocal")} 
                onclick={evt => runPython()}
                disabled={!current.pages[current.tab]?.file?.file || current.pages[current.tab]?.file?.ext !== ".py"}
                bind:awaiting={awaiting.runpy}
                cancel={evt => stopPython()}
                borderless
            /> 
        </RibbonSection>
    {/if}

    <RibbonSection label={t("tb.pavlovia")} icon="/icons/rbn-pavlovia.svg">
        <UserCtrl />
    </RibbonSection>

    <RibbonGap></RibbonGap>

    <RibbonSection label={t("tb.views")} icon="/icons/rbn-windows.svg">
        <IconButton 
            icon="/icons/btn-builder.svg" 
            label={t("tb.builderView")} 
            onclick={(evt) => showWindow("builder")} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-coder.svg" 
            label={t("tb.coderView")} 
            onclick={(evt) => showWindow("coder")} 
            borderless
            disabled
        />
        {#if electron}
            <IconButton 
                icon="/icons/btn-runner.svg" 
                label={t("tb.runnerView")} 
                onclick={(evt) => showWindow("runner")} 
                borderless
            />
        {/if}
    </RibbonSection>
</Ribbon>