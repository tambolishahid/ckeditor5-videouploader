import { Plugin, type ViewElement, type ViewContainerElement, type DowncastWriter } from 'ckeditor5';
import VideoLoadObserver from './videoloadobserver.js';
import InsertVideoCommand from './insertvideocommand.js';
import VideoUtils from '../videoutils.js';

export default class VideoEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoUtils ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const conversion = editor.conversion;

		editor.editing.view.addObserver( VideoLoadObserver );

		conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: 'video',
					key: 'src'
				},
				model: {
					key: 'src',
					value: ( viewVideo: ViewElement ) => {
						const value: Record<string, string | undefined> = {
							data: viewVideo.getAttribute( 'src' )
						};

						if ( viewVideo.hasAttribute( 'width' ) ) {
							value.width = viewVideo.getAttribute( 'width' );
						}

						return value;
					}
				}
			} );

		const insertVideoCommand = new InsertVideoCommand( editor );
		editor.commands.add( 'insertVideo', insertVideoCommand );
		editor.commands.add( 'videoInsert', insertVideoCommand );
	}
}

export function createVideoViewElement( writer: DowncastWriter ): ViewContainerElement {
	const emptyElement = writer.createEmptyElement( 'video' );
	const figure = writer.createContainerElement( 'figure', { class: 'video' } );

	writer.insert( writer.createPositionAt( figure, 0 ), emptyElement );

	return figure;
}
