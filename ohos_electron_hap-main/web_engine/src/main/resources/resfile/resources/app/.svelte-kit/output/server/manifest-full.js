export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["branding/component-wave.svg","branding/emblem.svg","branding/favicon-psyrun.icns","branding/favicon-psyrun.ico","branding/favicon-psyrun.svg","branding/favicon.icns","branding/favicon.ico","branding/favicon.svg","branding/favicon@1024x1024.png","branding/mac-install-backboard.png","branding/mac-install-backboard@2x.png","branding/pavlovia.svg","dynamicize.py","fonts/JetBrainsMono-Bold.ttf","fonts/JetBrainsMono-BoldItalic.ttf","fonts/JetBrainsMono-Italic.ttf","fonts/JetBrainsMono-Regular.ttf","fonts/JetBrainsMono.css","fonts/Noto.css","fonts/NotoColorEmoji-Regular.ttf","fonts/NotoSans-Bold.ttf","fonts/NotoSans-BoldItalic.ttf","fonts/NotoSans-Italic.ttf","fonts/NotoSans-Regular.ttf","fonts/NotoSansSymbols-Bold.ttf","fonts/NotoSansSymbols-Regular.ttf","fonts/NotoSansSymbols2-Regular.ttf","fonts/Nunito-Bold.ttf","fonts/Nunito-BoldItalic.ttf","fonts/Nunito-Italic.ttf","fonts/Nunito-Regular.ttf","fonts/Nunito.css","icons/btn-add-many.svg","icons/btn-add.svg","icons/btn-builder.svg","icons/btn-case.svg","icons/btn-clear.svg","icons/btn-coder.svg","icons/btn-color.svg","icons/btn-colors.svg","icons/btn-compilejs.svg","icons/btn-compilepy.svg","icons/btn-copy.svg","icons/btn-cut.svg","icons/btn-delete.svg","icons/btn-devices.svg","icons/btn-download.svg","icons/btn-edit.svg","icons/btn-filter.svg","icons/btn-find.svg","icons/btn-hamburger.svg","icons/btn-loop.svg","icons/btn-monitors.svg","icons/btn-new-table.svg","icons/btn-new.svg","icons/btn-open.svg","icons/btn-paste.svg","icons/btn-pilotjs.svg","icons/btn-pilotpy.svg","icons/btn-plugin.svg","icons/btn-redo.svg","icons/btn-refresh.svg","icons/btn-regex.svg","icons/btn-routine.svg","icons/btn-runjs.svg","icons/btn-runner.svg","icons/btn-runpy.svg","icons/btn-save.svg","icons/btn-saveas.svg","icons/btn-sendbuilder.svg","icons/btn-sendcoder.svg","icons/btn-sendpilot.svg","icons/btn-sendrun.svg","icons/btn-settings.svg","icons/btn-sort.svg","icons/btn-sync.svg","icons/btn-table.svg","icons/btn-target.svg","icons/btn-tick.svg","icons/btn-undo.svg","icons/btn-upload.svg","icons/components/ApertureComponent.svg","icons/components/AudioValidatorRoutine.svg","icons/components/BaseComponent.svg","icons/components/BrushComponent.svg","icons/components/ButtonBoxComponent.svg","icons/components/ButtonComponent.svg","icons/components/CameraComponent.svg","icons/components/CodeComponent.svg","icons/components/CounterbalanceRoutine.svg","icons/components/DotsComponent.svg","icons/components/EyetrackerCalibrationRoutine.svg","icons/components/EyetrackerRecordComponent.svg","icons/components/EyetrackerValidationRoutine.svg","icons/components/FormComponent.svg","icons/components/GratingComponent.svg","icons/components/ImageComponent.svg","icons/components/JoyButtonsComponent.svg","icons/components/JoystickComponent.svg","icons/components/KeyboardComponent.svg","icons/components/MicrophoneComponent.svg","icons/components/MouseComponent.svg","icons/components/MovieComponent.svg","icons/components/PanoramaComponent.svg","icons/components/ParallelOutComponent.svg","icons/components/PavloviaSurveyRoutine.svg","icons/components/PolygonComponent.svg","icons/components/ProgressComponent.svg","icons/components/RegionOfInterestComponent.svg","icons/components/ResourceManagerComponent.svg","icons/components/SerialOutComponent.svg","icons/components/SliderComponent.svg","icons/components/SoundComponent.svg","icons/components/SoundSensorComponent.svg","icons/components/StaticComponent.svg","icons/components/TextboxComponent.svg","icons/components/TextComponent.svg","icons/components/UnknownComponent.svg","icons/components/UnknownPluginComponent.svg","icons/components/VariableComponent.svg","icons/components/VisualValidatorRoutine.svg","icons/ctrl-switch-down.svg","icons/ctrl-switch-left.svg","icons/ctrl-switch-right.svg","icons/ctrl-switch-up.svg","icons/filetypes/audio.svg","icons/filetypes/css.svg","icons/filetypes/design.svg","icons/filetypes/font.svg","icons/filetypes/git.svg","icons/filetypes/html.svg","icons/filetypes/image.svg","icons/filetypes/info.svg","icons/filetypes/js.svg","icons/filetypes/json.svg","icons/filetypes/packaging.svg","icons/filetypes/psyexp.svg","icons/filetypes/psyrun.svg","icons/filetypes/python.svg","icons/filetypes/table.svg","icons/filetypes/text.svg","icons/filetypes/unknown.svg","icons/filetypes/video.svg","icons/param-update-constant.svg","icons/param-update-eachframe.svg","icons/param-update-eachrepeat.svg","icons/param-update-static.svg","icons/rbn-browser.svg","icons/rbn-desktop.svg","icons/rbn-edit.svg","icons/rbn-experiment.svg","icons/rbn-file.svg","icons/rbn-pavlovia.svg","icons/rbn-plugin.svg","icons/rbn-windows.svg","icons/sym-arrow-down-hl.svg","icons/sym-arrow-down.svg","icons/sym-arrow-left-hl.svg","icons/sym-arrow-left.svg","icons/sym-arrow-right-hl.svg","icons/sym-arrow-right.svg","icons/sym-arrow-up-hl.svg","icons/sym-arrow-up.svg","icons/sym-cancel.svg","icons/sym-close.svg","icons/sym-dot-blue.svg","icons/sym-dot-dark.svg","icons/sym-dot-green.svg","icons/sym-dot-light.svg","icons/sym-dot-orange.svg","icons/sym-dot-red.svg","icons/sym-dot-responsive.svg","icons/sym-error.svg","icons/sym-info.svg","icons/sym-js.svg","icons/sym-pending.svg","icons/sym-python.svg","icons/transparent.svg","style.css","themes/catppuccin-frappe.css","themes/catppuccin-latte.css","themes/catppuccin-macchiato.css","themes/catppuccin-mocha.css","themes/psychopy-dark.css","themes/psychopy-light.css","themes/psychopy.css"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png",".ttf":"font/ttf",".css":"text/css"},
	_: {
		client: {start:"_app/immutable/entry/start.B7Zp3vOH.js",app:"_app/immutable/entry/app.BC6h3NWK.js",imports:["_app/immutable/entry/start.B7Zp3vOH.js","_app/immutable/chunks/DkJYFXUF.js","_app/immutable/chunks/BjC7Y9vB.js","_app/immutable/chunks/CFu9OGiz.js","_app/immutable/chunks/C7rJf10A.js","_app/immutable/entry/app.BC6h3NWK.js","_app/immutable/chunks/BjC7Y9vB.js","_app/immutable/chunks/BKwgpZfa.js","_app/immutable/chunks/C_3iLvAe.js","_app/immutable/chunks/C7rJf10A.js","_app/immutable/chunks/x6TFst1D.js","_app/immutable/chunks/BQ6yCAVU.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/plugins",
				pattern: /^\/api\/plugins\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/plugins/_server.js'))
			},
			{
				id: "/api/report",
				pattern: /^\/api\/report\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/report/_server.js'))
			},
			{
				id: "/api/surveys",
				pattern: /^\/api\/surveys\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/surveys/_server.js'))
			},
			{
				id: "/api/token/authorize",
				pattern: /^\/api\/token\/authorize\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/token/authorize/_server.js'))
			},
			{
				id: "/api/token/refresh",
				pattern: /^\/api\/token\/refresh\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/token/refresh/_server.js'))
			},
			{
				id: "/builder",
				pattern: /^\/builder\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/coder",
				pattern: /^\/coder\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/runner",
				pattern: /^\/runner\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
