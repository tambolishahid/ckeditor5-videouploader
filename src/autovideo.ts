/**
 * @module video/autovideo
 */
import { Plugin, type Editor, Undo, Clipboard, type ClipboardPipeline, LivePosition, LiveRange, global, Delete } from 'ckeditor5';
import VideoUtils from './videoutils.js';

// Implements the pattern: http(s)://(www.)example.com/path/to/resource.ext?query=params&maybe=too.
const VIDEO_URL_REGEXP = new RegExp( String( /^(http(s)?:\/\/)?[\w-]+\.[\w.~:/[\]@!$&'()*+,;=%-]+/.source +
    /\.(mp4|webm|ogg|ogv|avi|wmv|mkv|mpeg2|mov|MP4|WEBM|OGG|OGV|AVI|WMV|MKV|MPEG2|MOV)/.source +
    /(\?[\w.~:/[\]@!$&'()*+,;=%-]*)?/.source +
    /(#[\w.~:/[\]@!$&'()*+,;=%-]*)?$/.source ) );

export default class AutoVideo extends Plugin {
	/**
     * @inheritDoc
     */
	public static get requires() {
		return [ Clipboard, VideoUtils, Undo, Delete ] as const;
	}

	/**
     * @inheritDoc
     */
	public static get pluginName() {
		return 'AutoVideo' as const;
	}

    /**
         * The paste–to–embed `setTimeout` ID. Stored as a property to allow
         * cleaning of the timeout.
         */
    private _timeoutId: ReturnType<typeof setTimeout> | null;

    /**
     * The position where the `<imageBlock>` element will be inserted after the timeout,
     * determined each time a new content is pasted into the document.
     */
    private _positionToInsert: LivePosition | null;

    /**
     * @inheritDoc
     */
    constructor( editor: Editor ) {
    	super( editor );

    	this._timeoutId = null;
    	this._positionToInsert = null;
    }

    /**
     * @inheritDoc
     */
    public init(): void {
    	const editor = this.editor;
    	const modelDocument = editor.model.document;
    	const clipboardPipeline: ClipboardPipeline = editor.plugins.get( 'ClipboardPipeline' );

    	this.listenTo( clipboardPipeline, 'inputTransformation', () => {
    		const firstRange = modelDocument.selection.getFirstRange()!;

    		const leftLivePosition = LivePosition.fromPosition( firstRange.start );
    		leftLivePosition.stickiness = 'toPrevious';

    		const rightLivePosition = LivePosition.fromPosition( firstRange.end );
    		rightLivePosition.stickiness = 'toNext';

    		modelDocument.once( 'change:data', () => {
    			this._embedVideoBetweenPositions( leftLivePosition, rightLivePosition );

    			leftLivePosition.detach();
    			rightLivePosition.detach();
    		}, { priority: 'high' } );
    	} );

        editor.commands.get( 'undo' )!.on( 'execute', () => {
        	if ( this._timeoutId ) {
        		global.window.clearTimeout( this._timeoutId );
                this._positionToInsert!.detach();

                this._timeoutId = null;
                this._positionToInsert = null;
        	}
        }, { priority: 'high' } );
    }

    private _embedVideoBetweenPositions( leftPosition: LivePosition, rightPosition: LivePosition ): void {
    	const editor = this.editor;
    	const urlRange = new LiveRange( leftPosition, rightPosition );
    	const walker = urlRange.getWalker( { ignoreElementEnd: true } );
    	const selectionAttributes = Object.fromEntries( editor.model.document.selection.getAttributes() );
    	const videoUtils: VideoUtils = this.editor.plugins.get( 'VideoUtils' ) as VideoUtils;

    	let src = '';

    	for ( const node of walker ) {
    		if ( node.item.is( '$textProxy' ) ) {
    			src += node.item.data;
    		}
    	}

    	src = src.trim();

    	if ( !src.match( VIDEO_URL_REGEXP ) ) {
    		urlRange.detach();

    		return;
    	}

    	this._positionToInsert = LivePosition.fromPosition( leftPosition );

    	this._timeoutId = setTimeout( () => {
    		const videoCommand = editor.commands.get( 'insertVideo' )!;

    		if ( !videoCommand.isEnabled ) {
    			urlRange.detach();

    			return;
    		}

    		editor.model.change( writer => {
    			this._timeoutId = null;

    			writer.remove( urlRange );
    			urlRange.detach();

    			let insertionPosition;

    			if ( this._positionToInsert!.root.rootName !== '$graveyard' ) {
    				insertionPosition = this._positionToInsert!.toPosition();
    			}

    			videoUtils.insertVideo( { ...selectionAttributes, src }, insertionPosition );

                this._positionToInsert!.detach();
                this._positionToInsert = null;
    		} );
    		const deletePlugin: Delete = editor.plugins.get( 'Delete' );

    		deletePlugin.requestUndoOnBackspace();
    	}, 100 );
    }
}
