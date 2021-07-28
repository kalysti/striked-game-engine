import { VkComponentMapping, VkComponentSwizzle, vkCreateImageView, vkDestroyImageView, VkImageAspectFlagBits, VkImageSubresourceRange, VkImageView, VkImageViewCreateInfo, VkImageViewType, VkResult, VkStructureType, VK_COMPONENT_SWIZZLE_IDENTITY, VK_IMAGE_VIEW_TYPE_2D } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";
import { VulkanImage } from "./image";

export class ImageView {

    private _device: Device | null = null;
    private _handle: VkImageView | null = null;
    private _image: VulkanImage;

    get handle(): VkImageView | null {
        return this._handle;
    }

    get device(): Device | null {
        return this._device;
    }
    get image(): VulkanImage {
        return this._image;
    }

    constructor(
        image: VulkanImage,
        aspectMask: VkImageAspectFlagBits
    ) {
        this._device = image.device;
        this._image = image;

        var imageViewInfo = new VkImageViewCreateInfo();
        //    imageViewInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
        imageViewInfo.image = image.handle;
        imageViewInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
        imageViewInfo.format = image.format;

        let components = new VkComponentMapping();
        components.r = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.g = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.b = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.a = VK_COMPONENT_SWIZZLE_IDENTITY;

        let subresourceRange = new VkImageSubresourceRange();
        subresourceRange.aspectMask = aspectMask;
        subresourceRange.baseMipLevel = 0;
        subresourceRange.levelCount = image.mipLevel;
        subresourceRange.baseArrayLayer = 0;
        subresourceRange.layerCount = 1;

        imageViewInfo.components = components;
        imageViewInfo.subresourceRange = subresourceRange;

        this._handle = new VkImageView();

        if (vkCreateImageView(
            this._device.handle,
            imageViewInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create image view");
    }

    destroy() {
        if (this._handle != null && this._device != null) {
            vkDestroyImageView(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
    }
}