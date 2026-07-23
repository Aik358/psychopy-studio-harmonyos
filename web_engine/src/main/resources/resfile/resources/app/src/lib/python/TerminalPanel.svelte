<script>
    import { terminal } from "$lib/python/terminal.svelte.js";
</script>

{#if terminal.open}
<div class="terminal-panel">
    <div class="terminal-header">
        <span>Python Terminal</span>
        <div class="terminal-actions">
            <button onclick={() => terminal.diagnose()}>Diagnose</button>
            <button onclick={() => terminal.clear()}>Clear</button>
            <button class="close-btn" onclick={() => terminal.open = false}>x</button>
        </div>
    </div>
    <pre class="terminal-output">
        {#each terminal.lines as line}
            <span class:stderr={line.type === 'stderr'} class:system={line.type === 'system'}>{line.text}</span>
        {/each}
    </pre>
</div>
{/if}

<style>
    .terminal-panel {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 35vh;
        z-index: 9000;
        background: var(--base, #1e1e2e);
        border-top: 2px solid var(--overlay, #45475a);
        display: flex;
        flex-direction: column;
        box-shadow: 0 -4px 16px rgba(0,0,0,0.3);
    }
    .terminal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 12px;
        background: var(--mantle, #181825);
        border-bottom: 1px solid var(--overlay, #45475a);
        font-size: 12px;
        font-weight: 600;
        color: var(--text, #cdd6f4);
    }
    .terminal-actions {
        display: flex;
        gap: 4px;
    }
    .terminal-actions button {
        padding: 2px 8px;
        font-size: 11px;
        background: var(--surface0, #313244);
        color: var(--text, #cdd6f4);
        border: 1px solid var(--overlay, #45475a);
        border-radius: 4px;
        cursor: pointer;
    }
    .close-btn {
        background: var(--red, #f38ba8) !important;
        color: #fff !important;
        border: none !important;
    }
    .terminal-output {
        flex: 1;
        margin: 0;
        padding: 8px 12px;
        color: var(--text, #cdd6f4);
        font-family: monospace;
        font-size: 12px;
        line-height: 1.5;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
    }
    .terminal-output span {
        display: block;
    }
    .terminal-output .stderr {
        color: var(--red, #f38ba8);
    }
    .terminal-output .system {
        color: var(--mauve, #cba6f7);
        font-weight: bold;
    }
</style>
