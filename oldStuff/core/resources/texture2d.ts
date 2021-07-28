import * as fs from "fs";
import { PNG } from "pngjs";
import { VkDescriptorSet, VkImageLayout, VkImageView, VkSampler, VK_FORMAT_R8G8B8A8_UNORM, VK_IMAGE_LAYOUT_PREINITIALIZED, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_TILING_OPTIMAL } from "vulkan-api/generated/1.2.162/win32";
import { BaseObject } from "../objects/BaseObject";
import { BoundedImage, StagingBuffer, Renderer } from "../render/renderer";

export class Texture2D extends BaseObject {
    width: number;
    height: number;
    data: Uint8Array | null = null;
    sampler!: VkSampler;
    imageView!: VkImageView;
    imageLayout: VkImageLayout = VK_IMAGE_LAYOUT_PREINITIALIZED;
    boundedImage!: BoundedImage;
    stagingBuffer!: StagingBuffer;
    descriptionSet!: VkDescriptorSet;

    constructor() {
        super();
        this.width = 0;
        this.height = 0;
        this.data = null;
    }
    
    fromImagePath(path: string) {
        let buffer = fs.readFileSync(path);
        let img = PNG.sync.read(buffer);
        let data = new Uint8Array(img.data);
        this.data = data;
        this.width = img.width;
        this.height = img.height;
        return this;
    };

    init(instance: Renderer) {

        if(this.data == null)
        {
            throw new Error(`Image Data Buffer is empty.`);
        }

        this.stagingBuffer = instance.createStagingImageBuffer(this.data);
        this.boundedImage = instance.createImage(this.width, this.height, VK_FORMAT_R8G8B8A8_UNORM, VK_IMAGE_TILING_OPTIMAL);
        this.imageLayout = instance.setImageLayoutTransition(this.boundedImage, this.imageLayout, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL);

        instance.transferStagingBufferToImage(this.stagingBuffer, this.boundedImage, this.width, this.height);

        this.imageLayout = instance.setImageLayoutTransition(this.boundedImage, this.imageLayout, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL);
        this.imageView = instance.createImageView(this.boundedImage, VK_FORMAT_R8G8B8A8_UNORM);
        this.sampler = instance.createSampler();

        this.descriptionSet = instance.createTextureDescription(this.sampler, this.imageView);
    }

    deinit() {

    }
};



