/*
 * psychojs-exporter.js v20 — Legacy-Browsers Style
 *
 * Generates experiment.js code that matches the official PsychoPy output
 * from writeScript(target="PsychoJS", modular=False).
 *
 * Key difference from v19:
 *   - NO import statements (legacy-browsers style)
 *   - Uses global variables: PsychoJS, util, Scheduler, visual, core, data
 *   - These globals are set up by the bridge script in index.cjs HTML template
 *   - Follows official Scheduler-based flow control exactly
 *
 * Based on official PsychoPy 2025.2.4 source code analysis.
 */
export function exportExperimentToJS(experiment, options) {
  options = options || {};
  var expName = (experiment.file && experiment.file.stem) || "experiment";
  var conditions = options.conditions || [];
  var conditionFiles = options.conditionFiles || [];

  var routines = [];
  for (var k in (experiment.routines || {})) routines.push(experiment.routines[k]);
  var flows = (experiment.flow && experiment.flow.flat) || [];

  // ---- Detect routines and components ----
  var routineList = [];
  routines.forEach(function(r) {
    var rname = r.name || "trial";
    var comps = [];
    (r.components || []).forEach(function(c) {
      var p = c.params || {};
      var cn = (p.name && p.name.val) || "stim";
      var tag = c.tag || c.constructor.name || "";
      comps.push({ name: cn, tag: tag, params: p });
    });
    routineList.push({ name: rname, components: comps, isStandalone: !!(r instanceof Object) });
  });

  // ---- Build code sections following official template ----
  var lines = [];

  // Header
  lines.push("/***************");
  lines.push(" * " + expName + " *");
  lines.push(" ***************/");
  lines.push("");

  // NO import statements — using IIFE globals via bridge script

  // Store info about the experiment session
  lines.push("// store info about the experiment session:");
  lines.push("let expName = " + JSON.stringify(expName) + ";  // from the Builder filename that created this script");
  lines.push("let expInfo = {");
  lines.push("    'participant': '',");
  lines.push("    'session': '001',");
  lines.push("};");
  lines.push("let PILOTING = util.getUrlParameters().has('__pilotToken');");
  lines.push("");

  // Start code blocks for 'Before Experiment'
  lines.push("// Start code blocks for 'Before Experiment'");

  // init psychoJS:
  lines.push("// init psychoJS:");
  lines.push("const psychoJS = new PsychoJS({");
  lines.push("  debug: true");
  lines.push("});");
  lines.push("");

  // open window:
  lines.push("// open window:");
  lines.push("psychoJS.openWindow({");
  lines.push("  fullscr: true,");
  lines.push("  color: new util.Color([0,0,0]),");
  lines.push("  units: 'height',");
  lines.push("  waitBlanking: true,");
  lines.push("  backgroundImage: '',");
  lines.push("  backgroundFit: 'none',");
  lines.push("});");
  lines.push("");

  // schedule the experiment:
  lines.push("// schedule the experiment:");
  // Skip DlgFromDict for local browser (no dialog needed)
  lines.push("// Skip DlgFromDict for local browser");
  lines.push("psychoJS.gui._dialogComponent = { button: 'OK', status: PsychoJS.Status.FINISHED };");
  lines.push("");

  lines.push("const flowScheduler = new Scheduler(psychoJS);");
  lines.push("const dialogCancelScheduler = new Scheduler(psychoJS);");
  lines.push("psychoJS.scheduleCondition(function() { return (psychoJS.gui.dialogComponent.button === 'OK'); },flowScheduler, dialogCancelScheduler);");
  lines.push("");

  // flowScheduler
  lines.push("// flowScheduler gets run if the participants presses OK");
  flowScheduler_addRoutines(lines, routineList);
  lines.push("flowScheduler.add(quitPsychoJS, '', true);");
  lines.push("");

  // dialogCancelScheduler
  lines.push("// quit if user presses Cancel in dialog box:");
  lines.push("dialogCancelScheduler.add(quitPsychoJS, '', false);");
  lines.push("");

  // psychoJS.start
  var resourceList = buildResourceList(flows, conditions, conditionFiles);
  lines.push("psychoJS.start({");
  lines.push("  expName: expName,");
  lines.push("  expInfo: expInfo,");
  lines.push("  resources: [");
  if (resourceList.length > 0) {
    lines.push("    // resources:");
    resourceList.forEach(function(r) {
      lines.push("    {name: " + JSON.stringify(r.name) + ", path: " + JSON.stringify(r.path) + "}");
    });
  } else {
    lines.push("    // resources:");
  }
  lines.push("  ]");
  lines.push("});");
  lines.push("");

  lines.push("psychoJS.experimentLogger.setLevel(core.Logger.ServerLevel.EXP);");
  lines.push("");

  // ---- Global variables ----
  lines.push("var currentLoop;");
  lines.push("var frameDur;");
  lines.push("");

  // ---- updateInfo function ----
  lines.push("async function updateInfo() {");
  lines.push("  currentLoop = psychoJS.experiment;  // right now there are no loops");
  lines.push("  expInfo['date'] = util.MonotonicClock.getDateStr();  // add a simple timestamp");
  lines.push("  expInfo['expName'] = expName;");
  lines.push("  expInfo['psychopyVersion'] = '2025.2.4';");
  lines.push("  expInfo['OS'] = window.navigator.platform;");
  lines.push("");
  lines.push("  // store frame rate of monitor if we can measure it successfully");
  lines.push("  expInfo['frameRate'] = psychoJS.window.getActualFrameRate();");
  lines.push("  if (typeof expInfo['frameRate'] !== 'undefined')");
  lines.push("    frameDur = 1.0 / Math.round(expInfo['frameRate']);");
  lines.push("  else");
  lines.push("    frameDur = 1.0 / 60.0; // couldn't get a reliable measure so guess");
  lines.push("");
  lines.push("  // add info from the URL:");
  lines.push("  util.addInfoFromUrl(expInfo);");
  lines.push("");
  lines.push("  psychoJS.experiment.dataFileName = (('.' + '/') + `data/${expInfo['participant']}_${expName}_${expInfo['date']}`);");
  lines.push("  psychoJS.experiment.field_separator = '\\t';");
  lines.push("");
  lines.push("  return Scheduler.Event.NEXT;");
  lines.push("}");
  lines.push("");

  // ---- experimentInit function ----
  lines.push("var globalClock;");
  lines.push("var routineTimer;");
  lines.push("async function experimentInit() {");
  lines.push("  // Create some handy timers");
  lines.push("  globalClock = new util.Clock();  // to track the time since experiment started");
  lines.push("  routineTimer = new util.CountdownTimer();  // to track time remaining of each (non-slip) routine");

  // Initialize stimulus variables
  routineList.forEach(function(r) {
    r.components.forEach(function(c) {
      lines.push("  var " + c.name + ";  // " + c.tag);
    });
  });

  lines.push("  return Scheduler.Event.NEXT;");
  lines.push("}");
  lines.push("");

  // ---- Routine functions ----
  routineList.forEach(function(r) {
    genRoutineBegin(lines, r);
    genRoutineEachFrame(lines, r);
    genRoutineEnd(lines, r);
  });

  // ---- importConditions ----
  lines.push("function importConditions(currentLoop) {");
  lines.push("  return async function () {");
  lines.push("    psychoJS.importAttributes(currentLoop.getCurrentTrial());");
  lines.push("    return Scheduler.Event.NEXT;");
  lines.push("    };");
  lines.push("}");
  lines.push("");

  // ---- quitPsychoJS ----
  lines.push("async function quitPsychoJS(message, isCompleted) {");
  lines.push("  // Check for and save orphaned data");
  lines.push("  if (psychoJS.experiment.isEntryEmpty()) {");
  lines.push("    psychoJS.experiment.nextEntry();");
  lines.push("  }");
  lines.push("  psychoJS.window.close();");
  lines.push("  psychoJS.quit({message: message, isCompleted: isCompleted});");
  lines.push("  return Scheduler.Event.QUIT;");
  lines.push("}");

  return lines.join("\n");
}

function flowScheduler_addRoutines(lines, routineList) {
  if (routineList.length === 0) {
    lines.push("flowScheduler.add(updateInfo); // add timeStamp");
    lines.push("flowScheduler.add(experimentInit);");
    return;
  }

  lines.push("flowScheduler.add(updateInfo); // add timeStamp");
  lines.push("flowScheduler.add(experimentInit);");

  routineList.forEach(function(r) {
    lines.push("flowScheduler.add(" + r.name + "RoutineBegin());");
    lines.push("flowScheduler.add(" + r.name + "RoutineEachFrame());");
    lines.push("flowScheduler.add(" + r.name + "RoutineEnd());");
  });
}

function buildResourceList(flows, conditions, conditionFiles) {
  var resources = [];
  // Add conditions files (.xlsx etc.) as resources for PsychoJS runtime
  if (conditionFiles && conditionFiles.length > 0) {
    conditionFiles.forEach(function(f) {
      resources.push({ name: f, path: f });
    });
  }
  if (conditions && conditions.length > 0) {
    resources.push({ name: "conditions.json", path: "conditions.json" });
  }
  return resources;
}

function genRoutineBegin(lines, r) {
  lines.push("function " + r.name + "RoutineBegin() {");
  lines.push("  return async function () {");
  lines.push("    //--- Beginning of Routine '" + r.name + "' ---");
  lines.push("    " + r.name + "Clock = new util.Clock();");
  lines.push("    routineTimer.reset();");

  // Initialize components
  r.components.forEach(function(c) {
    genComponentInit(lines, c, r.name);
  });

  lines.push("    // keep track of which components have finished");
  lines.push("    " + r.name + "Components = [];");
  r.components.forEach(function(c) {
    lines.push("    " + r.name + "Components.push(" + c.name + ");");
  });
  lines.push("    for (const thisComponent of " + r.name + "Components)");
  lines.push("      if ('status' in thisComponent)");
  lines.push("        thisComponent.status = PsychoJS.Status.NOT_STARTED;");
  lines.push("    return Scheduler.Event.NEXT;");
  lines.push("  };");
  lines.push("}");
  lines.push("");
}

function genComponentInit(lines, c, routineName) {
  var p = c.params;
  if (c.tag === "TextComponent" || c.tag === "TextStim") {
    var text = JSON.stringify((p.text && p.text.val) || "");
    var font = JSON.stringify((p.font && p.font.val) || "Arial");
    var pos = formatPos(p.pos && p.pos.val);
    var height = (p.height && p.height.val) || 0.05;
    var color = JSON.stringify((p.color && p.color.val) || "white");
    lines.push("    " + c.name + " = new visual.TextStim({");
    lines.push("      win: psychoJS.window,");
    lines.push("      name: " + JSON.stringify(c.name) + ",");
    lines.push("      text: " + text + ",");
    lines.push("      font: " + font + ",");
    lines.push("      pos: " + pos + ",");
    lines.push("      height: " + height + ",");
    lines.push("      color: new util.Color(" + color + "),");
    lines.push("      wrapWidth: undefined,");
    lines.push("      ori: " + ((p.ori && p.ori.val) || 0) + ",");
    lines.push("      depth: 0");
    lines.push("    });");
  } else if (c.tag === "KeyboardComponent" || c.tag === "Keyboard") {
    lines.push("    " + c.name + " = new core.Keyboard({");
    lines.push("      psychoJS: psychoJS,");
    lines.push("      waitBlanking: true");
    lines.push("    });");
  } else {
    // Generic stub for unknown components
    lines.push("    " + c.name + " = {");
    lines.push("      status: PsychoJS.Status.NOT_STARTED,");
    lines.push("      setAutoDraw: function() {},");
    lines.push("      draw: function() {},");
    lines.push("    };");
  }
}

function genRoutineEachFrame(lines, r) {
  lines.push("function " + r.name + "RoutineEachFrame() {");
  lines.push("  return async function () {");
  lines.push("    //--- Loop for each frame of Routine '" + r.name + "' ---");
  lines.push("    let continueRoutine = true;");
  lines.push("    // get current time");
  lines.push("    let t = " + r.name + "Clock.getTime();");
  lines.push("    let frameN = 0;");

  // Component per-frame code
  r.components.forEach(function(c) {
    genComponentFrame(lines, c, r.name);
  });

  lines.push("    // check for quit (typically the Esc key)");
  lines.push("    if (psychoJS.experiment.experimentEnded || psychoJS.eventManager.getKeys({keyList:['escape']}).length > 0) {");
  lines.push("      return psychoJS.quit({message: 'The [Escape] key was pressed. Goodbye!', isCompleted: false});");
  lines.push("    }");
  lines.push("");
  lines.push("    // check if the Routine should terminate");
  lines.push("    if (!continueRoutine) {");
  lines.push("      // we are done");
  lines.push("      return Scheduler.Event.NEXT;");
  lines.push("    }");
  lines.push("    continueRoutine = false;");
  lines.push("    for (const thisComponent of " + r.name + "Components)");
  lines.push("      if ('status' in thisComponent && thisComponent.status !== PsychoJS.Status.FINISHED) {");
  lines.push("        continueRoutine = true;");
  lines.push("        break;");
  lines.push("      }");
  lines.push("    // refresh the screen if continuing");
  lines.push("    if (continueRoutine) {");
  lines.push("      return Scheduler.Event.FLIP_REPEAT;");
  lines.push("    } else {");
  lines.push("      return Scheduler.Event.NEXT;");
  lines.push("    }");
  lines.push("  };");
  lines.push("}");
  lines.push("");
}

function genComponentFrame(lines, c, routineName) {
  var p = c.params;
  var startVal = (p.startVal && p.startVal.val) || 0;
  var stopVal = (p.stopVal && p.stopVal.val) || "";

  if (c.tag === "TextComponent" || c.tag === "TextStim") {
    lines.push("    // *(" + c.name + ")* updates");
    lines.push("    if (t >= " + startVal + " && " + c.name + ".status === PsychoJS.Status.NOT_STARTED) {");
    lines.push("      " + c.name + ".setAutoDraw(true);");
    lines.push("    }");
    if (stopVal !== "" && stopVal !== undefined) {
      lines.push("    if (t >= " + stopVal + " && " + c.name + ".status === PsychoJS.Status.STARTED) {");
      lines.push("      " + c.name + ".setAutoDraw(false);");
      lines.push("    }");
    }
    lines.push("");
  } else if (c.tag === "KeyboardComponent" || c.tag === "Keyboard") {
    lines.push("    // *(" + c.name + ")* updates");
    lines.push("    if (t >= " + startVal + " && " + c.name + ".status === PsychoJS.Status.NOT_STARTED) {");
    lines.push("      " + c.name + ".status = PsychoJS.Status.STARTED;");
    lines.push("      psychoJS.window.callOnFlip(function(){ " + c.name + ".clock.reset(); });");
    lines.push("      psychoJS.eventManager.clearEvents({eventType:'keyboard'});");
    lines.push("    }");
    if (stopVal !== "" && stopVal !== undefined) {
      lines.push("    if (t >= " + stopVal + " && " + c.name + ".status === PsychoJS.Status.STARTED) {");
      lines.push("      " + c.name + ".status = PsychoJS.Status.FINISHED;");
      lines.push("    }");
    }
    lines.push("    if (" + c.name + ".status === PsychoJS.Status.STARTED) {");
    lines.push("      let theseKeys = psychoJS.eventManager.getKeys();");
    lines.push("      if (theseKeys.length > 0) {");
    lines.push("        // at least one key was pressed");
    lines.push("        " + c.name + ".keys = theseKeys;");
    lines.push("        " + c.name + ".rt = " + c.name + ".clock.getTime();");
    lines.push("        // was this 'correct'?");
    lines.push("        continueRoutine = false;");
    lines.push("      }");
    lines.push("    }");
    lines.push("");
  } else {
    // Generic component
    lines.push("    // *(" + c.name + ")* updates");
    lines.push("    if (t >= " + startVal + " && " + c.name + ".status === PsychoJS.Status.NOT_STARTED) {");
    lines.push("      " + c.name + ".status = PsychoJS.Status.STARTED;");
    lines.push("    }");
    lines.push("");
  }
}

function genRoutineEnd(lines, r) {
  lines.push("function " + r.name + "RoutineEnd() {");
  lines.push("  return async function () {");
  lines.push("    //--- Ending Routine '" + r.name + "' ---");
  lines.push("    for (const thisComponent of " + r.name + "Components) {");
  lines.push("      if (typeof thisComponent.setAutoDraw === 'function') {");
  lines.push("        thisComponent.setAutoDraw(false);");
  lines.push("      }");
  lines.push("    }");

  // Keyboard cleanup
  r.components.forEach(function(c) {
    if (c.tag === "KeyboardComponent" || c.tag === "Keyboard") {
      lines.push("    // " + c.name + " routine end");
      lines.push("    psychoJS.experiment.addData('" + c.name + ".keys', " + c.name + ".keys);");
      lines.push("    if (typeof " + c.name + ".keys !== 'undefined') {");
      lines.push("      psychoJS.experiment.addData('" + c.name + ".rt', " + c.name + ".rt);");
      lines.push("    }");
    }
  });

  lines.push("    // the Routine \"" + r.name + "\" was fulfilled");
  lines.push("    return Scheduler.Event.NEXT;");
  lines.push("  };");
  lines.push("}");
  lines.push("");
}

function formatPos(posVal) {
  if (!posVal) return "[0, 0]";
  if (Array.isArray(posVal)) return JSON.stringify(posVal);
  var s = String(posVal).trim();
  if (s.startsWith("[")) return s;
  // Try to parse comma-separated values
  var parts = s.split(",").map(function(p) { return parseFloat(p.trim()); });
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return "[" + parts[0] + ", " + parts[1] + "]";
  }
  return "[0, 0]";
}
