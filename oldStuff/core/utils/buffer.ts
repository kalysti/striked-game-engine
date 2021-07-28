import { vkAllocateCommandBuffers,  vkAllocateMemory, vkBeginCommandBuffer, vkBindBufferMemory, VkBuffer, VkBufferCopy, VkBufferCreateInfo, vkCmdCopyBuffer, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkCommandPool, vkCreateBuffer, VkDevice, VkDeviceMemory, vkEndCommandBuffer, vkGetBufferMemoryRequirements, vkGetPhysicalDeviceMemoryProperties, vkMapMemory, VkMemoryAllocateInfo, VkMemoryPropertyFlagBits, VkMemoryRequirements, VkPhysicalDevice, VkPhysicalDeviceMemoryProperties, VkQueue, vkQueueSubmit, vkQueueWaitIdle, VkSubmitInfo, vkUnmapMemory, VK_BUFFER_USAGE_TRANSFER_DST_BIT, VK_BUFFER_USAGE_TRANSFER_SRC_BIT, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT, VK_SHARING_MODE_EXCLUSIVE, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";

const { platform } = process;
const nvk = require("vulkan-api/generated/1.2.162/win32/build/Release/addon-" + platform + ".node");
const getAddressFromArrayBuffer = nvk.getAddressFromArrayBuffer;
const getArrayBufferFromAddress = nvk.getArrayBufferFromAddress;

export const BI0 = BigInt(0);
export const BI4 = BigInt(4);
export const BI8 = BigInt(8);

export class ArrayBufferExt extends ArrayBuffer{
    
    static fromAddress(address: bigint, byteLength: number) {
        return getArrayBufferFromAddress(address, BigInt(byteLength));
    }
    static getAddress() {
        return getAddressFromArrayBuffer(this);
    }
}

export function memoryCopy(dstPtr: bigint, srcData: { buffer: any; }, byteLen: number) {
    let dstBuffer = ArrayBufferExt.fromAddress(dstPtr, byteLen);
    let srcBuffer = srcData.buffer;
    let dstView = new Uint8Array(dstBuffer);
    let srcView = new Uint8Array(srcBuffer);
    for (let ii = 0; ii < byteLen; ++ii) dstView[ii] = srcView[ii];
};

export interface createBufferInterface {
    size: any;
    usage: any;
    buffer: any;
    bufferMemory: any;
    propertyFlags: any;
}

export function createBuffer(opts: createBufferInterface, device: VkDevice, physicalDevice: VkPhysicalDevice) {
    let {
        size,
        usage,
        buffer,
        bufferMemory,
        propertyFlags
    } = opts;

    let bufferInfo = new VkBufferCreateInfo();
    bufferInfo.size = size;
    bufferInfo.usage = usage;
    bufferInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
    bufferInfo.queueFamilyIndexCount = 0;
    bufferInfo.pQueueFamilyIndices = null;

    let result = vkCreateBuffer(device, bufferInfo, null, buffer);

    if (result !== VK_SUCCESS)
        throw new Error(`Vulkan assertion failed!`);

    let memoryRequirements = new VkMemoryRequirements();
    vkGetBufferMemoryRequirements(device, buffer, memoryRequirements);

    let memAllocInfo = new VkMemoryAllocateInfo();
    memAllocInfo.allocationSize = memoryRequirements.size;
    memAllocInfo.memoryTypeIndex = getMemoryTypeIndex(memoryRequirements.memoryTypeBits, propertyFlags, physicalDevice);

    let resultAlloc = vkAllocateMemory(device, memAllocInfo, null, bufferMemory);

    if (resultAlloc !== VK_SUCCESS)
        throw new Error(`Vulkan assertion failed!`);

    vkBindBufferMemory(device, buffer, bufferMemory, 0n);
};

export interface copyBufferOpts {
    srcBuffer: any;
    dstBuffer: any;
    byteLength: any;
}

export function copyBuffer(opts: copyBufferOpts, device: VkDevice, cmdPool: VkCommandPool, queue: VkQueue) {
    let {
        srcBuffer,
        dstBuffer,
        byteLength
    } = opts;

    let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
    cmdBufferAllocInfo.commandPool = cmdPool;
    cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
    cmdBufferAllocInfo.commandBufferCount = 1;

    let cmdBuffer = new VkCommandBuffer();
    let result = vkAllocateCommandBuffers(device, cmdBufferAllocInfo, [cmdBuffer]);

    if (result !== VK_SUCCESS)
        throw new Error(`Vulkan assertion failed!`);

    let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
    cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
    cmdBufferBeginInfo.pInheritanceInfo = null;

    let resultBegin = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
    if (resultBegin !== VK_SUCCESS)
        throw new Error(`Vulkan assertion failed!`);

    let bufferCopy = new VkBufferCopy();
    bufferCopy.srcOffset = 0n;
    bufferCopy.dstOffset = 0n;
    bufferCopy.size = byteLength;

    vkCmdCopyBuffer(cmdBuffer, srcBuffer, dstBuffer, 1, [bufferCopy]);

    let resultCopy = vkEndCommandBuffer(cmdBuffer);
    if (resultCopy !== VK_SUCCESS)
        throw new Error(`Vulkan assertion failed!`);

    let submitInfo = new VkSubmitInfo();
    submitInfo.commandBufferCount = 1;
    submitInfo.pCommandBuffers = [cmdBuffer];

    let resultSubmit = vkQueueSubmit(queue, 1, [submitInfo], null);
    if (resultSubmit !== VK_SUCCESS)
        throw new Error(`Vulkan assertion failed!`);

    vkQueueWaitIdle(queue);
};
export interface uploadBufferOps {
    data: any;
    usage: any;
    buffer: any;
    bufferMemory: any;
}
export function uploadBufferData(opts: uploadBufferOps, device: VkDevice, physicalDevice: VkPhysicalDevice, cpool: VkCommandPool, queue: VkQueue) {
    let {
        data,
        usage,
        buffer,
        bufferMemory
    } = opts;

    let size = data.byteLength;

    let stagingBuffer = new VkBuffer();
    let stagingBufferMemory = new VkDeviceMemory();

    createBuffer({
        size: size,
        usage: VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
        buffer: stagingBuffer,
        bufferMemory: stagingBufferMemory,
        propertyFlags: VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
    }, device, physicalDevice);

    let dataPtr = { $: 0n };
    vkMapMemory(device, stagingBufferMemory, 0n, size, 0, dataPtr);
    memoryCopy(dataPtr.$, data, size);
    vkUnmapMemory(device, stagingBufferMemory);

    createBuffer({
        size: size,
        usage: usage | VK_BUFFER_USAGE_TRANSFER_DST_BIT,
        buffer: buffer,
        bufferMemory: bufferMemory,
        propertyFlags: VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
    }, device, physicalDevice);

    copyBuffer({
        srcBuffer: stagingBuffer,
        dstBuffer: buffer,
        byteLength: size
    }, device, cpool, queue);
};

export function getMemoryTypeIndex(typeFilter: number, propertyFlag: number | VkMemoryPropertyFlagBits, physicalDevice: VkPhysicalDevice) {
    let memoryProperties = new VkPhysicalDeviceMemoryProperties();
    vkGetPhysicalDeviceMemoryProperties(physicalDevice, memoryProperties);
    if (memoryProperties.memoryTypes != null) {
        for (let ii = 0; ii < memoryProperties.memoryTypeCount; ++ii) {
            if (
                (typeFilter & (1 << ii)) &&
                (memoryProperties.memoryTypes[ii].propertyFlags & propertyFlag) === propertyFlag
            ) {
                return ii;
            }
        };
    }
    return -1;
};