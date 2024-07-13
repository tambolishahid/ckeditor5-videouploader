import {
	Plugin,
	icons,
	CKEditorError,
	Collection,
	ButtonView,
	DropdownButtonView,
	ViewModel,
	createDropdown,
	addListToDropdown,
	type Editor,
	type ListDropdownItemDefinition,
	type Locale
} from 'ckeditor5';
import VideoResizeEditing from './videoresizeediting.js';
import type ResizeVideoCommand from './resizevideocommand.js';
import type { VideoResizeOption } from '../videoconfig.js';

const RESIZE_ICONS = {
	small: icons.objectSizeSmall,
	medium: icons.objectSizeMedium,
	large: icons.objectSizeLarge,
	original: icons.objectSizeFull
};

export default class VideoResizeButtons extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoResizeEditing ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'VideoResizeButtons' as const;
	}

	/**
	 * The resize unit.
	 * @default '%'
	 */
	private readonly _resizeUnit: 'px' | '%' | undefined;

	/**
	 * @inheritDoc
	 */
	constructor( editor: Editor ) {
		super( editor );

		this._resizeUnit = editor.config.get( 'video.resizeUnit' ) as
			| 'px'
			| '%'
			| undefined;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const options: Array<VideoResizeOption> = editor.config.get(
			'video.resizeOptions'
		)! as Array<VideoResizeOption>;
		const command: ResizeVideoCommand = editor.commands.get(
			'resizeVideo'
		) as ResizeVideoCommand;

		this.bind( 'isEnabled' ).to( command );

		for ( const option of options ) {
			this._registerVideoResizeButton( option );
		}

		this._registerVideoResizeDropdown( options );
	}

	private _registerVideoResizeButton( option: VideoResizeOption ): void {
		const editor = this.editor;
		const { name, value, icon } = option;
		const optionValueWithUnit = value ? value + this._resizeUnit : null;

		editor.ui.componentFactory.add( name, locale => {
			const button = new ButtonView( locale );
			const command: ResizeVideoCommand = editor.commands.get(
				'resizeVideo'
			) as ResizeVideoCommand;
			const labelText = this._getOptionLabelValue( option, true );

			if ( !RESIZE_ICONS[ icon as keyof typeof RESIZE_ICONS ] ) {
				throw new CKEditorError(
					'videoresizebuttons-missing-icon',
					editor,
					option
				);
			}

			button.set( {
				// Use the `label` property for a verbose description (because of ARIA).
				label: labelText,
				icon: RESIZE_ICONS[ icon as keyof typeof RESIZE_ICONS ],
				tooltip: labelText,
				isToggleable: true
			} );

			// Bind button to the command.
			button.bind( 'isEnabled' ).to( this );
			button
				.bind( 'isOn' )
				.to(
					command,
					'value',
					getIsOnButtonCallback( optionValueWithUnit )
				);

			this.listenTo( button, 'execute', () => {
				editor.execute( 'resizeVideo', { width: optionValueWithUnit } );
			} );

			return button;
		} );
	}

	private _registerVideoResizeDropdown(
		options: Array<VideoResizeOption>
	): void {
		const editor = this.editor;
		const t = editor.t;
		const originalSizeOption = options.find( option => !option.value )!;

		// Register dropdown.
		const componentCreator = ( locale: Locale ) => {
			const command: ResizeVideoCommand = editor.commands.get(
				'resizeVideo'
			) as ResizeVideoCommand;
			const dropdownView = createDropdown( locale, DropdownButtonView );
			const dropdownButton: typeof dropdownView.buttonView & {
				commandValue?: string | null;
			} = dropdownView.buttonView;

			dropdownButton.set( {
				tooltip: t( 'Resize video' ),
				commandValue: originalSizeOption.value,
				icon: RESIZE_ICONS.medium,
				isToggleable: true,
				label: this._getOptionLabelValue( originalSizeOption ),
				withText: true,
				class: 'ck-resize-video-button'
			} );

			dropdownButton
				.bind( 'label' )
				.to( command, 'value', commandValue => {
					if ( commandValue && commandValue.width ) {
						return commandValue.width;
					} else {
						return this._getOptionLabelValue( originalSizeOption );
					}
				} );
			// TODO: check more
			// dropdownView.bind('isOn').to(command);

			dropdownView.bind( 'isEnabled' ).to( this );

			addListToDropdown(
				dropdownView,
				() =>
					this._getResizeDropdownListItemDefinitions(
						options,
						command
					),
				{
					ariaLabel: t( 'Video resize list' ),
					role: 'menu'
				}
			);

			// Execute command when an item from the dropdown is selected.
			this.listenTo( dropdownView, 'execute', evt => {
				editor.execute( ( evt.source as any ).commandName, {
					width: ( evt.source as any ).commandValue
				} );
				editor.editing.view.focus();
			} );

			return dropdownView;
		};

		editor.ui.componentFactory.add( 'resizeVideo', componentCreator );
		editor.ui.componentFactory.add( 'videoResize', componentCreator );
	}

	private _getOptionLabelValue(
		option: VideoResizeOption,
		forTooltip: boolean = false
	): string {
		const t = this.editor.t;

		if ( option.label ) {
			return option.label;
		} else if ( forTooltip ) {
			if ( option.value ) {
				return t( 'Resize video to %0', option.value + this._resizeUnit );
			} else {
				return t( 'Resize video to the original size' );
			}
		} else {
			if ( option.value ) {
				return option.value + this._resizeUnit;
			} else {
				return t( 'Original' );
			}
		}
	}

	private _getResizeDropdownListItemDefinitions(
		options: Array<VideoResizeOption>,
		command: ResizeVideoCommand
	): Collection<ListDropdownItemDefinition> {
		const itemDefinitions = new Collection<ListDropdownItemDefinition>();

		options.map( option => {
			const optionValueWithUnit = option.value ?
				option.value + this._resizeUnit :
				null;
			const definition: ListDropdownItemDefinition = {
				type: 'button',
				model: new ViewModel( {
					commandName: 'resizeVideo',
					commandValue: optionValueWithUnit,
					label: this._getOptionLabelValue( option ),
					withText: true,
					icon: null
				} )
			};

			definition.model
				.bind( 'isOn' )
				.to(
					command,
					'value',
					getIsOnButtonCallback( optionValueWithUnit )
				);

			itemDefinitions.add( definition );
		} );

		return itemDefinitions;
	}
}

function getIsOnButtonCallback(
	value: string | null
): ( commandValue: unknown ) => boolean {
	return ( commandValue: unknown ): boolean => {
		const objectCommandValue = commandValue as null | {
			width: string | null;
		};
		if ( value === null && objectCommandValue === value ) {
			return true;
		}

		return (
			objectCommandValue !== null && objectCommandValue.width === value
		);
	};
}
