<script>
    import { MessageArray, Message } from "$lib/utils/message";
    import { MessageDialog } from "$lib/utils/dialog";
    import { CodeOutput } from "$lib/utils/code";
    import { python } from "$lib/globals.svelte.js";

    let errors = $state([])
    let showDlg = $state.raw(false)

    // 弹窗 15s 后自动消失，但错误会一直累积在数组里；
    // 界面下方常驻一个按钮可随时再次打开查看（即使所有弹窗都消失了）。
    const DISMISS_MS = 15000;
    const pushError = (message) => errors.push({
        dismiss: new Promise((resolve) => setTimeout(resolve, DISMISS_MS)),
        content: message
    });

    // listen to Python stderr
    python.output.stderr.listen((evt, message) => pushError(message))
    // listen for Liaison too
    python.liaison.listen("error", (evt, message) => pushError(message))
</script>

{#if errors.length > 0}
    <button class="err-reopen" onclick={() => showDlg = true}>
        ⚠ {errors.length} 条 Python 错误 · 点击查看
    </button>
{/if}

<MessageArray>
    {#each errors as error}
        {#await error.dismiss}
            <Message
                message="Python error, click to show"
                icon="/icons/sym-error.svg"
                onclick={evt => showDlg = true}
            />
        {:then}
            {""}
        {/await}
    {/each}
</MessageArray>

<MessageDialog
    bind:shown={showDlg}
    buttons={{
        CANCEL: evt => {}
    }}
>
    <p class="log-hint">
        完整错误日志已自动保存到沙箱：<br/>
        <code>/data/storage/el2/base/files/psychopy4/.logs/python-errors.log</code><br/>
        可用 <code>hdc file recv</code> 取出（即使界面卡死也不会丢）。
    </p>
    <div class=output-container>
        <CodeOutput value={errors.map(err => err.content.error).join("\n")} />
    </div>
</MessageDialog>

<style>
    .err-reopen {
        margin: 4px;
        padding: 4px 10px;
        background: #b3261e;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    .log-hint {
        font-size: 12px;
        opacity: 0.85;
        margin: 0 0 8px;
    }
    .log-hint code {
        background: rgba(127,127,127,0.2);
        padding: 1px 4px;
        border-radius: 3px;
    }
</style>
