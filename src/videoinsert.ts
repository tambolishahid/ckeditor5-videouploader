/**
 * @module video/videoinsert
 */
import { Plugin } from 'ckeditor5';
import VideoUpload from './videoupload.js';
import VideoInsertUI from './videoinsert/videoinsertui.js';

export default class VideoInsert extends Plugin {
	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'VideoInsert' as const;
	}

	/**
     * @inheritDoc
     */
	public static get requires() {
		return [ VideoUpload, VideoInsertUI ] as const;
	}
}
