import { VkImageAspectFlagBits, VkImageUsageFlagBits } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./api/device";
import { VulkanImage } from "./api/image";
import { ImageView } from "./api/imageview";
import { RenderPassDefault } from "./api/render-pass";

export class RenderTarget {


    get RenderedImageView(): ImageView {
        return this._renderedImageView;
    }

    get RenderedImage(): VulkanImage {
        return this._renderedImage;
    }
    set RenderedImage(val: VulkanImage) {
         this._renderedImage = val;
    }
    /// <summary>
    /// Rendered image from the camera
    /// </summary>
    protected _renderedImage: VulkanImage;
    /// <summary>
    /// Image view for the rendered image
    /// </summary>
    protected _renderedImageView: ImageView;

/// <summary>
/// Constructor for RenderTarget
/// </summary>
constructor(
    device: Device,
    width: number, height: number
) {
    this._renderedImage = new VulkanImage(
        device,
        width, height,
        RenderPassDefault.format,
        VkImageUsageFlagBits.VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_DST_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_SRC_BIT,
        1
    );
    this._renderedImageView = new ImageView(
        this._renderedImage,
        VkImageAspectFlagBits.VK_IMAGE_ASPECT_COLOR_BIT
    );
}

    /// <summary>
    /// Convert's Render Target to an image
    /// </summary>
    public ConvertToImage() {
    //TODO
    throw new Error();
}

    /// <summary>
    /// Convert's render target to texture
    /// </summary>
    public ConverToTexture() {
    //TODO
    throw new Error();
}
}
