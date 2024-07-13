import {
	Plugin,
	Notification,
	ClipboardPipeline,
	FileRepository,
	env,
	UpcastWriter,
	type Element,
	type Item,
	type Writer,
	type DataTransfer,
	type ViewElement,
	type Editor,
	type UploadResponse,
	type FileLoader,
	type ViewDocumentClipboardInputEvent
} from 'ckeditor5';
import VideoUtils from '../videoutils.js';
import UploadVideoCommand from './uploadvideocommand.js';
import { fetchLocalVideo, isLocalVideo, createVideoTypeRegExp } from './utils.js';

const DEFAULT_VIDEO_EXTENSIONS = [ 'mp4', 'webm', 'ogg' ];

export default class VideoUploadEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [
			FileRepository,
			Notification,
			ClipboardPipeline,
			VideoUtils
		] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoUploadEditing' as const;
	}

	private readonly _uploadVideoElements: Map<string, Element>;

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		editor.config.define( 'video.upload', {
			types: DEFAULT_VIDEO_EXTENSIONS,
			allowMultipleFiles: true
		} );

		this._uploadVideoElements = new Map();
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const doc = editor.model.document;
		const conversion = editor.conversion;
		const fileRepository = editor.plugins.get( FileRepository );
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const clipboardPipeline: ClipboardPipeline =
			editor.plugins.get( 'ClipboardPipeline' );
		const videoTypes = createVideoTypeRegExp(
			editor.config.get( 'video.upload.types' )! as Array<string>
		);
		const uploadVideoCommand = new UploadVideoCommand( editor );

		editor.commands.add( 'uploadVideo', uploadVideoCommand );
		editor.commands.add( 'videoUpload', uploadVideoCommand );

		conversion.for( 'upcast' ).attributeToAttribute( {
			view: {
				name: 'video',
				key: 'uploadId'
			},
			model: 'uploadId'
		} );

		this.listenTo<ViewDocumentClipboardInputEvent>(
			editor.editing.view.document,
			'clipboardInput',
			( evt, data ) => {
				if ( isHtmlIncluded( data.dataTransfer ) ) {
					return;
				}

				const videos = Array.from( data.dataTransfer.files ).filter(
					file => {
						if ( !file ) {
							return false;
						}

						return videoTypes.test( file?.type );
					}
				);

				if ( !videos.length ) {
					return;
				}

				evt.stop();

				editor.model.change( writer => {
					if ( data.targetRanges ) {
						writer.setSelection(
							data.targetRanges.map( viewRange =>
								editor.editing.mapper.toModelRange( viewRange )
							)
						);
					}

					editor.model.enqueueChange( () => {
						editor.execute( 'uploadVideo', { file: videos } );
					} );
				} );
			}
		);

		this.listenTo( clipboardPipeline, 'inputTransformation', ( evt, data ) => {
			const fetchableVideos = Array.from(
				editor.editing.view.createRangeIn( data.content )
			)
				.map( value => value.item as ViewElement )
				.filter(
					viewElement =>
						isLocalVideo( videoUtils, viewElement ) &&
						!viewElement.getAttribute( 'uploadProcessed' )
				)
				.map( viewElement => {
					return {
						promise: fetchLocalVideo( viewElement ),
						videoElement: viewElement
					};
				} );

			if ( !fetchableVideos.length ) {
				return;
			}

			const writer = new UpcastWriter( editor.editing.view.document );

			for ( const fetchableVideo of fetchableVideos ) {
				writer.setAttribute(
					'uploadProcessed',
					true,
					fetchableVideo.videoElement
				);

				const loader = fileRepository.createLoader(
					fetchableVideo.promise
				);

				if ( loader ) {
					writer.setAttribute( 'src', '', fetchableVideo.videoElement );
					writer.setAttribute(
						'uploadId',
						loader.id,
						fetchableVideo.videoElement
					);
				}
			}
		} );

		editor.editing.view.document.on( 'dragover', ( evt, data ) => {
			data.preventDefault();
		} );

		doc.on( 'change', () => {
			const changes = doc.differ
				.getChanges( { includeChangesInGraveyard: true } )
				.reverse();
			const insertedVideosIds = new Set();

			for ( const entry of changes ) {
				if ( entry.type === 'insert' && entry.name !== '$text' ) {
					const item = entry.position.nodeAfter!;
					const isInsertedInGraveyard =
						entry.position.root.rootName === '$graveyard';

					for ( const videoElement of getVideosFromChangeItem(
						editor,
						item
					) ) {
						const uploadId = videoElement.getAttribute(
							'uploadId'
						) as string;

						if ( !uploadId ) {
							continue;
						}

						const loader = fileRepository.loaders.get( uploadId );

						if ( !loader ) {
							continue;
						}

						if ( isInsertedInGraveyard ) {
							if ( !insertedVideosIds.has( uploadId ) ) {
								loader.abort();
							}
						} else {
							insertedVideosIds.add( uploadId );
							this._uploadVideoElements.set(
								uploadId,
								videoElement as Element
							);

							if ( loader.status == 'idle' ) {
								this._readAndUpload( loader );
							}
						}
					}
				}
			}
		} );

		this.on<VideoUploadCompleteEvent>(
			'uploadComplete',
			( evt, { videoElement, data } ) => {
				const urls = data.urls ?
					( data.urls as Record<string, unknown> ) :
					data;

				this.editor.model.change( writer => {
					writer.setAttribute( 'src', urls.default, videoElement );
				} );
			},
			{ priority: 'low' }
		);
	}

	/**
	 * @inheritDoc
	 */
	public afterInit(): void {
		const schema = this.editor.model.schema;

		if ( this.editor.plugins.has( 'VideoBlockEditing' ) ) {
			schema.extend( 'videoBlock', {
				allowAttributes: [ 'uploadId', 'uploadStatus' ]
			} );
		}

		if ( this.editor.plugins.has( 'VideoInlineEditing' ) ) {
			schema.extend( 'videoInline', {
				allowAttributes: [ 'uploadId', 'uploadStatus' ]
			} );
		}
	}

	protected _readAndUpload( loader: FileLoader ): Promise<void> {
		const editor = this.editor;
		const model = editor.model;
		const t = editor.locale.t;
		const fileRepository = editor.plugins.get( FileRepository );
		const notification = editor.plugins.get( Notification );
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const videoUploadElements = this._uploadVideoElements;

		model.enqueueChange( { isUndoable: false }, writer => {
			writer.setAttribute(
				'uploadStatus',
				'reading',
				videoUploadElements.get( loader.id )!
			);
		} );

		return loader
			.read()
			.then( () => {
				const promise = loader.upload();
				const videoElement = videoUploadElements.get( loader.id )!;

				if ( env.isSafari ) {
					const viewFigure =
						editor.editing.mapper.toViewElement( videoElement )!;
					const viewVideo =
						videoUtils.findViewVideoElement( viewFigure )!;

					editor.editing.view.once( 'render', () => {
						if ( !viewVideo.parent ) {
							return;
						}

						const domFigure =
							editor.editing.view.domConverter.mapViewToDom(
								viewVideo.parent
							) as HTMLElement | undefined;

						if ( !domFigure ) {
							return;
						}

						const originalDisplay = domFigure.style.display;

						domFigure.style.display = 'none';

						( domFigure as any )._ckHack = domFigure.offsetHeight;

						domFigure.style.display = originalDisplay;
					} );
				}

				model.enqueueChange( { isUndoable: false }, writer => {
					writer.setAttribute(
						'uploadStatus',
						'uploading',
						videoElement
					);
				} );

				return promise;
			} )
			.then( data => {
				model.enqueueChange( { isUndoable: false }, writer => {
					const videoElement = videoUploadElements.get( loader.id )!;

					writer.setAttribute(
						'uploadStatus',
						'complete',
						videoElement
					);

					this.fire<VideoUploadCompleteEvent>( 'uploadComplete', {
						data,
						videoElement
					} );
				} );

				clean();
			} )
			.catch( error => {
				if ( loader.status !== 'error' && loader.status !== 'aborted' ) {
					throw error;
				}

				if ( loader.status === 'error' && error ) {
					notification.showWarning( error, {
						title: t( 'Upload failed' ),
						namespace: 'upload'
					} );
				}

				model.enqueueChange( { isUndoable: false }, writer => {
					writer.remove( videoUploadElements.get( loader.id )! );
				} );

				clean();
			} );

		function clean() {
			model.enqueueChange( { isUndoable: false }, writer => {
				const videoElement = videoUploadElements.get( loader.id )!;

				writer.removeAttribute( 'uploadId', videoElement );
				writer.removeAttribute( 'uploadStatus', videoElement );

				videoUploadElements.delete( loader.id );
			} );

			fileRepository.destroyLoader( loader );
		}
	}
}

export function isHtmlIncluded( dataTransfer: DataTransfer ): boolean {
	return (
		Array.from( dataTransfer.types ).includes( 'text/html' ) &&
		dataTransfer.getData( 'text/html' ) !== ''
	);
}

function getVideosFromChangeItem( editor: Editor, item: Item ): Array<Item> {
	const videoUtils: VideoUtils = editor.plugins.get(
		'VideoUtils'
	) as VideoUtils;

	return Array.from( editor.model.createRangeOn( item ) )
		.filter( value => videoUtils.isVideo( value.item as Element ) )
		.map( value => value.item );
}

export type VideoUploadCompleteEvent = {
	name: 'uploadComplete';
	args: [data: VideoUploadCompleteData];
};

export type VideoUploadCompleteData = {

	/**
	 * The data coming from the upload adapter.
	 */
	data: UploadResponse;

	/**
	 * The model {@link module:engine/model/element~Element image element} that can be customized.
	 */
	videoElement: Element;
};
