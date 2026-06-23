<script>
    import { setContext } from "svelte";

    let {
        /** @interface */
        children
    } = $props()

    let nodes = $state({
        selected: undefined
    });

    setContext("siblings", nodes);
</script>

<div class=tree-root>
    {@render children?.()}
</div>

<style>
    .tree-root {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: .25rem;
        background-color: var(--base);
        flex-grow: 1;
        padding-bottom: 1rem;
        box-sizing: border-box;
    }
</style>