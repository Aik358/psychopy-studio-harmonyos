<script>
    import { asset } from '$app/paths';

    let {
        src,
        size="100%",
        /** @prop @type {boolean} Are we awaiting execution of anything for this icon? */
        awaiting=$bindable()
    } = $props()

    // transform source to a URL
    let url = $derived.by(() => {
        if (String(src).match(/.*\.(svg|png|jpg|jpeg)/g)) {
            return asset(src)
        } else {
            let blob = new Blob([src], {type: 'image/svg+xml'})
            return URL.createObjectURL(blob);  
        }
    })

    // For SVG vectors: fetch or inline SVG content so CSS variables work
    // TODO: If CSS variables are fixed upstream, revert to original <use href={url}> approach
    let svgContent = $state('');
    let svgError = $state(false);

    // Detect if src is inline SVG XML (starts with <svg) vs a file path
    let isInlineSvg = $derived(String(src).trim().startsWith('<'));

    $effect(() => {
        if (!String(src).match(/.*\.(png|jpg|jpeg)/g)) {
            svgError = false;
            if (isInlineSvg) {
                // Inline SVG XML - use directly
                svgContent = src;
            } else if (String(src).match(/.*\.svg/g) && url) {
                // External SVG file - fetch and inline
                fetch(url)
                    .then(r => r.text())
                    .then(text => {
                        svgContent = text;
                    })
                    .catch(() => {
                        svgError = true;
                    });
            }
        }
    });
</script>

{#if String(src).match(/.*\.(png|jpg|jpeg)/g)}
    <!-- rasterised images -->
    {#await awaiting}
        <img 
            class=icon
            style:width={size}
            style:height={size}
            src={asset("/icons/sym-pending.svg")} 
            alt="Loading..."
        />
    {:then}
        <img 
            class=icon
            style:width={size}
            style:height={size}
            src={url} 
            alt={url}
        />
    {:catch}
        <img 
            class=icon
            style:width={size}
            style:height={size}
            src={asset("/icons/sym-error.svg")} 
            alt="Error"
        />
    {/await}
{:else if svgError}
    <!-- SVG loaded via <img> as fallback when fetch fails -->
    <img 
        class=icon
        style:width={size}
        style:height={size}
        src={url}
        alt={url}
    />
{:else if svgContent}
    <!-- inline SVG in a styled container: CSS variables inherit from page context -->
    <span class=icon style:width={size} style:height={size} style:display="inline-flex" style:align-items="center" style:justify-content="center">
        {@html svgContent}
    </span>
{:else}
    <!-- loading / awaiting state -->
    {#await awaiting}
        <svg 
            class=icon
            style:width={size}
            style:height={size}
        >
            <use href={asset("/icons/sym-pending.svg#animation")} />
        </svg>
    {:then}
        <span style:width={size} style:height={size}></span>
    {:catch}
        <svg 
            class=icon
            style:width={size}
            style:height={size}
        >
            <use href={asset("/icons/sym-error.svg")} />
        </svg>
    {/await}
{/if}
