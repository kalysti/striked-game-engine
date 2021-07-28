import { vkCreateFramebuffer, vkDestroyFramebuffer, VkFramebuffer, VkFramebufferCreateInfo, VkImageView, VkResult, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";
import { VulkanImage } from "./image";
import { ImageView } from "./imageview";
import { RenderPass } from "./render-pass";

export class Framebuffer {

    public handle: VkFramebuffer | null = null;

    private _width: number;
    private _height: number;
    private _device: Device;
    private _renderPass: RenderPass;
    private _images: VulkanImage[] = [];
    private _imageViews: ImageView[] = [];

    get width(): number {
        return this._width;
    }

    get images(): VulkanImage[] {
        return this._images;
    }

    set images(value: VulkanImage[]) {
        this._images = value;
    }


    get imageViews(): ImageView[] {
        return this._imageViews;
    }

    set imageViews(value: ImageView[]) {
        this._imageViews = value;
    }

    get height(): number {
        return this._height;
    }

    get device(): Device {
        return this._device;
    }

    get renderPass(): RenderPass {
        return this._renderPass;
    }

    constructor(
        renderPass: RenderPass,
        width: number, height: number,
        layers: number = 1
    ) {

        this._width = width;
        this._height = height;
        this._device = renderPass.device;
        this._renderPass = renderPass;

        for (let attachment of renderPass.attachments) {
            let img = new VulkanImage(
                this._device,
                width, height,
                attachment.format,
                attachment.imageUsageFlags,
                1
            );
            this._images.push(img);
            this._imageViews.push(new ImageView(
                img,
                attachment.imageAspectFlags
            ));
        }

        var attachments: VkImageView[] = [];
        for (let view of this._imageViews) {
            if (view.handle != null)
                attachments.push(view.handle);
        }

        var framebufferCreateInfo = new VkFramebufferCreateInfo();
     //   framebufferCreateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_FRAMEBUFFER_CREATE_INFO;
        framebufferCreateInfo.renderPass = renderPass.handle;
        framebufferCreateInfo.attachmentCount = attachments.length;
        framebufferCreateInfo.pAttachments = attachments;
        framebufferCreateInfo.width = width;
        framebufferCreateInfo.height = height;
        framebufferCreateInfo.layers = layers;

        this.handle = new VkFramebuffer();
        if (vkCreateFramebuffer(
            this._device.handle,
            framebufferCreateInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create framebuffer");
    }

    public destroy() {
        if (this.handle != null) {
            vkDestroyFramebuffer(
                this._device.handle,
                this.handle,
                null
            );
            this.handle = null;
        }
    }
}