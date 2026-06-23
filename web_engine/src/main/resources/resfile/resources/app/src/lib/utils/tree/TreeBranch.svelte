<script>
    import { Icon } from "$lib/utils/icons";
    import TreeNode from "./TreeNode.svelte";


    let {
        label,
        icon=undefined,
        /** @interface */
        children
    } = $props()

    let open = $state.raw(false);
</script>

<div 
    class=tree-branch
>
    <TreeNode
        label={label}
        icon={icon}
        onselect={(evt, data) => open = !open}
    >
        <!-- arrow showing open state -->
        {#snippet chevron()}
            <Icon 
                src="/icons/sym-arrow-{open ? "down" : "right"}.svg"
                size=".5rem"
            />
        {/snippet}
    </TreeNode>
    
    {#if open}
        <div class=tree-branch-nodes>
            {@render children?.()}
        </div>
    {/if}
</div>

<style>
    .tree-branch {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }
    .tree-branch-nodes {
        display: flex;
        flex-direction: column;
        gap: .5rem;
        align-items: stretch;
        margin-left: .5rem;
        padding-left: .5rem;
        border-left: 1px solid var(--overlay);
    }
</style>