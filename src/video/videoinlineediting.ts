import {
	Plugin,
	ClipboardPipeline,
	UpcastWriter,
	type ClipboardInputTransformationEvent,
	type ViewElement
} from 'ckeditor5';
import { downcastVideoAttribute } from './converters.js';
import VideoEditing from './videoediting.js';
import VideoTypeCommand from './videotypecommand.js';
import VideoUtils from '../videoutils.js';
import {
	getVideoViewElementMatcher,
	createVideoViewElement,
	determineVideoTypeForInsertionAtSelection
} from './utils.js';

export default class VideoInlineEditing extends Plugin {
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
		return 'VideoInlineEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const schema = editor.model.schema;

		schema.register( 'videoInline', {
			isObject: true,
			isInline: true,
			allowWhere: '$text',
			allowAttributes: [ 'src' ]
		} );

		schema.addChildCheck( ( context, childDefinition ) => {
			if (
				context.endsWith( 'caption' ) &&
				childDefinition.name === 'videoInline'
			) {
				return false;
			}
		} );

		this._setupConversion();

		if ( editor.plugins.has( 'VideoBlockEditing' ) ) {
			editor.commands.add(
				'videoTypeInline',
				new VideoTypeCommand( this.editor, 'videoInline' )
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
			model: 'videoInline',
			view: ( modelElement, { writer } ) =>
				writer.createEmptyElement( 'video' )
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'videoInline',
			view: ( modelElement, { writer } ) =>
				videoUtils.toVideoWidget(
					createVideoViewElement( writer, 'videoInline' ),
					writer
				)
		} );

		conversion
			.for( 'downcast' )
			.add( downcastVideoAttribute( videoUtils, 'videoInline', 'src' ) );

		conversion.for( 'upcast' ).elementToElement( {
			view: getVideoViewElementMatcher( editor, 'videoInline' ),
			model: ( viewVideo, { writer } ) =>
				writer.createElement(
					'videoInline',
					viewVideo.hasAttribute( 'src' ) ?
						{ src: viewVideo.getAttribute( 'src' ) } :
						undefined
				)
		} );
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

				if ( !docFragmentChildren.every( videoUtils.isBlockVideoView ) ) {
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
					) === 'videoInline'
				) {
					const writer = new UpcastWriter( editingView.document );

					const inlineViewVideos = docFragmentChildren.map(
						blockViewVideo => {
							if ( blockViewVideo.childCount === 1 ) {
								Array.from(
									blockViewVideo.getAttributes()
								).forEach( attribute =>
									writer.setAttribute(
										...attribute,
										videoUtils.findViewVideoElement(
											blockViewVideo
										)
									)
								);

								return blockViewVideo.getChild( 0 )!;
							} else {
								return blockViewVideo;
							}
						}
					);

					data.content =
						writer.createDocumentFragment( inlineViewVideos );
				}
			}
		);
	}
}
