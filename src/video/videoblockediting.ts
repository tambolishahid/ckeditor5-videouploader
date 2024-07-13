import {
	Plugin,
	ClipboardPipeline,
	UpcastWriter,
	type ClipboardInputTransformationEvent,
	type ViewElement
} from 'ckeditor5';
import { downcastVideoAttribute, upcastVideoFigure } from './converters.js';
import VideoEditing from './videoediting.js';
import VideoTypeCommand from './videotypecommand.js';
import {
	createVideoViewElement,
	determineVideoTypeForInsertionAtSelection,
	getVideoViewElementMatcher
} from './utils.js';

import VideoUtils from '../videoutils.js';

export default class VideoBlockEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoEditing, VideoUtils, ClipboardPipeline ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoBlockEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const schema = editor.model.schema;

		schema.register( 'videoBlock', {
			isObject: true,
			isBlock: true,
			allowWhere: '$block',
			allowAttributes: [ 'src' ]
		} );

		this._setupConversion();

		if ( editor.plugins.has( 'VideoInlineEditing' ) ) {
			editor.commands.add(
				'videoTypeBlock',
				new VideoTypeCommand( this.editor, 'videoBlock' )
			);

			this._setupClipboardIntegration();
		}
	}

	private _setupConversion(): void {
		const editor = this.editor;
		const conversion = editor.conversion;
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'videoBlock',
			view: ( modelElement, { writer } ) =>
				createVideoViewElement( writer, 'videoBlock' )
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'videoBlock',
			view: ( modelElement, { writer } ) =>
				videoUtils.toVideoWidget(
					createVideoViewElement( writer, 'videoBlock' ),
					writer
				)
		} );

		conversion
			.for( 'downcast' )
			.add( downcastVideoAttribute( videoUtils, 'videoBlock', 'src' ) );

		conversion
			.for( 'upcast' )
			.elementToElement( {
				view: getVideoViewElementMatcher( editor, 'videoBlock' ),
				model: ( viewVideo, { writer } ) =>
					writer.createElement(
						'videoBlock',
						viewVideo.hasAttribute( 'src' ) ?
							{ src: viewVideo.getAttribute( 'src' ) } :
							undefined
					)
			} )
			.add( upcastVideoFigure( videoUtils ) );
	}

	private _setupClipboardIntegration(): void {
		const editor = this.editor;
		const model = editor.model;
		const editingView = editor.editing.view;
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const clipboardPipeline: ClipboardPipeline =
			editor.plugins.get( 'ClipboardPipeline' );

		this.listenTo<ClipboardInputTransformationEvent>(
			clipboardPipeline,
			'inputTransformation',
			( evt, data ) => {
				const docFragmentChildren = Array.from(
					data.content.getChildren() as IterableIterator<ViewElement>
				);
				let modelRange;

				if ( !docFragmentChildren.every( videoUtils.isInlineVideoView ) ) {
					return;
				}

				if ( data.targetRanges ) {
					modelRange = editor.editing.mapper.toModelRange(
						data.targetRanges[ 0 ]
					);
				} else {
					modelRange = model.document.selection.getFirstRange();
				}

				const selection = model.createSelection( modelRange );

				if (
					determineVideoTypeForInsertionAtSelection(
						model.schema,
						selection
					) === 'videoBlock'
				) {
					const writer = new UpcastWriter( editingView.document );

					const blockViewVideos = docFragmentChildren.map(
						inlineViewVideo =>
							writer.createElement(
								'figure',
								{ class: 'video' },
								inlineViewVideo
							)
					);

					data.content =
						writer.createDocumentFragment( blockViewVideos );
				}
			}
		);
	}
}
