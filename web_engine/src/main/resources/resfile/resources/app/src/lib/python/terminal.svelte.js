function _getTerminal() {
    if (typeof window === 'undefined') return null;
    // Try standalone bridge first, then python.terminal fallback
    if (window.terminal) return window.terminal;
    if (window.python && window.python.terminal) return window.python.terminal;
    return null;
}

export const terminal = $state({
    open: false,
    lines: [],
    _listenersSetup: false,
    
    setup() {
        if (this._listenersSetup) return;
        const t = _getTerminal();
        if (!t) { this.lines = [...this.lines, { type: 'system', text: 'window.terminal not available. Rebuild HAP and retry.', time: Date.now() }]; return; }
        this._listenersSetup = true;
        // Listen for Python stdout/stderr forwarded by the preload DOM injection
        try { window.addEventListener('term-stdout', (e) => { this.lines = [...this.lines, { type: 'stdout', text: e.detail, time: Date.now() }]; }); } catch(_) {}
        try { window.addEventListener('term-stderr', (e) => { this.lines = [...this.lines, { type: 'stderr', text: e.detail, time: Date.now() }]; }); } catch(_) {}
        this.lines = [...this.lines, { type: 'system', text: 'Terminal ready. Listening for Python output...', time: Date.now() }];
    },

    toggle() {
        this.open = !this.open;
        if (this.open) this.setup();
    },

    clear() {
        this.lines = [];
    },

    async diagnose() {
        this.open = true;
        // Debug: show what's on window
        this.lines = [...this.lines, { type: 'system', text: '--- Checking window bridges ---', time: Date.now() }];
        try {
            const keys = typeof window !== 'undefined' ? Object.keys(window).filter(k => !k.startsWith('__') && !k.startsWith('webkit') && !k.startsWith('on')).join(', ') : 'window is undefined';
            this.lines = [...this.lines, { type: 'stdout', text: 'window keys: ' + keys.slice(0, 500), time: Date.now() }];
            this.lines = [...this.lines, { type: 'stdout', text: 'window.python: ' + (typeof window.python), time: Date.now() }];
            this.lines = [...this.lines, { type: 'stdout', text: 'window.terminal: ' + (typeof window.terminal), time: Date.now() }];
            this.lines = [...this.lines, { type: 'stdout', text: 'window.python.terminal: ' + (typeof window.python?.terminal), time: Date.now() }];
        } catch(e) {
            this.lines = [...this.lines, { type: 'stderr', text: 'Debug error: ' + e.message, time: Date.now() }];
        }
        // Then normal diagnose
        this.lines = [...this.lines, { type: 'system', text: '--- Running diagnostics ---', time: Date.now() }];
        const t = _getTerminal();
        if (!t) {
            this.lines = [...this.lines, { type: 'stderr', text: 'Terminal bridge not available.', time: Date.now() }];
            return;
        }
        try {
            const result = await t.diagnose();
            this.lines = [...this.lines, { type: 'stdout', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2), time: Date.now() }];
        } catch(e) {
            this.lines = [...this.lines, { type: 'stderr', text: 'Diagnostic error: ' + (e.message || String(e)), time: Date.now() }];
        }
    },
});
