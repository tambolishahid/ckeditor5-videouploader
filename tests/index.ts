import { expect } from 'chai';
import { Videouploader as VideouploaderDll, icons } from '../src/index.js';
import Videouploader from '../src/videouploader.js';

import ckeditor from './../theme/icons/ckeditor.svg';

describe( 'CKEditor5 Videouploader DLL', () => {
	it( 'exports Videouploader', () => {
		expect( VideouploaderDll ).to.equal( Videouploader );
	} );

	describe( 'icons', () => {
		it( 'exports the "ckeditor" icon', () => {
			expect( icons.ckeditor ).to.equal( ckeditor );
		} );
	} );
} );
