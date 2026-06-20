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
            // if already looks like a url, return as is
            return asset(src)
        } else {
            // blobbify data to get around cross-origin security nonsense
            let blob = new Blob([src], {type: 'image/svg+xml'})
            
            return URL.createObjectURL(blob);  
        }
    })
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
{:else}
    <!-- responsive SVG vectors -->
    <svg 
        class=icon
        style:width={size}
        style:height={size}
    >
        {#await awaiting}
            <use href={asset("/icons/sym-pending.svg#animation")} />
        {:then}
            <use href={url} />
        {:catch}
            <use href={asset("/icons/sym-error.svg")} />
        {/await}
    </svg>
{/if}
