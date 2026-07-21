<script>
    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        // view
        showWindow,
    } from '../callbacks.svelte.js'
    
    import Menu from "./Menu.svelte";
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/utils/ribbon';
    import { getContext } from "svelte";
    import { electron, python } from "$lib/globals.svelte.js";
    import { IconButton, SwitchButton } from '$lib/utils/buttons';
    import { t } from "$lib/i18n";
    import { UserCtrl, ProjectCtrl } from '$lib/pavlovia/pavlovia.svelte';
    import { Experiment } from "$lib/experiment";
    import { openIn } from "$lib/utils/views.svelte";

    let current = getContext("current");

    let {
        selection
    } = $props()

    let show = $state({
        menu: false,
        settingsDlg: false,
        findDlg: false,
        deviceMgrDlg: false,
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
            label={t("tb.newConfig")} 
            onclick={(evt) => fileNew()} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-open.svg" 
            label={t("tb.openConfig")} 
            onclick={(evt) => fileOpen(true).catch(err => console.error(err))} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-save.svg" 
            label={t("tb.saveConfig")} 
            onclick={fileSave}
            borderless
        />
        <IconButton 
            icon="/icons/btn-saveas.svg" 
            label={t("tb.saveConfigAs")}
            onclick={fileSaveAs} 
            borderless
        />
    </RibbonSection>

    <RibbonSection label={t("tb.selection")} icon="/icons/rbn-experiment.svg">
        <SwitchButton 
            labels={[t("tb.pilot"), t("tb.run")]} 
            tooltip={t(current.runlist[current.selection]?.pilotMode ? "tip.pilotMode" : "tip.runMode")}
            bind:value={
                () => current.runlist[current.selection]?.pilotMode,
                (value) => current.runlist[current.selection]?.setPilotMode(value)
            } 
            disabled={current.selection === undefined}
        />
        <IconButton 
            icon="/icons/btn-send{current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"}.svg" 
            label={t("tb.openSelectionIn", { target: current.runlist[current.selection]?.file.ext === ".psyexp" ? t("tb.builderView") : t("tb.coderView") })}
            onclick={evt => openIn(
                current.runlist[current.selection]?.file.file, 
                current.runlist[current.selection]?.file.ext === ".psyexp" ? "builder" : "coder"
            )} 
            borderless
            disabled={!current.runlist[current.selection]}
        />
    </RibbonSection>

    <RibbonSection label={t("tb.run")} icon="/icons/btn-runpy.svg">
        {#if python?.ready}
            <IconButton 
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg" 
                label={t(current.runlist[current.selection]?.pilotMode ? "tb.pilotLocal" : "tb.runLocal")} 
                onclick={evt => current.runlist[current.selection]?.runPython()}
                disabled={current.selection === undefined}
                bind:awaiting={current.awaiting.runpy}
                cancel={python.scripts.stop}
                borderless
            />
        {/if}
        <IconButton 
            icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg" 
            label={t(current.runlist[current.selection]?.pilotMode ? "tb.pilotBrowser" : "tb.runBrowser")} 
            onclick={(evt) => current.runlist[current.selection]?.runJS()}
            disabled={current.selection === undefined || !(current.runlist[current.selection] instanceof Experiment)}
            bind:awaiting={current.awaiting.runjs}
            borderless
        />
    </RibbonSection>

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
        />
        {#if electron}
            <IconButton 
                icon="/icons/btn-runner.svg" 
                label={t("tb.runnerView")} 
                onclick={(evt) => showWindow("runner")} 
                borderless
                disabled
            />
        {/if}
    </RibbonSection>
</Ribbon>