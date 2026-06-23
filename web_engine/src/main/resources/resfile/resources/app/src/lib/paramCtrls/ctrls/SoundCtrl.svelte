<script>
    import FileCtrl from "./FileCtrl.svelte";

    let notes = [
        "C", 
        "Csh", "C#", "Dfl", "D♭", 
        "D", 
        "Dsh", "D#", "Efl", "E♭", 
        "E",
        "F", 
        "Fsh", "F#", "Gfl", "G♭", 
        "G", 
        "Gsh", "G#", "Afl", "A♭", 
        "A", 
        "Ash", "A#", "Bfl", "B♭", 
        "B"
    ]

    let {
        /** @prop @type {import("$lib/experiment").Param} Param object to which this ctrl pertains */
        param=$bindable(),
        /** @prop @type {boolean} Controls whether this control is disabled */
        disabled=false,
        /** @bindable State tracking whether this param's value is valid */
        valid=$bindable(),
        /** @interface */
        ...attachments
    } = $props()
    

    function validateSound(param, valid) {
        // allow musical notes
        if (notes.includes(param.val)) {
            valid.value = true
            valid.warning = undefined
        }
    }
</script>

<FileCtrl 
    bind:param={param}
    disabled={disabled}
    bind:valid={valid}
    {@attach element => param.registerValidator("sound", validateSound, -5)}
    {...attachments}
/>