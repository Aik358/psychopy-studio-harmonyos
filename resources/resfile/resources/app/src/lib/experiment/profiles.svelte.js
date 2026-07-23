import FallbackComponentProfiles from "$lib/experiment/fallbacks/components.json";
import FallbackLoopProfiles from "$lib/experiment/fallbacks/loops.json";
import FallbackDeviceProfiles from "$lib/experiment/fallbacks/devices.json";
import FallbackPreferencesProfile from "$lib/preferences.json";
import { python } from "$lib/globals.svelte";


export var profiles = $state({
    components: FallbackComponentProfiles,
    loops: FallbackLoopProfiles,
    devices: FallbackDeviceProfiles,
    preferences: FallbackPreferencesProfile
})

export var pending = $state({
    components: Promise.resolve(),
    loops: Promise.resolve(),
    devices: Promise.resolve(),
    preferences: Promise.resolve()
})

export function mergeProfiles(fallback, pyData) {
    // Guard: if the liaison returned a list / error / non-object (e.g. psychopy
    // unavailable or version mismatch), keep the bundled fallback instead of
    // corrupting profiles (which would blank out every component's params).
    if (!pyData || typeof pyData !== "object" || Array.isArray(pyData)) {
        console.warn("[profiles] liaison returned non-object profile data; keeping bundled fallback:", pyData);
        return;
    }
    for (const [key, obj] of Object.entries(pyData)) {
        // Only augment components we already know from the bundled fallback.
        // Unknown keys from psychopy would lack iconSVG/params/label and render
        // as blank ("gray bar") entries — skip them.
        const fb = fallback[key];
        if (!fb || typeof obj !== "object") continue;
        const merged = { ...fb, ...obj }
        // Always keep the bundled display-critical fields; psychopy's obj may
        // omit or blank them (this is what produced the gray bars on refresh).
        if (fb.iconSVG) merged.iconSVG = fb.iconSVG
        if (fb.iconFile) merged.iconFile = fb.iconFile
        if (fb.params) merged.params = fb.params
        if (fb.label) merged.label = fb.label
        if (fb.tooltip) merged.tooltip = fb.tooltip
        fallback[key] = merged
    }
}

if ( python ) {
    python.liaison.ready("app").then(
        (ready) => {
            if (!ready) {
                console.warn("[profiles] liaison not ready, keeping fallback profiles")
                return
            }
            // get components
            pending.components = python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.experiment:getElementProfiles"
                ]
            }).then(
                data => mergeProfiles(profiles.components, data)
            )
            // get loops
            pending.loops = python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.experiment:getLoopProfiles"
                ]
            }).then(
                data => mergeProfiles(profiles.loops, data)
            )
            // get devices
            pending.devices = python.liaison.send("app", {
                command: "run",
                args: [
                    "psychopy.experiment:getDeviceProfiles"
                ]
            }).then(
                resp => mergeProfiles(profiles.devices, resp)
            )
        }
    )
}
