import { vkAllocateMemory, vkBindImageMemory, vkCreateImage, vkDestroyImage, VkDeviceMemory, VkExtent3D, VkFormat, vkFreeMemory, vkGetImageMemoryRequirements, VkImage, VkImageCreateInfo, VkImageLayout, VkImageTiling, VkImageType, VkImageUsageFlagBits, VkMemoryAllocateInfo, VkMemoryPropertyFlagBits, VkMemoryRequirements, VkResult, VkSampleCountFlagBits, VkSharingMode, VkStructureType, VK_IMAGE_USAGE_SAMPLED_BIT, VK_IMAGE_USAGE_TRANSFER_DST_BIT } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";
import { DEPTH_FORMAT_CANDIDATES } from "./graphic-constacts";
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseVulkanImage {
    protected _device: Device;
    protected _width: number;
    protected _height: number;
    protected _format: VkFormat;
    protected _mipLevel: number;
    protected _layout: VkImageLayout[] = [];
    protected _handle: VkImage | null = null;
    protected _memoryHandle: VkDeviceMemory | null = null;
    protected _id: string = "";

    get id() {
        return this._id;
    }
    get mipLevel(): number {
        return this._mipLevel;
    }
    get device(): Device {
        return this._device;
    }


    get height(): number {
        return this._height;
    }
    get width(): number {
        return this._width;
    }

    get format(): VkFormat {
        return this._format;
    }

    get handle(): VkImage | null {
        return this._handle;
    }

    set memoryHandle(memory: VkDeviceMemory | null) {
        this._memoryHandle = memory;
    }

    set layout(layout: VkImageLayout[]) {
        this._layout = layout;
    }
    get layout(): VkImageLayout[] {
        return this._layout;
    }

    constructor(device: Device,
        width: number,
        height: number, format: VkFormat,
        mipLevel: number = 0,
    ) {
        this._id = uuidv4();

        console.log("[" + this._id + "] Created as " + format.toString());

        this._device = device;
        this._width = width;
        this._height = height;
        this._format = format;
        this._mipLevel = mipLevel;
    }



    public get HasStencilComponent(): boolean {
        return VulkanImage.HasStencil(this._format);;
    }

    public static HasStencil(format: VkFormat): boolean {
        return DEPTH_FORMAT_CANDIDATES.includes(
            format
        );
    }


    destroy() {
        if (this._device == null)
            return;

        if (this._handle != null) {
            vkDestroyImage(this._device.handle, this._handle, null);
            this._handle = null;
        }

        if (this._memoryHandle != null) {
            vkFreeMemory(this._device.handle, this._memoryHandle, null);
            this._memoryHandle = null;
        }
    }

}
export class VulkanImageEmpty extends BaseVulkanImage {
    constructor(
        device: Device,
        width: number,
        height: number,
        format: VkFormat,
        handle: VkImage,
        layouts: VkImageLayout[] = [],
        memoryHandle: VkDeviceMemory | null,
        mipLevel: number = 1,
    ) {
        super(device, width, height, format, mipLevel);

        this._layout = layouts;
        this._memoryHandle = memoryHandle;
        this._handle = handle;
    }
}
export class VulkanImage extends BaseVulkanImage {

    constructor(
        device: Device,
        width: number,
        height: number,
        format: VkFormat,
        usageFlags: VkImageUsageFlagBits,
        mipLevel: number = 0,
        layout: VkImageLayout = VkImageLayout.VK_IMAGE_LAYOUT_UNDEFINED
    ) {
        super(device, width, height, format, mipLevel);

        // auto generate mip map levels
        if (mipLevel == 0) {
            mipLevel =
                Math.floor(
                    Math.log2(
                        Math.max(width, height)
                    )
                ) + 1;
        }

        this._mipLevel = mipLevel;

        for (let i = 0; i < mipLevel; i++) {
            this._layout[i] = layout;
        }

        let queueFamilyIndices: number[] = [];
        for (let queueFamily of device.QueueFamilies)
            queueFamilyIndices.push(queueFamily.index);


        let extend = new VkExtent3D();
        extend.width = width;
        extend.height = height;
        extend.depth = 1;

        var imageInfo = new VkImageCreateInfo();
        // imageInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
        imageInfo.imageType = VkImageType.VK_IMAGE_TYPE_2D;
        imageInfo.format = format;
        imageInfo.extent = extend;
        imageInfo.mipLevels = mipLevel;
        imageInfo.samples = VkSampleCountFlagBits.VK_SAMPLE_COUNT_1_BIT;
        imageInfo.tiling = VkImageTiling.VK_IMAGE_TILING_OPTIMAL;
        imageInfo.arrayLayers = 1;
        imageInfo.usage = usageFlags;
        imageInfo.sharingMode = VkSharingMode.VK_SHARING_MODE_CONCURRENT;
        imageInfo.initialLayout = VkImageLayout.VK_IMAGE_LAYOUT_UNDEFINED;
        imageInfo.queueFamilyIndexCount = queueFamilyIndices.length;
        imageInfo.pQueueFamilyIndices = new Uint32Array(queueFamilyIndices);

        this._handle = new VkImage();

        if (vkCreateImage(
            device.handle,
            imageInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create vulkan image");

        //memory 
        let memoryRequirements = new VkMemoryRequirements();
        vkGetImageMemoryRequirements(
            device.handle,
            this._handle,
            memoryRequirements
        );

        var allocateInfo = new VkMemoryAllocateInfo();
        //  allocateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
        allocateInfo.memoryTypeIndex = device.getMemoryTypeIndex(
            memoryRequirements.memoryTypeBits,
            VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT,
            device.PhysicalDevice
        );
        allocateInfo.allocationSize = memoryRequirements.size;

        this._memoryHandle = new VkDeviceMemory();
        if (vkAllocateMemory(
            device.handle,
            allocateInfo,
            null,
            this._memoryHandle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to allocate device memory");

        //bind memory with image
        if (vkBindImageMemory(
            device.handle,
            this._handle,
            this._memoryHandle,
            0
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to bind image to device memory");
    }
}