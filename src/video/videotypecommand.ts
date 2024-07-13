import { Command, type Editor, type Element } from 'ckeditor5';
import type VideoUtils from '../videoutils.js';

export default class VideoTypeCommand extends Command {
	private readonly _modelElementName: 'videoBlock' | 'videoInline';

	/**
	 * @inheritDoc
	 *
	 * @param modelElementName Model element name the command converts to.
	 */
	constructor(
		editor: Editor,
		modelElementName: 'videoBlock' | 'videoInline'
	) {
		super( editor );

		this._modelElementName = modelElementName;
	}

	/**
	 * @inheritDoc
	 */
	public override refresh(): void {
		const editor = this.editor;
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const element = videoUtils.getClosestSelectedVideoElement(
			this.editor.model.document.selection
		);

		if ( this._modelElementName === 'videoBlock' ) {
			this.isEnabled = videoUtils.isInlineVideo( element );
		} else {
			this.isEnabled = videoUtils.isBlockVideo( element );
		}
	}

	public override execute(): {
		oldElement: Element;
		newElement: Element;
	} | null {
		const editor = this.editor;
		const model = this.editor.model;
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const oldElement = videoUtils.getClosestSelectedVideoElement(
			model.document.selection
		)!;
		const attributes = Object.fromEntries( oldElement.getAttributes() );

		if ( !attributes.src && !attributes.uploadId ) {
			return null;
		}

		return model.change( writer => {
			const markers = Array.from( model.markers ).filter( marker =>
				marker.getRange().containsItem( oldElement )
			);

			const newElement = videoUtils.insertVideo(
				attributes,
				model.createSelection( oldElement, 'on' ),
				this._modelElementName
			);

			if ( !newElement ) {
				return null;
			}

			const newElementRange = writer.createRangeOn( newElement );

			for ( const marker of markers ) {
				const markerRange = marker.getRange();

				const range =
					markerRange.root.rootName != '$graveyard' ?
						markerRange.getJoined( newElementRange, true )! :
						newElementRange;

				writer.updateMarker( marker, { range } );
			}

			return {
				oldElement,
				newElement
			};
		} );
	}
}
