import { View, type ViewCollection, type LabelView, type Locale } from 'ckeditor5';

import '../../../theme/videoinsertformrowview.css';

export default class videoUploadFormRowView extends View {
	/**
	 * An additional CSS class added to the {@link #element}.
	 *
	 * @observable
	 */
	declare public class: string | null;

	/**
	 * A collection of row items (buttons, dropdowns, etc.).
	 */
	public readonly children: ViewCollection;

	/**
	 * The role property reflected by the `role` DOM attribute of the {@link #element}.
	 *
	 * **Note**: Used only when a `labelView` is passed to constructor `options`.
	 *
	 * @observable
	 * @private
	 */
	declare public _role: string | null;

	/**
	 * The ARIA property reflected by the `aria-labelledby` DOM attribute of the {@link #element}.
	 *
	 * **Note**: Used only when a `labelView` is passed to constructor `options`.
	 *
	 * @observable
	 * @private
	 */
	declare public _ariaLabelledBy: string | null;

	/**
	 * Creates an instance of the form row class.
	 *
	 * @param locale The locale instance.
	 * @param options.labelView When passed, the row gets the `group` and `aria-labelledby`
	 * DOM attributes and gets described by the label.
	 */
	constructor( locale: Locale, options: { children?: Array<View>; class?: string; labelView?: LabelView } = {} ) {
		super( locale );

		const bind = this.bindTemplate;

		this.set( 'class', options.class || null );

		this.children = this.createCollection();

		if ( options.children ) {
			options.children.forEach( child => this.children.add( child ) );
		}

		this.set( '_role', null );

		this.set( '_ariaLabelledBy', null );

		if ( options.labelView ) {
			this.set( {
				_role: 'group',
				_ariaLabelledBy: options.labelView.id
			} );
		}

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: [
					'ck',
					'ck-form__row',
					bind.to( 'class' )
				],
				role: bind.to( '_role' ),
				'aria-labelledby': bind.to( '_ariaLabelledBy' )
			},
			children: this.children
		} );
	}
}
