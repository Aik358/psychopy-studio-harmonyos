<script>
    import { store } from "$lib/sharedViewStore.svelte.js";
    import { electron } from "$lib/globals.svelte";
    import { goto } from "$app/navigation";
    import { newWindow } from "$lib/utils/views.svelte";

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
                {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
        {/each}
    </nav>

    {#if ribbon}
        {@render ribbon()}
    {/if}
    <div id=content>
        {@render children()}
    </div>
</div>

<style>
#frame {
    display: grid;
    grid-template: min-content min-content 1fr / 1fr;
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
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
    gap: 2px;
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
