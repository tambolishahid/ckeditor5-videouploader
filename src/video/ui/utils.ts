import type VideoUtils from '../../videoutils.js';
import {
	BalloonPanelView,
	type PositionOptions,
	type Editor,
	type ContextualBalloon
} from 'ckeditor5';

export function repositionContextualBalloon( editor: Editor ): void {
	const balloon: ContextualBalloon = editor.plugins.get( 'ContextualBalloon' );
	const videoUtils: VideoUtils = editor.plugins.get(
		'VideoUtils'
	) as VideoUtils;

	if (
		videoUtils.getClosestSelectedVideoWidget(
			editor.editing.view.document.selection
		)
	) {
		const position = getBalloonPositionData( editor );

		balloon.updatePosition( position );
	}
}

export function getBalloonPositionData(
	editor: Editor
): Partial<PositionOptions> {
	const editingView = editor.editing.view;
	const defaultPositions = BalloonPanelView.defaultPositions;
	const videoUtils: VideoUtils = editor.plugins.get(
		'VideoUtils'
	) as VideoUtils;

	return {
		target: editingView.domConverter.viewToDom(
			videoUtils.getClosestSelectedVideoWidget(
				editingView.document.selection
			)!
		) as HTMLElement,
		positions: [
			defaultPositions.northArrowSouth,
			defaultPositions.northArrowSouthWest,
			defaultPositions.northArrowSouthEast,
			defaultPositions.southArrowNorth,
			defaultPositions.southArrowNorthWest,
			defaultPositions.southArrowNorthEast
		]
	};
}
