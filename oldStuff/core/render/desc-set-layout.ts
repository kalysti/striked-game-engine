import { vkCreateDescriptorSetLayout, VkDescriptorSetLayout, VkDescriptorSetLayoutBinding, VkDescriptorSetLayoutCreateInfo, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_FRAGMENT_BIT, VK_SHADER_STAGE_VERTEX_BIT, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";
import { LogicalDevice } from "./logical-device";

export class DescriptorSetLayout {

    protected descSetLayout: VkDescriptorSetLayout = new VkDescriptorSetLayout();

    getDescSet(): VkDescriptorSetLayout {
        return this.descSetLayout;
    }

    create(_device: LogicalDevice) {

        let uboLayoutBinding = new VkDescriptorSetLayoutBinding();
        uboLayoutBinding.binding = 0;
        uboLayoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
        uboLayoutBinding.descriptorCount = 1;
        uboLayoutBinding.stageFlags = VK_SHADER_STAGE_VERTEX_BIT;
        uboLayoutBinding.pImmutableSamplers = null;

        let samplerLayoutBinding = new VkDescriptorSetLayoutBinding();
        samplerLayoutBinding.binding = 1;
        samplerLayoutBinding.descriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
        samplerLayoutBinding.descriptorCount = 1;
        samplerLayoutBinding.stageFlags = VK_SHADER_STAGE_FRAGMENT_BIT;
        samplerLayoutBinding.pImmutableSamplers = null;

        let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
        layoutInfo.bindingCount = 2;
        layoutInfo.pBindings = [uboLayoutBinding, samplerLayoutBinding];

        let result = vkCreateDescriptorSetLayout(_device.getDevice(), layoutInfo, null, this.descSetLayout);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }
}