import { vkCreateDescriptorSetLayout, VkDescriptorSetLayout, VkDescriptorSetLayoutBinding, VkDescriptorSetLayoutCreateInfo, VkDescriptorType, vkDestroyDescriptorSetLayout, VkResult, VkShaderStageFlagBits, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";

/*
-- GPU DATA STRUCTURE --
struct Descriptor { type specific data }
struct DescriptorBinding {   
  int binding;
  DescriptorType type;
  Descriptor descriptors[]
};
struct DescriptorSet {
    DescriptorBinding bindings[];
};
struct PipelineLayout {
  DescriptorSet sets[]
}
*/
export class DescriptorBindingInfo {
    public Index: number;
    public DescriptorType: VkDescriptorType;
    public DescriptorCounts: number;
    public ShaderStageFlags: VkShaderStageFlagBits;

    constructor(
        index: number,
        descriptorType: VkDescriptorType,
        descriptorCounts: number,
        shaderStageFlags: VkShaderStageFlagBits
    ) {
        this.Index = index;
        this.DescriptorType = descriptorType;
        this.DescriptorCounts = descriptorCounts;
        this.ShaderStageFlags = shaderStageFlags;
    }
}

export class DescriptorLayout {

    
    private _device: Device;
    public handle: VkDescriptorSetLayout | null = null;
    private _bindings: DescriptorBindingInfo[] = [];

    get device(): Device{
        return this._device
    }

    get bindings(): DescriptorBindingInfo[]{
        return this._bindings
    }

    constructor(device: Device, bindings: DescriptorBindingInfo[]) {
        this._device = device;
        this._bindings = bindings;

        var vulkanBindings: VkDescriptorSetLayoutBinding[] = [];
        for (let binding of bindings) {

            let bind = new VkDescriptorSetLayoutBinding();
            bind.binding = binding.Index;
            bind.descriptorType = binding.DescriptorType;
            bind.descriptorCount = binding.DescriptorCounts;
            bind.stageFlags = binding.ShaderStageFlags;
            bind.pImmutableSamplers = null;
            vulkanBindings.push(bind);
        }

        var createInfo = new VkDescriptorSetLayoutCreateInfo();
        //createInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_DESCRIPTOR_SET_LAYOUT_CREATE_INFO;
        createInfo.bindingCount = vulkanBindings.length;
        createInfo.pBindings = vulkanBindings;

        this.handle = new VkDescriptorSetLayout();

        if (vkCreateDescriptorSetLayout(
            device.handle,
            createInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create descriptor set layout");
    }
    
    destrtoy() {
        if (this.handle != null) {
            vkDestroyDescriptorSetLayout(
                this._device.handle,
                this.handle,
                null
            );
            this.handle = null;
        }
    }
}
