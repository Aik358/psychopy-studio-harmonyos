<script>
    import { browser } from '$app/environment';

    let {
        src,
        size="100%",
        /** @prop @type {boolean} Are we awaiting execution of anything for this icon? */
        awaiting=$bindable()
    } = $props()

    let svgContent = $state("")
    let svgViewBox = $state("")
    let loaded = $state(false)
    let loadError = $state(false)

    let isFile = $derived(Boolean(String(src).match(/.*\.(svg|png|jpg|jpeg)/g)))
    let isRaster = $derived(Boolean(String(src).match(/.*\.(png|jpg|jpeg)/g)))

    /** Direct server path — no asset() wrapper to avoid relative path issues */
    function resolvePath(path) {
        if (!path || path.startsWith('http') || path.startsWith('data:')) return path;
        let cleaned = String(path).replace(/^(\.\.?\/)+/, '/');
        if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
        return cleaned;
    }

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
        if (isRaster) { loaded = true; return }
        loaded = false
        loadError = false
        fetch(resolvePath(src))
            .then(r => { if (!r.ok) throw new Error(r.status); return r.text() })
            .then(text => { extractSvg(text); loaded = true })
            .catch(() => { loadError = true; loaded = true })
    })
</script>

{#if isRaster}
    {#await awaiting}
        <img class=icon style:width={size} style:height={size} src={resolvePath("/icons/sym-pending.svg")} alt="Loading..." />
    {:then}
        <img class=icon style:width={size} style:height={size} src={resolvePath(src)} alt={src} />
    {:catch}
        <img class=icon style:width={size} style:height={size} src={resolvePath("/icons/sym-error.svg")} alt="Error" />
    {/await}
{:else if !loaded}
    <img class=icon style:width={size} style:height={size} src={resolvePath("/icons/sym-pending.svg")} alt="Loading..." />
{:else if loadError}
    <img class=icon style:width={size} style:height={size} src={resolvePath("/icons/sym-error.svg")} alt="Error" />
{:else}
    <svg class=icon style:width={size} style:height={size} viewBox={svgViewBox}>
        {@html svgContent}
    </svg>
{/if}
