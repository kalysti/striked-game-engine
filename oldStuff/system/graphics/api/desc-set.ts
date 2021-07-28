import { vkAllocateDescriptorSets, VkDescriptorBufferInfo, VkDescriptorImageInfo, VkDescriptorSet, VkDescriptorSetAllocateInfo, VkDescriptorSetLayout, VkResult, VkStructureType, vkUpdateDescriptorSets, VkWriteDescriptorSet } from "vulkan-api/generated/1.2.162/win32";
import {  VulkanBuffer } from "./buffer";
import { DescriptorPool } from "./desc-pool";
import { Device } from "./device";
import { ImageView } from "./imageview";
import { Sampler } from "./sampler";


export class DescriptorSet {

    private _descriptorPool: DescriptorPool;
    private _device: Device;
    private _handle: VkDescriptorSet;

    get handle(): VkDescriptorSet {
        return this._handle;

    }
    get device(): Device {
        return this._device;
    }
    get descriptorPool(): DescriptorPool {
        return this._descriptorPool;
    }

    constructor(descriptorPool: DescriptorPool, setCount: number = 1) {
        this._device = descriptorPool.Device;
        this._descriptorPool = descriptorPool;

        var layouts: VkDescriptorSetLayout[] = [];
        for (let i = 0; i < setCount; i++) {
            if (descriptorPool.Layout.handle != null)
                layouts.push(descriptorPool.Layout.handle);
        }

        var allocateInfo = new VkDescriptorSetAllocateInfo();

      //  allocateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_DESCRIPTOR_SET_ALLOCATE_INFO;
        allocateInfo.descriptorPool = descriptorPool.handle;
        allocateInfo.descriptorSetCount = setCount;
        allocateInfo.pSetLayouts = layouts;

        this._handle = new VkDescriptorSet();

        if (vkAllocateDescriptorSets(
            this._device.handle,
            allocateInfo,
            [this._handle]
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to allocate descriptor sets");


    }

    public UpdateBuffers(buffers: VulkanBuffer[]) {
        if (buffers.length != this._descriptorPool.Layout.bindings.length)
            throw new Error("buffers length should match descriptor layout bindings");

        var descriptorSetBufferInfos: VkDescriptorBufferInfo[] = [];
        var writeDescriptorSets: VkWriteDescriptorSet[] = [];

        for (let i = 0; i < this._descriptorPool.Layout.bindings.length; i++) {
            var binding = this._descriptorPool.Layout.bindings[i];

            var descriptorSetBufferInfo = new VkDescriptorBufferInfo();
            descriptorSetBufferInfo.buffer = buffers[i].handle;
            descriptorSetBufferInfo.offset = 0n;
            descriptorSetBufferInfo.range = buffers[i].size;

            var writeDescriptorSet = new VkWriteDescriptorSet();

          //  writeDescriptorSet.sType = VkStructureType.VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
            writeDescriptorSet.dstSet = this._handle;
            writeDescriptorSet.dstBinding = binding.Index;
            writeDescriptorSet.dstArrayElement = 0;
            writeDescriptorSet.descriptorCount = binding.DescriptorCounts;
            writeDescriptorSet.descriptorType = binding.DescriptorType;
            writeDescriptorSet.pBufferInfo = [descriptorSetBufferInfo];

            descriptorSetBufferInfos.push(descriptorSetBufferInfo);
            writeDescriptorSets.push(writeDescriptorSet);
        }

        vkUpdateDescriptorSets(
            this._device.handle,
            writeDescriptorSets.length,
            writeDescriptorSets,
            0,
            null
        );
    }

    public UpdateBuffer(buffer: VulkanBuffer, binding: number) {
        var vulkanBinding = this._descriptorPool.Layout.bindings[binding];
        var descriptorSetBufferInfo = new VkDescriptorBufferInfo();

        descriptorSetBufferInfo.buffer = buffer.handle;
        descriptorSetBufferInfo.offset = 0;
        descriptorSetBufferInfo.range = buffer.size;

        var writeDescriptorSet = new VkWriteDescriptorSet();
     //  writeDescriptorSet.sType = VkStructureType.VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
        writeDescriptorSet.dstSet = this._handle;
        writeDescriptorSet.dstBinding = vulkanBinding.Index;
        writeDescriptorSet.dstArrayElement = 0;
        writeDescriptorSet.descriptorCount = vulkanBinding.DescriptorCounts;
        writeDescriptorSet.descriptorType = vulkanBinding.DescriptorType;
        writeDescriptorSet.pBufferInfo = [descriptorSetBufferInfo];

        vkUpdateDescriptorSets(
            this._device.handle,
            1,
            [writeDescriptorSet],
            0,
            null
        );
    }

    public UpdateSampledImages(views: ImageView[], samplers: Sampler[]) {
        if (views.length != this._descriptorPool.Layout.bindings.length)
            throw new Error("views length should match descriptor layout bindings");
        if (samplers.length != this._descriptorPool.Layout.bindings.length)
            throw new Error("samplers length should match descriptor layout bindings");

        var descriptorImageInfos: VkDescriptorImageInfo[] = [];
        var writeDescriptorSets: VkWriteDescriptorSet[] = [];

        for (let i = 0; i < this._descriptorPool.Layout.bindings.length; i++) {
            var binding = this._descriptorPool.Layout.bindings[i];
            var descriptorImageInfo = new VkDescriptorImageInfo();
            descriptorImageInfo.imageLayout = views[i].image.layout[0];
            descriptorImageInfo.imageView = views[i].handle;
            descriptorImageInfo.sampler = samplers[i].handle;

            var writeDescriptorSet = new VkWriteDescriptorSet();
         //   writeDescriptorSet.sType = VkStructureType.VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET;
            writeDescriptorSet.dstSet = this._handle;
            writeDescriptorSet.dstBinding = binding.Index;
            writeDescriptorSet.dstArrayElement = 0;
            writeDescriptorSet.descriptorCount = binding.DescriptorCounts;
            writeDescriptorSet.descriptorType = binding.DescriptorType;
            writeDescriptorSet.pImageInfo = [descriptorImageInfo];
            descriptorImageInfos.push(descriptorImageInfo);
            writeDescriptorSets.push(writeDescriptorSet);
        }

        vkUpdateDescriptorSets(
            this._device.handle,
            writeDescriptorSets.length,
            writeDescriptorSets,
            0,
            null
        );
    }

    public UpdateSampledImage(view: ImageView, sampler: Sampler, binding: number) {
        var vulkanBinding = this._descriptorPool.Layout.bindings[binding];
        var descriptorImageInfo = new VkDescriptorImageInfo();
        descriptorImageInfo.imageLayout = view.image.layout[0];
        descriptorImageInfo.imageView = view.handle;
        descriptorImageInfo.sampler = sampler.handle;


        var writeDescriptorSet = new VkWriteDescriptorSet();

     //   writeDescriptorSet.sType = VkStructureType.VK_STRUCTURE_TYPE_WRITE_DESCRIPTOR_SET,
        writeDescriptorSet.dstSet = this._handle;
        writeDescriptorSet.dstBinding = vulkanBinding.Index;
        writeDescriptorSet.dstArrayElement = 0;
        writeDescriptorSet.descriptorCount = vulkanBinding.DescriptorCounts;
        writeDescriptorSet.descriptorType = vulkanBinding.DescriptorType;
        writeDescriptorSet.pImageInfo = [descriptorImageInfo];

        vkUpdateDescriptorSets(
            this._device.handle,
            1,
            [writeDescriptorSet],
            0,
            null
        );
    }
}
