<script>
    import { store, flushBeforeNavigate } from "$lib/sharedViewStore.svelte.js";
    import { electron } from "$lib/globals.svelte";
    import { goto } from "$app/navigation";
    import { newWindow } from "$lib/utils/views.svelte";
    import TabletModeBanner from "$lib/python/TabletModeBanner.svelte";
    import LangSwitch from "$lib/i18n/LangSwitch.svelte";
    import { t } from "$lib/i18n";
    import { zoom } from "$lib/utils/zoom.svelte.js";
    import ZoomSlider from "$lib/utils/ribbon/ZoomSlider.svelte";
    import { terminal } from "$lib/python/terminal.svelte.js";
    import TerminalPanel from "$lib/python/TerminalPanel.svelte";

    let {
        currentView = $bindable("builder"),
        onFileDrop = (evt, file) => {},
        ribbon=undefined,
        children
    } = $props();

    let hover = $state({
        show: false,
        indicator: undefined
    })

    const views = ["builder", "coder", "runner"];

    function switchView(view) {
        // ★ 切窗口前落 localStorage：保 currentFile + activeView，goto 跳转后 target 视图 mount 从这里恢复
        // 不走 electron.windows.navigate（避免 HTTP 整页重载让 Ribbon 布局塌缩、Terminal 标识消失）
        // goto 是 SPA 跳转不重载，Terminal 标识保留；localStorage 落盘后文件也不丢
        flushBeforeNavigate(view, null);
        currentView = view;
        store.activeView = view;
        goto(`/${view}`);
    }
</script>

<div 
    id=frame
    ondragenter={evt => hover.show = evt.dataTransfer.types?.includes?.("Files")}
    ondragover={evt => evt.preventDefault()}
    ondragleave={evt => hover.show = evt.fromElement === hover.indicator}
    ondrop={async evt => {
        hover.show = false;
        if (electron) {
            evt.preventDefault();
            for (let f of evt.dataTransfer.files) {
                onFileDrop(evt, await electron.paths.getPathForFile(f))
            }
        }
    }}
    role="region"
>
    {#if hover.show}
        <div class=hover-indicator bind:this={hover.indicator}></div>
    {/if}
    
    <!-- View navigation tabs -->
    <nav id=view-nav>
        {#each views as view}
            <button
                class="nav-btn"
                class:active={currentView === view}
                onclick={() => switchView(view)}
            >
                {t(`home.${view}`)}
            </button>
        {/each}
        <div style="flex-grow:1; margin-left:auto;"></div>
        <button class="nav-btn terminal-btn" class:active={terminal.open} onclick={() => terminal.toggle()} title="Python Terminal">
            &gt;_
        </button>
        <ZoomSlider />
        <LangSwitch />
    </nav>

    {#if ribbon}
        {@render ribbon()}
    {/if}
    <div id=content style="zoom: {zoom.level / 100};">
        {@render children()}
    </div>
    <TabletModeBanner />
    <TerminalPanel />
</div>

<style>
#frame {
    display: grid;
    grid-template: min-content min-content 1fr / 1fr;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--crust);
}
#titlebar {
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: var(--crust);
    border-bottom: 1px solid var(--overlay);
    height: 32px;
    -webkit-app-region: drag;
    user-select: none;
}
#app-title {
    font-size: 12px;
    font-weight: 600;
    padding: 0 12px;
    color: var(--text);
    white-space: nowrap;
    -webkit-app-region: drag;
}
#view-nav {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2px;
    padding: 4px 16px;
    margin-left: 16px;
    -webkit-app-region: no-drag;
}
.nav-btn {
    background: none;
    border: none;
    border-radius: 4px;
    padding: 4px 12px;
    font-size: 12px;
    color: var(--outline);
    cursor: pointer;
    white-space: nowrap;
    min-width: fit-content;
    transition: background-color 0.2s, color 0.2s;
}
.nav-btn:hover {
    background-color: var(--mantle);
    color: var(--text);
}
.nav-btn.active {
    color: var(--text);
    background-color: var(--base);
}
#window-controls {
    display: flex;
    flex-direction: row;
    margin-left: auto;
    -webkit-app-region: no-drag;
}
.win-btn {
    background: none;
    border: none;
    width: 46px;
    height: 32px;
    font-size: 14px;
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
}
.win-btn:hover {
    background-color: var(--mantle);
}
.win-btn.close:hover {
    background-color: #e81123;
    color: white;
}
#content {
    position: relative;
    background-color: var(--crust);
    overflow: hidden;
}
    .hover-indicator {
        position: absolute;
        left: 0; right: 0;
        top: 0; bottom: 0;
        background: linear-gradient(var(--blue) 0%, transparent 500%);
        opacity: 10%;
        z-index: 100;
    }
</style>
