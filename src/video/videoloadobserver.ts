import { Observer } from 'ckeditor5';

export default class VideoLoadObserver extends Observer {
	/**
	 * @inheritDoc
	 */
	public observe( domRoot: HTMLElement ): void {
		this.listenTo( domRoot, 'load', ( event, domEvent ) => {
			const domElement = domEvent.target as HTMLElement;

			if ( this.checkShouldIgnoreEventFromTarget( domElement ) ) {
				return;
			}

			if ( domElement.tagName === 'VIDEO' ) {
				this._fireEvents( domEvent );
			}
			// Use capture phase for better performance (#4504).
		}, { useCapture: true } );
	}

	/**
	 * @inheritDoc
	 */
	public override stopObserving( domRoot: HTMLElement ): void {
		this.stopListening( domRoot );
	}

	private _fireEvents( domEvent: Event ): void {
		if ( this.isEnabled ) {
			this.document.fire( 'layoutChanged' );
			this.document.fire <VideoLoadedEvent>( 'videoLoaded', domEvent );
		}
	}
}

export type VideoLoadedEvent = {
	name: 'videoLoaded';
	args: [Event];
};
