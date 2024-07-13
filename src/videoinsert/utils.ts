import { LabeledFieldView, createLabeledInputText, type Editor, type View, type ButtonView, type Locale } from 'ckeditor5';
import type VideoInsertUI from './videoinsertui.js';

export function prepareIntegrations( editor: Editor ): Record<string, View> {
	const panelItems: any = editor.config.get( 'video.insert.integrations' );
	const videoInsertUIPlugin: VideoInsertUI = editor.plugins.get( 'VideoInsertUI' ) as VideoInsertUI;

	const PREDEFINED_INTEGRATIONS: Record<string, View> = {
		'insertVideoViaUrl': createLabeledInputView( editor.locale )
	};

	if ( !panelItems ) {
		return PREDEFINED_INTEGRATIONS;
	}

	// Prepares ckfinder component for the `openCKFinder` integration token.
	if ( panelItems.find( ( item: string ) => item === 'openCKFinder' ) && editor.ui.componentFactory.has( 'ckfinder' ) ) {
		const ckFinderButton = editor.ui.componentFactory.create( 'ckfinder' ) as ButtonView;
		ckFinderButton.set( {
			withText: true,
			class: 'ck-video-insert__ck-finder-button'
		} );

		// We want to close the dropdown panel view when user clicks the ckFinderButton.
		ckFinderButton.delegate( 'execute' ).to( videoInsertUIPlugin, 'cancel' );

		PREDEFINED_INTEGRATIONS.openCKFinder = ckFinderButton;
	}

	return panelItems.reduce( ( object: Record<string, View>, key: string ) => {
		if ( PREDEFINED_INTEGRATIONS[ key ] ) {
			object[ key ] = PREDEFINED_INTEGRATIONS[ key ];
		} else if ( editor.ui.componentFactory.has( key ) ) {
			object[ key ] = editor.ui.componentFactory.create( key );
		}

		return object;
	}, {} );
}

export function createLabeledInputView( locale: Locale ): LabeledFieldView {
	const t = locale.t;
	const labeledInputView = new LabeledFieldView( locale, createLabeledInputText );

	labeledInputView.set( {
		label: t( 'Insert video via URL' )
	} );
	labeledInputView.fieldView.placeholder = 'https://example.com/video.mp4';

	return labeledInputView;
}
