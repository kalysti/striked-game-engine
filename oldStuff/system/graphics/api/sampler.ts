import { throws } from "assert";
import { VkBorderColor, VkCompareOp, vkCreateSampler, vkDestroySampler, VkFilter, VkResult, VkSampler, VkSamplerAddressMode, VkSamplerCreateInfo, VkSamplerMipmapMode, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";
import { VulkanImage } from "./image";

export class Sampler {

    private _device: Device;
    private _handle: VkSampler | null;

    get device(): Device {
        return this._device;
    }

    get handle(): VkSampler | null {
        return this._handle;
    }

    constructor(image: VulkanImage) {
        this._device = image.device;
        var createInfo = new VkSamplerCreateInfo();

       // createInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_SAMPLER_CREATE_INFO;
        createInfo.magFilter = VkFilter.VK_FILTER_LINEAR;
        createInfo.minFilter = VkFilter.VK_FILTER_LINEAR;
        createInfo.addressModeU = VkSamplerAddressMode.VK_SAMPLER_ADDRESS_MODE_REPEAT;
        createInfo.addressModeV = VkSamplerAddressMode.VK_SAMPLER_ADDRESS_MODE_REPEAT;
        createInfo.addressModeW = VkSamplerAddressMode.VK_SAMPLER_ADDRESS_MODE_REPEAT;
        createInfo.anisotropyEnable = true;
        createInfo.maxAnisotropy = 16;
        createInfo.borderColor = VkBorderColor.VK_BORDER_COLOR_INT_OPAQUE_BLACK;
        createInfo.unnormalizedCoordinates = false;
        createInfo.compareEnable = false;
        createInfo.compareOp = VkCompareOp.VK_COMPARE_OP_ALWAYS;
        createInfo.mipmapMode = VkSamplerMipmapMode.VK_SAMPLER_MIPMAP_MODE_LINEAR;
        createInfo.mipLodBias = 0.0;
        createInfo.minLod = 0.0;
        createInfo.maxLod = image.mipLevel;

        this._handle = new VkSampler();
        if (vkCreateSampler(
            this._device.handle,
            createInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create sampler");
    }

    destroy() {
        if (this._handle != null) {
            vkDestroySampler(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
    }
}
