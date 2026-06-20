<script>
    import { ParamsNotebook, ParamCtrl } from "$lib/paramCtrls";
    import DeviceProfile from "./DeviceProfile.svelte";

    let {
        device
    } = $props()
</script>


<div class=device-details-pnl>
    <ParamsNotebook
        element={device}
    />
    <DeviceProfile 
        profile={device.profile}
    />
</div>

<style>
    .device-details-pnl {
        grid-row-start: start;
        grid-row-end: end;
        grid-column-start: details;

        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: start;
        box-sizing: border-box;
        position: relative;
    }
</style>