import { Command } from 'ckeditor5';
import type VideoUtils from '../videoutils.js';

export default class ResizeVideoCommand extends Command {
	/**
	 * Desired video width.
	 */
	declare public value: null | {
		width: string | null;
		height: string | null;
	};

	/**
	 * @inheritDoc
	 */
	public override refresh(): void {
		const editor = this.editor;
		const videoUtils: VideoUtils = editor.plugins.get( 'VideoUtils' ) as VideoUtils;
		const element = videoUtils.getClosestSelectedVideoElement( editor.model.document.selection );

		this.isEnabled = !!element;

		if ( !element || !element.hasAttribute( 'width' ) ) {
			this.value = null;
		} else {
			this.value = {
				width: element.getAttribute( 'width' ) as string,
				height: null
			};
		}
	}

	public override execute( options: { width: string | null } ): void {
		const editor = this.editor;
		const model = editor.model;
		const videoUtils: VideoUtils = editor.plugins.get( 'VideoUtils' ) as VideoUtils;
		const videoElement = videoUtils.getClosestSelectedVideoElement( model.document.selection );
		this.value = {
			width: options.width,
			height: null
		};

		if ( videoElement ) {
			model.change( writer => {
				writer.setAttribute( 'width', options.width, videoElement );
			} );
		}
	}
}
