<script>
    let {
        profile
    } = $props()
</script>


<table class=device-profile>
    {#if profile}
        <tbody>
            {#each Object.entries(profile) as [key, val]}
            <tr>
                <th class=key>{key}</th>
                <td class=value>{val}</td>
            </tr>
            {/each}
        </tbody>
    {/if}
</table>

<style>
    .device-profile {
        position: relative;
        border-collapse: collapse;
        margin: 0 1rem;
        width: calc(100% - 2rem);
        box-sizing: border-box;
    }
    .device-profile .value,
    .device-profile .key {
        border: 1px solid var(--overlay);
        padding: .5rem;
        box-sizing: border-box;
        
    }
    .device-profile .value {
        grid-column-start: values;
        word-break: break-word;
        background-color: var(--base);
    }
    .device-profile .key {
        grid-column-start: keys;
        text-align: right;
        background-color: var(--mantle);
    }
</style>