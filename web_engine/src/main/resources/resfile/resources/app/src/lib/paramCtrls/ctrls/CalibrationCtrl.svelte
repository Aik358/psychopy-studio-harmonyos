<script>
    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @interface */
        ...attachments
    } = $props()

    let labels = {
        cols: ["Min", "Max", "Gamma"],
        rows: ["lum", "R", "G", "B"]
    }

    function calibrate() {

    }
</script>

<div class=param-gamma-input>
    <table>
        <tbody>
            <tr>
                <th></th>
                {#each labels.cols as col}
                    <th>{col}</th>
                {/each}
             </tr>
            {#each Object.keys(labels.rows) as row}
                <tr>
                    <th>{labels.rows[row]}</th>
                    {#each Object.keys(labels.cols) as col}
                        <td>
                            <input type=number max=1 min={-1} step=0.01 bind:value={param.val[row][col]} />
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    .param-gamma-input {
        display: flex;
        flex-direction: column;
        align-items: end;
        gap: .5rem;
        border: 1px solid var(--overlay);
        border-radius: .5rem;
        padding: 1rem;
    }
    table {
        margin: -.5rem;
    }
    td, th {
        padding: .5rem;
    }
</style>