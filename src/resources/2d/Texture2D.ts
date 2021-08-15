import { EntityObject } from '@engine/resources';
import fs from 'fs';
import pngjs from 'pngjs';
import { VkFormat, VkImageViewType, VK_FORMAT_R8G8B8A8_UNORM, VK_IMAGE_VIEW_TYPE_2D } from 'vulkan-api';

const { PNG } = pngjs;

export enum BlendMode {
    none = 0,
}
export class Texture2D extends EntityObject {
    width: number = 0;
    height: number = 0;
    data: Uint8Array = new Uint8Array();
    viewType: VkImageViewType = VK_IMAGE_VIEW_TYPE_2D;
    format: VkFormat = VK_FORMAT_R8G8B8A8_UNORM;
    

    toDataStream(): Uint8Array {
        return this.data;
    }

    constructor() {
        super();
    }

    loadFromFilePath(path) {
        let buffer = fs.readFileSync(path);
        let img = PNG.sync.read(buffer);
        let data = new Uint8Array(img.data);

        this.data = data;
        this.width = img.width;
        this.height = img.height;

        return this;
    }
}


