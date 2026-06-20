<script>
    let {
        component,
        hovered=$bindable()
    } = $props()
</script>

<div class=static-period-container>
    <div 
        class=static-period
        style:left="{component.visualStart === null ? 0 : component.visualStart * 100 / component.routine.visualStop}%"
        style:right="{component.visualStop === null || (component.routine.visualStop && component.visualStop > component.routine.visualStop) ? 0 : (component.routine.visualStop - component.visualStop) * 100 / component.routine.visualStop}%"
        style:opacity={hovered ? "0.5" : "0.25"}
        onmouseenter={() => hovered = true}
        onmouseleave={() => hovered = false}
        role=none
    ></div>
</div>

<style>
    .static-period-container {
        position: relative;
        grid-row-start: timeline-top;
        grid-row-end: timeline-bottom;
        grid-column-start: timeline;
        z-index: 0;
    }
    .static-period {
        position: absolute;
        background-color: var(--red);
        border: 1px solid var(--red);
        top: 0;
        bottom: 0;
        transition: opacity .2s;
    }
</style>