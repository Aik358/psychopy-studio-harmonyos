<script>
    import { prefs } from "$lib/preferences.svelte";
    import { electron } from "$lib/globals.svelte";

    let themeName = $derived(prefs.params?.theme?.val ?? "psychopy");
    let customTheme = $derived(prefs.params?.customTheme?.val ?? "");
    let url = $derived.by(() => {
        if (themeName === "custom") {
            return `/${customTheme}`
        }
        return `/themes/${themeName}.css`
    })
</script>

<svelte:head>
    {#if themeName === "custom"}
        {#if electron}
            {#await electron.files.load(customTheme) then styling}
                {@html `<style type='text/css'>\n${styling}\n</style>`}
            {:catch err}
                <link rel="stylesheet" href="/themes/psychopy.css">
            {/await}
        {:else}
            <link rel="stylesheet" href="/themes/psychopy.css">
        {/if}
    {:else}
        <link rel="stylesheet" href={url}
            onerror={
                evt => evt.target.href = "/themes/psychopy.css"
            }
        >
    {/if}
</svelte:head>