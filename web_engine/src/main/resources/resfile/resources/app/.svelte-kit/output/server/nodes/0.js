

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const universal = {
  "csr": true,
  "prerender": true,
  "ssr": false,
  "trailingSlash": "always"
};
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.wTorflsW.js","_app/immutable/chunks/C_3iLvAe.js","_app/immutable/chunks/BjC7Y9vB.js","_app/immutable/chunks/F3Urv05k.js"];
export const stylesheets = [];
export const fonts = [];
