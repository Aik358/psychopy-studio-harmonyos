<script>
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import { prefs } from "$lib/preferences.svelte"; 
    import { electron, python } from "$lib/globals.svelte";
    import { t } from "$lib/i18n";
    import { PluginManagerDlg } from "$lib/dialogs/pluginManager";
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { setupPython } from "$lib/python";
    import { Version } from "$lib/utils/versions";

    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        revealFolder,
        quit,
        // edit
        undo,
        redo,
        find,
        // view
        // newWindow,
        showWindow,
        showDevTools,
        // // experiment
        // copyRoutine,
        // pasteRoutine,
        // // run
        togglePiloting,
        sendToRunner,
        runPython,
        runJS
    } from '../callbacks.svelte.js';

    let current = getContext("current");

    let {
        shown=$bindable()
    } = $props()

    let show = $state({
        prefsDlg: false,
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
            onclick={fileNew}
        />
        <MenuItem 
            icon="/icons/btn-open.svg" 
            label={t("file.open")} 
            shortcut="open"
            onclick={fileOpen} 
        />
        <MenuItem 
            icon="/icons/btn-save.svg" 
            label={t("file.save")}
            shortcut="save"
            onclick={fileSave} 
            disabled={
                Object.values(current.pages).length === 0 ||
                (!current.pages[current.tab]?.canUndo && current.pages[current.tab]?.file?.file)
            }
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={t("file.saveAs")}
            shortcut="saveAs"
            onclick={fileSaveAs} 
            disabled={Object.values(current.pages).length === 0}
        />
        <MenuItem
            label={t("file.reveal")}
            onclick={revealFolder}
            shortcut="revealFolder"
            disabled={current.pages[current.tab]?.file?.parent === undefined}
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
            disabled={!current.pages[current.tab]?.canUndo}
            onclick={undo}
            shortcut="undo"
        />
        <MenuItem 
            label={t("edit.redo")}
            icon="/icons/btn-redo.svg"
            onclick={redo}
            disabled={!current.pages[current.tab]?.redo}
            shortcut="redo"
        />
        <MenuSeparator />
        <MenuItem 
            label={t("edit.find")}
            icon="/icons/btn-find.svg"
            onclick={find}
            disabled={!current.pages[current.tab]?.editor}
            shortcut="find"
        />
    </SubMenu>

    <SubMenu label={t("menu.view")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={t("view.showBuilder")}
            onclick={evt => showWindow("builder")}
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

    {#if electron}
        <SubMenu label={t("menu.run")} icon="/icons/btn-runpy.svg">
            <MenuItem 
                label={t("run.togglePilot")}
                onclick={togglePiloting}
                shortcut="togglePilot"
                disabled={!current.pages[current.tab]}
            />
            <MenuItem 
                label={t("run.sendToRunner")}
                icon="/icons/btn-send{current.pages[current.tab]?.pilotMode ? "pilot" : "run"}.svg" 
                onclick={sendToRunner}
                shortcut="sendToRunner"
                disabled={!current.pages[current.tab]}
            />

            <MenuSeparator />

            <MenuItem 
                label={t(current.pages[current.tab]?.pilotMode ? "run.pilotInPython" : "run.runInPython")} 
                icon="/icons/btn-{current.pages[current.tab]?.pilotMode?.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => runPython()}
                shortcut="runPython"
                disabled={!current.pages[current.tab] || current.pages[current.tab].file.ext !== ".py"}
            />

        </SubMenu>
    {/if}

    <SubMenu label={t("menu.tools")} icon="/icons/btn-hamburger.svg">
        <MenuItem 
            label={t("tools.plugins")}
            icon="/icons/btn-plugin.svg"
            onclick={evt => show.pluginMgr = true}
            disabled={!python?.ready}
        />
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
                    label={t("help.aboutShort", { version: `${version.major}.${version.minor}` })}
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
{#if python}
    <PluginManagerDlg 
        bind:shown={show.pluginMgr}
    />
{/if}
{#if electron}
    <BugReportDlg 
        user={current.user}
        context={current.pages}
        bind:shown={show.bugReport}
    />
{/if}
