import { Plugin } from 'ckeditor5';
import VideoBlock from './videoblock.js';
import VideoInline from './videoinline.js';
import '../theme/video.css';

export default class Video extends Plugin {
	/**
     * @inheritDoc
     */
	public static get requires() {
		return [ VideoBlock, VideoInline ] as const;
	}

	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'Video' as const;
	}
}
