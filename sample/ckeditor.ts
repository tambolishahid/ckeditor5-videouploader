declare global {
	interface Window {
		editor: ClassicEditor;
	}
}

import {
	ClassicEditor,
	Autoformat,
	Base64UploadAdapter,
	BlockQuote,
	Bold,
	Code,
	CodeBlock,
	Essentials,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	ImageUpload,
	Indent,
	Italic,
	Link,
	List,
	MediaEmbed,
	Paragraph,
	Table,
	TableToolbar,
	FileRepository
} from 'ckeditor5';

import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

import Videouploader from '../src/videouploader.js';
import VideoUpload from '../src/videoupload.js';
import VideoResize from '../src/videoresize.js';
import VideoToolbar from '../src/videotoolbar.js';
import VideoStyle from '../src/videostyle.js';
import VideoInsert from '../src/videoinsert.js';

import CustomUploadAdapter from './CustomUploadAdapter.js';

import 'ckeditor5/ckeditor5.css';

ClassicEditor
	.create( document.getElementById( 'editor' )!, {
		// myUploadAdapter: {
		// 	baseUrl: 'http://localhost:3000/app/ckeditorplugin/upload/pin/mynewpin/get_policy',
		// 	makePublicURL: 'http://localhost:3000/app/ckeditorplugin/upload/pin/mynewpin/make_public'
		// },
		plugins: [
			FileRepository,
			VideoToolbar, Videouploader, VideoUpload, VideoResize, VideoStyle, VideoInsert,
			Essentials,
			Autoformat,
			BlockQuote,
			Bold,
			Heading,
			Image,
			ImageCaption,
			ImageStyle,
			ImageToolbar,
			ImageUpload,
			Indent,
			Italic,
			Link,
			List,
			MediaEmbed,
			Paragraph,
			Table,
			TableToolbar,
			CodeBlock,
			Code,
			CustomUploadAdapter
		],
		// extraPlugins: [CustomUploadAdapter],
		toolbar: [
			'undo',
			'redo',
			'|',
			'videoUpload',
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'link',
			'code',
			'bulletedList',
			'numberedList',
			'|',
			'outdent',
			'indent',
			'|',
			'uploadImage',
			'blockQuote',
			'insertTable',
			'mediaEmbed',
			'codeBlock'
		],
		image: {
			toolbar: [
				'imageStyle:inline',
				'imageStyle:block',
				'imageStyle:side',
				'|',
				'imageTextAlternative'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells'
			]
		}
	} )
	.then( editor => {
		window.editor = editor;
		CKEditorInspector.attach( editor );
		window.console.log( 'CKEditor 5 is ready.', editor );
	} )
	.catch( err => {
		window.console.error( err.stack );
	} );
