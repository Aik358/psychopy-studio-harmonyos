<script>
    let {
        /** @interface */
        children
    } = $props()
</script>

<div id=ribbon>
    {@render children()}
</div>

<style>
    /* --- Frame ribbon ---*/

    #ribbon {
        display: flex;
        flex-direction: row;
        padding: .5em;
        background-color: var(--crust);
        position: relative;
    }    
</style>