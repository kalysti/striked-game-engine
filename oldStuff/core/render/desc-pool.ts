import { vkCreateDescriptorPool, VkDescriptorPool, VkDescriptorPoolCreateInfo, VkDescriptorPoolSize, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";
import { LogicalDevice } from "./logical-device";

export class DescriptorPool {

    protected _pool: VkDescriptorPool = new VkDescriptorPool();

    getPool(): VkDescriptorPool {
        return this._pool;
    }

    create(_device: LogicalDevice) {

        let descriptorPoolSize = new VkDescriptorPoolSize();
        descriptorPoolSize.type = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
        descriptorPoolSize.descriptorCount = 1;

        let samplerDescriptorPoolSize = new VkDescriptorPoolSize();
        samplerDescriptorPoolSize.type = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
        samplerDescriptorPoolSize.descriptorCount = 1;

        let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
        descriptorPoolInfo.maxSets = 1;
        descriptorPoolInfo.poolSizeCount = 2;
        descriptorPoolInfo.pPoolSizes = [descriptorPoolSize, samplerDescriptorPoolSize];
        let result = vkCreateDescriptorPool(_device.getDevice(), descriptorPoolInfo, null, this._pool);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }
}