import { Plugin, WidgetToolbarRepository } from 'ckeditor5';
import VideoUtils from './videoutils.js';
import { isObject } from 'lodash-es';
import type { VideoStyleDropdownDefinition } from './videoconfig.js';

export default class VideoToolbar extends Plugin {
	/**
     * @inheritDoc
     */
	public static get requires() {
		return [ WidgetToolbarRepository, VideoUtils ] as const;
	}

	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'VideoToolbar' as const;
	}

	/**
     * @inheritDoc
     */
	public afterInit(): void {
		const editor = this.editor;
		const t = editor.t;
		const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );
		const videoUtils: VideoUtils = editor.plugins.get<string>( 'VideoUtils' ) as VideoUtils;

		widgetToolbarRepository.register( 'video', {
			ariaLabel: t( 'Video toolbar' ),
			items: normalizeDeclarativeConfig( editor.config.get( 'video.toolbar' ) as Array<string | VideoStyleDropdownDefinition> || [] ),
			getRelatedElement: selection => videoUtils.getClosestSelectedVideoWidget( selection )!
		} );
	}
}

function normalizeDeclarativeConfig( config: Array<string | VideoStyleDropdownDefinition> ): Array<string> {
	return config.map( item => isObject( item ) ? item.name : item );
}

