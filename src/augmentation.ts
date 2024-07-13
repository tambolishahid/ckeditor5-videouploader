import type { Videouploader } from './index.js';

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ Videouploader.pluginName ]: Videouploader;
	}
}
