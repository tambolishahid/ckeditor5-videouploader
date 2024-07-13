// import { Plugin, ButtonView } from 'ckeditor5';

// import ckeditor5Icon from '../../theme/icons/ckeditor.svg';

// export default class Videouploader extends Plugin {
// 	public static get pluginName() {
// 		return 'Videouploader' as const;
// 	}

// 	public init(): void {
// 		const editor = this.editor;
// 		const t = editor.t;
// 		const model = editor.model;

// 		// Add the "videouploaderButton" to feature components.
// 		editor.ui.componentFactory.add( 'videouploaderButton', locale => {
// 			const view = new ButtonView( locale );

// 			view.set( {
// 				label: t( 'Videouploader' ),
// 				icon: ckeditor5Icon,
// 				tooltip: true
// 			} );

// 			// Insert a text into the editor after clicking the button.
// 			this.listenTo( view, 'execute', () => {
// 				model.change( writer => {
// 					const textNode = writer.createText( 'Hello CKEditor 5!' );

// 					model.insertContent( textNode );
// 				} );

// 				editor.editing.view.focus();
// 			} );

// 			return view;
// 		} );
// 	}
// }
import { Plugin } from 'ckeditor5';
import VideoBlock from './videoblock.js';
import VideoInline from './videoinline.js';
import '../theme/video.css';

export default class Video extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [ VideoBlock, VideoInline ] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'Videouploader' as const;
	}
}
