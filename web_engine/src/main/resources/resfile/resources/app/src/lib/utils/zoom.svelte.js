const STORAGE_KEY = 'psychopy.zoomLevel.v1';
const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 100;

function _readPersist() {
    if (typeof localStorage === 'undefined') return DEFAULT_ZOOM;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            const val = parseInt(raw, 10);
            if (!isNaN(val) && val >= MIN_ZOOM && val <= MAX_ZOOM) return val;
        }
    } catch (_) {}
    return DEFAULT_ZOOM;
}

function _writePersist(level) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, String(level)); } catch (_) {}
}

export const zoom = $state({
    level: _readPersist()
});

export function setZoom(val) {
    zoom.level = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(val)));
    _writePersist(zoom.level);
}

export function zoomCSS() {
    return `scale(${(zoom.level / 100).toFixed(2)})`;
}
