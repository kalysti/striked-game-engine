import { VkDevice, vkGetDeviceQueue, VkPhysicalDevice, VkQueue } from "vulkan-api";

export class DeviceQueue{

    private queue: VkQueue = new VkQueue();

    get handle(){
        return this.queue;
    }
    constructor(device: VkDevice)
    {
        vkGetDeviceQueue(device, 0, 0, this.queue);
    }
}