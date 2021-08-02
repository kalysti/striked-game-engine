import { vkAllocateCommandBuffers, vkBeginCommandBuffer, VkClearValue, vkCmdBeginRenderPass, vkCmdBindDescriptorSets, vkCmdBindIndexBuffer, vkCmdBindPipeline, vkCmdBindVertexBuffers, vkCmdDraw, vkCmdDrawIndexed, vkCmdEndRenderPass, vkCmdSetScissor, vkCmdSetViewport, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkCommandPool, vkEndCommandBuffer, VkExtent2D, vkFreeCommandBuffers, VkOffset2D, VkRect2D, VkRenderPass, VkRenderPassBeginInfo, VkViewport, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT, VK_INDEX_TYPE_UINT16, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_SUBPASS_CONTENTS_INLINE } from 'vulkan-api';
import { VkClearColorValue, VkClearDepthStencilValue } from 'vulkan-api/generated/1.2.162/win32';
import { Geometry } from '../resources/core/Geometry';
import { Mesh3D } from '../resources/3d/Mesh3D';
import { ProSky } from '../resources/ProSky';
import { UI } from '../resources/ui';
import { ASSERT_VK_RESULT } from '../utils/helpers';
import { CommandPool } from './command.pool';
import { Framebuffer } from './framebuffer';
import { LogicalDevice } from './logical.device';
import { Pipeline } from './pipeline';
import { Swapchain } from './swapchain';
import { RenderPass } from './renderpass';
import { RenderElement } from './render.element';
import { Primitive2D } from '../resources/2d/Primitive2D';
import { Text } from '../resources/2d/Text';

export class CommandBuffer extends RenderElement {
    private pool: CommandPool;

    private swapChain: Swapchain;
    private framebuffer: Framebuffer;
    private renderPass: RenderPass;
    private pipeline: Pipeline;
    private cmdBuffers: VkCommandBuffer[] = [];

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
          //  clearValue.color.float32 = [0, 0,0, 1];

            let depthClearValue = new VkClearValue();

            depthClearValue.depthStencil = new VkClearDepthStencilValue();
            depthClearValue.depthStencil.depth = 1.0;
            depthClearValue.depthStencil.stencil = 0.0;

            let renderPassBeginInfo = new VkRenderPassBeginInfo();
            renderPassBeginInfo.renderPass = this.renderPass.handle;
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


                    let pipe = this.pipeline.pipelineList.get(pipeName);
                    let layout = this.pipeline.pipelineLayouts.get(pipeName);

                    vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipe);

                    if (mesh instanceof Mesh3D) {
                        let vertexBuffer = (mesh as Mesh3D).vertexBuffer;
                        let indexBuffer = (mesh as Mesh3D).indexBuffer;

                        vkCmdBindVertexBuffers(cmdBuffer, 0, 1, [vertexBuffer.handle], new BigUint64Array([0n]));
                        vkCmdBindIndexBuffer(cmdBuffer, indexBuffer.buffer, 0n, VK_INDEX_TYPE_UINT16);
                    }
                    else if (mesh instanceof ProSky) {
                        let vertexBuffer = (mesh as ProSky).vertexBuffer;
                        let indexBuffer = (mesh as ProSky).indexBuffer;

                        vkCmdBindVertexBuffers(cmdBuffer, 0, 1, [vertexBuffer.handle], new BigUint64Array([0n]));
                        vkCmdBindIndexBuffer(cmdBuffer, indexBuffer.buffer, 0n, VK_INDEX_TYPE_UINT16);
                    }

                    else if (mesh instanceof Primitive2D) {
                        let vertexBuffer = (mesh as Primitive2D).vertexBuffer;
                        console.log("bind primitives vertex");

                        vkCmdBindVertexBuffers(cmdBuffer, 0, 1, [vertexBuffer.handle], new BigUint64Array([0n]));
                        vkCmdBindVertexBuffers(cmdBuffer, 1, 1, [vertexBuffer.handle], new BigUint64Array([0n]));
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

                    if (mesh instanceof Mesh3D) {
                        let indexBuffer = (mesh as Mesh3D).indexBuffer;
                        vkCmdDrawIndexed(cmdBuffer, indexBuffer.values.length, 1, 0, 0, 0);
                    }
                    else if (mesh instanceof ProSky) {
                        let indexBuffer = (mesh as ProSky).indexBuffer;
                        vkCmdDrawIndexed(cmdBuffer, indexBuffer.values.length, 1, 0, 0, 0);
                    }
                    else if (mesh instanceof UI) {
                        vkCmdDraw(cmdBuffer, 3, 1, 0, 0);
                    }
                    else if (mesh instanceof Text) {
                        let vertices = (mesh as Text).data.vertices.length;
                        let letters = (mesh as Text).numLetters;

                        for (let j = 0; j < letters; j++)
                        {
                            vkCmdDraw(cmdBuffer, 4, 1, j * 4, 0);
                        }
                    }
                    else if (mesh instanceof Primitive2D) {
                        let vertices = (mesh as Primitive2D).data.vertices.length;
                        console.log("vcount: " + vertices);
                        vkCmdDraw(cmdBuffer, vertices, 1, 0, 0);
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