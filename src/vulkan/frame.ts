import { ASSERT_VK_RESULT } from "../test.helpers";
import { vkAcquireNextImageKHR, vkCreateSemaphore, VkDevice, VkPresentInfoKHR, vkQueuePresentKHR, vkQueueSubmit, vkQueueWaitIdle, VkSemaphore, VkSemaphoreCreateInfo, VkSubmitInfo, VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT, VkSwapchainKHR } from 'vulkan-api';
import { LogicalDevice } from './logical.device';
import { CommandBuffer } from "./command.buffers";

export class Frame {

    private semaphoreImageAvailable: VkSemaphore = new VkSemaphore();
    private semaphoreRenderingAvailable: VkSemaphore = new VkSemaphore();
    private device: LogicalDevice;
    private swapchain: VkSwapchainKHR;
    private commandBuffers: CommandBuffer;

    constructor(device: LogicalDevice, swapchain: VkSwapchainKHR, commandBuffers: CommandBuffer) {
        this.device = device;
        this.swapchain = swapchain;
        this.commandBuffers = commandBuffers;
        let semaphoreInfo = new VkSemaphoreCreateInfo();

        let result = vkCreateSemaphore(this.device.handle, semaphoreInfo, null, this.semaphoreImageAvailable);
        ASSERT_VK_RESULT(result);
        result = vkCreateSemaphore(this.device.handle, semaphoreInfo, null, this.semaphoreRenderingAvailable);
        ASSERT_VK_RESULT(result);
    }

    draw() {

        let imageIndex = { $: 0 };
        vkAcquireNextImageKHR(this.device.handle, this.swapchain, Number.MAX_SAFE_INTEGER, this.semaphoreImageAvailable, null, imageIndex);

        let waitStageMask = new Int32Array([
            VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT
        ]);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 1;
        submitInfo.pWaitSemaphores = [this.semaphoreImageAvailable];
        submitInfo.pWaitDstStageMask = waitStageMask;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [this.commandBuffers.buffers[imageIndex.$]];
        submitInfo.signalSemaphoreCount = 1;
        submitInfo.pSignalSemaphores = [this.semaphoreRenderingAvailable];

        let result = vkQueueSubmit(this.device.handleQueue, 1, [submitInfo], null);
        ASSERT_VK_RESULT(result);

        let presentInfo = new VkPresentInfoKHR();
        presentInfo.waitSemaphoreCount = 1;
        presentInfo.pWaitSemaphores = [this.semaphoreRenderingAvailable];
        presentInfo.swapchainCount = 1;
        presentInfo.pSwapchains = [this.swapchain];
        presentInfo.pImageIndices = new Uint32Array([imageIndex.$]);
        presentInfo.pResults = null;

        result = vkQueuePresentKHR(this.device.handleQueue, presentInfo);
        ASSERT_VK_RESULT(result);

        ASSERT_VK_RESULT(vkQueueWaitIdle(this.device.handleQueue));
    };
}