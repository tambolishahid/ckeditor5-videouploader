import { type Element, type Editor, Command } from 'ckeditor5';
import type { VideoStyleOptionDefinition } from '../videoconfig.js';
import type VideoUtils from '../videoutils.js';

export default class VideoStyleCommand extends Command {
	private _defaultStyles: Record<string, string | false>;

	private _styles: Map<string, VideoStyleOptionDefinition>;

	constructor( editor: Editor, styles: Array<VideoStyleOptionDefinition> ) {
		super( editor );

		this._defaultStyles = {
			videoBlock: false,
			videoInline: false
		};

		this._styles = new Map(
			styles.map( style => {
				if ( style.isDefault ) {
					for ( const modelElementName of style.modelElements ) {
						this._defaultStyles[ modelElementName ] = style.name;
					}
				}

				return [ style.name, style ];
			} )
		);
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
		)!;

		this.isEnabled = !!element;

		if ( !this.isEnabled ) {
			this.value = false;
		} else if ( element.hasAttribute( 'videoStyle' ) ) {
			this.value = element.getAttribute( 'videoStyle' );
		} else {
			this.value = this._defaultStyles[ element.name ];
		}
	}

	public override execute( options: { value?: string } = {} ): void {
		const editor = this.editor;
		const model = editor.model;
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;

		model.change( writer => {
			const requestedStyle = options.value;

			let videoElement = videoUtils.getClosestSelectedVideoElement(
				model.document.selection
			)!;

			if (
				requestedStyle &&
				this.shouldConvertVideoType( requestedStyle, videoElement )
			) {
				this.editor.execute(
					videoUtils.isBlockVideo( videoElement ) ?
						'videoTypeInline' :
						'videoTypeBlock'
				);
				videoElement = videoUtils.getClosestSelectedVideoElement(
					model.document.selection
				)!;
			}

			if (
				!requestedStyle ||
				this._styles.get( requestedStyle )!.isDefault
			) {
				writer.removeAttribute( 'videoStyle', videoElement );
			} else {
				writer.setAttribute( 'videoStyle', requestedStyle, videoElement );
			}
		} );
	}

	public shouldConvertVideoType(
		requestedStyle: string,
		videoElement: Element
	): boolean {
		const supportedTypes = this._styles.get( requestedStyle )!.modelElements;

		return !supportedTypes.includes( videoElement.name );
	}
}
