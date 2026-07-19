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
    components: Promise.withResolvers().promise,
    loops: Promise.withResolvers().promise,
    devices: Promise.withResolvers().promise,
    preferences: Promise.withResolvers().promise
})

// populate on Liaison starting (if it ever does)
if ( python ) {
    let _profilesLoading = false
    python.liaison.ready("app").then(
        () => {
            if (_profilesLoading) return
            _profilesLoading = true
            // get components
            pending.components = python.liaison.send("app", {
                command: "run",
                args: ["psychopy.experiment:getElementProfiles"]
            }).then(data => {
                for (const [key, obj] of Object.entries(data)) {
                    const fb = profiles.components[key] || {}
                    const merged = { ...fb, ...obj }
                    if (fb.iconSVG) merged.iconSVG = fb.iconSVG
                    if (fb.iconFile) merged.iconFile = fb.iconFile
                    if (fb.params) merged.params = fb.params
                    profiles.components[key] = merged
                }
            })
            // get loops
            pending.loops = python.liaison.send("app", {
                command: "run",
                args: ["psychopy.experiment:getLoopProfiles"]
            }).then(data => {
                for (const [key, obj] of Object.entries(data)) {
                    const fb = profiles.loops[key] || {}
                    const merged = { ...fb, ...obj }
                    if (fb.iconSVG) merged.iconSVG = fb.iconSVG
                    if (fb.iconFile) merged.iconFile = fb.iconFile
                    if (fb.params) merged.params = fb.params
                    profiles.loops[key] = merged
                }
            })
            // get devices
            pending.devices = python.liaison.send("app", {
                command: "run",
                args: ["psychopy.experiment:getDeviceProfiles"]
            }).then(resp => {
                for (const [key, obj] of Object.entries(resp)) {
                    const fb = profiles.devices[key] || {}
                    const merged = { ...fb, ...obj }
                    if (fb.iconSVG) merged.iconSVG = fb.iconSVG
                    if (fb.iconFile) merged.iconFile = fb.iconFile
                    if (fb.params) merged.params = fb.params
                    profiles.devices[key] = merged
                }
            })
            // todo: get prefs
        }
    )
}