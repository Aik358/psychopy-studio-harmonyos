<script>
    import { Icon } from "$lib/utils/icons";
    
    let {
        /** @interface */
        children
    } = $props()

    let hovered = $state.raw(false)

</script>

<div
    class=info
    style:opacity={hovered ? 1 : 0.25}
    onmouseenter={() => hovered = true}
    onmouseleave={() => hovered = false}
    onfocusin={() => hovered = true}
    onfocusout={() => hovered = false}
    role=none
>
    <Icon 
        src="/icons/sym-info.svg"
    />

    {#if hovered}
        {@render children?.()}
    {/if}
</div>


<style>
    .info {
        height: 1.5rem;
        width: 1.5rem;
        padding: .25rem;
        box-sizing: border-box;
        background-color: var(--outline);
        color: var(--base);
        border-radius: 50%;
    }
</style>