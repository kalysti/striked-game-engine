import { VkDescriptorPool, VkDescriptorPoolSize, VkDescriptorPoolCreateInfo, VkStructureType, VkResult, vkCreateDescriptorPool, vkDestroyDescriptorPool } from "vulkan-api/generated/1.2.162/win32";
import { DescriptorLayout } from "./desc-layout";
import { Device } from "./device";

export class DescriptorPool {

    private _maxSets: number;
    private _device: Device;
    private _layout: DescriptorLayout;
    private _handle: VkDescriptorPool|null;

    get MaxSets(): number {
        return this._maxSets;
    }
    get Device(): Device {
        return this._device;
    }
    get Layout(): DescriptorLayout {
        return this._layout;
    }
    get handle(): VkDescriptorPool|null {
        return this._handle;
    }

    constructor(layout: DescriptorLayout, maxSets: number) {
        this._device = layout.device;
        this._layout = layout;
        this._maxSets = maxSets;

        var poolSizes: VkDescriptorPoolSize[] = [];
        for (let binding of layout.bindings) {
            var poolSizeIndex = poolSizes.findIndex(
                p => p.type == binding.DescriptorType
            );
            if (poolSizeIndex == -1) {

                let desc = new VkDescriptorPoolSize();
                desc.type = binding.DescriptorType;
                desc.descriptorCount = binding.DescriptorCounts;

                poolSizes.push(desc);
            }
            else {

                let desc = new VkDescriptorPoolSize();
                desc.type = binding.DescriptorType;
                desc.descriptorCount =
                    poolSizes[poolSizeIndex].descriptorCount +
                    binding.DescriptorCounts;

                poolSizes[poolSizeIndex] = desc;
            }
        }

        var vulkanPoolSizes: VkDescriptorPoolSize[] = [];

        for (let p of poolSizes)
            vulkanPoolSizes.push(p);

        var createInfo = new VkDescriptorPoolCreateInfo();

        //createInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_DESCRIPTOR_POOL_CREATE_INFO;
        createInfo.maxSets = maxSets;
        createInfo.poolSizeCount = vulkanPoolSizes.length;
        createInfo.pPoolSizes = vulkanPoolSizes;


        this._handle = new VkDescriptorPool();
        if (vkCreateDescriptorPool(
            this._device.handle,
            createInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create descriptor pool");
    }

    destroy() {
        if (this._handle != null) {
            vkDestroyDescriptorPool(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
    }
}