import { Plugin, type Element, type UpcastElementEvent } from 'ckeditor5';

import VideoStyleCommand from './videostylecommand.js';
import VideoUtils from '../videoutils.js';
import utils from './utils.js';
import {
	viewToModelStyleAttribute,
	modelToViewStyleAttribute
} from './converters.js';
import type { VideoStyleOptionDefinition } from '../videoconfig.js';

export default class VideoStyleEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoStyleEditing' as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoUtils ] as const;
	}

	public normalizedStyles?: Array<VideoStyleOptionDefinition>;

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const { normalizeStyles, getDefaultStylesConfiguration } = utils;
		const editor = this.editor;
		const isBlockPluginLoaded = editor.plugins.has( 'VideoBlockEditing' );
		const isInlinePluginLoaded = editor.plugins.has( 'VideoInlineEditing' );

		editor.config.define(
			'video.styles',
			getDefaultStylesConfiguration(
				isBlockPluginLoaded,
				isInlinePluginLoaded
			)
		);

		this.normalizedStyles = normalizeStyles( {
			configuredStyles: editor.config.get( 'video.styles' )!,
			isBlockPluginLoaded,
			isInlinePluginLoaded
		} );

		this._setupConversion( isBlockPluginLoaded, isInlinePluginLoaded );
		this._setupPostFixer();

		editor.commands.add(
			'videoStyle',
			new VideoStyleCommand(
				editor,
				this.normalizedStyles as Array<VideoStyleOptionDefinition>
			)
		);
	}

	private _setupConversion(
		isBlockPluginLoaded: boolean,
		isInlinePluginLoaded: boolean
	): void {
		const editor = this.editor;
		const schema = editor.model.schema;

		const modelToViewConverter = modelToViewStyleAttribute(
			this.normalizedStyles!
		);
		const viewToModelConverter = viewToModelStyleAttribute(
			this.normalizedStyles!
		);

		editor.editing.downcastDispatcher.on(
			'attribute:videoStyle',
			modelToViewConverter
		);
		editor.data.downcastDispatcher.on(
			'attribute:videoStyle',
			modelToViewConverter
		);

		if ( isBlockPluginLoaded ) {
			schema.extend( 'videoBlock', { allowAttributes: 'videoStyle' } );
			editor.data.upcastDispatcher.on<UpcastElementEvent>(
				'element:figure',
				viewToModelConverter,
				{ priority: 'low' }
			);
		}

		if ( isInlinePluginLoaded ) {
			schema.extend( 'videoInline', { allowAttributes: 'videoStyle' } );
			editor.data.upcastDispatcher.on(
				'element:video',
				viewToModelConverter,
				{ priority: 'low' }
			);
		}
	}

	private _setupPostFixer(): void {
		const editor = this.editor;
		const document = editor.model.document;

		const videoUtils = editor.plugins.get( VideoUtils );
		const stylesMap = new Map(
			this.normalizedStyles!.map( style => [ style.name, style ] )
		);

		document.registerPostFixer( writer => {
			let changed = false;

			for ( const change of document.differ.getChanges() ) {
				if (
					change.type === 'insert' ||
					( change.type === 'attribute' &&
						change.attributeKey === 'videoStyle' )
				) {
					let element =
						change.type === 'insert' ?
							change.position.nodeAfter :
							change.range.start.nodeAfter;

					if (
						element &&
						element.is( 'element', 'paragraph' ) &&
						element.childCount > 0
					) {
						element = element.getChild( 0 );
					}

					if ( !videoUtils.isVideo( element as Element ) ) {
						continue;
					}

					const videoStyle = element?.getAttribute( 'videoStyle' ) as
						| string
						| undefined;

					if ( !videoStyle ) {
						continue;
					}

					const videoStyleDefinition = stylesMap.get( videoStyle );

					if (
						!videoStyleDefinition ||
						!videoStyleDefinition.modelElements.includes(
							( element as Element ).name
						)
					) {
						writer.removeAttribute(
							'videoStyle',
							element as Element
						);
						changed = true;
					}
				}
			}

			return changed;
		} );
	}
}
