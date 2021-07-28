import { VkCommandPool, VkCommandPoolCreateFlagBits, VkCommandPoolCreateInfo, vkCreateCommandPool, vkDestroyCommandPool, VkResult, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";
import { QueueFamily } from "./queue-family";

export class CommandPool {

    private _queueFamily: QueueFamily;
    private _device: Device;
    handle: VkCommandPool | null = null;

    get device(): Device{
        return this._device;
    }

    get QueueFamily(): QueueFamily {
        return this._queueFamily;
    }

    constructor(queueFamily: QueueFamily) {
        this._queueFamily = queueFamily;

        if (queueFamily.device == null)
            throw Error("No device found");
        this._device = queueFamily.device;

        var createInfo = new VkCommandPoolCreateInfo();
       // createInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO;
        createInfo.flags = VkCommandPoolCreateFlagBits.VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT;
        createInfo.queueFamilyIndex = queueFamily.index;

        if (queueFamily.device == null) {
            throw new Error("Cant find queue family device");
        }

        this.handle = new VkCommandPool();

        if (vkCreateCommandPool(
            queueFamily.device?.handle,
            createInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create command pool on device");

    }
    destroy() {
        if (this.handle != null && this._queueFamily.device != null) {
            vkDestroyCommandPool(
                this._queueFamily.device.handle,
                this.handle,
                null
            );

            this.handle = null;
        }
    }
}
