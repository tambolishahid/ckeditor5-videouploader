import { global, type ViewElement } from 'ckeditor5';
import type VideoUtils from '../videoutils.js';

export function createVideoTypeRegExp( types: Array<string> ): RegExp {
	const regExpSafeNames = types.map( type => type.replace( '+', '\\+' ) );
	return new RegExp( `^video\\/(${ regExpSafeNames.join( '|' ) })$` );
}

export function fetchLocalVideo( video: ViewElement ): Promise<File> {
	return new Promise( ( resolve, reject ) => {
		const videoSrc = video.getAttribute( 'src' )!;

		// Fetch works asynchronously and so does not block browser UI when processing data.
		fetch( videoSrc )
			.then( resource => resource.blob() )
			.then( blob => {
				const mimeType = getVideoMimeType( blob, videoSrc );
				const ext = mimeType.replace( 'video/', '' );
				const filename = `video.${ ext }`;
				const file = new File( [ blob ], filename, { type: mimeType } );

				resolve( file );
			} )
			.catch( err => {
				return err && err.name === 'TypeError' ?
					convertLocalVideoOnCanvas( videoSrc ).then( resolve ).catch( reject ) :
					reject( err );
			} );
	} );
}

export function isLocalVideo( videoUtils: VideoUtils, node: ViewElement ): boolean {
	if ( !videoUtils.isInlineVideoView( node ) || !node.getAttribute( 'src' ) ) {
		return false;
	}

	return !!node.getAttribute( 'src' )!.match( /^data:video\/\w+;base64,/g ) ||
        !!node.getAttribute( 'src' )!.match( /^blob:/g );
}

function getVideoMimeType( blob: Blob, src: string ): string {
	if ( blob.type ) {
		return blob.type;
	} else if ( src.match( /data:(video\/\w+);base64/ ) ) {
		return src.match( /data:(video\/\w+);base64/ )![ 1 ].toLowerCase();
	} else {
		// Fallback to 'mp4' as common extension.
		return 'video/mp4';
	}
}

function convertLocalVideoOnCanvas( videoSrc: string ): Promise<File> {
	return getBlobFromCanvas( videoSrc ).then( blob => {
		const mimeType = getVideoMimeType( blob, videoSrc );
		const ext = mimeType.replace( 'video/', '' );
		const filename = `video.${ ext }`;

		return new File( [ blob ], filename, { type: mimeType } );
	} );
}

function getBlobFromCanvas( videoSrc: string ): Promise<Blob> {
	return new Promise( ( resolve, reject ) => {
		const video = global.document.createElement( 'video' );

		video.addEventListener( 'load', () => {
			const canvas = global.document.createElement( 'canvas' );

			canvas.width = video.width;
			canvas.height = video.height;

			const ctx = canvas.getContext( '2d' )!;

			( ctx as any ).drawVideo( video, 0, 0 );

			canvas.toBlob( blob => blob ? resolve( blob ) : reject() );
		} );

		video.addEventListener( 'error', () => reject() );

		video.src = videoSrc;
	} );
}
