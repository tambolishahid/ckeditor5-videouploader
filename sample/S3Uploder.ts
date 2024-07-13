// import { UploadAdapter } from '@ckeditor/ckeditor5-adapter-core';
import {
	type UploadResponse,
	type UploadAdapter,
	type FileLoader
} from 'ckeditor5';

interface PresignedPostType {
	url: string;
	fields: { [key: string]: string };
}

export default class S3UploadAdapter implements UploadAdapter {
	private loader: FileLoader;
	private xhr: XMLHttpRequest | null = null;
	private readonly baseUrl: string;
	private readonly makePublicURL: string;

	constructor( loader: any, baseUrl: string, makePublicURL: string ) {
		this.loader = loader;
		this.baseUrl = baseUrl;
		this.makePublicURL = makePublicURL;
	}

	public async upload(): Promise<UploadResponse> {
		const file = await this.loader.file;
		if ( file === null ) {
			return Promise.reject( 'File is null' );
		}
		const fileName = this.generateRandomFilename( file.name );
		const fileExtension: string | undefined = file.name.split( '.' ).pop();
		// 1. Get signed URL
		const presignedPost = await this.fetchSignedUrl(
			fileName,
			fileExtension
		);
		const formData = new FormData();
		const presignedPostFields = presignedPost.fields;

		// Append presigned post fields to FormData
		for ( const key in presignedPostFields ) {
			formData.append( key, presignedPostFields[ key ] );
		}

		// Append the file to FormData
		formData.append( 'file', file );
		console.log( formData );

		return new Promise( ( resolve, reject ) => {
			this.xhr = new XMLHttpRequest();
			this.xhr.open( 'POST', presignedPost.url, true );
			this.xhr.responseType = 'json';
			this.xhr.upload.addEventListener( 'progress', event => {
				if ( event.lengthComputable ) {
					const uploaded = event.loaded;
          			const uploadTotal = event.total;
					// resolve({ uploaded, total });
				}
			} );
			if ( this.xhr === null ) {
				return reject( 'XHR is null' );
			}
			this.xhr.onload = () => {
				if (
					// @ts-ignore
					this.xhr.status === 200 ||
					// @ts-ignore
					this.xhr.status === 201 ||
					// @ts-ignore
					this.xhr.status === 204
				) {
					// Construct the URL for the uploaded file
					const uploadedFileUrl = `${ presignedPost.url }${ presignedPost.fields.key }`;
					fetch(
						`${ this.makePublicURL }?key=${ presignedPost.fields.key }`,
						{
							method: 'GET'
						}
					).then( response => {
						console.log( 'Uploaded file URL:', uploadedFileUrl );
						resolve( { urls: { default: uploadedFileUrl } } );
					} );
				} else {
					// @ts-ignore
					reject( `Upload failed with status ${ this.xhr.status }` );
				}
			};

			this.xhr.onerror = error => {
				reject( error );
			};

			this.xhr.send( formData );
		} );
	}

	public abort(): void {
		if ( this.xhr ) {
			this.xhr.abort();
		}
	}

	private generateRandomFilename( originalName: string ): string {
		const randomString = Math.random().toString( 36 ).substring( 2, 15 );
		const extension = originalName.split( '.' ).pop(); // Get extension
		return `${ randomString }.${ extension }`;
	}

	private async fetchSignedUrl(
		fileName: string,
		fileExtension: string | undefined
	): Promise<PresignedPostType> {
		try {
			const response = await fetch(
				`${ this.baseUrl }?media_type=image&file_name=${ fileName }&file_extension=${ fileExtension }`,
				{
					method: 'GET'
				}
			);

			if ( !response.ok ) {
				throw new Error(
					`Failed to fetch signed URL: ${ response.statusText }`
				);
			}

			const result = await response.json();
			console.log( 'PresignedPost URL:', result.url, result.presignedPost );
			return result.presignedPost;
		} catch ( error ) {
			console.error( 'Error fetching signed URL:', error );
			throw error; // Re-throw error for handling in CKEditor
		}
	}
}
