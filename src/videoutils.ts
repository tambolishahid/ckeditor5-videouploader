/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module video/videoutils
 */

import {
	Plugin,
	findOptimalInsertionRange,
	isWidget,
	toWidget,
	type Editor,
	type Element,
	type ViewElement,
	type ViewNode,
	type DocumentSelection,
	type ViewDocumentSelection,
	type Selection,
	type ViewSelection,
	type DocumentFragment,
	type ViewDocumentFragment,
	type DowncastWriter,
	type Model,
	type Position
} from 'ckeditor5';
import { determineVideoTypeForInsertionAtSelection } from './video/utils.js';

export default class VideoUtils extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoUtils' as const;
	}

	public isVideo(
		modelElement?: Element | null
	): modelElement is Element & { name: 'videoInline' | 'videoBlock' } {
		return (
			this.isInlineVideo( modelElement ) || this.isBlockVideo( modelElement )
		);
	}

	public isInlineVideoView( element?: ViewElement | null ): boolean {
		return !!element && element.is( 'element', 'video' );
	}

	public isBlockVideoView( element?: ViewElement | null ): boolean {
		return (
			!!element &&
			element.is( 'element', 'figure' ) &&
			element.hasClass( 'video' )
		);
	}

	public insertVideo(
		attributes: Record<string, unknown> = {},
		selectable: Selection | Position | null = null,
		videoType: 'videoBlock' | 'videoInline' | null = null
	): Element | null {
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;
		console.log( 'insert steppppppp' );
		videoType = determineVideoTypeForInsertion(
			editor,
			selectable || selection,
			videoType
		);

		attributes = {
			...Object.fromEntries( selection.getAttributes() ),
			...attributes
		};

		for ( const attributeName in attributes ) {
			if ( !model.schema.checkAttribute( videoType, attributeName ) ) {
				delete attributes[ attributeName ];
			}
		}
		console.log( 'complete insertion videoType', videoType );
		console.log( 'complete insertion attributes', attributes );

		return model.change( writer => {
			const videoElement = writer.createElement( videoType!, attributes );
			model.insertObject( videoElement, selectable, null, {
				setSelection: 'on',
				// If we want to insert a block image (for whatever reason) then we don't want to split text blocks.
				// This applies only when we don't have the selectable specified (i.e., we insert multiple block images at once).
				findOptimalPosition:
					!selectable && videoType != 'videoInline' ?
						'auto' :
						undefined
			} );
			console.log( 'complete insertion videoElement', videoElement );

			// Inserting an image might've failed due to schema regulations.
			if ( videoElement.parent ) {
				return videoElement;
			}

			return null;

			// if ( !selectable && videoType !== 'videoInline' ) {
			//     selectable = findOptimalInsertionRange( selection, model );
			// }

			// model.insertContent( videoElement, selectable );

			// if ( videoElement.parent ) {
			//     writer.setSelection( videoElement, 'on' );

			//     return videoElement;
			// }

			// return null;
		} );
		console.log( 'complete insertion videoType', videoType );
		console.log( 'complete insertion attributes', attributes );
	}

	public getClosestSelectedVideoWidget(
		selection: ViewSelection | ViewDocumentSelection
	): ViewElement | null {
		const selectionPosition = selection.getFirstPosition();

		if ( !selectionPosition ) {
			return null;
		}

		const viewElement = selection.getSelectedElement();

		if ( viewElement && this.isVideoWidget( viewElement ) ) {
			return viewElement;
		}

		let parent: ViewNode | ViewDocumentFragment | null =
			selectionPosition.parent;

		while ( parent ) {
			if ( parent.is( 'element' ) && this.isVideoWidget( parent ) ) {
				return parent;
			}

			parent = parent.parent;
		}

		return null;
	}

	public getClosestSelectedVideoElement(
		selection: Selection | DocumentSelection
	): Element | null {
		const selectedElement = selection.getSelectedElement();

		return this.isVideo( selectedElement ) ?
			selectedElement :
			selection.getFirstPosition()!.findAncestor( 'videoBlock' );
	}

	/**
	 * Checks if video can be inserted at current model selection.
	 *
	 * @internal
	 */
	public isVideoAllowed(): boolean {
		const model = this.editor.model;
		const selection = model.document.selection;

		return (
			isVideoAllowedInParent( this.editor, selection ) &&
			isNotInsideVideo( selection )
		);
	}

	public toVideoWidget(
		viewElement: ViewElement,
		writer: DowncastWriter
	): ViewElement {
		writer.setCustomProperty( 'video', true, viewElement );

		return toWidget( viewElement, writer );
	}

	protected isVideoWidget( viewElement: ViewElement ): boolean {
		return (
			!!viewElement.getCustomProperty( 'video' ) && isWidget( viewElement )
		);
	}

	public isBlockVideo( modelElement?: Element | null ): boolean {
		return !!modelElement && modelElement.is( 'element', 'videoBlock' );
	}

	public isInlineVideo( modelElement?: Element | null ): boolean {
		return !!modelElement && modelElement.is( 'element', 'videoInline' );
	}

	public findViewVideoElement( figureView: ViewElement ): ViewElement {
		if ( this.isInlineVideoView( figureView ) ) {
			return figureView;
		}

		const editingView = this.editor.editing.view;

		for ( const { item } of editingView.createRangeIn( figureView ) ) {
			if ( this.isInlineVideoView( item as ViewElement ) ) {
				return item as ViewElement;
			}
		}
		// not sure
		return figureView;
	}
}
function isVideoAllowedInParent(
	editor: Editor,
	selection: Selection | DocumentSelection
): boolean {
	const videoType = determineVideoTypeForInsertion( editor, selection, null );

	if ( videoType === 'videoBlock' ) {
		const parent = getInsertVideoParent( selection, editor.model );

		if ( editor.model.schema.checkChild( parent as Element, 'videoBlock' ) ) {
			return true;
		}
	} else if (
		editor.model.schema.checkChild( selection.focus!, 'videoInline' )
	) {
		return true;
	}

	return false;
}

function isNotInsideVideo( selection: DocumentSelection ): boolean {
	return [ ...selection.focus!.getAncestors() ].every(
		ancestor => !ancestor.is( 'element', 'videoBlock' )
	);
}

function getInsertVideoParent(
	selection: Selection | DocumentSelection,
	model: Model
): Element | DocumentFragment {
	const insertionRange = findOptimalInsertionRange( selection, model );
	const parent = insertionRange.start.parent;

	if ( parent.isEmpty && !parent.is( 'element', '$root' ) ) {
		return parent.parent!;
	}

	return parent;
}

function determineVideoTypeForInsertion(
	editor: Editor,
	selectable: Position | Selection | DocumentSelection,
	videoType: 'videoBlock' | 'videoInline' | null
): 'videoBlock' | 'videoInline' {
	const schema = editor.model.schema;
	const configVideoInsertType = editor.config.get( 'video.insert.type' );

	if ( !editor.plugins.has( 'VideoBlockEditing' ) ) {
		return 'videoInline';
	}

	if ( !editor.plugins.has( 'VideoInlineEditing' ) ) {
		return 'videoBlock';
	}

	if ( videoType ) {
		return videoType;
	}

	if ( configVideoInsertType === 'inline' ) {
		return 'videoInline';
	}

	if ( configVideoInsertType === 'block' ) {
		return 'videoBlock';
	}

	if ( selectable.is( 'selection' ) ) {
		return determineVideoTypeForInsertionAtSelection( schema, selectable );
	}

	return schema.checkChild( selectable, 'videoInline' ) ?
		'videoInline' :
		'videoBlock';
}
