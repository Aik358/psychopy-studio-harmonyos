<script>
    import { browser } from '$app/environment';

    let {
        src,
        size="100%",
        awaiting=$bindable()
    } = $props()

    let svgContent = $state("")
    let svgViewBox = $state("")
    let loaded = $state(false)
    let loadError = $state(false)

    let isFile = $derived(Boolean(String(src).match(/.*\.(svg|png|jpg|jpeg)/g)))
    let isRaster = $derived(Boolean(String(src).match(/.*\.(png|jpg|jpeg)/g)))

    function resolvePath(path) {
        if (!path || path.startsWith('http') || path.startsWith('data:')) return path;
        let cleaned = String(path).replace(/^(\.\.?\/)+/, '');
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
            if (!isFile) { extractSvg(String(src)) }
            loaded = true; return
        }
        if (isRaster) { loaded = true; return }
        loaded = false; loadError = false
        console.log('[Icon] fetching:', resolvePath(src));
        fetch(resolvePath(src))
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            })
            .then(text => {
                console.log('[Icon] got', text.length, 'bytes for', src);
                extractSvg(text);
                loaded = true;
            })
            .catch(err => {
                console.log('[Icon] error:', err.message);
                loadError = true;
                loaded = true;
            })
    })
</script>

<div class=icon-wrap style="width:{size};height:{size};display:inline-flex;align-items:center;justify-content:center;overflow:hidden">
    {#if isRaster}
        {#await awaiting}
            <div style="width:60%;height:60%;border-radius:50%;background:var(--overlay,#ccc)"></div>
        {:then}
            <img class=icon style="width:100%;height:100%" src={resolvePath(src)} alt={src} />
        {:catch}
            <div style="width:60%;height:60%;border-radius:50%;background:var(--red,#f00)"></div>
        {/await}
    {:else if !loaded}
        <div style="width:60%;height:60%;border-radius:50%;background:var(--overlay,#ccc)"></div>
    {:else if loadError}
        <div title="Icon error: {src}" style="width:60%;height:60%;border-radius:50%;background:var(--red,#f00)"></div>
    {:else}
        <svg class=icon style="width:100%;height:100%" viewBox={svgViewBox}>
            {@html svgContent}
        </svg>
    {/if}
</div>
