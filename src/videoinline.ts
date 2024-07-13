import { Plugin, Widget } from 'ckeditor5';

import VideoInlineEditing from './video/videoinlineediting.js';

import '../theme/video.css';

export default class VideoInline extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoInlineEditing, Widget ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoInline' as const;
	}
}
