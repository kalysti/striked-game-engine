"use strict";

import * as fs from 'fs';
import { mat4, vec3 } from "gl-matrix";
import { GLSL } from "nvk-essentials";
import { performance } from "perf_hooks";
import { vkAcquireNextImageKHR, vkAllocateCommandBuffers, vkAllocateDescriptorSets, vkAllocateMemory, VkApplicationInfo, vkBeginCommandBuffer, vkBindImageMemory, VkBuffer, VkBufferImageCopy, VkClearValue, vkCmdBeginRenderPass, vkCmdBindPipeline, vkCmdCopyBufferToImage, vkCmdEndRenderPass, vkCmdPipelineBarrier, vkCmdSetViewport, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkComponentMapping, vkCreateImage, vkCreateImageView, vkCreateInstance, vkCreateSampler, vkCreateShaderModule, VkDescriptorBufferInfo, VkDescriptorImageInfo, VkDescriptorSet, VkDescriptorSetAllocateInfo, vkDestroyImageView, vkDestroySampler, VkDeviceMemory, vkEndCommandBuffer, VkExtent2D, VkExtent3D, VkFormat, VkFramebuffer, vkFreeCommandBuffers, vkGetImageMemoryRequirements, VkImage, VkImageCreateInfo, VkImageLayout, VkImageMemoryBarrier, VkImageSubresourceLayers, VkImageSubresourceRange, VkImageTiling, VkImageView, VkImageViewCreateInfo, VkInstance, VkInstanceCreateInfo, vkMapMemory, VkMemoryAllocateInfo, VkMemoryRequirements, VkOffset2D, VkOffset3D, VkPipelineShaderStageCreateInfo, VkPipelineVertexInputStateCreateInfo, VkPresentInfoKHR, vkQueuePresentKHR, vkQueueSubmit, vkQueueWaitIdle, VkRect2D, VkRenderPassBeginInfo, VkResult, VkSampler, VkSamplerCreateInfo, VkShaderModule, VkShaderModuleCreateInfo, VkShaderStageFlagBits, VkSubmitInfo, vkUnmapMemory, vkUpdateDescriptorSets, VkVertexInputAttributeDescription, VkVertexInputBindingDescription, VkViewport, VkWriteDescriptorSet, VK_ACCESS_SHADER_READ_BIT, VK_ACCESS_TRANSFER_WRITE_BIT, VK_API_VERSION_1_1, VK_BORDER_COLOR_INT_OPAQUE_BLACK, VK_BUFFER_USAGE_INDEX_BUFFER_BIT, VK_BUFFER_USAGE_TRANSFER_SRC_BIT, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT, VK_COMPARE_OP_ALWAYS, VK_COMPONENT_SWIZZLE_IDENTITY, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_ERROR_OUT_OF_DATE_KHR, VK_FILTER_NEAREST, VK_FORMAT_R8G8B8A8_UNORM, VK_IMAGE_ASPECT_COLOR_BIT, VK_IMAGE_LAYOUT_PREINITIALIZED, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL, VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL, VK_IMAGE_LAYOUT_UNDEFINED, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_TYPE_2D, VK_IMAGE_USAGE_SAMPLED_BIT, VK_IMAGE_USAGE_TRANSFER_DST_BIT, VK_IMAGE_VIEW_TYPE_2D, VK_MAKE_VERSION, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT, VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT, VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT, VK_PIPELINE_STAGE_TRANSFER_BIT, VK_QUEUE_FAMILY_IGNORED, VK_SAMPLER_ADDRESS_MODE_REPEAT, VK_SAMPLER_MIPMAP_MODE_LINEAR, VK_SAMPLE_COUNT_1_BIT, VK_SHADER_STAGE_VERTEX_BIT, VK_SHARING_MODE_EXCLUSIVE, VK_SUBOPTIMAL_KHR, VK_SUBPASS_CONTENTS_INLINE, VK_SUCCESS, VK_VERTEX_INPUT_RATE_VERTEX } from "vulkan-api/generated/1.2.162/win32";
import { UIWindow } from "../components/window/ui-window";
import { Cube } from "../objects/cube";
import { createBuffer, getMemoryTypeIndex, memoryCopy, uploadBufferData } from "../utils/buffer";
import { CommandBuffer } from "./command-buffer";
import { CommandPool } from "./command-pool";
import { CreateSema } from "./create-sema";
import { DescriptorPool } from "./desc-pool";
import { DescriptorSetLayout } from "./desc-set-layout";
import { FrameBuffer } from "./frame-buffer";
import { GraphicsPipeline } from "./graphics-pipeline";
import { GraphicsPipelineBase } from './graphics-pipeline-base';
import { GraphicsPipelineTest } from './graphics-pipeline-test';
import { LogicalDevice } from "./logical-device";
import { PhysicalDevice } from "./physical-device";
import { RecordCommand } from "./record-command";
import { RenderPass } from "./render-pass";
import { RenderPipeline } from "./render-pipeline";
import { RenderQueue } from "./render-queue";
import { Swapchain } from "./swapchain";
import { SwapchainImageView } from "./swapchain-imageview";

export class Renderer {

    protected _instance!: VkInstance;
    protected _appInfo!: VkApplicationInfo;
    protected _mainWindow: UIWindow;

    protected lastFrame: number = 0;

    mModel = mat4.create();
    mView = mat4.create();
    mProjection = mat4.create();
    vLightPosition = vec3.fromValues(1.0, 3.0, 2.0);
    uniformBuffer!: UniformBuffer;

    public ubo: Float32Array = new Float32Array(
        this.mModel.length +
        this.mView.length +
        this.mProjection.length +
        this.vLightPosition.length
    );

    public pipeline: RenderPipeline = new RenderPipeline();

    protected runLoop: boolean = false;
    protected validationLayers: string[] = [];
    protected _instanceInfo: VkInstanceCreateInfo = new VkInstanceCreateInfo();
    protected _physicalDevice: PhysicalDevice = new PhysicalDevice();
    protected _logicalDevice: LogicalDevice = new LogicalDevice();
    protected _queue: RenderQueue = new RenderQueue();
    protected _renderPass: RenderPass = new RenderPass();
    protected _graphicsPipeline: GraphicsPipeline = new GraphicsPipeline();
    protected _swapchain: Swapchain = new Swapchain();
    protected _swapchainview: SwapchainImageView = new SwapchainImageView();
    protected _framebuffer: FrameBuffer = new FrameBuffer();
    protected _commandPool: CommandPool = new CommandPool();
    protected _commandBuffer: CommandBuffer = new CommandBuffer();
    protected _descPool: DescriptorPool = new DescriptorPool();
    protected _descSetLayout: DescriptorSetLayout = new DescriptorSetLayout();
    protected _RecordCommand: RecordCommand = new RecordCommand();
    protected _sema: CreateSema = new CreateSema();

    protected _graphicsPipelineTest: GraphicsPipelineTest = new GraphicsPipelineTest();

    constructor(_window: UIWindow) {
        this._mainWindow = _window;
        this.pipeline.attach(this._mainWindow);
    }

    freeSwapChainView() {
        this._swapchainview.destroy(this._logicalDevice.getDevice());
    }

    freeCommandBuffers() {

        vkFreeCommandBuffers(this._logicalDevice.getDevice(), this._commandPool.getPool(),
            this._swapchainview.getCount(), this._commandBuffer.cmdBuffers);

        this._commandBuffer.clear();
    }

    freeCommandPool() {
        this._commandPool.destroy(this._logicalDevice.getDevice());
    }

    freeFrameBuffers() {
        this._framebuffer.destroy(this._logicalDevice.getDevice(), this._swapchainview.getCount())
    }

    freeRenderPass() {
        this._renderPass.destroy(this._logicalDevice.getDevice());
    }

    create(): boolean {

        this.createTransform();

        this._instance = new VkInstance();
        this._appInfo = new VkApplicationInfo({
            pApplicationName: "Hello!",
            applicationVersion: VK_MAKE_VERSION(1, 0, 0),
            pEngineName: "No Engine",
            engineVersion: VK_MAKE_VERSION(1, 0, 0),
            apiVersion: VK_API_VERSION_1_1
        });

        let instanceExtensions = this._mainWindow.requiredVulkanExtensions();
        this._instanceInfo.pApplicationInfo = this._appInfo;
        this._instanceInfo.enabledExtensionCount = instanceExtensions.length;
        this._instanceInfo.ppEnabledExtensionNames = instanceExtensions;
        this._instanceInfo.ppEnabledLayerNames = this.validationLayers;
        this._instanceInfo.enabledLayerCount = this.validationLayers.length;

        let result = vkCreateInstance(this._instanceInfo, null, this._instance);
        if (result !== VkResult.VK_SUCCESS)

            return false;
        else {
            this._mainWindow.attachToSurface(this._instance);

            var surface = this._mainWindow.getSurface();

            console.log("created phyiscal device");
            this._physicalDevice.create(this._instance, surface);

            console.log("created logical device");
            this._logicalDevice.create(this._physicalDevice.getDevice(), surface);

            console.log("created queue");
            this._queue.create(this._logicalDevice.getDevice());

            console.log("created swapchain");
            this._swapchain.create(this._logicalDevice.getDevice(), this._mainWindow);

            console.log("created swapchainview");
            this._swapchainview.create(this._logicalDevice.getDevice(), this._swapchain);

            console.log("created uniform buffer");
            this.uniformBuffer = this.createUniformBuffer();

            console.log("created render pass");
            this._renderPass.create(this._logicalDevice.getDevice());

            var cube = new Cube();
            var cube2 = new Cube();

            console.log("desc set layout");
            this._descSetLayout.create(this._logicalDevice);

            console.log("create pipeline");
            this._graphicsPipeline.create(this, cube, this._logicalDevice, this._mainWindow, this._renderPass.getRenderPass(), this._descSetLayout);
           // this._graphicsPipelineTest.create(this, cube2, this._logicalDevice, this._mainWindow, this._renderPass.getRenderPass(), this._descSetLayout);

            console.log("create framebuffer");
            this._framebuffer.create(this._logicalDevice, this._renderPass, this._swapchainview, this._mainWindow);

            console.log("create command pool");
            this._commandPool.create(this._logicalDevice);

            console.log("create command buffer");
            this._commandBuffer.create(this._logicalDevice, this._commandPool, this._swapchainview);

            console.log("desc pool");
            this._descPool.create(this._logicalDevice);

            console.log("upload cube with texture");
            cube.init(this);
         

            console.log("record command");
            this._RecordCommand.create(this, cube, this._framebuffer, this._commandBuffer, this._swapchainview, this._graphicsPipeline)
           //  this._RecordCommand.create(this, cube2, this._framebuffer, this._commandBuffer, this._swapchainview, this._graphicsPipelineTest)

            console.log("create sema");
            this._sema.create(this._logicalDevice);

            return true;
        }
    }

    protected loopInterval: NodeJS.Timeout | null = null;

    startMainThread() {
        this.loopInterval = setInterval(() => {
            this.loop();
        }, 0);
    }

    stopMainThread() {
        if (this.loopInterval != null)
            clearInterval(this.loopInterval);
    }

    protected loop() {
        if (!this._mainWindow.shouldClose()) {

            let now = performance.now();
            let delta = (this.lastFrame - now) | 0;
            this._mainWindow.title = `Vulkan ${delta}`;
            this.updateTransforms();
            this.drawFrame();

            this.pipeline.loop(delta);
            this.lastFrame = now;

        }
        else {
            this.stopMainThread();
        }
    }

    drawFrame() {
        let imageIndex = { $: 0 };
        let result = vkAcquireNextImageKHR(this._logicalDevice.getDevice(), this._swapchain.getSwapchain(), Number.MAX_SAFE_INTEGER, this._sema.semaphoreImageAvailable, null, imageIndex);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let waitStageMask = new Int32Array([
            VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT
        ]);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 1;
        submitInfo.pWaitSemaphores = [this._sema.semaphoreImageAvailable];
        submitInfo.pWaitDstStageMask = waitStageMask;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [this._commandBuffer.cmdBuffers[imageIndex.$]];
        submitInfo.signalSemaphoreCount = 1;
        submitInfo.pSignalSemaphores = [this._sema.semaphoreRenderingDone];

        let resultQueue = vkQueueSubmit(this._queue.getQueue(), 1, [submitInfo], null);
        if (resultQueue !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let presentInfo = new VkPresentInfoKHR();
        presentInfo.waitSemaphoreCount = 1;
        presentInfo.pWaitSemaphores = [this._sema.semaphoreRenderingDone];
        presentInfo.swapchainCount = 1;
        presentInfo.pSwapchains = [this._swapchain.getSwapchain()];
        presentInfo.pImageIndices = new Uint32Array([imageIndex.$]);
        presentInfo.pResults = null;

        let resultKHR = vkQueuePresentKHR(this._queue.getQueue(), presentInfo);
        if (resultKHR === VK_SUBOPTIMAL_KHR || resultKHR === VK_ERROR_OUT_OF_DATE_KHR) {
            this._mainWindow.close();
        } else if (resultQueue !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    };

    private vCameraPosition = vec3.fromValues(4.0, 4.0, 4.0);

    createTransform() {
        // view
        mat4.lookAt(
            this.mView,
            this.vCameraPosition,
            vec3.fromValues(0.0, 0.0, 0.0),
            vec3.fromValues(0.0, 0.0, 1.0)
        );

        for (let ii = 0; ii < this.mView.length; ++ii) this.ubo[16 + ii] = this.mView[ii];
        // projection
        mat4.perspective(
            this.mProjection,
            45.0 * Math.PI / 180,
            this._mainWindow.getWindow().width / this._mainWindow.getWindow().height,
            1.0,
            4096.0
        );

        this.mProjection[5] *= -1.0;
        for (let ii = 0; ii < this.mProjection.length; ++ii) this.ubo[32 + ii] = this.mProjection[ii];
    }

    updateTransforms() {
        let now = performance.now();

        // light
        for (let ii = 0; ii < this.vLightPosition.length; ++ii) this.ubo[48 + ii] = this.vLightPosition[ii];
        // model
        mat4.identity(this.mModel);
        mat4.rotate(
            this.mModel,
            this.mModel,
            (now / 1e3) * (90 * Math.PI / 180),
            vec3.fromValues(0.0, 0.0, 1.0)
        );
        for (let ii = 0; ii < this.mModel.length; ++ii) this.ubo[0 + ii] = this.mModel[ii];

        // upload
        let dataPtr = { $: 0n };
        vkMapMemory(this._logicalDevice.getDevice(), this.uniformBuffer.memory, 0n, this.ubo.byteLength, 0, dataPtr);
        memoryCopy(dataPtr.$, this.ubo, this.ubo.byteLength);
        vkUnmapMemory(this._logicalDevice.getDevice(), this.uniformBuffer.memory);
    };

    destroyImageView(imageView: VkImageView) {
        vkDestroyImageView(this._logicalDevice.getDevice(), imageView, null);
    }

    destroySampler(sampler: VkSampler) {
        vkDestroySampler(this._logicalDevice.getDevice(), sampler, null);
    }

    beginSingleTimeBuffer(): VkCommandBuffer {
        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this._commandPool.getPool();
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(this._logicalDevice.getDevice(), cmdBufferAllocInfo, [cmdBuffer]);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;

        let resultCommand = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
        if (resultCommand !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        return cmdBuffer;
    }

    loadShaderFromPath(filepath: string, ext: string): VkShaderModule {
        console.log("Load shader:" + filepath + " from type " + ext);

        let shader = new VkShaderModule();

        let shaderSrc = GLSL.toSPIRVSync({
            source: fs.readFileSync(filepath),
            extension: ext
        }).output;

        let shaderModuleInfo = new VkShaderModuleCreateInfo();
        shaderModuleInfo.pCode = shaderSrc;
        shaderModuleInfo.codeSize = shaderSrc.byteLength;
        let result = vkCreateShaderModule(this._logicalDevice.getDevice(), shaderModuleInfo, null, shader);

        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        return shader;
    };

    setViewport(cmdBuffer: VkCommandBuffer, viewport: VkViewport) {
        vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);
    }

    createViewport(): VkViewport {
        let viewport = new VkViewport();
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = this._mainWindow.getWindow().width;
        viewport.height = this._mainWindow.getWindow().height;
        viewport.minDepth = 0.0;
        viewport.maxDepth = 1.0;

        return viewport;
    }

    createRenderArea(): VkRect2D {

        let offset = new VkOffset2D();
        offset.x = 0;
        offset.y = 0;

        let extent = new VkExtent2D();
        extent.width = this._mainWindow.getWindow().width;
        extent.height = this._mainWindow.getWindow().height;

        let renderArea = new VkRect2D();
        renderArea.offset = offset;
        renderArea.extent = extent;

        return renderArea;
    }

    createScissor(): VkRect2D {
        let scissorOffset = new VkOffset2D();
        scissorOffset.x = 0;
        scissorOffset.y = 0;
        let scissorExtent = new VkExtent2D();
        scissorExtent.width = this._mainWindow.getWindow().width;
        scissorExtent.height = this._mainWindow.getWindow().height;
        let scissor = new VkRect2D();
        scissor.offset = scissorOffset;
        scissor.extent = scissorExtent;

        return scissor;
    }

    endRenderPass(cmdBuffer: VkCommandBuffer) {
        vkCmdEndRenderPass(cmdBuffer);
    }

    beginRenderPass(graphicsPipeline: GraphicsPipelineBase, cmdBuffer: VkCommandBuffer, frameBuffer: VkFramebuffer, renderArea: VkRect2D) {

        let clearValue = new VkClearValue();
        let renderPassBeginInfo = new VkRenderPassBeginInfo();
        renderPassBeginInfo.renderPass = this._renderPass.getRenderPass();
        renderPassBeginInfo.framebuffer = frameBuffer;
        renderPassBeginInfo.renderArea = renderArea;
        renderPassBeginInfo.clearValueCount = 1;
        renderPassBeginInfo.pClearValues = [clearValue];
        vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);
        vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, graphicsPipeline.getPipeline());
    }

    endSingleTimeCommands(commandBuffer: VkCommandBuffer) {
        let resultCommandBuffer = vkEndCommandBuffer(commandBuffer);
        if (resultCommandBuffer !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 0;
        submitInfo.pWaitSemaphores = null;
        submitInfo.pWaitDstStageMask = null;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [commandBuffer];
        submitInfo.signalSemaphoreCount = 0;
        submitInfo.pSignalSemaphores = null;

        vkQueueSubmit(this._queue.getQueue(), 1, [submitInfo], null);
        vkQueueWaitIdle(this._queue.getQueue());
    }

    setImageLayoutTransition(boundedImage: BoundedImage, oldLayout: VkImageLayout, newLayout: VkImageLayout): VkImageLayout {

        var buffer = this.beginSingleTimeBuffer();

        let subresourceRange = new VkImageSubresourceRange();
        subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        subresourceRange.baseMipLevel = 0;
        subresourceRange.levelCount = 1;
        subresourceRange.baseArrayLayer = 0;
        subresourceRange.layerCount = 1;

        let srcAccessMask = 0;
        let dstAccessMask = 0;
        let srcStage = 0;
        let dstStage = 0;
        if (
            (newLayout === VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL) &&
            (oldLayout === VK_IMAGE_LAYOUT_PREINITIALIZED)
        ) {
            srcAccessMask = 0;
            dstAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            srcStage = VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT;
            dstStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
        } else if (
            (newLayout === VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL) &&
            (oldLayout === VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL)
        ) {
            srcAccessMask = VK_ACCESS_TRANSFER_WRITE_BIT;
            dstAccessMask = VK_ACCESS_SHADER_READ_BIT;
            srcStage = VK_PIPELINE_STAGE_TRANSFER_BIT;
            dstStage = VK_PIPELINE_STAGE_FRAGMENT_SHADER_BIT;
        }

        let imageMemoryBarrier = new VkImageMemoryBarrier();
        imageMemoryBarrier.srcAccessMask = srcAccessMask;
        imageMemoryBarrier.dstAccessMask = dstAccessMask;
        console.log("dstAccessMask!!!!: " + dstAccessMask);
        imageMemoryBarrier.oldLayout = oldLayout;
        imageMemoryBarrier.newLayout = newLayout;
        imageMemoryBarrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        imageMemoryBarrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        imageMemoryBarrier.image = boundedImage.image;
        imageMemoryBarrier.subresourceRange = subresourceRange;

        vkCmdPipelineBarrier(
            buffer,
            srcStage, dstStage,
            0,
            0, null,
            0, null,
            1, [imageMemoryBarrier]
        );

        this.endSingleTimeCommands(buffer);

        return newLayout;
    }

    createUniformBuffer(): UniformBuffer {
        let uniformBuffer = new UniformBuffer();

        createBuffer({
            size: this.ubo.byteLength,
            usage: VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT,
            buffer: uniformBuffer.buffer,
            bufferMemory: uniformBuffer.memory,
            propertyFlags: VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
        }, this._logicalDevice.getDevice(), this._physicalDevice.getDevice());

        return uniformBuffer;
    }

    createTextureDescription(sampler: VkSampler, imageView: VkImageView): VkDescriptorSet {

        let desc = new VkDescriptorSet();
        let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
        descriptorSetAllocInfo.descriptorPool = this._descPool.getPool();
        descriptorSetAllocInfo.descriptorSetCount = 1;
        descriptorSetAllocInfo.pSetLayouts = [this._descSetLayout.getDescSet()];
        
        let result = vkAllocateDescriptorSets(this._logicalDevice.getDevice(), descriptorSetAllocInfo, [desc]);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan cant alloc failed!`);

        let bufferInfo = new VkDescriptorBufferInfo();
        bufferInfo.buffer = this.uniformBuffer.buffer;
        bufferInfo.offset = 0n;
        bufferInfo.range = this.ubo.byteLength;

        let writeDescriptorSet = new VkWriteDescriptorSet();
        writeDescriptorSet.dstSet = desc;
        writeDescriptorSet.dstBinding = 0;
        writeDescriptorSet.dstArrayElement = 0;
        writeDescriptorSet.descriptorCount = 1;
        writeDescriptorSet.descriptorType = VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER;
        writeDescriptorSet.pBufferInfo = [bufferInfo];

        let descriptorImageInfo = new VkDescriptorImageInfo();
        descriptorImageInfo.sampler = sampler;
        descriptorImageInfo.imageView = imageView;
        descriptorImageInfo.imageLayout = VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL;

        let writeDescriptorSetSampler = new VkWriteDescriptorSet();
        writeDescriptorSetSampler.dstSet = desc;
        writeDescriptorSetSampler.dstBinding = 1;
        writeDescriptorSetSampler.dstArrayElement = 0;
        writeDescriptorSetSampler.descriptorCount = 1;
        writeDescriptorSetSampler.descriptorType = VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER;
        writeDescriptorSetSampler.pImageInfo = [descriptorImageInfo];

        vkUpdateDescriptorSets(this._logicalDevice.getDevice(), 2, [writeDescriptorSet, writeDescriptorSetSampler], 0, null);

        return desc;
    }

    createVertexInputInfo(bytesPerElement: number, attributes: VkVertexInputAttributeDescription[]) : VkPipelineVertexInputStateCreateInfo{
        let posVertexBindingDescr = new VkVertexInputBindingDescription();
        posVertexBindingDescr.binding = 0;
        posVertexBindingDescr.stride = 8 * bytesPerElement;
        posVertexBindingDescr.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;

        
        let vertexInputInfo = new VkPipelineVertexInputStateCreateInfo();
        vertexInputInfo.vertexBindingDescriptionCount = 1;
        vertexInputInfo.pVertexBindingDescriptions = [posVertexBindingDescr];
        vertexInputInfo.vertexAttributeDescriptionCount = attributes.length;
        vertexInputInfo.pVertexAttributeDescriptions = attributes;

        return vertexInputInfo;


    }

    createShaderStageInfo(shader: VkShaderModule, shaderType: VkShaderStageFlagBits = VK_SHADER_STAGE_VERTEX_BIT) : VkPipelineShaderStageCreateInfo {

        let shaderStageInfoVert = new VkPipelineShaderStageCreateInfo();
        shaderStageInfoVert.stage = shaderType;
        shaderStageInfoVert.module = shader;
        shaderStageInfoVert.pName = "main";
        shaderStageInfoVert.pSpecializationInfo = null;

        return shaderStageInfoVert;
    }

    createSampler(): VkSampler {
        let sampler = new VkSampler();
        let samplerInfo = new VkSamplerCreateInfo();
        samplerInfo.magFilter = VK_FILTER_NEAREST;
        samplerInfo.minFilter = VK_FILTER_NEAREST;
        samplerInfo.mipmapMode = VK_SAMPLER_MIPMAP_MODE_LINEAR;
        samplerInfo.addressModeU = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.addressModeV = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.addressModeW = VK_SAMPLER_ADDRESS_MODE_REPEAT;
        samplerInfo.mipLodBias = 0;
        samplerInfo.anisotropyEnable = false;
        samplerInfo.maxAnisotropy = 16;
        samplerInfo.compareEnable = false;
        samplerInfo.compareOp = VK_COMPARE_OP_ALWAYS;
        samplerInfo.minLod = 0;
        samplerInfo.maxLod = 0;
        samplerInfo.borderColor = VK_BORDER_COLOR_INT_OPAQUE_BLACK;
        samplerInfo.unnormalizedCoordinates = false;

        let resultSampler = vkCreateSampler(this._logicalDevice.getDevice(), samplerInfo, null, sampler);
        if (resultSampler !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        return sampler;
    }

    transferStagingBufferToImage(stagingBuffer: StagingBuffer, boundedImage: BoundedImage, width: number, height: number) {

        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = this._commandPool.getPool();
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = 1;

        let cmdBuffer = new VkCommandBuffer();
        let result = vkAllocateCommandBuffers(this._logicalDevice.getDevice(), cmdBufferAllocInfo, [cmdBuffer]);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
        cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        cmdBufferBeginInfo.pInheritanceInfo = null;

        let resultBegin = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
        if (resultBegin !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let imageSubresource = new VkImageSubresourceLayers();
        imageSubresource.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        imageSubresource.mipLevel = 0;
        imageSubresource.baseArrayLayer = 0;
        imageSubresource.layerCount = 1;

        let imageOffset = new VkOffset3D();
        imageOffset.x = 0;
        imageOffset.y = 0;
        imageOffset.z = 0;

        let imageExtent = new VkExtent3D();
        imageExtent.width = width;
        imageExtent.height = height;
        imageExtent.depth = 1;

        let bufferImageCopy = new VkBufferImageCopy();
        bufferImageCopy.bufferOffset = 0n;
        bufferImageCopy.bufferRowLength = 0;
        bufferImageCopy.bufferImageHeight = 0;
        bufferImageCopy.imageSubresource = imageSubresource;
        bufferImageCopy.imageOffset = imageOffset;
        bufferImageCopy.imageExtent = imageExtent;

        vkCmdCopyBufferToImage(
            cmdBuffer,
            stagingBuffer.buffer,
            boundedImage.image,
            VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            1,
            [bufferImageCopy]
        );

        let resultEnd = vkEndCommandBuffer(cmdBuffer);
        if (resultEnd !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let submitInfo = new VkSubmitInfo();
        submitInfo.waitSemaphoreCount = 0;
        submitInfo.pWaitSemaphores = null;
        submitInfo.pWaitDstStageMask = null;
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = [cmdBuffer];
        submitInfo.signalSemaphoreCount = 0;
        submitInfo.pSignalSemaphores = null;

        vkQueueSubmit(this._queue.getQueue(), 1, [submitInfo], null);
        vkQueueWaitIdle(this._queue.getQueue());

    }

    createStagingImageBuffer(data: Uint8Array): StagingBuffer {
        let byteLength = data.byteLength;

        let buffer = new StagingBuffer();

        createBuffer({
            size: byteLength,
            usage: VK_BUFFER_USAGE_TRANSFER_SRC_BIT,
            buffer: buffer.buffer,
            bufferMemory: buffer.memory,
            propertyFlags: VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT
        }, this._logicalDevice.getDevice(), this._physicalDevice.getDevice());

        let dataPtr = { $: 0n };
        vkMapMemory(this._logicalDevice.getDevice(), buffer.memory, 0n, byteLength, 0, dataPtr);
        memoryCopy(dataPtr.$, data, byteLength);
        vkUnmapMemory(this._logicalDevice.getDevice(), buffer.memory);

        return buffer;
    }

    createImageView(image: BoundedImage, format: VkFormat = VK_FORMAT_R8G8B8A8_UNORM): VkImageView {

        let imageView = new VkImageView();

        let components = new VkComponentMapping();
        components.r = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.g = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.b = VK_COMPONENT_SWIZZLE_IDENTITY;
        components.a = VK_COMPONENT_SWIZZLE_IDENTITY;


        let subresourceRange = new VkImageSubresourceRange();
        subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        subresourceRange.baseMipLevel = 0;
        subresourceRange.levelCount = 1;
        subresourceRange.baseArrayLayer = 0;
        subresourceRange.layerCount = 1;

        let imageViewInfo = new VkImageViewCreateInfo();
        imageViewInfo.image = image.image;
        imageViewInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
        imageViewInfo.format = format;
        imageViewInfo.components = components;
        imageViewInfo.subresourceRange = subresourceRange;

        let resultCreate = vkCreateImageView(this._logicalDevice.getDevice(), imageViewInfo, null, imageView);

        if (resultCreate !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        return imageView;

    }

    createImage(width: number, height: number, format: VkFormat = VK_FORMAT_R8G8B8A8_UNORM, tiling: VkImageTiling = VK_IMAGE_TILING_OPTIMAL): BoundedImage {

        let boudedImage = new BoundedImage();

        let imageExtent = new VkExtent3D();
        imageExtent.width = width;
        imageExtent.height = height;
        imageExtent.depth = 1;

        let imageInfo = new VkImageCreateInfo();
        imageInfo.imageType = VK_IMAGE_TYPE_2D;
        imageInfo.format = format;
        imageInfo.extent = imageExtent;
        imageInfo.mipLevels = 1;
        imageInfo.arrayLayers = 1;
        imageInfo.samples = VK_SAMPLE_COUNT_1_BIT;
        imageInfo.tiling = tiling;
        imageInfo.usage = VK_IMAGE_USAGE_TRANSFER_DST_BIT | VK_IMAGE_USAGE_SAMPLED_BIT;
        imageInfo.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        imageInfo.queueFamilyIndexCount = 0;
        imageInfo.pQueueFamilyIndices = null;
        imageInfo.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;

        let result = vkCreateImage(this._logicalDevice.getDevice(), imageInfo, null, boudedImage.image);

        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let memoryRequirements = new VkMemoryRequirements();

        vkGetImageMemoryRequirements(this._logicalDevice.getDevice(), boudedImage.image, memoryRequirements);

        let memoryTypeIndex = getMemoryTypeIndex(
            memoryRequirements.memoryTypeBits,
            VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, this._physicalDevice.getDevice()
        );

        let memoryAllocateInfo = new VkMemoryAllocateInfo();
        memoryAllocateInfo.allocationSize = memoryRequirements.size;
        memoryAllocateInfo.memoryTypeIndex = memoryTypeIndex;

        let resultAllocate = vkAllocateMemory(this._logicalDevice.getDevice(), memoryAllocateInfo, null, boudedImage.memory);

        if (resultAllocate !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        vkBindImageMemory(this._logicalDevice.getDevice(), boudedImage.image, boudedImage.memory, 0n);
        return boudedImage;
    }

    createIndexBuffer(indicies: Uint16Array): IndexBuffer {
        var buffer = new IndexBuffer();

        uploadBufferData({
            data: indicies,
            usage: VK_BUFFER_USAGE_INDEX_BUFFER_BIT,
            buffer: buffer.buffer,
            bufferMemory: buffer.memory
        }, this._logicalDevice.getDevice(), this._physicalDevice.getDevice(), this._commandPool.getPool(), this._queue.getQueue());

        return buffer;
    }

    createVertexBuffer(meshData: Float32Array): VertexBuffer {
        var buffer = new VertexBuffer();
        uploadBufferData({
            data: meshData,
            usage: VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
            buffer: buffer.buffer,
            bufferMemory: buffer.memory
        }, this._logicalDevice.getDevice(), this._physicalDevice.getDevice(), this._commandPool.getPool(), this._queue.getQueue());

        return buffer;
    }
}

export class BoundedImage {
    image: VkImage = new VkImage();
    memory: VkDeviceMemory = new VkDeviceMemory();
}

export class StagingBuffer {
    buffer: VkBuffer = new VkBuffer();
    memory: VkDeviceMemory = new VkDeviceMemory();
}

export class UniformBuffer {
    buffer: VkBuffer = new VkBuffer();
    memory: VkDeviceMemory = new VkDeviceMemory();
}

export class VertexBuffer {
    buffer: VkBuffer = new VkBuffer();
    memory: VkDeviceMemory = new VkDeviceMemory();
}

export class IndexBuffer {
    buffer: VkBuffer = new VkBuffer();
    memory: VkDeviceMemory = new VkDeviceMemory();
}

