import { Plugin } from 'ckeditor5';
import VideoUploadUI from './videoupload/videouploadui.js';
import VideoUploadEditing from './videoupload/videouploadediting.js';
import VideoUploadProgress from './videoupload/videouploadprogress.js';

export default class VideoUpload extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoUpload' as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoUploadEditing, VideoUploadUI, VideoUploadProgress ] as const;
	}
}
