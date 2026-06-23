import { electron } from "$lib/globals.svelte";


export class Clipboard {
    last = undefined

    get() {
        if ( electron ) {
            // get from app if there is one
            return electron.clipboard.get().then(
                resp => this.last = resp
            )
        } else {
            // otherwise, use last set value
            return this.last
        }
        
    }

    set(value) {
        // set last
        this.last = value
        // set in app if there is one
        if ( electron ) {
            return electron.clipboard.set(value)
        }
    }
}
    