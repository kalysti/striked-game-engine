import { vkCreateFramebuffer, vkDestroyFramebuffer, VkFramebuffer, VkFramebufferCreateInfo, VulkanWindow } from 'vulkan-api';
import { Texture2D } from '../resources/2d/Texture2D';
import { ASSERT_VK_RESULT } from '../utils/helpers';
import { LogicalDevice } from './logical.device';
import { RenderElement } from './render.element';
import { RenderPass } from './renderpass';
import { Swapchain } from './swapchain';

export class Framebuffer extends RenderElement {

    private swapChain: Swapchain;
    private window: VulkanWindow;
    private renderPass: RenderPass;
    private framebuffers: VkFramebuffer[] = [];
    depthTexture: Texture2D;

    get handleBuffers() {
        return this.framebuffers;
    }

    protected onDestroy() {
        for (let ii = 0; ii < this.swapChain.imageCount; ++ii) {
            vkDestroyFramebuffer(this.device.handle, this.framebuffers[ii], null);
        };
        this.framebuffers = [];
    }


    protected onCreate() {
        let fbs = [...Array(this.swapChain.imageCount)].map(() => new VkFramebuffer());
        for (let ii = 0; ii < this.swapChain.imageCount; ++ii) {

            let attachments = [this.swapChain.views[ii] , this.depthTexture.imageView];
            let framebufferInfo = new VkFramebufferCreateInfo();
            framebufferInfo.renderPass = this.renderPass.handle;
            framebufferInfo.attachmentCount = attachments.length;
            
            framebufferInfo.pAttachments = attachments;
            framebufferInfo.width = this.window.width;
            framebufferInfo.height = this.window.height;
            framebufferInfo.layers = 1;
            let result = vkCreateFramebuffer(this.device.handle, framebufferInfo, null, fbs[ii]);
            ASSERT_VK_RESULT(result);
        };

        this.framebuffers = fbs;
    }

    constructor(device: LogicalDevice, swapChain: Swapchain, renderPass: RenderPass, window: VulkanWindow, depthTexture: Texture2D) {

        super(device);
        this.swapChain = swapChain;
        this.window = window;
        this.renderPass = renderPass;
        this.depthTexture = depthTexture;

        this.create();
    }
}