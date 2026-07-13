export const store = $state({
  activeView: 'builder',
  builderState: {
    saved: false,
    experimentJSON: null,
    file: null,
    routineName: null,
    readmeShown: false,
    project: null
  },
  coderState: {
    saved: false,
    pages: null,
    tab: 0
  },
  runnerState: {
    saved: false,
    runlist: null,
    selection: null,
    tab: 'alerts',
    output: null
  },
  generatedCode: {
    python: null,
    js: null,
    experimentJSON: null,
    sourceFile: null
  }
})

export let coderState = $state({
  saved: false,
  pages: null,
  tab: 0
})

export let runnerState = $state({
  saved: false,
  runlist: null,
  selection: null,
  tab: 'alerts',
  output: null
})

export let generatedCode = $state({
  python: null,
  js: null,
  experimentJSON: null,
  sourceFile: null
})
