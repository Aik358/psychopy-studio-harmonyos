<script>
    import { zoom, setZoom } from "$lib/utils/zoom.svelte.js";
    import { Icon } from "$lib/utils/icons";
</script>

<div class="zoom-slider" title="Zoom">
    <Icon src="/icons/btn-find.svg" size="14px" />
    <input
        type="range"
        min="50"
        max="200"
        value={zoom.level}
        oninput={(e) => setZoom(Number(e.target.value))}
    />
    <span class="zoom-label">{zoom.level}%</span>
</div>

<style>
    .zoom-slider {
        display: inline-flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
        padding: 2px 8px;
        margin: 0 4px;
        border-left: 1px solid var(--overlay);
    }
    .zoom-slider input[type="range"] {
        width: 120px;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: var(--overlay);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
    }
    .zoom-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--text);
        cursor: pointer;
        border: none;
    }
    .zoom-slider input[type="range"]::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--text);
        cursor: pointer;
        border: none;
    }
    .zoom-label {
        font-size: 11px;
        color: var(--text);
        min-width: 36px;
        text-align: right;
    }
</style>
