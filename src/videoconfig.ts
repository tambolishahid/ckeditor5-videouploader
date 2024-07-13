/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module video/videoconfig
 */

export interface VideoConfig {

    /**
     * The video insert configuration.
     */
    insert?: VideoInsertConfig;

    resizeOptions?: Array<VideoResizeOption>;

    /**
     * The available options are `'px'` or `'%'`.
     *
     * @default '%'
     */
    resizeUnit?: 'px' | '%';
    styles?: VideoStyleConfig;
    toolbar?: Array<string | VideoStyleDropdownDefinition>;

    /**
     * The video upload configuration.
     */
    upload?: VideoUploadConfig;
}

export interface VideoInsertConfig {

    /** `
     *
     * @internal
     * @default [ 'insertVideoViaUrl' ]
     */
    integrations: Array<string>;
    type?: 'inline' | 'block';
}

export interface VideoResizeOption {

    name: string;
    value: string | null;

    /**
     * An icon used by an individual resize button (see the `name` property to learn more).
     * Available icons are: `'small'`, `'medium'`, `'large'`, `'original'`.
     */
    icon?: string;
    label?: string;
}

export interface VideoStyleDropdownDefinition {

    name: string;
    title?: string;
    items: Array<string>;
    defaultItem: string;
}

export interface VideoStyleConfig {

    /**
     * A list of the video style options.
     */
    options?: Array<string | VideoStyleOptionDefinition>;
}

export interface VideoStyleOptionDefinition {

    name: string;
    isDefault?: boolean;
    icon: string;
    title: string;
    className?: string;
    modelElements: Array<string>;
}

export interface VideoUploadConfig {

    /**
     * @default [ 'mp4' ]
     */
    types: Array<string>;
    allowMultipleFiles: boolean;
}
