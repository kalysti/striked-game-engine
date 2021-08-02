import { vkAllocateCommandBuffers, vkAllocateMemory, vkBeginCommandBuffer, vkBindBufferMemory, VkBuffer, VkBufferCopy, VkBufferCreateInfo, vkCmdCopyBuffer, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkCommandPool, vkCreateBuffer, vkDestroyBuffer, VkDeviceMemory, vkEndCommandBuffer, vkFreeMemory, vkGetBufferMemoryRequirements, vkMapMemory, VkMemoryAllocateInfo, VkMemoryRequirements, VkPhysicalDevice, vkQueueSubmit, vkQueueWaitIdle, VkSubmitInfo, vkUnmapMemory, VK_BUFFER_USAGE_TRANSFER_DST_BIT, VK_BUFFER_USAGE_TRANSFER_SRC_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT, VK_SHARING_MODE_EXCLUSIVE } from 'vulkan-api';
import { VkBufferUsageFlagBits, VkMemoryPropertyFlagBits } from 'vulkan-api/generated/1.2.162/win32';
import { ASSERT_VK_RESULT, getMemoryTypeIndex, memoryCopy } from "../utils/helpers";
import { LogicalDevice } from './logical.device';

export class VulkanBuffer {
    device: LogicalDevice;
    physicalDevice: VkPhysicalDevice;
    buffer: VkBuffer = new VkBuffer();
    memory: VkDeviceMemory = new VkDeviceMemory();

    stagingBuffer: VkBuffer = new VkBuffer();
    stagingBufferMemory: VkDeviceMemory = new VkDeviceMemory();

    usage: VkBufferUsageFlagBits = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT;
    values: Float32Array | Uint16Array | null = null;
    size: number;

    get handle() {
        return this.buffer;
    }

    free() {
        vkDestroyBuffer(this.device.handle, this.buffer, null);
        vkFreeMemory(this.device.handle, this.memory, null);


        vkDestroyBuffer(this.device.handle, this.stagingBuffer, null);
        vkFreeMemory(this.device.handle, this.stagingBufferMemory, null);
    }

    constructor(device: LogicalDevice, size: number, usageFlags: VkBufferUsageFlagBits = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT) {
        this.device = device;
        this.physicalDevice = device.handlePhysicalDevice;
        this.usage = usageFlags;
        this.size = size;
    }

    create(propertyFlags: VkMemoryPropertyFlagBits = VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT) {
        this.createBuffer(this.usage, this.buffer, this.memory, propertyFlags);
    }

    updateValues(values: Float32Array | Uint8Array) {
        let dataPtr = { $: 0n };

        vkMapMemory(this.device.handle, this.memory, 0n, values.byteLength, 0, dataPtr);
        memoryCopy(dataPtr.$, values);
        vkUnmapMemory(this.device.handle, this.memory);
    }

    private createBuffer(usage: VkBufferUsageFlagBits, buffer: VkBuffer, memoryBuffer: VkDeviceMemory, propertyFlags: VkMemoryPropertyFlagBits = VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT) {
        let bufferInfo = new VkBufferCreateInfo();
        bufferInfo.size = this.size;
        bufferInfo.usage = usage;
        bufferInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        bufferInfo.queueFamilyIndexCount = 0;
        bufferInfo.pQueueFamilyIndices = null;

        let result = vkCreateBuffer(this.device.handle, bufferInfo, null, buffer);
        ASSERT_VK_RESULT(result);

        let memoryRequirements = new VkMemoryRequirements();
        vkGetBufferMemoryRequirements(this.device.handle, buffer, memoryRequirements);

        let memAllocInfo = new VkMemoryAllocateInfo();
        memAllocInfo.allocationSize = memoryRequirements.size;
        memAllocInfo.memoryTypeIndex = getMemoryTypeIndex(memoryRequirements.memoryTypeBits, propertyFlags, this.physicalDevice);

        result = vkAllocateMemory(this.device.handle, memAllocInfo, null, memoryBuffer);
        ASSERT_VK_RESULT(result);

        vkBindBufferMemory(this.device.handle, buffer, memoryBuffer, 0n);
    }

    copyCommand(cmdPool: VkCommandPool, srcBuffer: VkCommandBuffer, dstBuffer: VkCommandBuffer, length: number) {

        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = cmdPool;
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

        let bufferCopy = new VkBufferCopy();
        bufferCopy.srcOffset = 0n;
        bufferCopy.dstOffset = 0n;
        bufferCopy.size = length;

        vkCmdCopyBuffer(cmdBuffer, srcBuffer, dstBuffer, 1, [bufferCopy]);

        result = vkEndCommandBuffer(cmdBuffer);
        ASSERT_VK_RESULT(result);

        let submitInfo = new VkSubmitInfo();
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [cmdBuffer];

        result = vkQueueSubmit(this.device.handleQueue, 1, [submitInfo], null);
        ASSERT_VK_RESULT(result);

        vkQueueWaitIdle(this.device.handleQueue);
    }

    upload(cmdPool: VkCommandPool, values: Float32Array | Uint16Array) {

        if (values.byteLength != this.size)
            throw new Error("Not same size");

        //set values
        this.values = values;

        //create staging buffer
        this.createBuffer(
            VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
            this.stagingBuffer,
            this.stagingBufferMemory,
            VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
        );

        //copy values
        let dataPtr = { $: 0n };
        vkMapMemory(this.device.handle, this.stagingBufferMemory, 0n, values.byteLength, 0, dataPtr);
        memoryCopy(dataPtr.$, values);
        vkUnmapMemory(this.device.handle, this.stagingBufferMemory);

        //create default buffer
        this.createBuffer(
            this.usage | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
            this.buffer,
            this.memory,
            VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
        );

        //copy command buffer
        this.copyCommand(
            cmdPool,
            this.stagingBuffer,
            this.buffer,
            values.byteLength
        );
    }
}