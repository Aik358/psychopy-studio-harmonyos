<script>
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import ParamsDialog from "$lib/paramCtrls/ParamsDialog.svelte";
    import { FindDialog } from "$lib/dialogs/find";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { prefs } from "$lib/preferences.svelte"; 
    import { electron, python } from "$lib/globals.svelte";
    import { t } from "$lib/i18n";
    import { DeviceManagerDialog } from "$lib/dialogs/deviceManager/index.js";
    import { PluginManagerDlg } from "$lib/dialogs/pluginManager";
    import { setupPython } from "$lib/python"
    import { Version } from "$lib/utils/versions"

    import {
        // file
        file_new,
        file_open,
        file_save,
        file_save_as,
        revealFolder,
        close,
        quit,
        // edit
        undo,
        redo,
        // view
        newWindow,
        showWindow,
        showDevTools,
        // experiment
        showReadme,
        copyRoutine,
        pasteRoutine,
        // run
        togglePiloting,
        sendToRunner,
        compilePython,
        compileJS,
        runPython,
        runJS
    } from '../callbacks.svelte.js';

    let current = getContext("current");

    let {
        shown=$bindable()
    } = $props()

    let show = $state({
        prefsDlg: false,
        findDlg: false,
        settingsDlg: false,
        deviceMgrDlg: false,
        pluginMgr: false,
        bugReport: false
    })
</script>


<Menu 
    bind:shown={shown}
>
    <SubMenu label={t("menu.file")} icon="/icons/rbn-file.svg">
        <MenuItem 
            icon="/icons/btn-new.svg" 
            label={t("file.new")}
            shortcut="new"
            onclick={file_new}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={t("file.open")} 
            shortcut="open"
            onclick={file_open} 
        />
        <MenuItem 
            icon="/icons/btn-save.svg" 
            label={t("file.save")}
            shortcut="save"
            onclick={file_save} 
            disabled={!current.experiment.history.past.length} 
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={t("file.saveAs")}
            shortcut="saveAs"
            onclick={file_save_as} 
        />
        <MenuItem
            label={t("file.reveal")}
            onclick={revealFolder}
            shortcut="revealFolder"
            disabled={current.experiment.file?.parent === undefined}
        />
        <MenuItem
            label={t("file.close")}
            onclick={close}
            shortcut="close"
        />

        <MenuSeparator />

        <MenuItem
            icon="/icons/btn-settings.svg"
            label={t("file.preferences")}
            onclick={(evt) => {show.prefsDlg = true}}
        />
        <MenuItem
            label={t("file.resetPrefs")}
            onclick={evt => prefs.reset()}
        />
    </SubMenu>

    <SubMenu label={t("menu.edit")} icon="/icons/rbn-edit.svg">
        <MenuItem 
            label={t("edit.undo")}
            icon="/icons/btn-undo.svg"
            disabled={current.experiment.file === null || !current.experiment.history.past.length}
            onclick={undo}
            shortcut="undo"
        />
        <MenuItem 
            label={t("edit.redo")}
            icon="/icons/btn-redo.svg"
            onclick={redo}
            disabled={current.experiment.file === null || !current.experiment.history.future.length}
            shortcut="redo"
        />
        <MenuSeparator />
        <MenuItem 
            label={t("edit.findInExp")}
            icon="/icons/btn-find.svg"
            onclick={evt => show.findDlg = true}
            shortcut="find"
        />
    </SubMenu>

    <SubMenu label={t("menu.view")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={t("view.showCoder")}
            onclick={evt => showWindow("coder")}
        />
        <MenuItem 
            label={t("view.showRunner")}
            onclick={evt => showWindow("runner")}
        />

        <MenuSeparator />

        <MenuItem 
            label={t("view.devTools")}
            onclick={showDevTools}
            shortcut="showDevTools"
        />
    </SubMenu>

    <SubMenu label={t("menu.experiment")} icon="/icons/rbn-experiment.svg">
        <MenuItem 
            label={t("exp.settings")}
            icon="/icons/btn-settings.svg"
            onclick={evt => show.settingsDlg = true}
        />

        <MenuItem 
            label={t("exp.readme")}
            icon="/icons/btn-new.svg"
            onclick={evt => showReadme()}
        />

        <MenuSeparator />

        <MenuItem 
            label={t("exp.copyRoutine")}
            icon="/icons/btn-copy.svg"
            onclick={evt => copyRoutine()}
        />

        <MenuItem 
            label={t("exp.pasteRoutine")}
            icon="/icons/btn-paste.svg"
            onclick={evt => pasteRoutine()}
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={t("menu.run")} icon="/icons/btn-runpy.svg">
            <MenuItem 
                label={t("run.togglePilot")}
                onclick={togglePiloting}
                shortcut="togglePilot"
            />
            <MenuItem 
                label={t("run.sendToRunner")}
                icon="/icons/btn-send{current.experiment.pilotMode ? "pilot" : "run"}.svg" 
                onclick={sendToRunner}
                shortcut="sendToRunner"
                disabled={!current.experiment.file}
            />

            <MenuSeparator />

            <MenuItem 
                label={t("run.compilePy")}
                icon="/icons/btn-compilepy.svg" 
                onclick={evt => compilePython()}
                shortcut="compilePython"
                disabled={current.experiment === null}
            /> 
            <MenuItem 
                label={t(current.experiment.pilotMode ? "run.pilotInPython" : "run.runInPython")} 
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => runPython()}
                shortcut="runPython"
                disabled={current.experiment === null}
            />

            <MenuSeparator />

            <MenuItem 
                label={t("run.compileJs")} 
                icon="/icons/btn-compilejs.svg" 
                onclick={(evt) => compileJS()}
                shortcut="compileJS"
                disabled={current.experiment === null}
            />
            <MenuItem 
                label={t(current.experiment.pilotMode ? "run.pilotInBrowser" : "run.runInBrowser")} 
                icon="/icons/btn-{current.experiment.pilotMode ? "pilot" : "run"}js.svg" 
                onclick={(evt) => runJS()}
                shortcut="runJS"
                disabled={current.experiment === null}
            />
        </SubMenu>
    {/if}

    <SubMenu label={t("menu.tools")} icon="/icons/btn-hamburger.svg">
        <MenuItem 
            label={t("tools.deviceManager")}
            icon="/icons/btn-devices.svg"
            onclick={evt => show.deviceMgrDlg = true}
        />
        {#if python?.ready}
            <MenuItem 
                label={t("tools.plugins")}
                icon="/icons/btn-plugin.svg"
                onclick={evt => show.pluginMgr = true}
                disabled={!python?.ready}
            />
        {/if}

        {#if electron}
            <MenuSeparator />

            <MenuItem 
                label={t("tools.userFolder")}
                onclick={evt => electron.paths.user().then(
                    folder => electron.files.openPath(folder)
                )}
            />
        {/if}
        {#if python}
            <MenuItem 
                label={t("tools.reinstallPy")}
                onclick={evt => setupPython("app", true)}
            />
        {/if}
    </SubMenu>

    <SubMenu label={t("menu.help")}>
        <MenuItem 
            label={t("help.homepage")}
            onclick={evt => open("https://www.psychopy.org/")}
        />
        <MenuItem 
            label={t("help.docs")}
            onclick={evt => open("https://www.psychopy.org/documentation")}
        />
        <MenuItem 
            label={t("help.forum")}
            onclick={evt => open("https://discourse.psychopy.org/")}
        />
        <MenuSeparator />
        {#if electron}
            {#await electron.version() then version}
                <MenuItem
                    label={t("help.about", { version })}
                    disabled
                />
            {/await}
        {/if}
    </SubMenu>

    {#if electron}
        {#await electron.version() then version}
            {#if version === "dev" || Version.parse(version).extra}
                <MenuSeparator />
                
                <MenuItem
                    label={t("help.reportBug")}
                    onclick={evt => show.bugReport = true}
                />
            {/if}
        {/await}

        <MenuSeparator />

        <MenuItem
            label={t("file.quit")}
            onclick={quit}
            shortcut="quit"
        />
    {/if}
</Menu>


<!-- dialogs need to be outside so they're not hidden when the menu is -->
<PrefsDialog
    bind:shown={show.prefsDlg}
/>
<FindDialog
    bind:shown={show.findDlg}
/>
<ParamsDialog
    element={current.experiment.settings}
    bind:shown={show.settingsDlg}
/>
<DeviceManagerDialog
    bind:shown={show.deviceMgrDlg}
/>
{#if python}
    <PluginManagerDlg 
        bind:shown={show.pluginMgr}
    />
{/if}
{#if electron}
    <BugReportDlg 
        user={current.user}
        context={current.experiment}
        bind:shown={show.bugReport}
    />
{/if}