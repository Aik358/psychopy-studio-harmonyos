<script>
    import { getContext } from "svelte";
    import { Menu, MenuItem, MenuSeparator, SubMenu } from '$lib/utils/menu';
    import PrefsDialog from '$lib/dialogs/preferences/PrefsDialog.svelte';
    import { BugReportDlg } from "$lib/dialogs/bugReport";
    import { prefs } from "$lib/preferences.svelte"; 
    import { electron, python } from "$lib/globals.svelte";
    import { t } from "$lib/i18n";
    import { showDevTools } from "$lib/utils/views.svelte"
    import { setupPython } from "$lib/python";
    import { Version } from "$lib/utils/versions";

    import {
        // file
        fileNew,
        fileOpen,
        fileSave,
        fileSaveAs,
        quit,
        // run
        togglePiloting,
        // view
        showWindow,
    } from '../callbacks.svelte.js'

    let current = getContext("current");

    let {
        shown=$bindable()
    } = $props()

    let show = $state({
        prefsDlg: false,
        findDlg: false,
        settingsDlg: false,
        bugReport: false,
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
        />
        <MenuItem 
            icon="/icons/btn-saveas.svg" 
            label={t("file.saveAs")}
            shortcut="saveAs"
            onclick={fileSaveAs} 
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

        {#if electron}
            <MenuSeparator />

            <MenuItem
                label={t("file.quit")}
                onclick={quit}
                shortcut="quit"
            />
        {/if}
    </SubMenu>

    <SubMenu label={t("menu.view")} icon="/icons/rbn-windows.svg">
        <MenuItem 
            label={t("view.showBuilder")}
            onclick={evt => showWindow("builder")}
        />
        <MenuItem 
            label={t("view.showCoder")}
            onclick={evt => showWindow("coder")}
        />

        <MenuSeparator />

        <MenuItem 
            label={t("view.devTools")}
            onclick={showDevTools}
            shortcut="showDevTools"
        />
    </SubMenu>

    {#if electron}
        <SubMenu label={t("menu.run")} icon="/icons/btn-runpy.svg" disabled={current.selection === undefined}>
            <MenuItem 
                label={t("run.togglePilot")}
                onclick={togglePiloting}
                shortcut="togglePilot"
                disabled={current.selection === undefined}
            />

            <MenuSeparator />

            <MenuItem 
                label={t(current.runlist[current.selection]?.pilotMode ? "run.pilotInPython" : "run.runInPython")} 
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}py.svg" 
                onclick={evt => current.awaiting.runpy = current.runlist[current.selection]?.runPython()}
                shortcut="runPython"
                disabled={current.selection === undefined}
            />
            <MenuItem 
                label={t(current.runlist[current.selection]?.pilotMode ? "run.pilotInBrowser" : "run.runInBrowser")} 
                icon="/icons/btn-{current.runlist[current.selection]?.pilotMode ? "pilot" : "run"}js.svg" 
                onclick={(evt) => current.awaiting.runjs = current.runlist[current.selection]?.runJS()}
                shortcut="runJS"
                disabled={current.selection === undefined}
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
{#if electron}
    <BugReportDlg 
        user={current.user}
        context={current.runlist}
        bind:shown={show.bugReport}
    />
{/if}
