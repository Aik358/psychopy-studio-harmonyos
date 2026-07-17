
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const SVELTEKIT_FORK: string;
	export const NODE_ENV: string;
	export const npm_command: string;
	export const LOGNAME: string;
	export const EDITOR: string;
	export const HOMEBREW_CELLAR: string;
	export const npm_config_local_prefix: string;
	export const npm_config_noproxy: string;
	export const npm_config_npm_version: string;
	export const npm_config_globalconfig: string;
	export const npm_config_update_notifier: string;
	export const AppSpawnCheckUnexpectedExitCall: string;
	export const npm_package_version: string;
	export const npm_config_global_prefix: string;
	export const npm_lifecycle_script: string;
	export const ALACRITTY_WINDOW_ID: string;
	export const TMPDIR: string;
	export const npm_node_execpath: string;
	export const SHLVL: string;
	export const MALI_REPORT_MEM_USAGE: string;
	export const _: string;
	export const COLOR: string;
	export const npm_config_allow_scripts: string;
	export const LANG: string;
	export const HOME: string;
	export const XDG_CONFIG_HOME: string;
	export const NODE: string;
	export const npm_config_init_module: string;
	export const XDG_CACHE_HOME: string;
	export const UBSAN_OPTIONS: string;
	export const INFOPATH: string;
	export const OHOS_SOCKET_AppSpawn: string;
	export const PWD: string;
	export const npm_config_cache: string;
	export const INIT_CWD: string;
	export const HOMEBREW_REPOSITORY: string;
	export const __LIBACE_ENTRY_POINT: string;
	export const ubsanEnabled: string;
	export const npm_config_prefix: string;
	export const npm_lifecycle_event: string;
	export const npm_config_userconfig: string;
	export const PROCESS_START_TIME: string;
	export const OLDPWD: string;
	export const TERM: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const hwasanEnabled: string;
	export const HAP_DEBUGGABLE: string;
	export const ATOMCODE_PROXY_MODE: string;
	export const WINDOWID: string;
	export const HNP_PUBLIC_HOME: string;
	export const npm_package_json: string;
	export const npm_package_name: string;
	export const DOWNLOAD_CACHE: string;
	export const tsanEnabled: string;
	export const SHELL: string;
	export const npm_config_node_gyp: string;
	export const LC_CTYPE: string;
	export const PATH: string;
	export const USER: string;
	export const HNP_PRIVATE_HOME: string;
	export const HOMEBREW_PREFIX: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		SVELTEKIT_FORK: string;
		NODE_ENV: string;
		npm_command: string;
		LOGNAME: string;
		EDITOR: string;
		HOMEBREW_CELLAR: string;
		npm_config_local_prefix: string;
		npm_config_noproxy: string;
		npm_config_npm_version: string;
		npm_config_globalconfig: string;
		npm_config_update_notifier: string;
		AppSpawnCheckUnexpectedExitCall: string;
		npm_package_version: string;
		npm_config_global_prefix: string;
		npm_lifecycle_script: string;
		ALACRITTY_WINDOW_ID: string;
		TMPDIR: string;
		npm_node_execpath: string;
		SHLVL: string;
		MALI_REPORT_MEM_USAGE: string;
		_: string;
		COLOR: string;
		npm_config_allow_scripts: string;
		LANG: string;
		HOME: string;
		XDG_CONFIG_HOME: string;
		NODE: string;
		npm_config_init_module: string;
		XDG_CACHE_HOME: string;
		UBSAN_OPTIONS: string;
		INFOPATH: string;
		OHOS_SOCKET_AppSpawn: string;
		PWD: string;
		npm_config_cache: string;
		INIT_CWD: string;
		HOMEBREW_REPOSITORY: string;
		__LIBACE_ENTRY_POINT: string;
		ubsanEnabled: string;
		npm_config_prefix: string;
		npm_lifecycle_event: string;
		npm_config_userconfig: string;
		PROCESS_START_TIME: string;
		OLDPWD: string;
		TERM: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		hwasanEnabled: string;
		HAP_DEBUGGABLE: string;
		ATOMCODE_PROXY_MODE: string;
		WINDOWID: string;
		HNP_PUBLIC_HOME: string;
		npm_package_json: string;
		npm_package_name: string;
		DOWNLOAD_CACHE: string;
		tsanEnabled: string;
		SHELL: string;
		npm_config_node_gyp: string;
		LC_CTYPE: string;
		PATH: string;
		USER: string;
		HNP_PRIVATE_HOME: string;
		HOMEBREW_PREFIX: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
