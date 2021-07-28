import { vkCreateFence, vkDestroyFence, VkFence, VkFenceCreateFlagBits, VkFenceCreateInfo, vkGetFenceStatus, vkResetFences, VkResult, VkStructureType, vkWaitForFences } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";

export class Fence {
    private _handle: VkFence | null = null;
    private _device: Device;

    get handle(): VkFence | null {
        return this._handle;
    }

    constructor(device: Device, isSignaled: boolean = false) {
        this._device = device;

        var createInfo = new VkFenceCreateInfo();
        //   createInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_FENCE_CREATE_INFO;
        createInfo.flags = (
            isSignaled ?
                VkFenceCreateFlagBits.VK_FENCE_CREATE_SIGNALED_BIT :
                0
        );

        this._handle = new VkFence();
        if (vkCreateFence(
            this._device.handle,
            createInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create fence");
    }

    public destroy() {
        if (this._handle != null && this._device != null) {
            vkDestroyFence(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
    }

    public isSignaled(): boolean {
        if (this._device == null || this._handle == null)
            return false;

        return (vkGetFenceStatus(this._device.handle, this._handle) == VkResult.VK_SUCCESS);
    }


    public Wait(timeout: number = Number.MAX_VALUE) {
        if (this._handle == null || this._device == null)
            throw new Error("failed to wait on a fence");
        var fence = this._handle;
        if (vkWaitForFences(
            this._device.handle,
            1,
            [fence],
            true,
            18446744073709551615n
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to wait on a fence");
    }

    public Reset() {
        if (this._handle != null) {
            var fence = this._handle;
            if (vkResetFences(
                this._device.handle,
                1,
                [fence]
            ) != VkResult.VK_SUCCESS)
                throw new Error("failed to reset fence");
        }
    }
}