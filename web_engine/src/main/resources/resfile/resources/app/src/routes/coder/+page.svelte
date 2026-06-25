<script>
    import { setContext } from "svelte";
    import { current } from "./globals.svelte";
    import Theme from "$lib/utils/Theme.svelte";
    import CoderRibbon from "./ribbon/Ribbon.svelte";
    import Shortcuts from '$lib/utils/Shortcuts.svelte';
    import { shortcuts } from "./callbacks.svelte";
    import { CoderNotebook } from "./notebook";
    import Frame from "$lib/utils/Frame.svelte";
    import Panel from "$lib/utils/Panel.svelte";
    import { PaneGroup, Pane, PaneResizer } from "paneforge";
    import ShellNotebook from "./shell/ShellNotebook.svelte";
    import FileExplorer from "./files/FileExplorer.svelte";
    import { electron, python } from "$lib/globals.svelte";
    import SetupPython from "$lib/python/SetupPython.svelte";
    import TipsDialog from '$lib/dialogs/tips/TipsDialog.svelte';
    import { store } from '$lib/sharedViewStore.svelte.js';
    import { Script } from "$lib/experiment/script.svelte";

    // restore saved state on mount
    if (store.coderState.saved && store.coderState.pages) {
        current.pages = store.coderState.pages
        current.tab = store.coderState.tab
    }

    // if this is a new window, load state from main process
    ;(async () => {
        if (current.pages.length === 0 && electron && typeof electron.windows.state?.load === "function") {
            let savedCode = await electron.windows.state.load("generatedCode")
            if (savedCode?.experimentJSON) {
                let label = savedCode.sourceFile
                    ? savedCode.sourceFile.replace(/\.psyexp$/, '') + ' (from Builder)'
                    : 'Experiment (from Builder)'
                let content = JSON.stringify(savedCode.experimentJSON, null, 2)
                let script = new Script(label)
                script.content = content
                current.pages.push(script)
                current.tab = current.pages.length - 1
            }
        }
    })()

    // if builder generated code (same window), open it
    if (current.pages.length === 0 && store.generatedCode.experimentJSON) {
        let label = store.generatedCode.sourceFile
            ? store.generatedCode.sourceFile.replace(/\.psyexp$/, '') + ' (from Builder)'
            : 'Experiment (from Builder)'
        let content = JSON.stringify(store.generatedCode.experimentJSON, null, 2)
        let script = new Script(label)
        script.content = content
        current.pages.push(script)
        current.tab = current.pages.length - 1
    }

    // save coder state on destroy
    $effect(() => {
        return () => {
            if (current.pages.length > 0) {
                store.coderState.pages = current.pages
                store.coderState.tab = current.tab
                store.coderState.saved = true
            }
        }
    })

    // reference current in context for ease of access
    setContext("current", current)

    // parse url params
    let params = new URLSearchParams(location.search)
    // if given a file to open, open it
    if (params.get("fileOpen")) {
        current.openFile(params.get("fileOpen"))
    }

    // listen for messages from other windows
    if (electron) {
        // for opening files via another window
        electron.windows.listen("fileOpen", (evt, file) => current.openFile(file))
        // mark ready
        electron.windows.emit("ready", true)
    }

</script>

<title>PsychoPy Coder</title>
<Frame
    onFileDrop={(evt, file) => current.openFile(file)}
>
    {#snippet ribbon()}
        <CoderRibbon />
    {/snippet}
    <PaneGroup direction="vertical">
        <Pane defaultSize={2/3}>
            <PaneGroup direction="horizontal">
                {#if electron}
                    <Pane defaultSize={1/4}>
                        <Panel
                            title=Files
                            hspan={1}
                            vspan={2}
                        >
                            <FileExplorer />
                        </Panel>
                    </Pane>
                {/if}
                
                <PaneResizer style="width: .3rem;"/>
                
                <Pane defaultSize={3/4}>
                    <Panel
                        title=Editor 
                        hspan={electron ? 3 : 4} 
                        vspan={python ? 2 : 3}
                    >
                        <CoderNotebook />
                    </Panel>
                </Pane>
            </PaneGroup>
        </Pane>

        <PaneResizer style="height: .3rem;" />
        {#if python?.ready}
            <Pane defaultSize={1/3}>
                <Panel
                    title=Console
                    hspan={5}
                    vspan={1}
                >
                    <ShellNotebook />
                </Panel>
            </Pane>
        {/if}
    </PaneGroup>
    
    

    <TipsDialog 
        categories={["general", "coder", "silly"]}
        bind:shown={current.tip.shown}
    />

    <!-- this will setup themeing -->
    <Theme />
    <!-- this will setup keyboard shortcuts -->
    <Shortcuts
        callbacks={shortcuts}
    />
    <!-- this will setup a Python instance -->
    <SetupPython />
</Frame>
