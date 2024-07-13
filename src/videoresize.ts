/**
 * @module video/videoresize
 */
import { Plugin } from 'ckeditor5';
import VideoResizeEditing from './videoresize/videoresizeediting.js';
import VideoResizeHandles from './videoresize/videoresizehandles.js';
import VideoResizeButtons from './videoresize/videoresizebuttons.js';
import '../theme/videoresize.css';

export default class VideoResize extends Plugin {
	/**
     * @inheritDoc
     */
	public static get requires() {
		return [ VideoResizeEditing, VideoResizeHandles, VideoResizeButtons ] as const;
	}

	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'VideoResize' as const;
	}
}
