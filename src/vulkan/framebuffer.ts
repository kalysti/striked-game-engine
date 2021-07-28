import { ASSERT_VK_RESULT } from '../test.helpers';
import { vkCreateFramebuffer, VkDevice, VkFramebuffer, VkFramebufferCreateInfo, VulkanWindow, VkImageView, VkImage } from 'vulkan-api';
import { Swapchain } from './swapchain';
import { RenderPass } from './renderpass';
import { Texture2D } from '../resources/Texture2D';

export class Framebuffer {

    private swapChain: Swapchain;
    private window: VulkanWindow;
    private renderPass: RenderPass;
    private device: VkDevice;
    private framebuffers: VkFramebuffer[] = [];
    depthTexture: Texture2D;

    get handleBuffers() {
        return this.framebuffers;
    }



    constructor(device: VkDevice, swapChain: Swapchain, renderPass: RenderPass, window: VulkanWindow, depthTexture: Texture2D) {
        this.swapChain = swapChain;
        this.window = window;
        this.renderPass = renderPass;
        this.device = device;
        this.depthTexture = depthTexture;

        this.createFrameBuffers();
    }

    createFrameBuffers() {
        let fbs = [...Array(this.swapChain.imageCount)].map(() => new VkFramebuffer());
        for (let ii = 0; ii < this.swapChain.imageCount; ++ii) {
            let framebufferInfo = new VkFramebufferCreateInfo();
            framebufferInfo.renderPass = this.renderPass.handle;
            framebufferInfo.attachmentCount = 2;
            framebufferInfo.pAttachments = [this.swapChain.views[ii], this.depthTexture.imageView];
            framebufferInfo.width = this.window.width;
            framebufferInfo.height = this.window.height;
            framebufferInfo.layers = 1;
            let result = vkCreateFramebuffer(this.device, framebufferInfo, null, fbs[ii]);
            ASSERT_VK_RESULT(result);
        };

        this.framebuffers = fbs;
    }
}