import { memoryWrite, VkBlendFactor, VkBlendOp, vkCreateShaderModule, VkDescriptorPoolSize, VkDescriptorSetLayoutBinding, VkDescriptorType, VkFormat, vkGetPhysicalDeviceMemoryProperties, VkPhysicalDeviceMemoryProperties, VkPipelineColorBlendAttachmentState, VkPipelineShaderStageCreateInfo, VkShaderModule, VkShaderModuleCreateInfo, VkShaderStageFlagBits, VkVertexInputAttributeDescription, VkWriteDescriptorSet, VK_BLEND_FACTOR_ONE, VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA, VK_BLEND_FACTOR_SRC_ALPHA, VK_BLEND_FACTOR_ZERO, VK_BLEND_OP_ADD, VK_COLOR_COMPONENT_A_BIT, VK_COLOR_COMPONENT_B_BIT, VK_COLOR_COMPONENT_G_BIT, VK_COLOR_COMPONENT_R_BIT, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_FORMAT_R32G32B32_SFLOAT, VK_FORMAT_R32G32_SFLOAT, VK_SHADER_STAGE_FRAGMENT_BIT, VK_SUCCESS, VkDescriptorBufferInfo, VkDescriptorImageInfo, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, VkDevice } from 'vulkan-api';
import { VkColorComponentFlagBits } from 'vulkan-api/generated/1.2.162/win32';
import { Texture2D } from './resources/Texture2D';
import { VulkanBuffer } from './vulkan/buffer';

export function ASSERT_VK_RESULT(result) {
  if (result !== VK_SUCCESS) throw new Error(`Vulkan assertion failed!`);
};

export function createDescPoolSize(type: VkDescriptorType, count: number = 1) {
  let descriptorPoolSize = new VkDescriptorPoolSize();
  descriptorPoolSize.type = type;
  descriptorPoolSize.descriptorCount = count;

  return descriptorPoolSize;
}


export function createDescriptionLayout(bind: number, type: VkDescriptorType, stageFlag: VkShaderStageFlagBits) {
  let samplerLayoutBinding = new VkDescriptorSetLayoutBinding();
  samplerLayoutBinding.binding = bind;
  samplerLayoutBinding.descriptorType = type;
  samplerLayoutBinding.descriptorCount = 1;
  samplerLayoutBinding.stageFlags = stageFlag;
  samplerLayoutBinding.pImmutableSamplers = null;
  return samplerLayoutBinding;
}

export function createDescSet(vb: VulkanBuffer, binding: number = 0, type: VkDescriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER): VkWriteDescriptorSet {

  let bufferInfo = new VkDescriptorBufferInfo();
  bufferInfo.buffer = vb.buffer;
  bufferInfo.offset = 0n;
  bufferInfo.range = vb.size;

  let writeDescriptorSet = new VkWriteDescriptorSet();
  writeDescriptorSet.dstArrayElement = 0;
  writeDescriptorSet.descriptorCount = 1;
  writeDescriptorSet.descriptorType = type;
  writeDescriptorSet.dstBinding = binding;
  writeDescriptorSet.pBufferInfo = [bufferInfo];
  return writeDescriptorSet;
}

export function createDescImageInfo(texture: Texture2D, binding: number = 0, type: VkDescriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER): VkWriteDescriptorSet {

  let descriptorImageInfo = new VkDescriptorImageInfo();
  descriptorImageInfo.sampler = texture.sampler;
  descriptorImageInfo.imageView = texture.imageView;
  descriptorImageInfo.imageLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;

  let writeDescriptorSet = new VkWriteDescriptorSet();
  writeDescriptorSet.dstArrayElement = 0;
  writeDescriptorSet.descriptorCount = 1;
  writeDescriptorSet.descriptorType = type;
  writeDescriptorSet.dstBinding = binding;
  writeDescriptorSet.pImageInfo = [descriptorImageInfo];
  return writeDescriptorSet;
}

export function calculateVertexDescriptorStride(attributes: VkVertexInputAttributeDescription[] = []): number {
  let stride = 0;
  for (let attr of attributes) {
    if (attr.format == VK_FORMAT_R32G32B32_SFLOAT)
      stride += 3 * 4;
    else if (attr.format == VK_FORMAT_R32G32_SFLOAT)
      stride += 2 * 4;
    else
      throw new Error("Format not sign up.");

  }
  return stride;
}

export function createColorAttachment(
  blendEnable: boolean = false,
  srcColorFactor: VkBlendFactor = VK_BLEND_FACTOR_SRC_ALPHA,
  dstColorFactor: VkBlendFactor = VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA,
  colorBlendOp: VkBlendOp = VK_BLEND_OP_ADD,
  srcAlphaBlendFactor: VkBlendFactor = VK_BLEND_FACTOR_ONE,
  dstAlphaBlendFactor: VkBlendFactor = VK_BLEND_FACTOR_ZERO,
  alphaBlendOp: VkBlendOp = VK_BLEND_OP_ADD,
  colorWriteMask: VkColorComponentFlagBits = (
    VK_COLOR_COMPONENT_R_BIT |
    VK_COLOR_COMPONENT_G_BIT |
    VK_COLOR_COMPONENT_B_BIT |
    VK_COLOR_COMPONENT_A_BIT
  )): VkPipelineColorBlendAttachmentState {
  let colorBlendAttachment = new VkPipelineColorBlendAttachmentState();
  colorBlendAttachment.blendEnable = blendEnable;
 colorBlendAttachment.srcColorBlendFactor = srcColorFactor;
  colorBlendAttachment.dstColorBlendFactor = dstColorFactor;
  colorBlendAttachment.colorBlendOp = colorBlendOp;
  colorBlendAttachment.srcAlphaBlendFactor = srcAlphaBlendFactor;
  colorBlendAttachment.dstAlphaBlendFactor = dstAlphaBlendFactor;
  colorBlendAttachment.alphaBlendOp = alphaBlendOp;
  colorBlendAttachment.colorWriteMask = colorWriteMask;

  return colorBlendAttachment;
}
export function createVertexDescriptor(location: number = 0, offset: number = 0, format: VkFormat = VK_FORMAT_R32G32B32_SFLOAT): VkVertexInputAttributeDescription {

  let posVertexAttrDescr = new VkVertexInputAttributeDescription();
  posVertexAttrDescr.location = location;
  posVertexAttrDescr.binding = 0;
  posVertexAttrDescr.format = format;
  posVertexAttrDescr.offset = offset;

  return posVertexAttrDescr;
}


export function createShaderModule(device: VkDevice, shaderSrc, shaderModule) {
  let shaderModuleInfo = new VkShaderModuleCreateInfo();
  shaderModuleInfo.pCode = shaderSrc;
  shaderModuleInfo.codeSize = shaderSrc.byteLength;
  let result = vkCreateShaderModule(device, shaderModuleInfo, null, shaderModule);
  ASSERT_VK_RESULT(result);
  return shaderModule;
};

export function getMemoryTypeIndex(typeFilter, propertyFlag, physicalDevice) {
  let memoryProperties = new VkPhysicalDeviceMemoryProperties();
  vkGetPhysicalDeviceMemoryProperties(physicalDevice, memoryProperties);
  for (let ii = 0; ii < memoryProperties.memoryTypeCount; ++ii) {
    if (
      (typeFilter & (1 << ii)) &&
      (memoryProperties.memoryTypes[ii].propertyFlags & propertyFlag) === propertyFlag
    ) {
      return ii;
    }
  };
  return -1;
};

export function memoryCopy(dstPtr: bigint, srcData: Float32Array | Uint8Array | Uint32Array | Uint16Array) {

  let srcBuffer = srcData.buffer;
  let srcView = new Uint8Array(srcBuffer);

  memoryWrite(dstPtr, srcView);
};

