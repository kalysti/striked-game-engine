import {
    vkAllocateCommandBuffers,
    vkAllocateMemory,
    vkBeginCommandBuffer,
    vkBindBufferMemory,
    VkBuffer,
    VkBufferCopy,
    VkBufferCreateInfo, VkBufferUsageFlagBits, vkCmdCopyBuffer,
    VkCommandBuffer,
    VkCommandBufferAllocateInfo,
    VkCommandBufferBeginInfo,
    VkCommandPool,
    vkCreateBuffer,
    vkDestroyBuffer,
    VkDeviceMemory,
    vkEndCommandBuffer,
    vkFreeMemory,
    vkGetBufferMemoryRequirements,
    vkMapMemory,
    VkMemoryAllocateInfo, VkMemoryPropertyFlagBits, VkMemoryRequirements, vkQueueSubmit,
    vkQueueWaitIdle,
    VkSubmitInfo,
    vkUnmapMemory,
    VK_BUFFER_USAGE_TRANSFER_DST_BIT,
    VK_BUFFER_USAGE_TRANSFER_SRC_BIT, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
    VK_COMMAND_BUFFER_LEVEL_PRIMARY,
    VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT,
    VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT,
    VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
    VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT,
    VK_SHARING_MODE_EXCLUSIVE
} from 'vulkan-api';
import {
    ASSERT_VK_RESULT,
    getMemoryTypeIndex,
    memoryCopy
} from '../utils/helpers';
import { CommandPool } from './command.pool';
import { LogicalDevice } from './logical.device';
import { PhysicalDevice } from './physical.device';

export class VulkanBuffer {
    buffer: VkBuffer = new VkBuffer();
    memory: VkDeviceMemory = new VkDeviceMemory();
    logicalDevice: LogicalDevice;
    physicalDevice: PhysicalDevice;
    commandPool: CommandPool;
    stagingBuffer: VkBuffer = new VkBuffer();
    stagingBufferMemory: VkDeviceMemory = new VkDeviceMemory();

    usage: VkBufferUsageFlagBits = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT;
    values: Float32Array | Uint16Array | Uint8Array | null = null;
    currentBufferSize: number;

    constructor(

        usageFlags: VkBufferUsageFlagBits = VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
        logicalDevice: LogicalDevice,
        physicalDevice: PhysicalDevice,
        commandPool: CommandPool
    ) {
        this.usage = usageFlags;
        this.logicalDevice = logicalDevice;
        this.physicalDevice = physicalDevice;
        this.commandPool = commandPool;
    }
    get handle() {
        return this.buffer;
    }

    freeStage() {
        vkUnmapMemory(this.logicalDevice.handle, this.stagingBufferMemory);
        vkDestroyBuffer(
            this.logicalDevice.handle,
            this.stagingBuffer,
            null,
        );
        vkFreeMemory(
            this.logicalDevice.handle,
            this.stagingBufferMemory,
            null,
        );
    }

    free() {
        vkDestroyBuffer(this.logicalDevice.handle, this.buffer, null);
        vkFreeMemory(this.logicalDevice.handle, this.memory, null);

        vkDestroyBuffer(
            this.logicalDevice.handle,
            this.stagingBuffer,
            null,
        );
        vkFreeMemory(
            this.logicalDevice.handle,
            this.stagingBufferMemory,
            null,
        );
    }


    create(
        size: number,
        propertyFlags: VkMemoryPropertyFlagBits = VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
            VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
    ) {
        this.currentBufferSize = size;
        this.createBuffer(
            size,
            this.usage,
            this.buffer,
            this.memory,
            propertyFlags,
        );
    }

    updateValues(values: Float32Array | Uint8Array | Uint16Array) {

        if (this.usage & VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT) {
            if (values.byteLength > 0) {
                let dataPtr = { $: 0n };

                vkMapMemory(
                    this.logicalDevice.handle,
                    this.memory,
                    0n,
                    values.byteLength,
                    0,
                    dataPtr,
                );
                memoryCopy(dataPtr.$, values);
                vkUnmapMemory(this.logicalDevice.handle, this.memory);
            }
        }
        else {

            this.upload(values);
        }
    }

    private createBuffer(
        size: number,
        usage: VkBufferUsageFlagBits,
        buffer: VkBuffer,
        memoryBuffer: VkDeviceMemory,
        propertyFlags: VkMemoryPropertyFlagBits = VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
            VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
    ) {
        let bufferInfo = new VkBufferCreateInfo();
        bufferInfo.size = size;
        bufferInfo.usage = usage;
        bufferInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        bufferInfo.queueFamilyIndexCount = 0;
        bufferInfo.pQueueFamilyIndices = null;

        let result = vkCreateBuffer(
            this.logicalDevice.handle,
            bufferInfo,
            null,
            buffer,
        );
        ASSERT_VK_RESULT(result);

        let memoryRequirements = new VkMemoryRequirements();
        vkGetBufferMemoryRequirements(
            this.logicalDevice.handle,
            buffer,
            memoryRequirements,
        );

        let memAllocInfo = new VkMemoryAllocateInfo();
        memAllocInfo.allocationSize = memoryRequirements.size;
        memAllocInfo.memoryTypeIndex = getMemoryTypeIndex(
            memoryRequirements.memoryTypeBits,
            propertyFlags,
            this.physicalDevice.handle,
        );

        result = vkAllocateMemory(
            this.logicalDevice.handle,
            memAllocInfo,
            null,
            memoryBuffer,
        );
        ASSERT_VK_RESULT(result);

        vkBindBufferMemory(
            this.logicalDevice.handle,
            buffer,
            memoryBuffer,
            0n,
        );
    }

    copyCommand(
        cmdPool: VkCommandPool,
        srcBuffer: VkCommandBuffer,
        dstBuffer: VkCommandBuffer,
        length: number,
    ) {
        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = cmdPool;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(
            this.logicalDevice.handle,
            cmdBufferAllocInfo,
            [cmdBuffer],
        );
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

        result = vkQueueSubmit(
            this.logicalDevice.handleQueue,
            1,
            [submitInfo],
            null,
        );
        ASSERT_VK_RESULT(result);

        vkQueueWaitIdle(this.logicalDevice.handleQueue);
    }

    isCreated: boolean = false;




    upload(values: Float32Array | Uint16Array | Uint8Array) {
        if (values.byteLength > 0) {
            if (
                this.currentBufferSize > 0 &&
                values.byteLength != this.currentBufferSize
            )
                throw new Error('Not same size');

            this.currentBufferSize = values.byteLength;

            //set values
            this.values = values;

            //create staging buffer
            this.createBuffer(
                values.byteLength,
                VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
                this.stagingBuffer,
                this.stagingBufferMemory,
                VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
                VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
            );

            //copy values
            let dataPtr = { $: 0n };
            vkMapMemory(
                this.logicalDevice.handle,
                this.stagingBufferMemory,
                0n,
                values.byteLength,
                0,
                dataPtr,
            );
            memoryCopy(dataPtr.$, values);
        }

        //create default buffer
        if (!this.isCreated) {
            this.createBuffer(
                values.byteLength,
                this.usage | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
                this.buffer,
                this.memory,
                VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT,
            );

        }

        //copy command buffer
        this.copyCommand(
            this.commandPool.handle,
            this.stagingBuffer,
            this.buffer,
            values.byteLength,
        );

        if (values.byteLength > 0) {
            this.freeStage();
        }

        this.isCreated = true;

    }

}
