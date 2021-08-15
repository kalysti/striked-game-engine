import {
    vkAllocateCommandBuffers, VkCommandBuffer,
    VkCommandBufferAllocateInfo, vkFreeCommandBuffers, VK_COMMAND_BUFFER_LEVEL_PRIMARY
} from 'vulkan-api';
import { ASSERT_VK_RESULT } from '../utils/helpers';
import { CommandPool } from './command.pool';
import { Framebuffer } from './framebuffer';
import { LogicalDevice } from './logical.device';
import { Pipeline } from './pipeline';
import { RenderElement } from './render.element';
import { RenderPass } from './renderpass';
import { Swapchain } from './swapchain';

export class CommandBuffer extends RenderElement {
    private pool: CommandPool;

    private swapChain: Swapchain;
    private framebuffer: Framebuffer;
    private renderPass: RenderPass;
    private pipeline: Pipeline;
     cmdBuffers: VkCommandBuffer[] = [];

    get buffers() {
        return this.cmdBuffers;
    }

    constructor(device: LogicalDevice, swapChain: Swapchain, pool: CommandPool, renderPass: RenderPass, framebuffer: Framebuffer, pipeline: Pipeline) {
        super(device);
        this.swapChain = swapChain;
        this.pool = pool;
        this.renderPass = renderPass;
        this.framebuffer = framebuffer;
        this.pipeline = pipeline;

        this.create();
    }

    protected onDestroy() {
        vkFreeCommandBuffers(this.device.handle, this.pool.handle, this.swapChain.imageCount, this.cmdBuffers);
        this.cmdBuffers = [];
    }

    protected onCreate() {
        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this.pool.handle;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = this.swapChain.imageCount;

        let cmdBuffers = [...Array(this.swapChain.imageCount)].map(() => new VkCommandBuffer());

        let result = vkAllocateCommandBuffers(this.device.handle, cmdBufferAllocInfo, cmdBuffers);
        ASSERT_VK_RESULT(result);

        this.cmdBuffers = cmdBuffers;
    }

  
}
