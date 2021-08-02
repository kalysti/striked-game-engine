import fs from "fs";
import pngjs from "pngjs";
import { Renderer } from '../../renderer';
import { vkAllocateCommandBuffers, vkAllocateMemory, vkBeginCommandBuffer, vkBindImageMemory, VkBufferImageCopy, vkCmdCopyBufferToImage, vkCmdPipelineBarrier, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkCommandPool, VkComponentMapping, vkCreateImage, vkCreateImageView, vkCreateSampler, VkDeviceMemory, vkEndCommandBuffer, VkExtent3D, vkGetImageMemoryRequirements, VkImage, VkImageCreateInfo, VkImageLayout, VkImageMemoryBarrier, VkImageSubresourceLayers, VkImageSubresourceRange, VkImageView, VkImageViewCreateInfo, VkMemoryAllocateInfo, VkMemoryRequirements, VkOffset3D, VkPhysicalDevice, vkQueueSubmit, vkQueueWaitIdle, VkSampler, VkSamplerCreateInfo, VkSubmitInfo, VK_ACCESS_SHADER_READ_BIT, VK_ACCESS_TRANSFER_WRITE_BIT, VK_BORDER_COLOR_INT_OPAQUE_BLACK, VK_BUFFER_USAGE_TRANSFER_SRC_BIT, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT, VK_COMPARE_OP_ALWAYS, VK_COMPONENT_SWIZZLE_IDENTITY, VK_FILTER_NEAREST, VK_FORMAT_R8G8B8A8_UNORM, VK_IMAGE_ASPECT_COLOR_BIT, VK_IMAGE_LAYOUT_PREINITIALIZED, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_TYPE_2D, VK_IMAGE_USAGE_SAMPLED_BIT, VK_IMAGE_USAGE_TRANSFER_DST_BIT, VK_IMAGE_VIEW_TYPE_2D, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT, VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT, VK_PIPELINE_STAGE_TRANSFER_BIT, VK_QUEUE_FAMILY_IGNORED, VK_SAMPLER_ADDRESS_MODE_REPEAT, VK_SAMPLER_MIPMAP_MODE_LINEAR, VK_SAMPLE_COUNT_1_BIT, VK_SHARING_MODE_EXCLUSIVE, VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO, VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO, VkFormat, VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO, VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL, VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT, VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT, VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT, VK_IMAGE_ASPECT_DEPTH_BIT, VK_FORMAT_D24_UNORM_S8_UINT, VK_FORMAT_D32_SFLOAT_S8_UINT, VK_IMAGE_ASPECT_STENCIL_BIT, VK_IMAGE_VIEW_TYPE_CUBE, VK_IMAGE_CREATE_CUBE_COMPATIBLE_BIT, vkDestroyBuffer, vkFreeMemory, vkDestroyImageView } from 'vulkan-api';
import { ASSERT_VK_RESULT, getMemoryTypeIndex } from "../../utils/helpers";
import { VulkanBuffer } from '../../vulkan/buffer';
import { LogicalDevice } from '../../vulkan/logical.device';
import { EngineObject } from '../core/EngineObject';
import { VkImageTiling, VkImageUsageFlagBits, VkMemoryPropertyFlagBits, VkImageAspectFlagBits, VkImageViewType } from 'vulkan-api/generated/1.2.162/win32';
import { CommandPool } from '../../vulkan/command.pool';
const { PNG } = pngjs;

export class Texture2D extends EngineObject {

    width: number = 0;
    height: number = 0;
    data: Uint8Array = new Uint8Array();
    image = new VkImage();
    depthImage = new VkImage();
    sampler = new VkSampler();
    imageView = new VkImageView();
    imageMemory = new VkDeviceMemory();
    imageLayout: VkImageLayout = VK_IMAGE_LAYOUT_PREINITIALIZED;
    stagingBuffer: VulkanBuffer | null = null;

    device: LogicalDevice;
    physicalDevice: VkPhysicalDevice;
    cmdPool: CommandPool;
    format: VkFormat;

    constructor(device: LogicalDevice, physicalDevice: VkPhysicalDevice, cmdPool: CommandPool) {
        super();
        this.device = device;
        this.physicalDevice = physicalDevice;
        this.cmdPool = cmdPool;
    }

    fromBuffer(buffer: Uint8Array, width: number, height: number) {
        this.data = buffer;
        this.width = width;
        this.height = height;

        return this;
    };

    fromImagePath(path) {
        let buffer = fs.readFileSync(path);
        let img = PNG.sync.read(buffer);
        let data = new Uint8Array(img.data);
        this.data = data;
        this.width = img.width;
        this.height = img.height;

        return this;
    };

    update(buffer: Buffer, width: number = 0, height: number = 0) {

        this.data = new Uint8Array(buffer);

        let stagingBuffer = new VulkanBuffer(this.device, this.data.byteLength, VK_BUFFER_USAGE_TRANSFER_SRC_BIT);
        stagingBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
        stagingBuffer.updateValues(this.data);

        let imageSubresource = new VkImageSubresourceLayers();
        imageSubresource.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        imageSubresource.mipLevel = 0;
        imageSubresource.baseArrayLayer = 0;
        imageSubresource.layerCount = 1;

        let imageOffset = new VkOffset3D();
        imageOffset.x = 0;
        imageOffset.y = 0;
        imageOffset.z = 0;

        let imageExtent = new VkExtent3D();
        imageExtent.width = this.width;
        imageExtent.height = this.height;
        imageExtent.depth = 1;

        let bufferImageCopy = new VkBufferImageCopy();
        bufferImageCopy.bufferOffset = 0;
        bufferImageCopy.bufferRowLength = 0;
        bufferImageCopy.bufferImageHeight = 0;
        bufferImageCopy.imageSubresource = imageSubresource;
        bufferImageCopy.imageOffset = imageOffset;
        bufferImageCopy.imageExtent = imageExtent;


        let subresourceRange = new VkImageSubresourceRange();
        subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        subresourceRange.baseMipLevel = 0;
        subresourceRange.levelCount = 1;
        subresourceRange.baseArrayLayer = 0;
        subresourceRange.layerCount = 1;

        this.setNewLayout(VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, subresourceRange);
        this.transferBufferToImage(stagingBuffer, [bufferImageCopy]);
        this.setNewLayout(VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, subresourceRange);

        this.stagingBuffer.free();
        this.stagingBuffer = stagingBuffer;

    }

    create(format: VkFormat, tiling: VkImageTiling, usage: VkImageUsageFlagBits, properties: VkMemoryPropertyFlagBits) {
        let imageInfo = new VkImageCreateInfo();
        imageInfo.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
        imageInfo.imageType = VK_IMAGE_TYPE_2D;
        imageInfo.extent.width = Renderer.window.width;
        imageInfo.extent.height = Renderer.window.height;
        imageInfo.extent.depth = 1;
        imageInfo.mipLevels = 1;
        imageInfo.arrayLayers = 1;
        imageInfo.format = format;
        imageInfo.tiling = tiling;
        imageInfo.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        imageInfo.usage = usage;
        imageInfo.samples = VK_SAMPLE_COUNT_1_BIT;
        imageInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;

        let result = vkCreateImage(this.device.handle, imageInfo, null, this.image);
        ASSERT_VK_RESULT(result);

        let memRequirements = new VkMemoryRequirements();
        vkGetImageMemoryRequirements(this.device.handle, this.image, memRequirements);

        let allocInfo = new VkMemoryAllocateInfo();
        allocInfo.sType = VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
        allocInfo.allocationSize = memRequirements.size;
        allocInfo.memoryTypeIndex = getMemoryTypeIndex(memRequirements.memoryTypeBits, properties, this.physicalDevice);

        result = vkAllocateMemory(this.device.handle, allocInfo, null, this.imageMemory);
        ASSERT_VK_RESULT(result);

        vkBindImageMemory(this.device.handle, this.image, this.imageMemory, 0n);
        this.imageLayout = VK_IMAGE_LAYOUT_UNDEFINED;
    }

    createImageView(format: VkFormat, aspectFlags: VkImageAspectFlagBits) {
        let viewInfo = new VkImageViewCreateInfo();
        viewInfo.sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
        viewInfo.image = this.image;
        viewInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
        viewInfo.format = format;
        viewInfo.subresourceRange.aspectMask = aspectFlags;
        viewInfo.subresourceRange.baseMipLevel = 0;
        viewInfo.subresourceRange.levelCount = 1;
        viewInfo.subresourceRange.baseArrayLayer = 0;
        viewInfo.subresourceRange.layerCount = 1;

        this.format = format;

        let result = vkCreateImageView(this.device.handle, viewInfo, null, this.imageView);
        ASSERT_VK_RESULT(result);
    };

    upload(typeFormat: VkImageViewType = VK_IMAGE_VIEW_TYPE_2D) {

        let faces = (typeFormat == VK_IMAGE_VIEW_TYPE_CUBE) ? 6 : 1;

        let byteLength = this.data.byteLength;

        this.stagingBuffer = new VulkanBuffer(this.device, byteLength, VK_BUFFER_USAGE_TRANSFER_SRC_BIT);
        this.stagingBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
        this.stagingBuffer.updateValues(this.data);

        let imageExtent = new VkExtent3D();
        imageExtent.width = this.width;
        imageExtent.height = this.height;
        imageExtent.depth = 1;

        let imageInfo = new VkImageCreateInfo();
        imageInfo.imageType = VK_IMAGE_TYPE_2D;
        imageInfo.format = VK_FORMAT_R8G8B8A8_UNORM;
        imageInfo.extent = imageExtent;
        imageInfo.mipLevels = 1;
        imageInfo.arrayLayers = faces;
        imageInfo.samples = VK_SAMPLE_COUNT_1_BIT;
        imageInfo.tiling = VK_IMAGE_TILING_OPTIMAL;
        imageInfo.usage = VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT;
        imageInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        imageInfo.queueFamilyIndexCount = 0;
        imageInfo.pQueueFamilyIndices = null;
        imageInfo.initialLayout = this.imageLayout;

        if (typeFormat == VK_IMAGE_VIEW_TYPE_CUBE)
            imageInfo.flags = VK_IMAGE_CREATE_CUBE_COMPATIBLE_BIT;

        let result = vkCreateImage(this.device.handle, imageInfo, null, this.image);
        ASSERT_VK_RESULT(result);

        let memoryRequirements = new VkMemoryRequirements();
        vkGetImageMemoryRequirements(this.device.handle, this.image, memoryRequirements);

        let memoryTypeIndex = getMemoryTypeIndex(
            memoryRequirements.memoryTypeBits,
            VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT,
            this.physicalDevice
        );

        let memoryAllocateInfo = new VkMemoryAllocateInfo();
        memoryAllocateInfo.allocationSize = memoryRequirements.size;
        memoryAllocateInfo.memoryTypeIndex = memoryTypeIndex;

        result = vkAllocateMemory(this.device.handle, memoryAllocateInfo, null, this.imageMemory);
        ASSERT_VK_RESULT(result);

        vkBindImageMemory(this.device.handle, this.image, this.imageMemory, 0n);

        let offset = 0n;
        let buffercops: VkBufferImageCopy[] = [];
        for (let face = 0; face < faces; face++) {
            let imageSubresource = new VkImageSubresourceLayers();
            imageSubresource.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
            imageSubresource.mipLevel = 0;
            imageSubresource.baseArrayLayer = face;
            imageSubresource.layerCount = 1;

            let imageOffset = new VkOffset3D();
            imageOffset.x = 0;
            imageOffset.y = 0;
            imageOffset.z = 0;

            let imageExtent = new VkExtent3D();
            imageExtent.width = this.width;
            imageExtent.height = this.height;
            imageExtent.depth = 1;

            let bufferImageCopy = new VkBufferImageCopy();
            bufferImageCopy.bufferOffset = offset;
            bufferImageCopy.bufferRowLength = 0;
            bufferImageCopy.bufferImageHeight = 0;
            bufferImageCopy.imageSubresource = imageSubresource;
            bufferImageCopy.imageOffset = imageOffset;
            bufferImageCopy.imageExtent = imageExtent;

            buffercops.push(bufferImageCopy);
        }


        let subresourceRange = new VkImageSubresourceRange();
        subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        subresourceRange.baseMipLevel = 0;
        subresourceRange.levelCount = 1;
        subresourceRange.baseArrayLayer = 0;
        subresourceRange.layerCount = faces;

        this.setNewLayout(VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, subresourceRange);
        this.transferBufferToImage(this.stagingBuffer, buffercops);
        this.setNewLayout(VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, subresourceRange);

        let components = new VkComponentMapping();
        components.r = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.g = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.b = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.a = VK_COMPONENT_SWIZZLE_IDENTITY;

        let imageViewInfo = new VkImageViewCreateInfo();
        imageViewInfo.image = this.image;
        imageViewInfo.viewType = typeFormat;
        imageViewInfo.format = VK_FORMAT_R8G8B8A8_UNORM;
        imageViewInfo.components = components;
        imageViewInfo.subresourceRange = subresourceRange;

        result = vkCreateImageView(this.device.handle, imageViewInfo, null, this.imageView);
        ASSERT_VK_RESULT(result);

        let samplerInfo = new VkSamplerCreateInfo();
        samplerInfo.magFilter = VK_FILTER_NEAREST;
        samplerInfo.minFilter = VK_FILTER_NEAREST;
        samplerInfo.mipmapMode = VK_SAMPLER_MIPMAP_MODE_LINEAR;
        samplerInfo.addressModeU = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.addressModeV = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.addressModeW = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.mipLodBias = 0;
        samplerInfo.anisotropyEnable = false;
        samplerInfo.maxAnisotropy = 16;
        samplerInfo.compareEnable = false;
        samplerInfo.compareOp = VK_COMPARE_OP_ALWAYS;
        samplerInfo.minLod = 0;
        samplerInfo.maxLod = 0;
        samplerInfo.borderColor = VK_BORDER_COLOR_INT_OPAQUE_BLACK;
        samplerInfo.unnormalizedCoordinates = false;

        result = vkCreateSampler(this.device.handle, samplerInfo, null, this.sampler);
        ASSERT_VK_RESULT(result);
    }

    //VK_IMAGE_VIEW_TYPE_CUBE

    setNewLayout(imageLayout: VkImageLayout, subresourceRange: VkImageSubresourceRange | null = null) {

        if (subresourceRange == null) {
            subresourceRange = new VkImageSubresourceRange();
            subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
            subresourceRange.baseMipLevel = 0;
            subresourceRange.levelCount = 1;
            subresourceRange.baseArrayLayer = 0;
            subresourceRange.layerCount = 1;
        }

        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this.cmdPool.handle;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(this.device.handle, cmdBufferAllocInfo, [cmdBuffer]);
        ASSERT_VK_RESULT(result);

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;

        result = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
        ASSERT_VK_RESULT(result);

        if (imageLayout == VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL) {
            subresourceRange.aspectMask = VK_IMAGE_ASPECT_DEPTH_BIT;
            if (this.format == VK_FORMAT_D32_SFLOAT_S8_UINT || this.format == VK_FORMAT_D24_UNORM_S8_UINT) {
                subresourceRange.aspectMask |= VK_IMAGE_ASPECT_STENCIL_BIT;
            }
        }

        let srcAccessMask = 0;
        let dstAccessMask = 0;
        let srcStage = 0;
        let dstStage = 0;
        if (imageLayout == VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL && this.imageLayout == VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL) {
            dstAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            srcAccessMask = VK_ACCESS_SHADER_READ_BIT;
            dstStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
            srcStage = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
        }
        if (
            (imageLayout === VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL) &&
            (this.imageLayout === VK_IMAGE_LAYOUT_PREINITIALIZED)
        ) {
            srcAccessMask = 0;
            dstAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            srcStage = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT;
            dstStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
        } else if (
            (imageLayout === VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL) &&
            (this.imageLayout === VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL)
        ) {
            srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            dstAccessMask = VK_ACCESS_SHADER_READ_BIT;
            srcStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
            dstStage = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
        }

        else if (
            (imageLayout === VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL) &&
            (this.imageLayout === VK_IMAGE_LAYOUT_UNDEFINED)
        ) {
            srcAccessMask = 0;
            dstAccessMask = VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT | VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT;
            srcStage = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT;
            dstStage = VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT;
        }


        let imageMemoryBarrier = new VkImageMemoryBarrier();
        imageMemoryBarrier.srcAccessMask = srcAccessMask;
        imageMemoryBarrier.dstAccessMask = dstAccessMask;
        imageMemoryBarrier.oldLayout = this.imageLayout;
        imageMemoryBarrier.newLayout = imageLayout;
        imageMemoryBarrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        imageMemoryBarrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        imageMemoryBarrier.image = this.image;
        imageMemoryBarrier.subresourceRange = subresourceRange;

        vkCmdPipelineBarrier(
            cmdBuffer,
            srcStage, dstStage,
            0,
            0, null,
            0, null,
            1, [imageMemoryBarrier]
        );

        result = vkEndCommandBuffer(cmdBuffer);
        ASSERT_VK_RESULT(result);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 0;
        submitInfo.pWaitSemaphores = null;
        submitInfo.pWaitDstStageMask = null;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [cmdBuffer];
        submitInfo.signalSemaphoreCount = 0;
        submitInfo.pSignalSemaphores = null;


        vkQueueSubmit(this.device.handleQueue, 1, [submitInfo], null);
        vkQueueWaitIdle(this.device.handleQueue);

        this.imageLayout = imageLayout;
    };

    transferBufferToImage(buffer: VulkanBuffer, buffcops: VkBufferImageCopy[]) {
        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this.cmdPool.handle;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(this.device.handle, cmdBufferAllocInfo, [cmdBuffer]);
        ASSERT_VK_RESULT(result);

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;

        result = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
        ASSERT_VK_RESULT(result);



        vkCmdCopyBufferToImage(
            cmdBuffer,
            buffer.buffer,
            this.image,
            VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            buffcops.length,
            buffcops
        );

        result = vkEndCommandBuffer(cmdBuffer);
        ASSERT_VK_RESULT(result);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 0;
        submitInfo.pWaitSemaphores = null;
        submitInfo.pWaitDstStageMask = null;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [cmdBuffer];
        submitInfo.signalSemaphoreCount = 0;
        submitInfo.pSignalSemaphores = null;

        vkQueueSubmit(this.device.handleQueue, 1, [submitInfo], null);
        vkQueueWaitIdle(this.device.handleQueue);

    };

}