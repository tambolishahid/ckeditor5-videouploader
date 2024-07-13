import {
	FileRepository,
	toArray,
	Command,
	type ArrayOrItem,
	type Position
} from 'ckeditor5';
import type VideoUtils from '../videoutils.js';

export default class UploadVideoCommand extends Command {
	/**
	 * @inheritDoc
	 */
	public override refresh(): void {
		const editor = this.editor;
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const selectedElement =
			editor.model.document.selection.getSelectedElement()!;

		this.isEnabled =
			videoUtils.isVideoAllowed() || videoUtils.isVideo( selectedElement );
	}

	public override execute( options: { file: ArrayOrItem<File> } ): void {
		const files = toArray( options.file );
		const selection = this.editor.model.document.selection;
		const videoUtils: VideoUtils = this.editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;
		const selectionAttributes = Object.fromEntries(
			selection.getAttributes()
		);
		console.log( 'selectionAttributes', selectionAttributes );
		// if (!options.file && !options.files) {
		//     return;
		// }

		console.log( 'files', files );
		files.forEach( ( file, index ) => {
			const selectedElement = selection.getSelectedElement();

			if (
				index &&
				selectedElement &&
				videoUtils.isVideo( selectedElement )
			) {
				const position =
					this.editor.model.createPositionAfter( selectedElement );

				this._uploadVideo( file, selectionAttributes, position );
			} else {
				this._uploadVideo( file, selectionAttributes );
			}
		} );
	}

	private _uploadVideo(
		file: File,
		attributes: object,
		position?: Position
	): void {
		const editor = this.editor;
		const fileRepository = editor.plugins.get( FileRepository );
		const loader = fileRepository.createLoader( file );
		const videoUtils: VideoUtils = editor.plugins.get(
			'VideoUtils'
		) as VideoUtils;

		if ( !loader ) {
			return;
		}

		videoUtils.insertVideo(
			{ ...attributes, uploadId: loader.id },
			position
		);
	}
}
