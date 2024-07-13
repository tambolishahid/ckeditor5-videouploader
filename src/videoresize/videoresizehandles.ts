import { Plugin, WidgetResize, type Element, type ViewContainerElement, type ViewElement } from 'ckeditor5';
import type ResizeVideoCommand from './resizevideocommand.js';
import VideoLoadObserver, { type VideoLoadedEvent } from '../video/videoloadobserver.js';

const RESIZABLE_VIDEOS_CSS_SELECTOR =
	'figure.video.ck-widget > video,' +
	'figure.video.ck-widget > a > video,' +
	'span.video-inline.ck-widget > video';

const VIDEO_WIDGETS_CLASSES_MATCH_REGEXP = /(video|video-inline)/;

const RESIZED_VIDEO_CLASS = 'video_resized';

export default class VideoResizeHandles extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ WidgetResize ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoResizeHandles' as const;
	}

	/**
	 * @inheritDoc
	*/
	public init(): void {
		const command: ResizeVideoCommand = this.editor.commands.get( 'resizeVideo' ) as ResizeVideoCommand;
		this.bind( 'isEnabled' ).to( command );

		this._setupResizerCreator();
	}

	private _setupResizerCreator(): void {
		const editor = this.editor;
		const editingView = editor.editing.view;

		editingView.addObserver( VideoLoadObserver );
		this.listenTo<VideoLoadedEvent>( editingView.document, 'videoLoaded', ( evt, domEvent ) => {
			if ( !( domEvent.target as HTMLElement ).matches( RESIZABLE_VIDEOS_CSS_SELECTOR ) ) {
				return;
			}

			const domConverter = editor.editing.view.domConverter;
			const videoView = domConverter.domToView( ( domEvent.target as HTMLElement ) ) as ViewElement;
			const widgetView = videoView.findAncestor( { classes: VIDEO_WIDGETS_CLASSES_MATCH_REGEXP } ) as ViewContainerElement;

			let resizer = this.editor.plugins.get( WidgetResize ).getResizerByViewElement( widgetView );

			if ( resizer ) {
				resizer.redraw();

				return;
			}

			const mapper = editor.editing.mapper;
			const videoModel = mapper.toModelElement( widgetView )!;

			resizer = editor.plugins
				.get( WidgetResize )
				.attachTo( {
					unit: editor.config.get( 'video.resizeUnit' ) as '%' | 'px' | undefined,

					modelElement: videoModel,
					viewElement: widgetView,
					editor,
					getHandleHost( domWidgetElement ) {
						return domWidgetElement.querySelector( 'video' )!;
					},
					getResizeHost( domWidgetElement ) {
						return domConverter.viewToDom( mapper.toViewElement( videoModel.parent as Element )! ) as HTMLElement;
					},
					isCentered() {
						const videoStyle = videoModel.getAttribute( 'videoStyle' );

						return !videoStyle || videoStyle === 'block' || videoStyle === 'alignCenter';
					},

					onCommit( newValue ) {
						editingView.change( writer => {
							writer.removeClass( RESIZED_VIDEO_CLASS, widgetView );
						} );

						editor.execute( 'resizeVideo', { width: newValue } );
					}
				} );

			resizer.on( 'updateSize', () => {
				if ( !widgetView.hasClass( RESIZED_VIDEO_CLASS ) ) {
					editingView.change( writer => {
						writer.addClass( RESIZED_VIDEO_CLASS, widgetView );
					} );
				}
			} );

			resizer.bind( 'isEnabled' ).to( this );
		} );
	}
}
