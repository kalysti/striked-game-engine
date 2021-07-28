import { vkAllocateCommandBuffers, vkBeginCommandBuffer, VkClearValue, vkCmdBeginRenderPass, vkCmdBindDescriptorSets, vkCmdBindIndexBuffer, vkCmdBindPipeline, vkCmdBindVertexBuffers, vkCmdDraw, vkCmdDrawIndexed, vkCmdEndRenderPass, vkCmdSetScissor, vkCmdSetViewport, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkCommandPool, vkEndCommandBuffer, VkExtent2D, VkOffset2D, VkRect2D, VkRenderPass, VkRenderPassBeginInfo, VkViewport, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT, VK_INDEX_TYPE_UINT16, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_SUBPASS_CONTENTS_INLINE } from 'vulkan-api';
import { VkClearColorValue, VkClearDepthStencilValue } from 'vulkan-api/generated/1.2.162/win32';
import { Geometry } from '../resources/Geometry';
import { Mesh } from '../resources/Mesh';
import { ASSERT_VK_RESULT } from '../test.helpers';
import { Framebuffer } from './framebuffer';
import { LogicalDevice } from './logical.device';
import { Pipeline } from './pipeline';
import { Swapchain } from './swapchain';
export class CommandBuffer {
    private pool: VkCommandPool = new VkCommandPool();

    private swapChain: Swapchain;
    private device: LogicalDevice;
    private framebuffer: Framebuffer;
    private renderPass: VkRenderPass;
    private pipeline: Pipeline;
    private cmdBuffers: VkCommandBuffer[] = [];

    get buffers() {
        return this.cmdBuffers;
    }

    constructor(device: LogicalDevice, swapChain: Swapchain, pool: VkCommandPool, renderPass: VkRenderPass, framebuffer: Framebuffer, pipeline: Pipeline) {
        this.swapChain = swapChain;
        this.device = device;
        this.pool = pool;
        this.renderPass = renderPass;
        this.framebuffer = framebuffer;
        this.pipeline = pipeline;

        this.allocateBuffers();

    }

    allocateBuffers() {
        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this.pool;
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = this.swapChain.imageCount;

        let cmdBuffers = [...Array(this.swapChain.imageCount)].map(() => new VkCommandBuffer());

        let result = vkAllocateCommandBuffers(this.device.handle, cmdBufferAllocInfo, cmdBuffers);
        ASSERT_VK_RESULT(result);

        this.cmdBuffers = cmdBuffers;
    }

    bindBuffer(meshes: Geometry[], screenWidth: number, screenHeight: number) {

        for (let ii = 0; ii < this.cmdBuffers.length; ++ii) {
            let cmdBuffer = this.cmdBuffers[ii];

            //begin command buffer
            let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
            cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;

            let result = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
            ASSERT_VK_RESULT(result);

            //begin render pass
            let clearValue = new VkClearValue();
            clearValue.color = new VkClearColorValue();
            clearValue.color.float32 = [0, 0, 0, 0];

            let depthClearValue = new VkClearValue();

            depthClearValue.depthStencil = new VkClearDepthStencilValue();
            depthClearValue.depthStencil.depth = 1.0;
            depthClearValue.depthStencil.stencil = 0.0;

            let renderPassBeginInfo = new VkRenderPassBeginInfo();
            renderPassBeginInfo.renderPass = this.renderPass;
            renderPassBeginInfo.framebuffer = this.framebuffer.handleBuffers[ii];
            renderPassBeginInfo.renderArea.offset.x = 0;
            renderPassBeginInfo.renderArea.offset.y = 0;
            renderPassBeginInfo.renderArea.extent.width = screenWidth;
            renderPassBeginInfo.renderArea.extent.height = screenHeight;
            renderPassBeginInfo.clearValueCount = 2;
            renderPassBeginInfo.pClearValues = [clearValue, depthClearValue];
            vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

            //draw meshes 
            for (let mesh of meshes) {


                for (let pipeName of mesh.pipelines) {

                    console.log(pipeName);

                    let pipe = this.pipeline.pipelineList.get(pipeName);
                    let layout = this.pipeline.pipelineLayouts.get(pipeName);

                    vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipe);

                    if (mesh instanceof Mesh) {
                        let vertexBuffer = (mesh as Mesh).vertexBuffer;
                        let indexBuffer = (mesh as Mesh).indexBuffer;

                        vkCmdBindVertexBuffers(cmdBuffer, 0, 1, [vertexBuffer.handle], new BigUint64Array([0n]));
                        vkCmdBindIndexBuffer(cmdBuffer, indexBuffer.buffer, 0n, VK_INDEX_TYPE_UINT16);
                    }

                    vkCmdBindDescriptorSets(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, layout, 0, 1, [mesh.descriptorSet], 0, null);


                    //set viewport
                    let viewport = new VkViewport();
                    viewport.x = 0;
                    viewport.y = 0;
                    viewport.width = screenWidth;
                    viewport.height = screenHeight;
                    viewport.minDepth = 0.0;
                    viewport.maxDepth = 1.0;
                    vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);

                    //set scissor
                    let scissorOffset = new VkOffset2D();
                    scissorOffset.x = 0;
                    scissorOffset.y = 0;

                    let scissorExtent = new VkExtent2D();
                    scissorExtent.width = screenWidth;
                    scissorExtent.height = screenHeight;

                    let scissor = new VkRect2D();
                    scissor.offset = scissorOffset;
                    scissor.extent = scissorExtent;
                    vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);

                    //draw it

                    if (mesh instanceof Mesh)
                    {
                        let indexBuffer = (mesh as Mesh).indexBuffer;
                        vkCmdDrawIndexed(cmdBuffer, indexBuffer.values.length, 1, 0, 0, 0);
                    }
                    else {
                        vkCmdDraw(cmdBuffer, 12, 1, 0, 0);
                    }
                }
            }

            //end render pass
            vkCmdEndRenderPass(cmdBuffer);

            //end command buffer
            result = vkEndCommandBuffer(cmdBuffer);
            ASSERT_VK_RESULT(result);
        }
    }
}