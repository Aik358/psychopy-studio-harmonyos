<script>
    import {
        // file
        file_new,
        file_open,
        file_save,
        file_save_as,
        // edit
        undo,
        redo,
        // experiment
        sendToRunner,
        compilePython,
        compileJS,
        runPython,
        showWindow,
        runJS,
        stopPython,
    } from '../callbacks.svelte.js'
    
    import Menu from "./Menu.svelte";
    import { Ribbon, RibbonSection, RibbonGap } from '$lib/utils/ribbon';
    import { getContext } from "svelte";
    import { electron, python, git } from "$lib/globals.svelte.js";
    import { t } from "$lib/i18n";
    import SavePrompt from "./SavePrompt.svelte";
    import { FindDialog } from "$lib/dialogs/find/index.js";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js"
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { IconButton, SwitchButton } from '$lib/utils/buttons';
    import { users, UserCtrl, ProjectCtrl } from '$lib/pavlovia/pavlovia.svelte';
    import MonitorCenterDlg from '$lib/dialogs/monitorCenter/MonitorCenterDlg.svelte';
    import PavloviaSync from "$lib/pavlovia/Sync.svelte"

    let current = getContext("current");

    let show = $state({
        menu: false,
        settingsDlg: false,
        findDlg: false,
        deviceMgrDlg: false,
        monitorCenterDlg: false
    })

    let awaiting = $state({
        runpy: Promise.resolve(""),
        compilepy: Promise.resolve(""),
        runjs: Promise.resolve(""),
        compilejs: Promise.resolve("")
    })

    let lastAction = $derived.by(() => {
        if (current.experiment.history.past.length) {
            return ` "${current.experiment.history.past.at(-1).msg}"`
        }
    })
    let nextAction = $derived.by(() => {
        if (current.experiment.history.future.length) {
            return ` "${current.experiment.history.future[0].msg}"`
        }
    })

    let prompts = $state({
        NEW: false,
        OPEN: false,
        PYCOMPILE: false,
        PYRUN: false
    });
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
            onclick={(evt) => prompts.NEW = true}
            borderless
        />
        <SavePrompt
            bind:shown={prompts.NEW}
            action={file_new}
        />  
        <IconButton 
            icon="/icons/btn-open.svg" 
            label={t("tb.openFile")} 
            onclick={(evt) => prompts.OPEN = true} 
            borderless
        />
        <SavePrompt
            bind:shown={prompts.OPEN}
            action={file_open}
        />
        <IconButton 
            icon="/icons/btn-save.svg" 
            label={t("tb.saveFile")} 
            onclick={file_save}
            disabled={!current.experiment.history.past.length && current.experiment.file.file} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-saveas.svg" 
            label={t("tb.saveFileAs")}
            onclick={file_save_as} 
            borderless
        />
    </RibbonSection>

    <RibbonSection label={t("tb.edit")} icon="/icons/rbn-edit.svg">
        <IconButton 
            icon="/icons/btn-undo.svg" 
            label={t("tb.undo") + (lastAction ?? "")} 
            onclick={undo} 
            disabled={!current.experiment.file.file || !current.experiment.history.past.length} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-redo.svg" 
            label={t("tb.redo") + " " + (nextAction ?? "")} 
            onclick={redo} 
            disabled={!current.experiment.file.file || !current.experiment.history.future.length} 
            borderless
        />
        <IconButton 
            icon="/icons/btn-find.svg" 
            label={t("tb.find")} 
            onclick={() => show.findDlg = true}
            borderless
        />
        <FindDialog
            bind:shown={show.findDlg}
        ></FindDialog>
    </RibbonSection>
    
    <RibbonSection label={t("tb.experiment")} icon="/icons/rbn-experiment.svg">
        {#if python?.ready}
            <IconButton
                icon="/icons/btn-monitors.svg"
                label={t("tb.monitorCenter")}
                onclick={(evt) => show.monitorCenterDlg = true}
                borderless
            ></IconButton>
            <MonitorCenterDlg
                bind:shown={show.monitorCenterDlg}
            />
            <IconButton
                icon="/icons/btn-devices.svg"
                label={t("tb.deviceManager")}
                onclick={(evt) => show.deviceMgrDlg = true}
                borderless
            ></IconButton>
            <DeviceManagerDialog
                bind:shown={show.deviceMgrDlg}
            />
        {/if}

        <IconButton 
            icon="/icons/btn-settings.svg" 
            label={t("tb.expSettings")} 
            onclick={(evt) => show.settingsDlg = true}
            disabled={current.experiment === null}
            borderless
        />
        {#if current.experiment !== null }
        <ParamsDialog
            element={current.experiment.settings}
            bind:shown={show.settingsDlg}
        ></ParamsDialog>
        {/if}
        <SwitchButton 
            labels={[t("tb.pilot"), t("tb.run")]} 
            tooltip={t(current.experiment.pilotMode ? "tip.pilotMode" : "tip.runMode")}
            bind:value={
                () => current.experiment.pilotMode,
                (value) => {
                    // update history
                    current.experiment.history.update(`toggle pilot mode`)
                    // set pilot mode
                    current.experiment.settings.params['runMode'].val = value;
                }
            } 
            disabled={current.experiment === null}
        />  
        
        {#if python?.ready}
            <IconButton 
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                label={t("tb.sendToRunner")} 
                onclick={sendToRunner}
                disabled={!current.experiment.file.file}
                borderless
            /> 
        {/if}
    </RibbonSection>

    {#if python?.ready}
        <RibbonSection label={t("tb.desktop")} icon="/icons/rbn-desktop.svg">
            <IconButton 
                icon="/icons/btn-compilepy.svg" 
                label={t("tb.writePy")} 
                onclick={evt => compilePython()}
                disabled={!current.experiment.file.file}
                bind:awaiting={awaiting.compilepy}
                borderless
            /> 
            <IconButton 
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                label={t(current.experiment.pilotMode ? "tb.pilotLocal" : "tb.runLocal")} 
                onclick={evt => runPython()}
                disabled={!current.experiment.file.file}
                bind:awaiting={awaiting.runpy}
                cancel={evt => stopPython()}
                borderless
            />
        </RibbonSection>
    {/if}

    <!-- Browser run section: always visible in PsychoPy-Oh, even without Python -->
    <RibbonSection label={t("tb.browser")} icon="/icons/rbn-browser.svg">
        {#if python?.ready}
            <IconButton 
                    icon="/icons/btn-compilejs.svg" 
                    label={t("tb.writeJs")} 
                    onclick={(evt) => compileJS()}
                    disabled={!current.experiment.file.file}
                    bind:awaiting={awaiting.compilejs}
                    borderless
                />
        {/if}
            <IconButton 
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                label={t(current.experiment.pilotMode ? "tb.pilotBrowser" : "tb.runBrowser")} 
                onclick={(evt) => runJS()}
                disabled={!current.experiment.file.file}
                bind:awaiting={awaiting.runjs}
                borderless
            />
    </RibbonSection>

    <!-- <RibbonSection id=browser label=Browser icon="/icons/rbn-browser.svg">
        <IconButton 
            id="ribbon-btn-sync" 
            icon="/icons/btn-sync.svg" 
            label="Sync to Pavlovia" 
        />
    -->

    <RibbonSection label={t("tb.pavlovia")} icon="/icons/rbn-pavlovia.svg">
        
        <PavloviaSync>
            {#snippet button(sync)}
                <IconButton 
                    icon="/icons/btn-sync.svg" 
                    label={t("tb.sync")} 
                    onclick={(evt) => sync(
                        $state.snapshot(current.experiment.file.parent), 
                        $state.snapshot(current.user),
                        true
                    )}
                    disabled={!current.user || !current.experiment.file.file}
                    borderless
                />
            {/snippet}
        </PavloviaSync>
        <UserCtrl />
        <ProjectCtrl />
    </RibbonSection>

    <RibbonGap></RibbonGap>

    <RibbonSection label={t("tb.views")} icon="/icons/rbn-windows.svg">
        <IconButton 
            icon="/icons/btn-builder.svg" 
            label={t("tb.builderView")} 
            onclick={(evt) => showWindow("builder")} 
            borderless
            disabled
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
            />
        {/if}
    </RibbonSection>
</Ribbon>