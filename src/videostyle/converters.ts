import {
	first,
	type DowncastAttributeEvent,
	type Element,
	type UpcastElementEvent,
	type GetCallback
} from 'ckeditor5';
import type { VideoStyleOptionDefinition } from '../videoconfig.js';

export function modelToViewStyleAttribute(
	styles: Array<VideoStyleOptionDefinition>
): GetCallback<DowncastAttributeEvent> {
	return ( evt, data, conversionApi ) => {
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const newStyle = getStyleDefinitionByName(
			data.attributeNewValue as string,
			styles
		);
		const oldStyle = getStyleDefinitionByName(
			data.attributeOldValue as string,
			styles
		);

		const viewElement = conversionApi.mapper.toViewElement(
			data.item as Element
		)!;
		const viewWriter = conversionApi.writer;

		if ( oldStyle ) {
			viewWriter.removeClass( oldStyle.className!, viewElement );
		}

		if ( newStyle ) {
			viewWriter.addClass( newStyle.className!, viewElement );
		}
	};
}

export function viewToModelStyleAttribute(
	styles: Array<VideoStyleOptionDefinition>
): GetCallback<UpcastElementEvent> {
	const nonDefaultStyles: Record<
		string,
		Array<VideoStyleOptionDefinition>
	> = {
		videoInline: styles.filter(
			style =>
				!style.isDefault && style.modelElements.includes( 'videoInline' )
		),
		videoBlock: styles.filter(
			style =>
				!style.isDefault && style.modelElements.includes( 'videoBlock' )
		)
	};

	return ( evt, data, conversionApi ) => {
		if ( !data.modelRange ) {
			return;
		}

		const viewElement = data.viewItem;
		const modelVideoElement = first( data.modelRange.getItems() );

		if ( !modelVideoElement ) {
			return;
		}
		if ( nonDefaultStyles[ ( modelVideoElement as Element ).name ] ) {
			for ( const style of nonDefaultStyles[
				( modelVideoElement as Element ).name
			] ) {
				if (
					style &&
					conversionApi.consumable.consume( viewElement, {
						classes: style.className
					} )
				) {
					conversionApi.writer.setAttribute(
						'videoStyle',
						style.name,
						modelVideoElement
					);
				}
			}
		}
	};
}

function getStyleDefinitionByName(
	name: string,
	styles: Array<VideoStyleOptionDefinition>
): VideoStyleOptionDefinition | undefined {
	for ( const style of styles ) {
		if ( style.name === name ) {
			return style;
		}
	}
}
