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

function mergeProfiles(fallback, pyData) {
    for (const [key, obj] of Object.entries(pyData)) {
        const fb = fallback[key] || {}
        const merged = { ...fb, ...obj }
        if (fb.iconSVG) merged.iconSVG = fb.iconSVG
        if (fb.iconFile) merged.iconFile = fb.iconFile
        if (fb.params) merged.params = fb.params
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
