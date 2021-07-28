'use strict';

import { vkBeginCommandBuffer, vkCmdBindDescriptorSets, vkCmdBindIndexBuffer, vkCmdBindVertexBuffers, vkCmdDrawIndexed, vkCmdSetScissor, VkCommandBufferBeginInfo, vkEndCommandBuffer, VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT, VK_INDEX_TYPE_UINT16, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";
import { Cube } from "../objects/cube";
import { CommandBuffer } from "./command-buffer";
import { FrameBuffer } from "./frame-buffer";
import { GraphicsPipelineBase } from "./graphics-pipeline-base";
import { Renderer } from "./renderer";
import { SwapchainImageView } from "./swapchain-imageview";

export class RecordCommand {

    create(_instance: Renderer, cube: Cube, _framebuffer: FrameBuffer, _cmdbuffer: CommandBuffer, swapchainview: SwapchainImageView, graphicPipline: GraphicsPipelineBase) {

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;
        for (let ii = 0; ii < swapchainview.getCount(); ++ii) {

            //begin command buffer
            let cmdBuffer = _cmdbuffer.cmdBuffers[ii];
            let resultCommand = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
            if (resultCommand !== VK_SUCCESS)
                throw new Error(`Vulkan assertion failed!`);


            let frameBuffer = _framebuffer.framebuffers[ii];

            //create area
            let area = _instance.createRenderArea();

            //begin render pass
            _instance.beginRenderPass(graphicPipline, cmdBuffer, frameBuffer, area);


            var arr = new BigUint64Array([0n]);

            //bind buffers
            vkCmdBindVertexBuffers(cmdBuffer, 0, 1, [cube.vertexBuffer.buffer], arr);
            vkCmdBindIndexBuffer(cmdBuffer, cube.indexBuffer.buffer, 0n, VK_INDEX_TYPE_UINT16);


            for (let i = 0; i < 10; i++) {
                vkCmdBindDescriptorSets(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, graphicPipline.getLayout(), 0, 1, [cube.texture.descriptionSet], 0, null);

                //create viewport
                let viewport = _instance.createViewport();
                _instance.setViewport(cmdBuffer, viewport);

                let scissor = _instance.createScissor();
                vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);
                vkCmdDrawIndexed(cmdBuffer, cube.indices.length, 1, 0, 0, 0);
            }

            _instance.endRenderPass(cmdBuffer);

            let result = vkEndCommandBuffer(cmdBuffer);

            if (result !== VK_SUCCESS)
                throw new Error(`Vulkan assertion failed!`);
        }
    }
}