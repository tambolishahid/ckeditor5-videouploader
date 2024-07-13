// import { Plugin } from '@ckeditor/ckeditor5-core';
// import { FileRepository  } from 'ckeditor5';
// import { logWarning } from '@ckeditor/ckeditor5-utils';

import type { FileLoader, Editor } from 'ckeditor5';
import S3UploadAdapter from './S3Uploder.js';
// import { random } from 'colord';

interface CustomUploadAdapterConfig {
    baseUrl: string;
    makePublicURL: string;
}

// export default class AIQCustomUploadAdapter extends Plugin {
// 	/**
// 	 * @inheritDoc
// 	 */
// 	static get requires() {
// 		return [ FileRepository ] as const;
// 	}

// 	/**
// 	 * @inheritDoc
// 	 */
// 	static get pluginName() {
// 		return 'AIQCustomUploadAdapter' as const;
// 	}

// 	/**
// 	 * @inheritDoc
// 	 */
// 	init(): void {
// 		const options = this.editor.config.get('myUploadAdapter');

// 		if ( !options ) {
// 			return;
// 		}

// 		if ( !options.baseUrl || !options.makePublicURL ) {
// 			/**
// 			 * The {@link module:upload/uploadconfig~SimpleUploadConfig#uploadUrl `config.simpleUpload.uploadUrl`}
// 			 * configuration required by the {@link module:upload/adapters/simpleuploadadapter~SimpleUploadAdapter `SimpleUploadAdapter`}
// 			 * is missing. Make sure the correct URL is specified for the image upload to work properly.
// 			 *
// 			 * @error simple-upload-adapter-missing-uploadurl
// 			 */
// 			logWarning( 'simple-upload-adapter-missing-uploadurl' );

// 			return;
// 		}
//         console.log("AIQCustomUploadAdapter init", options.baseUrl, options.makePublicURL);

// 		this.editor.plugins.get( 'FileRepository' ).createUploadAdapter = loader => new S3UploadAdapter( loader, baseUrl, makePublicURL );
// 	}
// }

export default function CustomUploadAdapter( editor: Editor ): any {
	// console.log("AIQCustomUploadAdapter init", random());
	// const options = editor.config.get('myUploadAdapter');
	const baseUrl = 'http://localhost:3000/app/clraa2emo001gupsl8gby8hxj/upload/pin/mynewpin/get_policy';
	const makePublicURL = 'http://localhost:3000/app/clraa2emo001gupsl8gby8hxj/upload/pin/mynewpin/make_public';

	editor.plugins.get( 'FileRepository' ).createUploadAdapter = ( loader: FileLoader ) => {
		// Configure the URL to the upload script in your back-end here!
		return new S3UploadAdapter( loader, baseUrl, makePublicURL );
	};
}

// export default class S3Upload extends Plugin {

//     static get requires() {
//         return [FileRepository];
//     }

//     static get pluginName() {
//         return 'S3Upload';
//     }

//     init() {
//         const url = this.editor.config.get('s3Upload.policyUrl');

//         if (!url) {
//             console.warn('s3Upload.policyUrl is not configured')
//             return;
//         }

//         const mapUrl = this.editor.config.get('s3Upload.mapUrl');

//         this.editor.plugins.get('FileRepository').createUploadAdapter = loader => new Adapter(loader, url, mapUrl);
//     }
// }
