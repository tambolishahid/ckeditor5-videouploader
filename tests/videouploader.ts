import { expect } from 'chai';
import { ClassicEditor, Essentials, Paragraph, Heading } from 'ckeditor5';
import Videouploader from '../src/videouploader.js';

describe( 'Videouploader', () => {
	it( 'should be named', () => {
		expect( Videouploader.pluginName ).to.equal( 'Videouploader' );
	} );

	describe( 'init()', () => {
		let domElement: HTMLElement, editor: ClassicEditor;

		beforeEach( async () => {
			domElement = document.createElement( 'div' );
			document.body.appendChild( domElement );

			editor = await ClassicEditor.create( domElement, {
				plugins: [
					Paragraph,
					Heading,
					Essentials,
					Videouploader
				],
				toolbar: [
					'videouploaderButton'
				]
			} );
		} );

		afterEach( () => {
			domElement.remove();
			return editor.destroy();
		} );

		it( 'should load Videouploader', () => {
			const myPlugin = editor.plugins.get( 'Videouploader' );

			expect( myPlugin ).to.be.an.instanceof( Videouploader );
		} );

		it( 'should add an icon to the toolbar', () => {
			expect( editor.ui.componentFactory.has( 'videouploaderButton' ) ).to.equal( true );
		} );

		it( 'should add a text into the editor after clicking the icon', () => {
			const icon = editor.ui.componentFactory.create( 'videouploaderButton' );

			expect( editor.getData() ).to.equal( '' );

			icon.fire( 'execute' );

			expect( editor.getData() ).to.equal( '<p>Hello CKEditor 5!</p>' );
		} );
	} );
} );
