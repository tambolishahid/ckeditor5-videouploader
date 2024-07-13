import {
	logWarning,
	icons,
	type Editor,
	type PluginCollection
} from 'ckeditor5';
import type {
	VideoStyleConfig,
	VideoStyleDropdownDefinition,
	VideoStyleOptionDefinition
} from '../videoconfig.js';

const {
	objectFullWidth,
	objectInline,
	objectLeft,
	objectRight,
	objectCenter,
	objectBlockLeft,
	objectBlockRight
} = icons;

const DEFAULT_OPTIONS: Record<string, VideoStyleOptionDefinition> = {
	get inline() {
		return {
			name: 'inline',
			title: 'In line',
			icon: objectInline,
			modelElements: [ 'videoInline' ],
			isDefault: true
		};
	},

	get alignLeft() {
		return {
			name: 'alignLeft',
			title: 'Left aligned video',
			icon: objectLeft,
			modelElements: [ 'videoBlock', 'videoInline' ],
			className: 'video-style-align-left'
		};
	},

	get alignBlockLeft() {
		return {
			name: 'alignBlockLeft',
			title: 'Left aligned video',
			icon: objectBlockLeft,
			modelElements: [ 'videoBlock' ],
			className: 'video-style-block-align-left'
		};
	},

	get alignCenter() {
		return {
			name: 'alignCenter',
			title: 'Centered video',
			icon: objectCenter,
			modelElements: [ 'videoBlock' ],
			className: 'video-style-align-center'
		};
	},

	get alignRight() {
		return {
			name: 'alignRight',
			title: 'Right aligned video',
			icon: objectRight,
			modelElements: [ 'videoBlock', 'videoInline' ],
			className: 'video-style-align-right'
		};
	},

	get alignBlockRight() {
		return {
			name: 'alignBlockRight',
			title: 'Right aligned video',
			icon: objectBlockRight,
			modelElements: [ 'videoBlock' ],
			className: 'video-style-block-align-right'
		};
	},

	get block() {
		return {
			name: 'block',
			title: 'Centered video',
			icon: objectCenter,
			modelElements: [ 'videoBlock' ],
			isDefault: true
		};
	},

	get side() {
		return {
			name: 'side',
			title: 'Side video',
			icon: objectRight,
			modelElements: [ 'videoBlock' ],
			className: 'video-style-side'
		};
	}
};

const DEFAULT_ICONS: Record<string, string> = {
	full: objectFullWidth,
	left: objectBlockLeft,
	right: objectBlockRight,
	center: objectCenter,
	inlineLeft: objectLeft,
	inlineRight: objectRight,
	inline: objectInline
};

const DEFAULT_DROPDOWN_DEFINITIONS: Array<VideoStyleDropdownDefinition> = [
	{
		name: 'videoStyle:wrapText',
		title: 'Wrap text',
		defaultItem: 'videoStyle:alignLeft',
		items: [ 'videoStyle:alignLeft', 'videoStyle:alignRight' ]
	},
	{
		name: 'videoStyle:breakText',
		title: 'Break text',
		defaultItem: 'videoStyle:block',
		items: [
			'videoStyle:alignBlockLeft',
			'videoStyle:block',
			'videoStyle:alignBlockRight'
		]
	}
];

function normalizeStyles( config: {
	isInlinePluginLoaded: boolean;
	isBlockPluginLoaded: boolean;
	configuredStyles: VideoStyleConfig;
} ): Array<VideoStyleOptionDefinition> {
	const configuredStyles = config.configuredStyles.options || [];

	const styles = configuredStyles
		.map( arrangement => normalizeDefinition( arrangement ) )
		.filter( arrangement => isValidOption( arrangement, config ) );

	return styles;
}

function getDefaultStylesConfiguration(
	isBlockPluginLoaded: boolean,
	isInlinePluginLoaded: boolean
): VideoStyleConfig {
	if ( isBlockPluginLoaded && isInlinePluginLoaded ) {
		return {
			options: [
				'inline',
				'alignLeft',
				'alignRight',
				'alignCenter',
				'alignBlockLeft',
				'alignBlockRight',
				'block',
				'side'
			]
		};
	} else if ( isBlockPluginLoaded ) {
		return {
			options: [ 'block', 'side' ]
		};
	} else if ( isInlinePluginLoaded ) {
		return {
			options: [ 'inline', 'alignLeft', 'alignRight' ]
		};
	}

	return {};
}

function getDefaultDropdownDefinitions(
	pluginCollection: PluginCollection<Editor>
): Array<VideoStyleDropdownDefinition> {
	if (
		pluginCollection.has( 'VideoBlockEditing' ) &&
		pluginCollection.has( 'VideoInlineEditing' )
	) {
		return [ ...DEFAULT_DROPDOWN_DEFINITIONS ];
	} else {
		return [];
	}
}

function normalizeDefinition(
	definition:
		| string
		| ( Partial<VideoStyleOptionDefinition> & {
				name: string;
				icon?: string;
		  } )
): VideoStyleOptionDefinition {
	if ( typeof definition === 'string' ) {
		if ( !DEFAULT_OPTIONS[ definition ] ) {
			definition = { name: definition };
		} else {
			definition = { ...DEFAULT_OPTIONS[ definition ] };
		}
	} else {
		definition = extendStyle( DEFAULT_OPTIONS[ definition.name ], definition );
	}

	if ( typeof definition.icon === 'string' ) {
		definition.icon = DEFAULT_ICONS[ definition.icon ] || definition.icon;
	}

	return definition as VideoStyleOptionDefinition;
}

function isValidOption(
	option: VideoStyleOptionDefinition,
	{
		isBlockPluginLoaded,
		isInlinePluginLoaded
	}: { isBlockPluginLoaded: boolean; isInlinePluginLoaded: boolean }
): boolean {
	const { modelElements, name } = option;

	if ( !modelElements || !modelElements.length || !name ) {
		warnInvalidStyle( { style: option } );

		return false;
	} else {
		const supportedElements = [
			isBlockPluginLoaded ? 'videoBlock' : null,
			isInlinePluginLoaded ? 'videoInline' : null
		];

		if (
			!modelElements.some( elementName =>
				supportedElements.includes( elementName )
			)
		) {
			logWarning( 'video-style-missing-dependency', {
				style: option,
				missingPlugins: modelElements.map( name =>
					name === 'videoBlock' ?
						'VideoBlockEditing' :
						'VideoInlineEditing'
				)
			} );

			return false;
		}
	}

	return true;
}

function extendStyle(
	source: VideoStyleOptionDefinition,
	style: Partial<VideoStyleOptionDefinition>
): VideoStyleOptionDefinition {
	const extendedStyle: Record<string, any> = { ...style };

	for ( const prop in source ) {
		if ( !Object.prototype.hasOwnProperty.call( style, prop ) ) {
			extendedStyle[ prop ] = source[ prop as keyof typeof source ];
		}
	}

	return extendedStyle as VideoStyleOptionDefinition;
}

function warnInvalidStyle( info: object ): void {
	logWarning( 'video-style-configuration-definition-invalid', info );
}

export default {
	normalizeStyles,
	getDefaultStylesConfiguration,
	getDefaultDropdownDefinitions,
	warnInvalidStyle,
	DEFAULT_OPTIONS,
	DEFAULT_ICONS,
	DEFAULT_DROPDOWN_DEFINITIONS
};
