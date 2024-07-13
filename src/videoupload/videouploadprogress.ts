import {
	Plugin,
	FileRepository,
	type Editor,
	type FileLoader,
	type DowncastWriter,
	type EditingView,
	type ViewElement,
	type ViewContainerElement,
	type ViewUIElement,
	type DowncastAttributeEvent,
	type Element,
	type GetCallback
} from 'ckeditor5';
// import uploadingPlaceholder from '../../theme/icons/video_placeholder.svg';
import '../../theme/videouploadprogress.css';
import '../../theme/videouploadicon.css';
import '../../theme/videouploadloader.css';
import type VideoUtils from '../videoutils.js';

export default class VideoUploadProgress extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoUploadProgress' as const;
	}

	private placeholder: string;

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		this.placeholder =
			'data:video/svg+xml;utf8,' +
			encodeURIComponent(
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 250"><rect rx="4"/></svg>'
			);
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;

		// Upload status change - update video's view according to that status.
		if ( editor.plugins.has( 'VideoBlockEditing' ) ) {
			editor.editing.downcastDispatcher.on<DowncastAttributeEvent>(
				'attribute:uploadStatus:videoBlock',
				( ...args ) => this.uploadStatusChange( ...args )
			);
		}

		if ( editor.plugins.has( 'VideoInlineEditing' ) ) {
			editor.editing.downcastDispatcher.on<DowncastAttributeEvent>(
				'attribute:uploadStatus:videoInline',
				( ...args ) => this.uploadStatusChange( ...args )
			);
		}
	}

	private uploadStatusChange: GetCallback<DowncastAttributeEvent> = (
		evt,
		data,
		conversionApi
	) => {
		const editor = this.editor;
		const modelVideo = data.item as Element;
		const uploadId = modelVideo.getAttribute( 'uploadId' ) as string | number;

		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const fileRepository = editor.plugins.get( FileRepository );
		const status = uploadId ? data.attributeNewValue : null;
		const placeholder = this.placeholder;
		const viewFigure = editor.editing.mapper.toViewElement(
			modelVideo
		)! as ViewContainerElement;
		const viewWriter = conversionApi.writer;

		if ( status === 'reading' ) {
			// Start "appearing" effect and show placeholder with infinite progress bar on the top
			// while video is read from disk.
			_startAppearEffect( viewFigure, viewWriter );
			_showPlaceholder( videoUtils, placeholder, viewFigure, viewWriter );
			return;
		}

		// Show progress bar on the top of the video when video is uploading.
		if ( status === 'uploading' ) {
			const loader = fileRepository.loaders.get( uploadId );

			// Start appear effect if needed - see https://github.com/ckeditor/ckeditor5-video/issues/191.
			_startAppearEffect( viewFigure, viewWriter );

			if ( !loader ) {
				// There is no loader associated with uploadId - this means that video came from external changes.
				// In such cases we still want to show the placeholder until video is fully uploaded.
				// Show placeholder if needed - see https://github.com/ckeditor/ckeditor5-video/issues/191.
				_showPlaceholder(
					videoUtils,
					placeholder,
					viewFigure,
					viewWriter
				);
			} else {
				// Hide placeholder and initialize progress bar showing upload progress.
				_hidePlaceholder( viewFigure, viewWriter );
				_showProgressBar(
					viewFigure,
					viewWriter,
					loader,
					editor.editing.view
				);
				_displayLocalVideo( videoUtils, viewFigure, viewWriter, loader );
			}

			return;
		}

		if ( status === 'complete' && fileRepository.loaders.get( uploadId ) ) {
			_showCompleteIcon( viewFigure, viewWriter, editor.editing.view );
		}

		// Clean up.
		_hideProgressBar( viewFigure, viewWriter );
		_hidePlaceholder( viewFigure, viewWriter );
		_stopAppearEffect( viewFigure, viewWriter );
	};
}

function _startAppearEffect(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter
) {
	if ( !viewFigure.hasClass( 'ck-appear' ) ) {
		writer.addClass( 'ck-appear', viewFigure );
	}
}

function _stopAppearEffect(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter
) {
	writer.removeClass( 'ck-appear', viewFigure );
}

function _showPlaceholder(
	videoUtils: VideoUtils,
	placeholder: string,
	viewFigure: ViewContainerElement,
	writer: DowncastWriter
) {
	if ( !viewFigure.hasClass( 'ck-video-upload-placeholder' ) ) {
		writer.addClass( 'ck-video-upload-placeholder', viewFigure );
	}

	const viewVideo = videoUtils.findViewVideoElement( viewFigure )!;

	if ( viewVideo.getAttribute( 'src' ) !== placeholder ) {
		writer.setAttribute( 'src', placeholder, viewVideo );
	}

	if ( !_getUIElement( viewFigure, 'placeholder' ) ) {
		writer.insert(
			writer.createPositionAfter( viewVideo ),
			_createPlaceholder( writer )
		);
	}
}

function _hidePlaceholder(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter
) {
	if ( viewFigure.hasClass( 'ck-video-upload-placeholder' ) ) {
		writer.removeClass( 'ck-video-upload-placeholder', viewFigure );
	}

	_removeUIElement( viewFigure, writer, 'placeholder' );
}

function _showProgressBar(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter,
	loader: FileLoader,
	view: EditingView
) {
	const progressBar = _createProgressBar( writer );
	writer.insert( writer.createPositionAt( viewFigure, 'end' ), progressBar );

	// Update progress bar width when uploadedPercent is changed.
	loader.on( 'change:uploadedPercent', ( evt, name, value ) => {
		view.change( writer => {
			writer.setStyle( 'width', value + '%', progressBar );
		} );
	} );
}

function _hideProgressBar(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter
) {
	_removeUIElement( viewFigure, writer, 'progressBar' );
}

function _showCompleteIcon(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter,
	view: EditingView
) {
	const completeIcon = writer.createUIElement( 'div', {
		class: 'ck-video-upload-complete-icon'
	} );

	writer.insert( writer.createPositionAt( viewFigure, 'end' ), completeIcon );

	setTimeout( () => {
		view.change( writer =>
			writer.remove( writer.createRangeOn( completeIcon ) )
		);
	}, 3000 );
}

function _createProgressBar( writer: DowncastWriter ): ViewUIElement {
	const progressBar = writer.createUIElement( 'div', {
		class: 'ck-progress-bar'
	} );

	writer.setCustomProperty( 'progressBar', true, progressBar );

	return progressBar;
}

function _createPlaceholder( writer: DowncastWriter ): ViewUIElement {
	const placeholder = writer.createUIElement( 'div', {
		class: 'ck-upload-placeholder-loader'
	} );

	writer.setCustomProperty( 'placeholder', true, placeholder );

	return placeholder;
}

function _getUIElement(
	videoFigure: ViewElement,
	uniqueProperty: string
): ViewUIElement | undefined {
	for ( const child of videoFigure.getChildren() ) {
		if ( ( child as ViewElement ).getCustomProperty( uniqueProperty ) ) {
			return child as ViewUIElement;
		}
	}
}

function _removeUIElement(
	viewFigure: ViewContainerElement,
	writer: DowncastWriter,
	uniqueProperty: string
) {
	const element = _getUIElement( viewFigure, uniqueProperty );

	if ( element ) {
		writer.remove( writer.createRangeOn( element ) );
	}
}

function _displayLocalVideo(
	videoUtils: VideoUtils,
	viewFigure: ViewElement,
	writer: DowncastWriter,
	loader: FileLoader
) {
	if ( loader.data ) {
		const viewVideo = videoUtils.findViewVideoElement( viewFigure )!;

		writer.setAttribute( 'src', loader.data, viewVideo );
	}
}
