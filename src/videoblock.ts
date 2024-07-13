import { Plugin, Widget } from 'ckeditor5';

import VideoBlockEditing from './video/videoblockediting.js';

import '../theme/video.css';

export default class VideoBlock extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoBlockEditing, Widget ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoBlock' as const;
	}
}
