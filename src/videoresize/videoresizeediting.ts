import { Plugin, type ViewElement, type Editor } from 'ckeditor5';
import VideoUtils from '../videoutils.js';
import ResizeVideoCommand from './resizevideocommand.js';

export default class VideoResizeEditing extends Plugin {
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
		return 'VideoResizeEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		editor.config.define( 'video', {
			resizeUnit: '%',
			resizeOptions: [ {
				name: 'resizeVideo:original',
				value: null,
				icon: 'original'
			},
			{
				name: 'resizeVideo:25',
				value: '25',
				icon: 'small'
			},
			{
				name: 'resizeVideo:50',
				value: '50',
				icon: 'medium'
			},
			{
				name: 'resizeVideo:75',
				value: '75',
				icon: 'large'
			} ]
		} );
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const resizeVideoCommand = new ResizeVideoCommand( editor );

		this._registerSchema();
		this._registerConverters( 'videoBlock' );
		this._registerConverters( 'videoInline' );

		editor.commands.add( 'resizeVideo', resizeVideoCommand );
		editor.commands.add( 'videoResize', resizeVideoCommand );
	}

	private _registerSchema(): void {
		if ( this.editor.plugins.has( 'VideoBlockEditing' ) ) {
			this.editor.model.schema.extend( 'videoBlock', { allowAttributes: 'width' } );
		}

		if ( this.editor.plugins.has( 'VideoInlineEditing' ) ) {
			this.editor.model.schema.extend( 'videoInline', { allowAttributes: 'width' } );
		}
	}

	private _registerConverters( videoType: 'videoBlock' | 'videoInline' ) {
		const editor = this.editor;

		editor.conversion.for( 'downcast' ).add( dispatcher =>
			dispatcher.on( `attribute:width:${ videoType }`, ( evt, data, conversionApi ) => {
				if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
					return;
				}

				const viewWriter = conversionApi.writer;
				const figure = conversionApi.mapper.toViewElement( data.item );

				if ( data.attributeNewValue !== null ) {
					viewWriter.setStyle( 'width', data.attributeNewValue, figure );
					viewWriter.addClass( 'video_resized', figure );
				} else {
					viewWriter.removeStyle( 'width', figure );
					viewWriter.removeClass( 'video_resized', figure );
				}
			} )
		);

		editor.conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: videoType === 'videoBlock' ? 'figure' : 'video',
					styles: {
						width: /.+/
					}
				},
				model: {
					key: 'width',
					value: ( viewElement: ViewElement ) => viewElement.getStyle( 'width' )
				}
			} );
	}
}
