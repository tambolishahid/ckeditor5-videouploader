import type { Videouploader } from './index.js';
import type { VideoConfig } from './videoconfig.js';
declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ Videouploader.pluginName ]: Videouploader;
	}

	interface EditorConfig {
		video?: VideoConfig;
	}
}
