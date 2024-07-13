import {
	icons,
	ButtonView,
	View,
	SplitButtonView,
	ViewCollection,
	submitHandler,
	createDropdown,
	FocusCycler,
	type InputTextView,
	type LabeledFieldView,
	type DropdownView,
	type FocusableView,
	Collection,
	FocusTracker,
	KeystrokeHandler,
	type Locale
} from 'ckeditor5';

import VideoInsertFormRowView from './videoinsertformrowview.js';

import '../../../theme/videoinsert.css';
export type ViewWithName = View & { name: string };

export default class VideoInsertPanelView extends View {
	/**
	 * The "insert/update" button view.
	 */
	public insertButtonView: ButtonView;

	/**
	 * The "cancel" button view.
	 */
	public cancelButtonView: ButtonView;

	/**
	 * The value of the URL input.
	 *
	 * @observable
	 */
	public declare videoURLInputValue: string;

	/**
	 * Tracks information about DOM focus in the form.
	 */
	public readonly focusTracker: FocusTracker;

	/**
	 * Tracks information about DOM focus in the form.
	 */
	public readonly dropdownView: DropdownView;

	/**
	 * An instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
	 */
	public readonly keystrokes: KeystrokeHandler;

	/**
	 * A collection of views that can be focused in the form.
	 */
	protected readonly _focusables: ViewCollection<FocusableView>;

	/**
	 * Helps cycling over {@link #_focusables} in the form.
	 */
	protected readonly _focusCycler: FocusCycler;

	/**
	 * A collection of the defined integrations for inserting the videos.
	 *
	 * @private
	 */
	public declare _integrations: Collection<ViewWithName>;

	/**
	 *
	 * @param locale The localization services instance.
	 * @param integrations An integrations object that contains components (or tokens for components) to be shown in the panel view.
	 */
	constructor( locale: Locale, integrations: Record<string, View> = {} ) {
		super( locale );

		const { insertButtonView, cancelButtonView } =
			this._createActionButtons( locale );

		this.insertButtonView = insertButtonView;

		this.cancelButtonView = cancelButtonView;

		this.dropdownView = this._createDropdownView( locale );

		this.set( 'videoURLInputValue', '' );

		this.focusTracker = new FocusTracker();

		this.keystrokes = new KeystrokeHandler();

		this._focusables = new ViewCollection();

		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate form fields backwards using the Shift + Tab keystroke.
				focusPrevious: 'shift + tab',

				// Navigate form fields forwards using the Tab key.
				focusNext: 'tab'
			}
		} );

		this.set( '_integrations', new Collection<ViewWithName>() );

		if ( integrations ) {
			for ( const [ integration, integrationView ] of Object.entries(
				integrations
			) ) {
				if ( integration === 'insertVideoViaUrl' ) {
					(
						integrationView as LabeledFieldView<InputTextView>
					).fieldView
						.bind( 'value' )
						.to(
							this,
							'videoURLInputValue',
							( value: string ) => value || ''
						);

					(
						integrationView as LabeledFieldView<InputTextView>
					).fieldView.on( 'input', () => {
						this.videoURLInputValue = (
							integrationView as LabeledFieldView<InputTextView>
						).fieldView.element!.value.trim();
					} );
				}

				( integrationView as ViewWithName ).name = integration;

				this._integrations.add( integrationView as ViewWithName );
			}
		}

		this.setTemplate( {
			tag: 'form',

			attributes: {
				class: [ 'ck', 'ck-video-insert-form' ],

				tabindex: '-1'
			},

			children: [
				...this._integrations,
				new VideoInsertFormRowView( locale, {
					children: [ this.insertButtonView, this.cancelButtonView ],
					class: 'ck-video-insert-form__action-row'
				} )
			]
		} );
	}

	/**
	 * @inheritDoc
	 */
	public override render(): void {
		super.render();

		submitHandler( {
			view: this
		} );

		const childViews = [
			...this._integrations,
			this.insertButtonView,
			this.cancelButtonView
		];

		childViews.forEach( v => {
			// Register the view as focusable.
			// this._focusables.add(v);

			// Register the view in the focus tracker.
			this.focusTracker.add( v.element! );
		} );

		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element! );

		const stopPropagation = ( data: KeyboardEvent ) => data.stopPropagation();

		// Since the form is in the dropdown panel which is a child of the toolbar, the toolbar's
		// keystroke handler would take over the key management in the URL input. We need to prevent
		// this ASAP. Otherwise, the basic caret movement using the arrow keys will be impossible.
		this.keystrokes.set( 'arrowright', stopPropagation );
		this.keystrokes.set( 'arrowleft', stopPropagation );
		this.keystrokes.set( 'arrowup', stopPropagation );
		this.keystrokes.set( 'arrowdown', stopPropagation );

		// Intercept the "selectstart" event, which is blocked by default because of the default behavior
		// of the DropdownView#panelView.
		// TODO: blocking "selectstart" in the #panelView should be configurable per–drop–down instance.
		this.listenTo(
			childViews[ 0 ].element!,
			'selectstart',
			( evt, domEvt ) => {
				domEvt.stopPropagation();
			},
			{ priority: 'high' }
		);
	}

	/**
	 * @inheritDoc
	 */
	public override destroy(): void {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}
	getIntegration( name: string ) {
		return this._integrations.find(
			integration => integration.name === name
		);
	}

	_createDropdownView( locale: Locale ): DropdownView {
		const t = locale.t;
		const dropdownView = createDropdown( locale, SplitButtonView );
		const splitButtonView = dropdownView.buttonView;
		const panelView = dropdownView.panelView;

		splitButtonView.set( {
			label: t( 'Insert video' ),
			icon: icons.image,
			tooltip: true
		} );

		panelView.extendTemplate( {
			attributes: {
				class: 'ck-video-insert__panel'
			}
		} );

		return dropdownView;
	}

	_createActionButtons( locale: Locale ): {
		insertButtonView: ButtonView;
		cancelButtonView: ButtonView;
	} {
		const t = locale.t;
		const insertButtonView = new ButtonView( locale );
		const cancelButtonView = new ButtonView( locale );

		insertButtonView.set( {
			label: t( 'Insert' ),
			icon: icons.check,
			class: 'ck-button-save',
			type: 'submit',
			withText: true,
			isEnabled: this.videoURLInputValue
		} );

		cancelButtonView.set( {
			label: t( 'Cancel' ),
			icon: icons.cancel,
			class: 'ck-button-cancel',
			withText: true
		} );

		insertButtonView
			.bind( 'isEnabled' )
			.to( this, 'videoURLInputValue', value => !!value );
		insertButtonView.delegate( 'execute' ).to( this, 'submit' );
		cancelButtonView.delegate( 'execute' ).to( this, 'cancel' );

		return { insertButtonView, cancelButtonView };
	}

	focus() {
		this._focusCycler.focusFirst();
	}
}

/**
 *
 * @eventName ~VideoInsertPanelView#submit
 */
export type SubmitEvent = {
	name: 'submit';
	args: [];
};

/**
 *
 * @eventName ~VideoInsertPanelView#cancel
 */
export type CancelEvent = {
	name: 'cancel';
	args: [];
};
