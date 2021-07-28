import { Console, warn } from "console";
import { vkAllocateMemory, vkBindBufferMemory, VkBuffer, VkBufferCreateInfo, VkBufferUsageFlagBits, vkCreateBuffer, vkDestroyBuffer, VkDevice, VkDeviceMemory, vkFreeMemory, vkGetBufferMemoryRequirements, vkMapMemory, VkMemoryAllocateInfo, VkMemoryPropertyFlagBits, VkMemoryRequirements, VkResult, VkSharingMode, VkStructureType, vkUnmapMemory } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";
import { v4 as uuidv4 } from 'uuid';

const { platform } = process;
const nvk = require("vulkan-api/generated/1.2.162/win32/build/Release/addon-" + platform + ".node");
const getAddressFromArrayBuffer = nvk.getAddressFromArrayBuffer;
const getArrayBufferFromAddress = nvk.getArrayBufferFromAddress;

export const BI0 = BigInt(0);
export const BI4 = BigInt(4);
export const BI8 = BigInt(8);

export class ArrayBufferExt extends ArrayBuffer {

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

export class VulkanBuffer {

    private _id: string = "";

    private _size: number;
    private _device: Device | null = null;
    private _bufferUsage: VkBufferUsageFlagBits;
    private _memoryProperty: VkMemoryPropertyFlagBits;
    private _memoryRequirements: VkMemoryRequirements;
    private _memoryHandle: VkDeviceMemory | null = null;
    private _handle: VkBuffer | null = new VkBuffer;

    get id() {
        return this._id;
    }
    public get size(): number {
        return this._size;
    }

    public get handle(): VkBuffer | null {
        return this._handle;
    }

    public GetMemoryRequirements(
        device: VkDevice,
        buffer: VkBuffer
    ): VkMemoryRequirements {
        let memoryRequirements = new VkMemoryRequirements();;
        vkGetBufferMemoryRequirements(
            device,
            buffer,
            memoryRequirements
        );
        return memoryRequirements;
    }

    constructor(
        device: Device,
        size: number,
        bufferUsageFlags: VkBufferUsageFlagBits,
        memoryProperty: VkMemoryPropertyFlagBits
    ) {
        
        if (size == 0)
            throw new Error("cannot create buffer with size of zero bytes");
            this._id = uuidv4();

        //make sure buffer supports transfer data to and from buffer
        if ((bufferUsageFlags & VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_SRC_BIT) == 0)
            bufferUsageFlags |= VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_SRC_BIT;
        if ((bufferUsageFlags & VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT) == 0)
            bufferUsageFlags |= VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT;

        //store parameter information
        this._size = size;
        this._device = device;
        this._bufferUsage = bufferUsageFlags;
        this._memoryProperty = memoryProperty;

        var queueFamilyIndices: number[] = [];
        for (let queueFamily of device.QueueFamilies)
            queueFamilyIndices.push(queueFamily.index);

        //buffer create info
        var bufferCreateInfo = new VkBufferCreateInfo();
        //bufferCreateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_BUFFER_CREATE_INFO;
        bufferCreateInfo.usage = bufferUsageFlags;
        bufferCreateInfo.size = size;
        bufferCreateInfo.sharingMode = VkSharingMode.VK_SHARING_MODE_CONCURRENT;
        bufferCreateInfo.queueFamilyIndexCount = queueFamilyIndices.length;
        bufferCreateInfo.pQueueFamilyIndices = new Uint32Array(queueFamilyIndices);

        //setup buffer handler
        this._handle = new VkBuffer();
        if (vkCreateBuffer(
            this._device.handle,
            bufferCreateInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create vulkan buffer handle");

        if (this._device == null || this._device.handle == null)
            throw new Error("No device for given buffer.");

        //memory allocation info
        this._memoryRequirements = this.GetMemoryRequirements(this._device.handle, this._handle);

        var memoryAllocateInfo = new VkMemoryAllocateInfo();
       // memoryAllocateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_MEMORY_ALLOCATE_INFO;
        memoryAllocateInfo.allocationSize = this._memoryRequirements.size;
        memoryAllocateInfo.memoryTypeIndex = device.getMemoryTypeIndex(
            this._memoryRequirements.memoryTypeBits,
            this._memoryProperty,
            this._device._physicalDevice
        );

        //setup device memory
        this._memoryHandle = new VkDeviceMemory();
        if (vkAllocateMemory(
            this._device.handle,
            memoryAllocateInfo,
            null,
            this._memoryHandle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to allocat device memory");

        //bind buffer handle with device memory
        if (vkBindBufferMemory(
            this._device.handle,
            this._handle,
            this._memoryHandle,
            0
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to bind buffer handler to device memory");
    }

    destroy() {
        if (this._handle != null && this._device != null) {
            vkDestroyBuffer(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
        if (this._memoryHandle != null && this._device != null) {
            vkFreeMemory(
                this._device.handle,
                this._memoryHandle,
                null
            );
            this._memoryHandle = null;
        }
    }

    public SetData(buffer: Float32Array, size: number) {

        if (size == 0) {
            warn("[WARNING]: cannot set buffer data with zero bytes");
            return;
        }
        if (size > this._size) {
            warn("[WARNING]: new data size is bigger than buffer size");
            return;
        }

        if (this._device == null)
            throw new Error("No device given for setdata");

        // upload
        let mappedMemory = { $: 0n };

        if (vkMapMemory(
            this._device.handle,
            this._memoryHandle,
            0n,
            buffer.byteLength,
            0,
            mappedMemory
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to map device memory");

        //todo mby needs to swap
        memoryCopy(mappedMemory.$, buffer, buffer.byteLength);
        vkUnmapMemory(this._device.handle, this._memoryHandle);
    }
    /*
        public GetData() {
         //   var data = Marshal.AllocHGlobal(Convert.ToInt32(this._size));
    
            if (this._device == null)
            throw new Error("No device given for setdata");
    
            let mappedMemory = { $: 0n };
    
            if (vkMapMemory(
                this._device.handle,
                this._memoryHandle,
                0,
                this._size,
                0,
                mappedMemory
            ) != VkResult.VK_SUCCESS)
                throw new Error("failed to map device memory");
    
            System.Buffer.MemoryCopy(
                mappedMemory.ToPointer(),
                data.ToPointer(),
                this._size
            );
    
            vkUnmapMemory(_device.Handle, _memoryHandle);
            return data;
        }
        */
    /*
    public unsafe void SetData<T>(T[] data) where T: struct
        => SetData(
            new IntPtr(Unsafe.AsPointer<T>(ref data[0])),
            Unsafe.SizeOf<T>() * data.Length
        );
    public unsafe T[] GetData<T>() where T: struct
{
    var elementSize = Unsafe.SizeOf<T>();
    var data = new T[_size / elementSize];
    var ptr = GetData();
    for (int i = 0; i < data.Length; i++)
    {
        data[i] = Unsafe.Read<T>(
            IntPtr.Add(ptr, i * elementSize).ToPointer()
        );
    }
    Marshal.FreeHGlobal(ptr);
    return data;
}*/
}