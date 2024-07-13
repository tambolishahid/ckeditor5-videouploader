import type VideoUtils from '../videoutils.js';
import {
	type DowncastDispatcher,
	type Element,
	type UpcastDispatcher,
	type UpcastElementEvent,
	type DowncastAttributeEvent,
	type GetCallback,
	first
} from 'ckeditor5';

export function upcastVideoFigure(
	videoUtils: VideoUtils
): ( dispatcher: UpcastDispatcher ) => void {
	const converter: GetCallback<UpcastElementEvent> = (
		evt,
		data,
		conversionApi
	) => {
		if (
			!conversionApi.consumable.test( data.viewItem, {
				name: true,
				classes: 'video'
			} )
		) {
			return;
		}

		// Find an image element inside the figure element.
		const viewVideo = videoUtils.findViewVideoElement( data.viewItem );

		if (
			!viewVideo ||
			!viewVideo.hasAttribute( 'src' ) ||
			!conversionApi.consumable.test( viewVideo, { name: true } )
		) {
			return;
		}

		conversionApi.consumable.consume( data.viewItem, {
			name: true,
			classes: 'video'
		} );

		const conversionResult = conversionApi.convertItem(
			viewVideo,
			data.modelCursor
		);

		const modelVideo = first(
			conversionResult.modelRange!.getItems()
		) as Element;

		// When video wasn't successfully converted then finish conversion.
		if ( !modelVideo ) {
			// Revert consumed figure so other features can convert it.
			conversionApi.consumable.revert( data.viewItem, {
				name: true,
				classes: 'video'
			} );

			return;
		}

		// Convert rest of the figure element's children as an video children.
		conversionApi.convertChildren( data.viewItem, modelVideo );

		conversionApi.updateConversionResult( modelVideo, data );
	};

	return dispatcher => {
		dispatcher.on<UpcastElementEvent>( 'element:figure', converter );
	};
}

export function downcastVideoAttribute(
	videoUtils: VideoUtils,
	videoType: 'videoBlock' | 'videoInline',
	attributeKey: string
): ( dispatcher: DowncastDispatcher ) => void {
	const converter: GetCallback<DowncastAttributeEvent<Element>> = (
		evt,
		data,
		conversionApi
	) => {
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const writer = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item )!;
		const video = videoUtils.findViewVideoElement( element )!;

		writer.setAttribute(
			data.attributeKey,
			data.attributeNewValue || '',
			video
		);
	};

	return dispatcher => {
		dispatcher.on<DowncastAttributeEvent<Element>>(
			`attribute:${ attributeKey }:${ videoType }`,
			converter
		);
	};
}
