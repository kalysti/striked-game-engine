import { VkDeviceQueueCreateInfo, vkGetDeviceQueue, VkQueue, VkQueueFlagBits, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";


export class QueueFamily {

    private _index: number;
    private _queueCount: number;
    private _type: VkQueueFlagBits;
    private _priorities: Float32Array = new Float32Array();
    private _device: Device | null = null;
    private _queues: VkQueue[] | null = null;

    get index(){
        return this._index;
    } 
    
    get type(){
        return this._type;
    }

    get device(){
        return this._device;
    }

    get queues() : VkQueue[] | null
    {
        return this._queues;
    }

    constructor(index: number, queueCount: number, type: VkQueueFlagBits) {
        this._index = index;
        this._queueCount = queueCount;
        this._type = type;

        let numbers = [];
        for (let i = 0; i < queueCount; i++) {
            numbers.push(1.0 / queueCount);
        }
        this._priorities = new Float32Array(numbers);
    }

    get QueueCreateInfo(): VkDeviceQueueCreateInfo {
        let info = new VkDeviceQueueCreateInfo();
     //   info.sType = VkStructureType.VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO;
        info.queueCount = this._queueCount;
        info.queueFamilyIndex = this._index;
        info.pQueuePriorities = this._priorities;

        return info;
    }

    public GetQueuesFromDevice(device: Device) 
    {
        this._device = device;
        
        if (this._queues != null)
            throw new Error("queues are already setup");

        this._queues = [];
        for (let i = 0; i < this._queueCount; i++) {
            let queue = new VkQueue();
            vkGetDeviceQueue(
                device.handle,
                this._index,
                i,
                queue
            );
            this._queues.push(queue);
        }
    }
}