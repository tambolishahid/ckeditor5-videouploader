import {
	logWarning,
	toArray,
	Command,
	type Editor,
	type ArrayOrItem
} from 'ckeditor5';

import type VideoUtils from '../videoutils.js';

export default class InsertVideoCommand extends Command {
	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		const configVideoInsertType = editor.config.get( 'video.insert.type' );

		if ( !editor.plugins.has( 'VideoBlockEditing' ) ) {
			if ( configVideoInsertType === 'block' ) {
				logWarning( 'video-block-plugin-required' );
			}
		}

		if ( !editor.plugins.has( 'VideoInlineEditing' ) ) {
			if ( configVideoInsertType === 'inline' ) {
				logWarning( 'video-inline-plugin-required' );
			}
		}
	}

	/**
	 * @inheritDoc
	 */
	public override refresh(): void {
		const videoUtils: VideoUtils = this.editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;

		this.isEnabled = videoUtils.isVideoAllowed();
	}

	public override execute( options: {
		source: ArrayOrItem<string | Record<string, unknown>>;
	} ): void {
		const sourceDefinitions = toArray<string | Record<string, unknown>>(
			options.source
		);
		const selection = this.editor.model.document.selection;
		const videoUtils: VideoUtils = this.editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;

		const selectionAttributes = Object.fromEntries(
			selection.getAttributes()
		);

		sourceDefinitions.forEach( ( sourceDefinition, index ) => {
			const selectedElement = selection.getSelectedElement();

			if ( typeof sourceDefinition === 'string' ) {
				sourceDefinition = { src: sourceDefinition };
			}

			if (
				index &&
				selectedElement &&
				videoUtils.isVideo( selectedElement )
			) {
				const position =
					this.editor.model.createPositionAfter( selectedElement );

				videoUtils.insertVideo(
					{ ...sourceDefinition, ...selectionAttributes },
					position
				);
			} else {
				videoUtils.insertVideo( {
					...sourceDefinition,
					...selectionAttributes
				} );
			}
		} );
	}
}
