'use strict';

import { vkCreateSemaphore, VkSemaphore, VkSemaphoreCreateInfo, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";
import { LogicalDevice } from "./logical-device";

export class CreateSema {

    private sema: VkSemaphoreCreateInfo = new VkSemaphoreCreateInfo();
    public semaphoreImageAvailable: VkSemaphore = new VkSemaphore();
    public semaphoreRenderingDone: VkSemaphore = new VkSemaphore();


    getSema(): VkSemaphoreCreateInfo {
        return this.sema;
    }

    create(_device: LogicalDevice) {

        let result = vkCreateSemaphore(_device.getDevice(), this.sema, null, this.semaphoreImageAvailable);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let resultDone = vkCreateSemaphore(_device.getDevice(), this.sema, null, this.semaphoreRenderingDone);

        if (resultDone !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }
}