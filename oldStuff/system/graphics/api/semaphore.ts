import { vkCreateSemaphore, vkDestroySemaphore, VkResult, VkSemaphore, VkSemaphoreCreateInfo, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";

export class Semaphore {

    private _device: Device;
    handle: VkSemaphore | null = null;

    get device(): Device {
        return this._device;
    }

    constructor(device: Device) {
        this._device = device;
        var createInfo = new VkSemaphoreCreateInfo();
        //createInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;

        this.handle = new VkSemaphore();
        if (vkCreateSemaphore(
            this._device.handle,
            createInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create semaphore");
    }
    
    Destroy() {
        if (this.handle != null && this._device != null) {
            vkDestroySemaphore(
                this._device.handle,
                this.handle,
                null
            );
            this.handle = null;
        }
    }
}
