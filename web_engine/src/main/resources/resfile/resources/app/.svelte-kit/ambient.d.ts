
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
	export const ACSetupSvcPort: string;
	export const ACSvcPort: string;
	export const TEMP: string;
	export const PIP_CACHE_DIR: string;
	export const OPENCLAW_NO_RESPAWN: string;
	export const CommonProgramFiles: string;
	export const AEGIS_REPORT_DIR: string;
	export const AEGIS_REPORT_FILENAME: string;
	export const NODE_ENV: string;
	export const ALLUSERSPROFILE: string;
	export const OPENCLAW_NIX_MODE: string;
	export const AUTH_GATEWAY_PORT: string;
	export const APPDATA: string;
	export const BUILD_ENV: string;
	export const FPS_BROWSER_USER_PROFILE_STRING: string;
	export const ChocolateyInstall: string;
	export const ChocolateyLastPathUpdate: string;
	export const OPENCLAW_DISABLE_BONJOUR: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const OPENCLAW_PACKAGED_COMPILE_CACHE_RESPAWNED: string;
	export const CommonProgramW6432: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const COMPUTERNAME: string;
	export const USERNAME: string;
	export const ComSpec: string;
	export const OneDrive: string;
	export const QCLAW_BUNDLED_CONFIG_DIR: string;
	export const OPENCLAW_GATEWAY_PORT: string;
	export const DriverData: string;
	export const EFC_18964_1262719628: string;
	export const OPENCLAW_PATH_BOOTSTRAPPED: string;
	export const EFC_18964_1592913036: string;
	export const PATHEXT: string;
	export const EFC_18964_2283032206: string;
	export const PATH: string;
	export const EFC_18964_2775293581: string;
	export const EFC_18964_2946480783: string;
	export const OPENCLAW_CONFIG_PATH: string;
	export const EFC_18964_344590478: string;
	export const LOCALAPPDATA: string;
	export const EFC_18964_3789132940: string;
	export const EFC_18964_4126798990: string;
	export const PROCESSOR_REVISION: string;
	export const EMULATOR_AVD_ROOT: string;
	export const HDC_SERVER_PORT: string;
	export const EMULATOR_SDK_ROOT: string;
	export const EnableLog: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const FPS_BROWSER_APP_PROFILE_STRING: string;
	export const ProgramFiles: string;
	export const HOMEDRIVE: string;
	export const HOMEPATH: string;
	export const OPENCLAW_CLI: string;
	export const LOGONSERVER: string;
	export const NODE_COMPILE_CACHE: string;
	export const OS: string;
	export const OLLAMA_ORIGINS: string;
	export const OPENCLAW_SHELL: string;
	export const OPENCLAW_STATE_DIR: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_LEVEL: string;
	export const ProgramData: string;
	export const ProgramW6432: string;
	export const PROMPT: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const QCLAW_CLI_NODE_BINARY: string;
	export const QCLAW_CLI_OPENCLAW_MJS: string;
	export const QCLAW_CONFIG_HMAC_SECRET: string;
	export const QCLAW_DEVICE_ID: string;
	export const QCLAW_GIT_BASH_BINARY: string;
	export const windir: string;
	export const QCLAW_GIT_BINARY: string;
	export const QCLAW_GIT_HOME: string;
	export const QCLAW_LLM_API_KEY: string;
	export const QCLAW_LLM_BASE_URL: string;
	export const QCLAW_NPM_CLI_JS: string;
	export const QCLAW_NPM_GLOBAL_PREFIX: string;
	export const QCLAW_NPX_CLI_JS: string;
	export const SystemRoot: string;
	export const QCLAW_USER_DATA_DIR: string;
	export const QCLAW_PLUGIN_CONFIG_PATH: string;
	export const QCLAW_PYTHON_BINARY: string;
	export const QCLAW_PYTHON_USER_BASE: string;
	export const QCLAW_QQBOT_ACCOUNT_1904114528_APPID: string;
	export const QCLAW_QQBOT_ACCOUNT_1904114528_CLIENTSECRET: string;
	export const QCLAW_TASK_NODE_ENABLED: string;
	export const QCLAW_USER_GUID: string;
	export const QCLAW_USER_ID: string;
	export const QCLAW_USER_TOKEN_ENCRYPTED: string;
	export const QCLAW_WECHAT_WS_URL: string;
	export const QCLAW_WEIXIN_ACCOUNT_ID: string;
	export const RlsSvcPort: string;
	export const SESSIONNAME: string;
	export const SystemDrive: string;
	export const TMP: string;
	export const USERDOMAIN: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const USERPROFILE: string;
	export const VK_SDK_PATH: string;
	export const VULKAN_SDK: string;
	export const SVELTEKIT_FORK: string;
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
		ACSetupSvcPort: string;
		ACSvcPort: string;
		TEMP: string;
		PIP_CACHE_DIR: string;
		OPENCLAW_NO_RESPAWN: string;
		CommonProgramFiles: string;
		AEGIS_REPORT_DIR: string;
		AEGIS_REPORT_FILENAME: string;
		NODE_ENV: string;
		ALLUSERSPROFILE: string;
		OPENCLAW_NIX_MODE: string;
		AUTH_GATEWAY_PORT: string;
		APPDATA: string;
		BUILD_ENV: string;
		FPS_BROWSER_USER_PROFILE_STRING: string;
		ChocolateyInstall: string;
		ChocolateyLastPathUpdate: string;
		OPENCLAW_DISABLE_BONJOUR: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		OPENCLAW_PACKAGED_COMPILE_CACHE_RESPAWNED: string;
		CommonProgramW6432: string;
		PROCESSOR_IDENTIFIER: string;
		COMPUTERNAME: string;
		USERNAME: string;
		ComSpec: string;
		OneDrive: string;
		QCLAW_BUNDLED_CONFIG_DIR: string;
		OPENCLAW_GATEWAY_PORT: string;
		DriverData: string;
		EFC_18964_1262719628: string;
		OPENCLAW_PATH_BOOTSTRAPPED: string;
		EFC_18964_1592913036: string;
		PATHEXT: string;
		EFC_18964_2283032206: string;
		PATH: string;
		EFC_18964_2775293581: string;
		EFC_18964_2946480783: string;
		OPENCLAW_CONFIG_PATH: string;
		EFC_18964_344590478: string;
		LOCALAPPDATA: string;
		EFC_18964_3789132940: string;
		EFC_18964_4126798990: string;
		PROCESSOR_REVISION: string;
		EMULATOR_AVD_ROOT: string;
		HDC_SERVER_PORT: string;
		EMULATOR_SDK_ROOT: string;
		EnableLog: string;
		NUMBER_OF_PROCESSORS: string;
		FPS_BROWSER_APP_PROFILE_STRING: string;
		ProgramFiles: string;
		HOMEDRIVE: string;
		HOMEPATH: string;
		OPENCLAW_CLI: string;
		LOGONSERVER: string;
		NODE_COMPILE_CACHE: string;
		OS: string;
		OLLAMA_ORIGINS: string;
		OPENCLAW_SHELL: string;
		OPENCLAW_STATE_DIR: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_LEVEL: string;
		ProgramData: string;
		ProgramW6432: string;
		PROMPT: string;
		PSModulePath: string;
		PUBLIC: string;
		QCLAW_CLI_NODE_BINARY: string;
		QCLAW_CLI_OPENCLAW_MJS: string;
		QCLAW_CONFIG_HMAC_SECRET: string;
		QCLAW_DEVICE_ID: string;
		QCLAW_GIT_BASH_BINARY: string;
		windir: string;
		QCLAW_GIT_BINARY: string;
		QCLAW_GIT_HOME: string;
		QCLAW_LLM_API_KEY: string;
		QCLAW_LLM_BASE_URL: string;
		QCLAW_NPM_CLI_JS: string;
		QCLAW_NPM_GLOBAL_PREFIX: string;
		QCLAW_NPX_CLI_JS: string;
		SystemRoot: string;
		QCLAW_USER_DATA_DIR: string;
		QCLAW_PLUGIN_CONFIG_PATH: string;
		QCLAW_PYTHON_BINARY: string;
		QCLAW_PYTHON_USER_BASE: string;
		QCLAW_QQBOT_ACCOUNT_1904114528_APPID: string;
		QCLAW_QQBOT_ACCOUNT_1904114528_CLIENTSECRET: string;
		QCLAW_TASK_NODE_ENABLED: string;
		QCLAW_USER_GUID: string;
		QCLAW_USER_ID: string;
		QCLAW_USER_TOKEN_ENCRYPTED: string;
		QCLAW_WECHAT_WS_URL: string;
		QCLAW_WEIXIN_ACCOUNT_ID: string;
		RlsSvcPort: string;
		SESSIONNAME: string;
		SystemDrive: string;
		TMP: string;
		USERDOMAIN: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		USERPROFILE: string;
		VK_SDK_PATH: string;
		VULKAN_SDK: string;
		SVELTEKIT_FORK: string;
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
