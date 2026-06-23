<script>
    import { asset } from '$app/paths';
    import { browser } from '$app/environment';

    let {
        src,
        size="100%",
        awaiting=$bindable()
    } = $props()

    let svgContent = $state("")
    let svgViewBox = $state("")
    let loaded = $state(false)
    let error = $state(false)

    let isFile = $derived(Boolean(String(src).match(/.*\.(svg|png|jpg|jpeg)/g)))
    let isRaster = $derived(Boolean(String(src).match(/.*\.(png|jpg|jpeg)/g)))

    function extractSvg(text) {
        let clean = text
            .replace(/<\?xml[^>]*\?>/, '')
            .replace(/<!DOCTYPE[^>]*>/, '')
            .replace(/ xmlns:serif="[^"]*"/g, '')
            .replace(/ serif:id="[^"]*"/g, '')
        let vbMatch = clean.match(/viewBox="([^"]*)"/)
        svgViewBox = vbMatch ? vbMatch[1] : "0 0 32 32"
        let contentMatch = clean.match(/<svg[^>]*>([\s\S]*)<\/svg>/)
        svgContent = contentMatch ? contentMatch[1] : clean
    }

    $effect(() => {
        if (!isFile || !browser) {
            if (!isFile) {
                extractSvg(String(src))
            }
            loaded = true
            return
        }
        loaded = false
        error = false
        fetch(asset(src))
            .then(r => r.text())
            .then(text => { extractSvg(text); loaded = true })
            .catch(() => { error = true; loaded = true })
    })
</script>

{#if isRaster}
    {#await awaiting}
        <img class=icon style:width={size} style:height={size} src={asset("/icons/sym-pending.svg")} alt="Loading..." />
    {:then}
        <img class=icon style:width={size} style:height={size} src={asset(src)} alt={src} />
    {:catch}
        <img class=icon style:width={size} style:height={size} src={asset("/icons/sym-error.svg")} alt="Error" />
    {/await}
{:else if !loaded}
    <svg class=icon style:width={size} style:height={size}>
        <use href={asset("/icons/sym-pending.svg")} />
    </svg>
{:else if error}
    <svg class=icon style:width={size} style:height={size}>
        <use href={asset("/icons/sym-error.svg")} />
    </svg>
{:else}
    <svg class=icon style:width={size} style:height={size} viewBox={svgViewBox}>
        {@html svgContent}
    </svg>
{/if}
