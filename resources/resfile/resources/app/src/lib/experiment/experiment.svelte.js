import { devices } from "$lib/globals.svelte";
import { python, electron } from "$lib/globals.svelte";
import path from "path-browserify";
import { parsePath } from "$lib/utils/files";
import xmlFormat from 'xml-formatter';
import { Routine, StandaloneRoutine } from "./routine.svelte";
import { Component } from "./component.svelte";
import { Flow, LoopInitiator } from "./flow.svelte";
import { setupPython } from "$lib/python";
import { exportExperimentToJS } from "$lib/utils/psychojs-exporter.js";


export class Experiment {

    version = "2026.1.0"

    routines = $state({})
    file = $state(undefined)
    running = $state.raw(undefined)

    /** store past and future states for this experiment */
    history = $state({
        past: [],
        future: [],
        update: (msg) => {
            // store experiment state
            this.history.past.push(
                {
                    msg: msg,
                    state: this.toJSON()
                }
            )
            // limit to 16 items to save memory
            while (this.history.past.length >= 16) {
                delete this.history.past[0]
                this.history.past = this.history.past.slice(1);
            }
            // clear future
            this.history.future = []
        },
        clear: () => {
            // clear arrays for past and future
            this.history.past = []
            this.history.future = []
        },
        undo: () => {
            // do nothing if we have no past
            if (!this.history.past) {
                return
            }
            // get last state
            let last = this.history.past.pop()
            // store present as future
            this.history.future.unshift({
                msg: last.msg, 
                state: this.toJSON()
            })
            // restore last state
            this.fromJSON(
                last.state
            )
        },
        redo: () => {
            // do nothin if we have no future
            if (!this.history.future) {
                return
            }
            // get next state
            let next = this.history.future.shift()
            // add current state to past
            this.history.past.push({
                msg: next.msg,
                state: this.toJSON()
            })
            // restore next state
            this.fromJSON(
                next.state
            )
        }
    })

    /** Stores all names used in this experiment */
    namespace = $derived.by(() => {
        // start with none
        let names = {}
        // iterate through all Routines
        for (let rt of Object.values(this.routines)) {
            // for a Routine, iterate through Components
            if (rt instanceof Routine) {
                for (let comp of rt.components) {
                    // add Component name and param
                    names[comp.name] = comp.params['name']
                }
                // add Routine name and param
                names[rt.name] = rt.settings.params['name']
            } else {
                // add Routine name and param
                names[rt.name] = rt.params['name']
            }
        }
        // iterate through all loops
        for (let loop of Object.values(this.flow.loops)) {
            // add Loop name
            names[loop.name] = loop.params['name']
        }
        // iterate through all devices
        for (let device of Object.values(devices)) {
            names[device.name] = device.params['name']
        }
        
        return names
    })

    /**
     * If the given name conflicts with this experiment's namespace, transform it until it doesn't
     */
    resolveNameConflict(name) {
        // return as is if already valid
        if (!Object.keys(this.namespace).includes(name)) {
            return name
        }
        // choose where to start numbering
        let index = 1;
        if (String(name).match(/\d+$/)) {
            // if it already ends with a number, get the number
            index = parseInt(
                String(name).match(/\d+$/)[0]
            );
            // remove it from the name
            name = String(name).replace(/\d+$/, "")
        }
        // iterate index until name is unique
        while (Object.keys(this.namespace).includes(`${name}${index}`)) {
            index += 1
        }

        return `${name}${index}`
    }

    /**
     *
     * @param {String} filename Name of the experiment file
     */
    constructor(filename) {
        // create attributes
        this.settings = new Component("SettingsComponent")
        this.flow = new Flow(this);
        // starting defaults
        this.reset()
        // set filename
        if (filename) {
            this.file = parsePath(filename);
        }
    }

    /** 
     * Get a path relative to this experiment's root folder 
     */
    relativePath(value) {
        if (this.file?.parent && !path.isAbsolute(value)) {
            return path.join(this.file?.parent, value) 
        } else {
            return value
        }
    }

    /**
     * Reset this Experiment as if from new
     */
    reset(keepHistory=false) {
        // clear file
        this.file = {
            file: undefined,
            parent: undefined,
            name: "untitled.psyexp",
            stem: "untitled",
            ext: ".psyexp"
        }
        // set to current version
        this.version = "2026.1.0"
        // clear history
        if (!keepHistory) {
            this.history.clear()
        }
        // reset settings
        this.settings.reset()
        // remove all routines
        Object.keys(this.routines).forEach((key) => delete this.routines[key])
        // clear the flow
        this.flow.clear()
        // add a default routine
        this.routines['trial'] = new Routine();
        this.routines['trial'].exp = this;
        this.routines['trial'].settings.params['name'].val = "trial";
        this.flow.flat.push(this.routines['trial'])
    }

    /**
     * Search this experiment for a particular phrase
     */
    search(searchTerm, useRegex=false, caseSensitive=false) {
        let results = []
        // abort if search term is blank
        if (searchTerm === "") {
            return results;
        }
        // search all routines
        for (let routine of Object.values(this.routines)) {
            results.push(
                ...routine.search(searchTerm, useRegex, caseSensitive)
            )
        }
        // search all loops
        for (let element of Object.values(this.flow.flat)) {
            if (element instanceof LoopInitiator) {
                results.push(
                    ...element.search(searchTerm, useRegex, caseSensitive)
                )
            }
        }
        // search settings
        results.push(
            ...this.settings.search()
        )

        return results
    }

    pilotMode = $derived(this.settings.params['runMode'].val)

    getPilotMode() {
        return this.settings.params['runMode'].val
    }

    setPilotMode(value) {
        this.settings.params['runMode'].val = value
    }

    /**
     * List of all Static Components in this Experiment
     */
    updateTargets = $derived.by(() => {
        let targets = [];
        // iterate through Routines
        for (let rt of Object.values(this.routines)) {
            targets.push(
                ...rt.updateTargets
            )
        }

        return targets
    })

    /**
     * Get this Experiment as a JSON string.
     */
    toJSON() {
        // create node
        let node = {
            filename: this.file.file,
            version: this.version,
            settings: this.settings.toJSON(),
            routines: {},
            flow: this.flow.toJSON(),
        };
        // add routines
        for (let [name, routine] of Object.entries(this.routines)) {
            node.routines[name] = routine.toJSON()
        }
        
        return node
    }

    /**
     * Populate this Experiment from a JSON object
     * 
     * @param {Object} node JSON object representing this Experiment
     */
    fromJSON(node) {
        // reset experiment
        this.reset(true)
        // set basic attributes
        this.file = parsePath(node.filename);
        this.version = node.version;
        // copy settings
        this.settings.fromJSON(node.settings);
        // add each routine from JSON
        for (let [name, profile] of Object.entries(node.routines)) {
            // make a new routine
            let rt = new Routine();
            rt.exp = this;
            // populate it from JSON
            rt.fromJSON(profile)
            // append it
            this.routines[name] = rt
        }
        // populate flow from JSON
        this.flow.fromJSON(node.flow)
    }

    /**
     * Populate this Experiment from an XML element
     * 
     * @param {Element} node XML element to create the Experiment from
     */
    fromXML(node) {
        // if given a string, parse it as XML
        if (typeof node === "string") {
            let document = new DOMParser().parseFromString(node, "application/xml");
            node = document.getElementsByTagName("PsychoPy2experiment")[0];
        }
        // reset experiment
        this.reset()
        // get version
        this.version = node.getAttribute("version");
        // get settings
        this.settings.fromXML(
            node.getElementsByTagName("Settings")[0]
        );
        // get routines
        let routinesNode = node.getElementsByTagName("Routines")[0];
        for (let routineNode of routinesNode.childNodes) {
            // skip blank nodes
            if (routineNode instanceof Text) {
                continue
            }
            // parse node
            let routine;
            if (routineNode.nodeName === "Routine") {
                routine = new Routine(); 
            } else {
                routine = new StandaloneRoutine(routineNode.nodeName);
            }
            routine.exp = this;
            routine.fromXML(routineNode);
            // parse and append node
            this.routines[routine.name] = routine
        }
        // get flow
        this.flow.fromXML(
            node.getElementsByTagName("Flow")[0]
        );
    }

    /**
     * Get this experiment as an XML element
     */
    toXML() {
        // create document
        let doc = document.implementation.createDocument(null, "xml");
        let main = doc.createElement("PsychoPy2experiment");
        main.setAttribute("encoding", "utf-8");
        main.setAttribute("version", this.version);
        // create settings node
        let settingsNode = this.settings.toXML();
        settingsNode.removeAttribute("name");
        settingsNode.removeAttribute("plugin");
        main.appendChild(settingsNode);
        // create routines node
        let routinesNode = doc.createElement("Routines");
        for (let [name, routine] of Object.entries(this.routines)) {
            // get xml of each routine
            routinesNode.appendChild(
                routine.toXML()
            )
        }
        main.appendChild(routinesNode)
        // create flow node
        let flowNode = this.flow.toXML()
        main.appendChild(flowNode)

        return main
    }

    async fromFile(file) {
        // parse to object if needed
        if (typeof file === "string") {
            file = parsePath(file)
        }
        // read text content from file
        let content
        if (electron) {
            content = await electron.files.load(file.file)
        } else {
            // without electron, file needs to have a handle (from a UI interaction)
            content = await file.handle.text()
        }
        // load from content
        this.fromXML(content)
        // store file
        this.file = file
    }

    async toFile(file) {
        // get experiment as xml
        let node = this.toXML()
        // convert to an xml string
        let ser = new XMLSerializer()
        let content = ser.serializeToString(node)
        // make human readable
        content = xmlFormat(content)
        // write file
        if (electron) {
            await electron.files.save(
                $state.snapshot(file.file), 
                content
            )
        } else {
            // get file writable from handle
            file.writable = await file.handle.createWritable();
            // write to file
            file.writable.seek(0);
            file.writable.write(content);
            file.writable.close();
        }
        // if indicated in exp settings, export JS
        if (this.settings.params['exportHTML'].val === "on Save") {
            this.writeScript("PsychoJS")
        }
    }

    async writeScript(target="PsychoPy", executable=undefined) {
        if (!python) {
            console.error("Script writing is not available in browser.")
            return
        }
        // error if there's no psyexp
        if (!this.file.file) {
            console.error("Cannot compile to Python on an experiment with no psyexp file attached")
            return
        }
        // save to file
        await this.toFile(this.file)
        // construct output path
        let targetFile = path.join(
            this.file.parent,
            this.file.stem + (target === "PsychoJS" ? ".js" : ".py")
        )
        // make sure relevant Python version is setup
        let version = $state.snapshot(this.settings.params['Use version'].val)
        if (version) {
            await setupPython(version)
        }
        version = version || "app"
        // reload devices.json if necessary
        await python.liaison.send(version, {
            command: "try",
            args: ["prefs.setDevicesFile", path.join(
                await electron.paths.user(), "devices.json"
            )]
        }, 10000).catch(
            err => logging.error([`Failed to set devices file`, err])
        )

        // create experiment object via Liaison
        await python.liaison.send(version, {
            command: "init",
            args: [
                "currentExperiment",
                "psychopy.experiment:Experiment"
            ]
        }, 10000).catch(
            reason => console.error(reason)
        )
        // load from file
        await python.liaison.send(version, {
            command: "run",
            args: [
                "currentExperiment.loadFromXML",
                $state.snapshot(this.file.file)
            ]
        }, 10000).catch(
            reason => console.error(reason)
        )
        // write script
        let script = await python.liaison.send(version, {
            command: "run",
            args: [
                "currentExperiment.writeScript",
            ],
            kwargs: {
                target: target, 
                modular: true,
                expPath: this.file.file
            }
        }, 10000).catch(
            reason => console.error(reason)
        )
        // save to python/js file
        if (typeof script === "string") {
            const savedPath = await electron.files.save(targetFile, script)
            // If save returned a different path (fallback), use that
            if (typeof savedPath === 'string' && savedPath !== targetFile) {
                console.warn(`[writeScript] File saved to fallback path: ${savedPath}`)
                targetFile = savedPath
            }
        } else {
            console.error(script)
        }

        return targetFile
    }

    /**
     * Run this experiment in Python.
     * 
     * @param {boolean} compile If true, compile the experiment to Python before running
     */
    async runPython(compile=true) {
        // fail if there's no Python to run in
        if (!python) {
            console.error("Script running is not available in browser.")
            return
        }
        // compile first if requested
        let target
        if (compile) {
            target = await this.writeScript("PsychoPy")
        } else {
            // otherwise, construct output path
            target = path.join(
                this.file.parent,
                this.file.stem + ".py"
            )
        }
        // make sure relevant Python version is setup
        let version = $state.snapshot(this.settings.params['Use version'].val) || "app"
        if (version) {
            await setupPython(version)
        }
        // mark started
        await python.output.stdout.send(
            `--- Started experiment ${this.file.name} ---`
        )
        // run script
        this.running = await python.scripts.run(
            version,
            target, 
            ...(this.pilotMode ? ["--pilot"] : []),
            "--prefs-json",
            await electron.paths.prefs()
        )
        await python.scripts.finished(version, this.running)
        // mark finished
        this.running = undefined
        await python.output.stdout.send(
            `--- Finished experiment ${this.file.name} ---`
        )
    }

    async stopPython() {
        // do nothing if nothing is running
        if (this.running === undefined) {
            return
        }
        // fail if there's no Python to run in
        if (!python) {
            console.error("Script running is not available in browser.")
            return
        }
        // figure out version
        let version = $state.snapshot(this.settings.params['Use version'].val) || "app"
        // request stop from electron
        await python.scripts.stop(version, this.running)
        // mark finished
        this.running = undefined
        await python.output.stdout.send(
            `--- Stopped experiment ${this.file.name} ---`
        )
    }

    /**
     * Run this experiment in PsychoJS via system browser.
     * Uses the official compiled JS if available, otherwise generates from model.
     */
    async runJS(compile=true) {
        if (!electron) {
            alert("Browser running is only available in Electron/PsychoPy-Oh.");
            return;
        }
        if (!python || !python.psychojs || typeof python.psychojs.browserRun !== 'function') {
            alert("[PsychoJS Browser] python.psychojs.browserRun IPC not available.");
            return;
        }
        try {
            let expName = this.file?.stem || "experiment";
            let expDir = this.file?.parent || "";
            // Try multiple possible official JS filenames
            let jsCandidates = [
                path.join(expDir, expName + ".js"),
                path.join(expDir, (expName || "").replace(/[-\s]+/g, "") + ".js"),
            ];
            // Also check for .js files in expDir via scandir
            try {
                let dirFiles = await electron.files.scandir(expDir, false);
                for (let f of dirFiles) {
                    if (f.endsWith(".js") && !f.includes("node_modules")) {
                        jsCandidates.push(path.join(expDir, f));
                    }
                }
            } catch(e) {}

            let finalJSCode = "";
            let conditionsJSON = "";
            let resourceFiles = [];
            let officialJSPath = "";

            // Try each candidate
            for (let candidate of jsCandidates) {
                try {
                    let exists = await electron.files.exists(candidate);
                    if (exists) {
                        console.log(`[PsychoJS Browser] Testing official JS: ${candidate}`);
                        finalJSCode = await electron.files.load(candidate);
                        officialJSPath = candidate;
                        console.log(`[PsychoJS Browser] Loaded official JS: ${candidate} (${finalJSCode.length} chars)`);
                        break;
                    }
                } catch(e) {
                    console.warn(`[PsychoJS Browser] Skip candidate ${candidate}: ${e.message}`);
                }
            }

            if (officialJSPath) {

                // Find XLSX conditions files referenced in the experiment
                for (const flowItem of (this.flow?.flat || [])) {
                    if (typeof flowItem.addTerminator === 'function') {
                        let condFile = flowItem.params?.conditionsFile?.val || flowItem._conditionsFile;
                        if (condFile) {
                            let condPath = condFile;
                            if (expDir && !path.isAbsolute(condFile)) {
                                condPath = path.join(expDir, condFile);
                            }
                            resourceFiles.push({ rel: condFile, abs: condPath });
                        }
                    }
                }
            } else {
                // Use generated code
                console.log(`[PsychoJS Browser] Compiling experiment from model...`);
                if (typeof exportExperimentToJS !== 'function') {
                    alert("[PsychoJS Browser] exportExperimentToJS is not loaded.");
                    return;
                }

                // Read conditions from loops
                let conditions = [];
                for (const flowItem of (this.flow?.flat || [])) {
                    if (typeof flowItem.addTerminator === 'function') {
                        let condFile = flowItem.params?.conditionsFile?.val || flowItem._conditionsFile;
                        if (!condFile) continue;
                        let condPath = condFile;
                        if (expDir && !path.isAbsolute(condFile)) {
                            condPath = path.join(expDir, condFile);
                        }
                        try {
                            if (python.psychojs.readConditions) {
                                conditionsJSON = await python.psychojs.readConditions(condPath);
                                conditions = JSON.parse(conditionsJSON || "[]");
                                console.log(`[PsychoJS Browser] Loaded ${conditions.length} conditions`);
                            }
                        } catch (e) {
                            console.warn(`[PsychoJS Browser] Could not read conditions: ${condPath}`, e);
                        }
                        break;
                    }
                }

                finalJSCode = exportExperimentToJS(this, {
                    debug: this.settings.params?.debugMode?.val === "True",
                    conditions: conditions
                });
            }

            console.log(`[PsychoJS Browser] JS length: ${finalJSCode.length}, resources: ${resourceFiles.length}`);

            console.log(`[PsychoJS Browser] Calling python.psychojs.browserRun...`);
            const result = await python.psychojs.browserRun(
                finalJSCode, expName, conditionsJSON,
                officialJSPath ? JSON.stringify(resourceFiles) : "",
                officialJSPath ? expDir : ""
            );
            console.log(`[PsychoJS Browser] Result:`, result);
            // Open a new Electron window to load the PsychoJS runner
            if (result && result.address) {
                const runnerUrl = `http://${result.address}/index.html`;
                console.log(`[PsychoJS Browser] Opening runner window: ${runnerUrl}`);
                try {
                    // Try opening via electron.windows.new (creates a new BrowserWindow)
                    if (electron && electron.windows && typeof electron.windows.new === 'function') {
                        await electron.windows.new(runnerUrl);
                    } else if (electron && typeof electron.files !== 'undefined' && typeof electron.files.openExternal === 'function') {
                        // Fallback: openExternal
                        await electron.files.openExternal(runnerUrl);
                    } else {
                        // Last resort: open in current window's new tab
                        window.open(runnerUrl, '_blank');
                    }
                } catch (e) {
                    console.warn(`[PsychoJS Browser] Could not open runner window: ${e.message || e}`);
                    // Fallback: try openExternal
                    try { await electron.files.openExternal(runnerUrl); } catch(_) {}
                }
            } else if (result && result.error) {
                alert(`[PsychoJS Browser] Server error: ${result.error}`);
            }
        } catch (err) {
            console.error(`[PsychoJS Browser] ERROR:`, err);
            alert(`[PsychoJS Browser] Failed: ${err?.message || err}\nCheck console (Ctrl+Shift+I) for details.`);
        }
    }
}
