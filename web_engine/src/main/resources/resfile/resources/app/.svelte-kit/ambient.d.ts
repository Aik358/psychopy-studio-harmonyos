
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
	export const ACC_PRODUCT_CONFIG_V3: string;
	export const CODEBUDDY_INCLUDE_TOPIC_MESSAGE: string;
	export const ACSetupSvcPort: string;
	export const ACSvcPort: string;
	export const CODEBUDDY_SKILL_TOOL_CHAR_BUDGET: string;
	export const AWS_PAGER: string;
	export const CODEBUDDY_QIMEI36: string;
	export const CODEBUDDY_SESSION_ID: string;
	export const ALLUSERSPROFILE: string;
	export const CODEBUDDY_DISABLE_REQUEST_VALIDATION: string;
	export const CLAUDE_SESSION_ID: string;
	export const APPDATA: string;
	export const CODEBUDDY_NODE_BIN: string;
	export const WORKBUDDY_USER_DATA_DIR: string;
	export const BASH_ENV: string;
	export const CLIENT_INFO_USER_AGENT_EXTENSION: string;
	export const ProgramData: string;
	export const CODEBUDDY_BUILTIN_SKILLS_DIR: string;
	export const CLIENT_INFO_PLATFORM: string;
	export const ChocolateyInstall: string;
	export const ChocolateyLastPathUpdate: string;
	export const CLAUDE_PROJECT_DIR: string;
	export const CODEBUDDY_ENABLE_SECURITY_AUDIT: string;
	export const CLIENT_INFO_IDE_TYPE: string;
	export const npm_config_noproxy: string;
	export const CODEBUDDY_DISABLE_AUTO_MEMORY: string;
	export const ELECTRON_RUN_AS_NODE: string;
	export const CODEBUDDY_CONFIG_DIR: string;
	export const WORKBUDDY_APP_VERSION: string;
	export const CLIENT_INFO_PRODUCT_NAME: string;
	export const CLIENT_INFO_MACHINE_ID: string;
	export const CLIENT_INFO_PLATFORM_VERSION: string;
	export const CLIENT_INFO_PLUGIN_NAME: string;
	export const CODEBUDDY_DISABLE_SESSION_HISTORY_CLEANUP: string;
	export const CLIENT_INFO_PLUGIN_VERSION: string;
	export const CODEBUDDY_SAFE_DELETE_BIN_DIR: string;
	export const PWD: string;
	export const CLIENT_INFO_PRODUCT_VERSION: string;
	export const CODEBUDDY_HOST: string;
	export const CODEBUDDY_CODE_DISABLE_SESSION_SUMMARY: string;
	export const CODEBUDDY_DISABLE_IDE: string;
	export const CODEBUDDY_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
	export const CODEBUDDY_CODE_GIT_BASH_PATH: string;
	export const EFC_19388_2775293581: string;
	export const CODEBUDDY_CODE_IMAGE_COMPRESSION_MAX_DIMENSION: string;
	export const CODEBUDDY_GATEWAY_DISABLE_API_DOCS: string;
	export const CODEBUDDY_POWERSHELL_USE_PTY: string;
	export const CODEBUDDY_CONVERSATION_REQUEST_ID: string;
	export const CODEBUDDY_DISABLE_CRON: string;
	export const CODEBUDDY_GATEWAY_AUTH: string;
	export const HOMEDRIVE: string;
	export const GENIE_TRASH_DIR: string;
	export const CODEBUDDY_REPLAY_SHOW_PRE_COMPACT: string;
	export const npm_package_version: string;
	export const CODEBUDDY_REASONING_ONLY_END_TURN: string;
	export const TENCENT_DOCS_LOCAL_SERVER: string;
	export const PROGRAMFILES: string;
	export const CODEBUDDY_DISABLE_FORK_SUBAGENT: string;
	export const CODEBUDDY_DISABLE_SYSTEM_REMINDER_MD: string;
	export const PROMPT: string;
	export const CODEBUDDY_GATEWAY_PASSWORD: string;
	export const CODEBUDDY_GIT_REPO_SCAN_DISABLED: string;
	export const CODEBUDDY_HOST_CAPABILITIES: string;
	export const CODEBUDDY_INTERNET_ENVIRONMENT: string;
	export const _: string;
	export const EFC_19388_2283032206: string;
	export const CODEBUDDY_MCP_CONFIG: string;
	export const CODEBUDDY_PROJECT_DIR: string;
	export const npm_config_node_gyp: string;
	export const CODEBUDDY_SAFE_DELETE_BULK_STATE_DIR: string;
	export const CODEBUDDY_PROMPT_SUGGESTION_DISABLED: string;
	export const CODEBUDDY_SAFE_DELETE_BULK_GUARD: string;
	export const CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD: string;
	export const CODEBUDDY_SAFE_DELETE_REPORT_PATH: string;
	export const CODEBUDDY_SKIP_GIT_BASH_CHECK: string;
	export const CODEBUDDY_TOOL_CALL_ID: string;
	export const EDITOR: string;
	export const COLOR: string;
	export const COMMONPROGRAMFILES: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const COMSPEC: string;
	export const OneDrive: string;
	export const DISABLE_AUTOUPDATER: string;
	export const HGPAGER: string;
	export const dp0: string;
	export const GIT_TERMINAL_PROMPT: string;
	export const DriverData: string;
	export const editor_sdk_port: string;
	export const EFC_19388_1262719628: string;
	export const VULKAN_SDK: string;
	export const EFC_19388_1592913036: string;
	export const EFC_19388_344590478: string;
	export const LESSCHARSET: string;
	export const EFC_19388_3789132940: string;
	export const npm_lifecycle_script: string;
	export const EFC_19388_4126798990: string;
	export const EMULATOR_AVD_ROOT: string;
	export const EMULATOR_SDK_ROOT: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const LC_ALL: string;
	export const EnableLog: string;
	export const EXEPATH: string;
	export const FPS_BROWSER_APP_PROFILE_STRING: string;
	export const FPS_BROWSER_USER_PROFILE_STRING: string;
	export const GALILEO_ENABLE: string;
	export const OLDPWD: string;
	export const GALILEO_SDK_READY: string;
	export const GIT_PAGER: string;
	export const HDC_SERVER_PORT: string;
	export const HOME: string;
	export const HOMEPATH: string;
	export const INIT_CWD: string;
	export const LANG: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const MANPAGER: string;
	export const MSYS: string;
	export const MSYS2_ARG_CONV_EXCL: string;
	export const MSYSTEM: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const MSYS_NO_PATHCONV: string;
	export const NODE: string;
	export const NODE_ENV: string;
	export const NODE_OPTIONS: string;
	export const npm_command: string;
	export const npm_config_allow_scripts: string;
	export const npm_config_cache: string;
	export const npm_config_globalconfig: string;
	export const npm_config_global_prefix: string;
	export const npm_config_init_module: string;
	export const npm_config_local_prefix: string;
	export const npm_config_npm_version: string;
	export const npm_config_prefix: string;
	export const PATHEXT: string;
	export const npm_config_registry: string;
	export const npm_config_userconfig: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const npm_lifecycle_event: string;
	export const npm_node_execpath: string;
	export const WINDIR: string;
	export const npm_package_json: string;
	export const npm_package_name: string;
	export const OLLAMA_ORIGINS: string;
	export const ORIGINAL_XDG_CURRENT_DESKTOP: string;
	export const OS: string;
	export const PAGER: string;
	export const PATH: string;
	export const PLINK_PROTOCOL: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_LEVEL: string;
	export const PROCESSOR_REVISION: string;
	export const TERM: string;
	export const ProgramW6432: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const PYTHONIOENCODING: string;
	export const PYTHONPATH: string;
	export const PYTHONUTF8: string;
	export const RlsSvcPort: string;
	export const SERVER__PORT: string;
	export const SESSIONNAME: string;
	export const SHLVL: string;
	export const SYSTEMDRIVE: string;
	export const SYSTEMD_PAGER: string;
	export const SYSTEMROOT: string;
	export const TEMP: string;
	export const TENCENT_DOCS_LOCAL_MCP: string;
	export const TMP: string;
	export const USERDOMAIN: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const WORKBUDDY_PAC_RPC_SOCKET: string;
	export const USERNAME: string;
	export const USERPROFILE: string;
	export const VK_SDK_PATH: string;
	export const WORKBUDDY_APPLICATION_NAME: string;
	export const WORKBUDDY_APP_NAME: string;
	export const WORKBUDDY_APP_PATH: string;
	export const WORKBUDDY_CONFIG_DIR: string;
	export const WORKBUDDY_DATA_FOLDER_NAME: string;
	export const WORKBUDDY_EXTRA_PATHS: string;
	export const WORKBUDDY_PAC_RPC_TOKEN: string;
	export const WORKBUDDY_FS_PROTECTION_ROLE: string;
	export const WORKBUDDY_IS_PACKAGED: string;
	export const WORKBUDDY_LEGACY_LOCALSTORAGE_MIGRATION_RESULT_PATH: string;
	export const SVELTEKIT_FORK: string;
	export const WORKBUDDY_LOCALE: string;
	export const WORKBUDDY_MENU_LOCALE: string;
	export const WORKBUDDY_NODE_ENV: string;
	export const WORKBUDDY_PRODUCT_NAME: string;
	export const WORKBUDDY_PROMPT_TEMPLATES_DIR: string;
	export const WORKBUDDY_RESOURCES_PATH: string;
	export const WORKBUDDY_STARTUP_DATE: string;
	export const WORKBUDDY_STARTUP_PID: string;
	export const WORKBUDDY_STARTUP_TIME: string;
	export const _prog: string;
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
		ACC_PRODUCT_CONFIG_V3: string;
		CODEBUDDY_INCLUDE_TOPIC_MESSAGE: string;
		ACSetupSvcPort: string;
		ACSvcPort: string;
		CODEBUDDY_SKILL_TOOL_CHAR_BUDGET: string;
		AWS_PAGER: string;
		CODEBUDDY_QIMEI36: string;
		CODEBUDDY_SESSION_ID: string;
		ALLUSERSPROFILE: string;
		CODEBUDDY_DISABLE_REQUEST_VALIDATION: string;
		CLAUDE_SESSION_ID: string;
		APPDATA: string;
		CODEBUDDY_NODE_BIN: string;
		WORKBUDDY_USER_DATA_DIR: string;
		BASH_ENV: string;
		CLIENT_INFO_USER_AGENT_EXTENSION: string;
		ProgramData: string;
		CODEBUDDY_BUILTIN_SKILLS_DIR: string;
		CLIENT_INFO_PLATFORM: string;
		ChocolateyInstall: string;
		ChocolateyLastPathUpdate: string;
		CLAUDE_PROJECT_DIR: string;
		CODEBUDDY_ENABLE_SECURITY_AUDIT: string;
		CLIENT_INFO_IDE_TYPE: string;
		npm_config_noproxy: string;
		CODEBUDDY_DISABLE_AUTO_MEMORY: string;
		ELECTRON_RUN_AS_NODE: string;
		CODEBUDDY_CONFIG_DIR: string;
		WORKBUDDY_APP_VERSION: string;
		CLIENT_INFO_PRODUCT_NAME: string;
		CLIENT_INFO_MACHINE_ID: string;
		CLIENT_INFO_PLATFORM_VERSION: string;
		CLIENT_INFO_PLUGIN_NAME: string;
		CODEBUDDY_DISABLE_SESSION_HISTORY_CLEANUP: string;
		CLIENT_INFO_PLUGIN_VERSION: string;
		CODEBUDDY_SAFE_DELETE_BIN_DIR: string;
		PWD: string;
		CLIENT_INFO_PRODUCT_VERSION: string;
		CODEBUDDY_HOST: string;
		CODEBUDDY_CODE_DISABLE_SESSION_SUMMARY: string;
		CODEBUDDY_DISABLE_IDE: string;
		CODEBUDDY_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
		CODEBUDDY_CODE_GIT_BASH_PATH: string;
		EFC_19388_2775293581: string;
		CODEBUDDY_CODE_IMAGE_COMPRESSION_MAX_DIMENSION: string;
		CODEBUDDY_GATEWAY_DISABLE_API_DOCS: string;
		CODEBUDDY_POWERSHELL_USE_PTY: string;
		CODEBUDDY_CONVERSATION_REQUEST_ID: string;
		CODEBUDDY_DISABLE_CRON: string;
		CODEBUDDY_GATEWAY_AUTH: string;
		HOMEDRIVE: string;
		GENIE_TRASH_DIR: string;
		CODEBUDDY_REPLAY_SHOW_PRE_COMPACT: string;
		npm_package_version: string;
		CODEBUDDY_REASONING_ONLY_END_TURN: string;
		TENCENT_DOCS_LOCAL_SERVER: string;
		PROGRAMFILES: string;
		CODEBUDDY_DISABLE_FORK_SUBAGENT: string;
		CODEBUDDY_DISABLE_SYSTEM_REMINDER_MD: string;
		PROMPT: string;
		CODEBUDDY_GATEWAY_PASSWORD: string;
		CODEBUDDY_GIT_REPO_SCAN_DISABLED: string;
		CODEBUDDY_HOST_CAPABILITIES: string;
		CODEBUDDY_INTERNET_ENVIRONMENT: string;
		_: string;
		EFC_19388_2283032206: string;
		CODEBUDDY_MCP_CONFIG: string;
		CODEBUDDY_PROJECT_DIR: string;
		npm_config_node_gyp: string;
		CODEBUDDY_SAFE_DELETE_BULK_STATE_DIR: string;
		CODEBUDDY_PROMPT_SUGGESTION_DISABLED: string;
		CODEBUDDY_SAFE_DELETE_BULK_GUARD: string;
		CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD: string;
		CODEBUDDY_SAFE_DELETE_REPORT_PATH: string;
		CODEBUDDY_SKIP_GIT_BASH_CHECK: string;
		CODEBUDDY_TOOL_CALL_ID: string;
		EDITOR: string;
		COLOR: string;
		COMMONPROGRAMFILES: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		COMSPEC: string;
		OneDrive: string;
		DISABLE_AUTOUPDATER: string;
		HGPAGER: string;
		dp0: string;
		GIT_TERMINAL_PROMPT: string;
		DriverData: string;
		editor_sdk_port: string;
		EFC_19388_1262719628: string;
		VULKAN_SDK: string;
		EFC_19388_1592913036: string;
		EFC_19388_344590478: string;
		LESSCHARSET: string;
		EFC_19388_3789132940: string;
		npm_lifecycle_script: string;
		EFC_19388_4126798990: string;
		EMULATOR_AVD_ROOT: string;
		EMULATOR_SDK_ROOT: string;
		NUMBER_OF_PROCESSORS: string;
		LC_ALL: string;
		EnableLog: string;
		EXEPATH: string;
		FPS_BROWSER_APP_PROFILE_STRING: string;
		FPS_BROWSER_USER_PROFILE_STRING: string;
		GALILEO_ENABLE: string;
		OLDPWD: string;
		GALILEO_SDK_READY: string;
		GIT_PAGER: string;
		HDC_SERVER_PORT: string;
		HOME: string;
		HOMEPATH: string;
		INIT_CWD: string;
		LANG: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		MANPAGER: string;
		MSYS: string;
		MSYS2_ARG_CONV_EXCL: string;
		MSYSTEM: string;
		PROCESSOR_IDENTIFIER: string;
		MSYS_NO_PATHCONV: string;
		NODE: string;
		NODE_ENV: string;
		NODE_OPTIONS: string;
		npm_command: string;
		npm_config_allow_scripts: string;
		npm_config_cache: string;
		npm_config_globalconfig: string;
		npm_config_global_prefix: string;
		npm_config_init_module: string;
		npm_config_local_prefix: string;
		npm_config_npm_version: string;
		npm_config_prefix: string;
		PATHEXT: string;
		npm_config_registry: string;
		npm_config_userconfig: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		npm_lifecycle_event: string;
		npm_node_execpath: string;
		WINDIR: string;
		npm_package_json: string;
		npm_package_name: string;
		OLLAMA_ORIGINS: string;
		ORIGINAL_XDG_CURRENT_DESKTOP: string;
		OS: string;
		PAGER: string;
		PATH: string;
		PLINK_PROTOCOL: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_LEVEL: string;
		PROCESSOR_REVISION: string;
		TERM: string;
		ProgramW6432: string;
		PSModulePath: string;
		PUBLIC: string;
		PYTHONIOENCODING: string;
		PYTHONPATH: string;
		PYTHONUTF8: string;
		RlsSvcPort: string;
		SERVER__PORT: string;
		SESSIONNAME: string;
		SHLVL: string;
		SYSTEMDRIVE: string;
		SYSTEMD_PAGER: string;
		SYSTEMROOT: string;
		TEMP: string;
		TENCENT_DOCS_LOCAL_MCP: string;
		TMP: string;
		USERDOMAIN: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		WORKBUDDY_PAC_RPC_SOCKET: string;
		USERNAME: string;
		USERPROFILE: string;
		VK_SDK_PATH: string;
		WORKBUDDY_APPLICATION_NAME: string;
		WORKBUDDY_APP_NAME: string;
		WORKBUDDY_APP_PATH: string;
		WORKBUDDY_CONFIG_DIR: string;
		WORKBUDDY_DATA_FOLDER_NAME: string;
		WORKBUDDY_EXTRA_PATHS: string;
		WORKBUDDY_PAC_RPC_TOKEN: string;
		WORKBUDDY_FS_PROTECTION_ROLE: string;
		WORKBUDDY_IS_PACKAGED: string;
		WORKBUDDY_LEGACY_LOCALSTORAGE_MIGRATION_RESULT_PATH: string;
		SVELTEKIT_FORK: string;
		WORKBUDDY_LOCALE: string;
		WORKBUDDY_MENU_LOCALE: string;
		WORKBUDDY_NODE_ENV: string;
		WORKBUDDY_PRODUCT_NAME: string;
		WORKBUDDY_PROMPT_TEMPLATES_DIR: string;
		WORKBUDDY_RESOURCES_PATH: string;
		WORKBUDDY_STARTUP_DATE: string;
		WORKBUDDY_STARTUP_PID: string;
		WORKBUDDY_STARTUP_TIME: string;
		_prog: string;
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
