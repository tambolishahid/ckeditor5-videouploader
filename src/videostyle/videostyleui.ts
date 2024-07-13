import {
	Plugin,
	ButtonView,
	createDropdown,
	addToolbarToDropdown,
	SplitButtonView
} from 'ckeditor5';

import VideoStyleEditing from './videostyleediting.js';
import utils from './utils.js';
import { isObject, identity } from 'lodash-es';

import '../../theme/videostyle.css';
import type {
	VideoStyleDropdownDefinition,
	VideoStyleOptionDefinition
} from '../videoconfig.js';
import type VideoStyleCommand from './videostylecommand.js';

export default class VideoStyleUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoStyleEditing ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoStyleUI' as const;
	}

	public get localizedDefaultStylesTitles(): Record<string, string> {
		const t = this.editor.t;

		return {
			'Wrap text': t( 'Wrap text' ),
			'Break text': t( 'Break text' ),
			'In line': t( 'In line' ),
			'Full size video': t( 'Full size video' ),
			'Side video': t( 'Side video' ),
			'Left aligned video': t( 'Left aligned video' ),
			'Centered video': t( 'Centered video' ),
			'Right aligned video': t( 'Right aligned video' )
		};
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const plugins = this.editor.plugins;
		const toolbarConfig =
			( this.editor.config.get(
				'video.toolbar'
			) as Array<VideoStyleDropdownDefinition> ) || [];
		const videoStyleEditing: VideoStyleEditing = plugins.get(
			'VideoStyleEditing'
		) as VideoStyleEditing;

		const definedStyles = translateStyles(
			videoStyleEditing.normalizedStyles!,
			this.localizedDefaultStylesTitles
		);

		for ( const styleConfig of definedStyles ) {
			this._createButton( styleConfig );
		}

		const definedDropdowns = translateStyles(
			[
				...( toolbarConfig.filter(
					isObject
				) as Array<VideoStyleDropdownDefinition> ),
				...utils.getDefaultDropdownDefinitions( plugins )
			],
			this.localizedDefaultStylesTitles
		);

		for ( const dropdownConfig of definedDropdowns ) {
			this._createDropdown( dropdownConfig, definedStyles );
		}
	}

	private _createDropdown(
		dropdownConfig: VideoStyleDropdownDefinition,
		definedStyles: Array<VideoStyleOptionDefinition>
	): void {
		const factory = this.editor.ui.componentFactory;

		factory.add( dropdownConfig.name, locale => {
			let defaultButton: ButtonView | undefined;

			const { defaultItem, items, title } = dropdownConfig;
			const buttonViews = items
				.filter( itemName =>
					definedStyles.find(
						( { name } ) => getUIComponentName( name ) === itemName
					)
				)
				.map( buttonName => {
					const button = factory.create( buttonName ) as ButtonView;

					if ( buttonName === defaultItem ) {
						defaultButton = button;
					}

					return button;
				} );

			if ( items.length !== buttonViews.length ) {
				utils.warnInvalidStyle( { dropdown: dropdownConfig } );
			}

			const dropdownView = createDropdown( locale, SplitButtonView );
			const splitButtonView = dropdownView.buttonView as SplitButtonView;

			addToolbarToDropdown( dropdownView, buttonViews );

			splitButtonView.set( {
				label: getDropdownButtonTitle( title, defaultButton!.label! ),
				class: null,
				tooltip: true
			} );

			splitButtonView
				.bind( 'icon' )
				.toMany( buttonViews, 'isOn', ( ...areOn ) => {
					const index = areOn.findIndex( identity );

					return index < 0 ?
						defaultButton!.icon :
						buttonViews[ index ].icon;
				} );

			splitButtonView
				.bind( 'label' )
				.toMany( buttonViews, 'isOn', ( ...areOn ) => {
					const index = areOn.findIndex( identity );

					return getDropdownButtonTitle(
						title,
						index < 0 ?
							defaultButton!.label! :
							buttonViews[ index ].label!
					);
				} );

			splitButtonView
				.bind( 'isOn' )
				.toMany( buttonViews, 'isOn', ( ...areOn ) =>
					areOn.some( identity )
				);

			splitButtonView
				.bind( 'class' )
				.toMany( buttonViews, 'isOn', ( ...areOn ) =>
					areOn.some( identity ) ? 'ck-splitbutton_flatten' : undefined
				);

			splitButtonView.on( 'execute', () => {
				if ( !buttonViews.some( ( { isOn } ) => isOn ) ) {
					defaultButton!.fire( 'execute' );
				} else {
					dropdownView.isOpen = !dropdownView.isOpen;
				}
			} );

			dropdownView
				.bind( 'isEnabled' )
				.toMany( buttonViews, 'isEnabled', ( ...areEnabled ) =>
					areEnabled.some( identity )
				);
			// Focus the editable after executing the command.
			// Overrides a default behaviour where the focus is moved to the dropdown button (#12125).
			this.listenTo( dropdownView, 'execute', () => {
				this.editor.editing.view.focus();
			} );

			return dropdownView;
		} );
	}

	private _createButton( buttonConfig: VideoStyleOptionDefinition ): void {
		const buttonName = buttonConfig.name;

		this.editor.ui.componentFactory.add(
			getUIComponentName( buttonName ),
			locale => {
				const command: VideoStyleCommand = this.editor.commands.get(
					'videoStyle'
				) as VideoStyleCommand;
				const view = new ButtonView( locale );

				view.set( {
					label: buttonConfig.title,
					icon: buttonConfig.icon,
					tooltip: true,
					isToggleable: true
				} );

				view.bind( 'isEnabled' ).to( command, 'isEnabled' );
				view.bind( 'isOn' ).to(
					command,
					'value',
					value => value === buttonName
				);
				view.on( 'execute', this._executeCommand.bind( this, buttonName ) );

				return view;
			}
		);
	}

	private _executeCommand( name: string ): void {
		this.editor.execute( 'videoStyle', { value: name } );
		this.editor.editing.view.focus();
	}
}

function translateStyles<
	T extends VideoStyleOptionDefinition | VideoStyleDropdownDefinition
>( styles: Array<T>, titles: Record<string, string> ): Array<T> {
	for ( const style of styles ) {
		if ( titles[ style.title! ] ) {
			style.title = titles[ style.title! ];
		}
	}

	return styles;
}

function getUIComponentName( name: string ): string {
	return `videoStyle:${ name }`;
}

function getDropdownButtonTitle(
	dropdownTitle: string | undefined,
	buttonTitle: string
): string {
	return ( dropdownTitle ? dropdownTitle + ': ' : '' ) + buttonTitle;
}
