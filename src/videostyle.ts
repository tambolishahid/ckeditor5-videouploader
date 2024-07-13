/**
 * @module video/videostyle
 */
import { Plugin } from 'ckeditor5';
import VideoStyleEditing from './videostyle/videostyleediting.js';
import VideoStyleUI from './videostyle/videostyleui.js';

export default class VideoStyle extends Plugin {
	/**
     * @inheritDoc
     */
	public static get requires() {
		return [ VideoStyleEditing, VideoStyleUI ] as const;
	}

	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'VideoStyle' as const;
	}
}
