import { VkAccessFlagBits, vkAllocateCommandBuffers, vkBeginCommandBuffer, VkBufferCopy, VkBufferImageCopy, VkClearColorValue, VkClearDepthStencilValue, VkClearValue, vkCmdBeginRenderPass, vkCmdBindDescriptorSets, vkCmdBindPipeline, vkCmdBlitImage, vkCmdCopyBuffer, vkCmdCopyBufferToImage, vkCmdDraw, vkCmdEndRenderPass, vkCmdPipelineBarrier, vkCmdSetScissor, vkCmdSetViewport, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandBufferBeginInfo, VkCommandBufferInheritanceInfo, VkCommandBufferLevel, VkCommandBufferUsageFlagBits, VkDescriptorSet, vkEndCommandBuffer, VkExtent2D, VkExtent3D, VkFilter, VkFormat, vkGetImageSubresourceLayout, VkImage, VkImageAspectFlagBits, VkImageBlit, VkImageLayout, VkImageMemoryBarrier, VkImageSubresourceLayers, VkImageSubresourceRange, VkOffset2D, VkOffset3D, VkPipelineBindPoint, VkPipelineStageFlagBits, VkQueue, vkQueueSubmit, VkRect2D, VkRenderPassBeginInfo, VkResult, VkSemaphore, VkStructureType, VkSubmitInfo, VkSubpassContents, VkViewport, VK_QUEUE_FAMILY_IGNORED } from "vulkan-api/generated/1.2.162/win32";
import { VulkanBuffer } from "./buffer";
import { CommandPool } from "./command-pool";
import { DescriptorSet } from "./desc-set";
import { Fence } from "./fence";
import { Framebuffer } from "./framebuffer";
import { VulkanImage } from "./image";
import { Pipeline } from "./pipeline";
import { RenderPass, RenderPassDefault, RenderPassDefaultDepth } from "./render-pass";
import { Semaphore } from "./semaphore";

export class AccessFlagsInterface {
    public key: VkAccessFlagBits | null;
    public value: VkPipelineStageFlagBits | null;

    constructor(key: VkAccessFlagBits | null, value: VkPipelineStageFlagBits | null) {
        this.key = key;
        this.value = value;
    }
}

export class CommandBuffer {

    private _commandPool: CommandPool;
    private _level: VkCommandBufferLevel;
    private _fence: Fence;
    handle: VkCommandBuffer | null = null;

    get CommandPool(): CommandPool {
        return this._commandPool;
    }

    get Fence(): Fence {
        return this._fence;
    }

    set Fence(fence: Fence) {
        this._fence = fence;
    }


    public SetScissor(x: number, y: number, width: number, height: number) {
        var scissor = new VkRect2D();
        scissor.offset = new VkOffset2D();
        scissor.offset.x = x;
        scissor.offset.y = y;

        scissor.extent = new VkExtent2D();
        scissor.extent.width = width;
        scissor.extent.height = height;

        vkCmdSetScissor(this.handle, 0, 1, [scissor]);
    }

    public Draw(
        vertexCount: number,
        instanceCount: number,
        firstVertex: number = 0,
        firstInstance: number = 0
    ) {

        vkCmdDraw(
            this.handle,
            vertexCount,
            instanceCount,
            firstVertex,
            firstInstance
        );
    }

    public EndRenderPass() {
        vkCmdEndRenderPass(this.handle);
    }


    public SetViewport(x: number, y: number, width: number, height: number) {
        var viewport = new VkViewport();

        viewport.x = x;
        viewport.y = y;
        viewport.width = width;
        viewport.height = height;
        viewport.minDepth = 0;
        viewport.maxDepth = 1;

        vkCmdSetViewport(
            this.handle,
            0,
            1,
            [viewport]
        );
    }


    public BindDescriptorSets(
        pipeline: Pipeline,
        descriptorSets: DescriptorSet[] | null = null,
        bindPoint: VkPipelineBindPoint = VkPipelineBindPoint.VK_PIPELINE_BIND_POINT_GRAPHICS
    ) {

        var sets: VkDescriptorSet[] = [];
        if (descriptorSets != null) {
            for (let set of descriptorSets)
                sets.push(set.handle);
        }

        if (pipeline.layout == null)
            throw Error("No pipeline layout");

        if (sets.length > 0) {
            vkCmdBindDescriptorSets(
                this.handle,
                bindPoint,
                pipeline.layout,
                0,
                sets.length,
                sets,
                0,
                null
            );
        }
        else throw Error("NO sets found");
    }

    public BindPipeline(
        pipeline: Pipeline,
        bindPoint: VkPipelineBindPoint = VkPipelineBindPoint.VK_PIPELINE_BIND_POINT_GRAPHICS
    ) {
        vkCmdBindPipeline(
            this.handle,
            bindPoint,
            pipeline.handle
        );
    }


    public TransferImageLayout(image: VulkanImage, newLayout: VkImageLayout): VulkanImage {

        for (let i = 0; i < image.mipLevel; i++) {
            {
                if (image.handle != null) {
                    console.log("[" + image.id + "] " + image.layout[i] + " to " + newLayout);
                    this.TransferImageLayoutParameters(image.handle, image.format, image.layout[i], newLayout, i);
                }
                else
                    throw Error("No image found");
            }
        }

        for (let l in image.layout) {
            image.layout[l] = newLayout;
        }

        return image;
    }

    private GetAspectFlags(
        layout: VkImageLayout
    ): VkImageAspectFlagBits {
        if (layout == VkImageLayout.VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL)
            return VkImageAspectFlagBits.VK_IMAGE_ASPECT_DEPTH_BIT;
        else
            return VkImageAspectFlagBits.VK_IMAGE_ASPECT_COLOR_BIT;
    }

    private GetImageTransferFlags(
        layout: VkImageLayout
    ): AccessFlagsInterface {

        switch (layout) {

            case VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_TRANSFER_READ_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_TRANSFER_BIT)

            case VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_TRANSFER_WRITE_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_TRANSFER_BIT)
            case VkImageLayout.VK_IMAGE_LAYOUT_UNDEFINED:
                /*return new KeyValuePair<VkAccessFlags, VkPipelineStageFlags>(
                    VkAccessFlags.None,
                    VkPipelineStageFlags.TopOfPipe
                );*/
                return new AccessFlagsInterface(null, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT)

            case VkImageLayout.VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_READ_BIT | VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT)

            case VkImageLayout.VK_IMAGE_LAYOUT_PRESENT_SRC_KHR:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_READ_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT)

            case VkImageLayout.VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_READ_BIT | VkAccessFlagBits.VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT)

            case VkImageLayout.VK_IMAGE_LAYOUT_GENERAL:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_READ_BIT | VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT)

            case VkImageLayout.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL:
                return new AccessFlagsInterface(VkAccessFlagBits.VK_ACCESS_SHADER_READ_BIT, VkPipelineStageFlagBits.VK_PIPELINE_STAGE_ALL_GRAPHICS_BIT)

        }

        return new AccessFlagsInterface(
            null, null
        );
    }

    public TransferImageLayoutParameters(
        image: VkImage,
        format: VkFormat,
        oldLayout: VkImageLayout,
        newLayout: VkImageLayout,
        mipLevel = 0
    ) {
        var aspect = this.GetAspectFlags(newLayout);
        var sourceFlags = this.GetImageTransferFlags(oldLayout);
        var destinationFlags = this.GetImageTransferFlags(newLayout);

        let subreRange = new VkImageSubresourceRange()
        subreRange.aspectMask = aspect;
        subreRange.baseMipLevel = mipLevel;
        subreRange.levelCount = 1;
        subreRange.baseArrayLayer = 0;
        subreRange.layerCount = 1;

        var barrier = new VkImageMemoryBarrier();
        //  barrier.sType = VkStructureType.VK_STRUCTURE_TYPE_IMAGE_MEMORY_BARRIER;
        barrier.oldLayout = oldLayout;
        barrier.newLayout = newLayout;

        barrier.srcQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        barrier.dstQueueFamilyIndex = VK_QUEUE_FAMILY_IGNORED;
        barrier.image = image;
        barrier.srcAccessMask = (sourceFlags.key) ? sourceFlags.key : 0;
        barrier.dstAccessMask = (destinationFlags.key) ? destinationFlags.key : 0;

        console.log(" barrier.dstAccessMask!!!!: " +  barrier.dstAccessMask);

        barrier.subresourceRange = subreRange;

        vkCmdPipelineBarrier(
            this.handle,
            (sourceFlags.value) ? sourceFlags.value : 0,
            (destinationFlags.value) ? destinationFlags.value : 0,
            0, 0, null, 0, null,
            1,
            [barrier]
        );
    }

    constructor(
        commandPool: CommandPool,
        level: VkCommandBufferLevel = VkCommandBufferLevel.VK_COMMAND_BUFFER_LEVEL_PRIMARY,
        isFenceSignaled: boolean = false
    ) {
        this._commandPool = commandPool;
        this._level = level;

        var allocateInfo = new VkCommandBufferAllocateInfo();
        // allocateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO;
        allocateInfo.commandPool = commandPool.handle;
        allocateInfo.level = level;
        allocateInfo.commandBufferCount = 1;

        let buffer = new VkCommandBuffer();
        if (vkAllocateCommandBuffers(
            commandPool.device.handle,
            allocateInfo,
            [buffer]
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to allocate command buffers");

        if (buffer == null) {
            throw new Error("Cant find first buffer");
        }

        this.handle = buffer;
        this._fence = new Fence(commandPool.device, isFenceSignaled);
    }

    public Begin(commandBufferUsageFlag: VkCommandBufferUsageFlagBits) {
        if (this._level != VkCommandBufferLevel.VK_COMMAND_BUFFER_LEVEL_PRIMARY)
            throw new Error("you can only use this method for primary command buffers");

        var beginInfo = new VkCommandBufferBeginInfo();
        beginInfo.flags = commandBufferUsageFlag;
        beginInfo.pInheritanceInfo = null;

        if (vkBeginCommandBuffer(
            this.handle,
            beginInfo
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to begin command buffer");
    }

    public BeginWithParameters(
        commandBufferUsageFlag: VkCommandBufferUsageFlagBits,
        renderPass: RenderPass,
        framebuffer: Framebuffer,
        subpass: number = 0
    ) {
        if (this._level != VkCommandBufferLevel.VK_COMMAND_BUFFER_LEVEL_SECONDARY)
            throw new Error("you can only use this method for primary command buffers");

        var inheritanceInfo = new VkCommandBufferInheritanceInfo();
        // inheritanceInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_COMMAND_BUFFER_INHERITANCE_INFO;
        inheritanceInfo.renderPass = renderPass.handle;
        inheritanceInfo.framebuffer = framebuffer.handle;

        var beginInfo = new VkCommandBufferBeginInfo();
        //  beginInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO;
        beginInfo.flags = commandBufferUsageFlag;
        beginInfo.pInheritanceInfo = inheritanceInfo;

        if (vkBeginCommandBuffer(
            this.handle,
            beginInfo
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to begin command buffer");
    }

    public End(): void {
        if (vkEndCommandBuffer(
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to end command buffer");
    }

    public CopyBuffer(
        source: VulkanBuffer,
        destination: VulkanBuffer
    ): void {
        if (source.size > destination.size)
            throw new Error("source size cannot be greater than destination");

        var region = new VkBufferCopy();
        region.dstOffset = 0;
        region.srcOffset = 0;
        region.size = source.size;

        vkCmdCopyBuffer(
            this.handle,
            source.handle,
            destination.handle,
            1,
            [region]
        );
    }

    CopyBufferToImage(buffer: VulkanBuffer,
        image: VulkanImage,
        mipLevel: number = 0) {
        var region = new VkBufferImageCopy();

        region.bufferOffset = 0;
        region.bufferRowLength = image.width;
        region.bufferImageHeight = image.height;

        let offset = new VkOffset3D();
        offset.x = 0;
        offset.y = 0;
        offset.z = 0;
        region.imageOffset = offset;

        let extend = new VkExtent3D();
        extend.width = image.width;
        extend.height = image.height;
        extend.depth = 1;

        region.imageExtent = extend;

        let layers = new VkImageSubresourceLayers();
        layers.mipLevel = mipLevel;
        layers.baseArrayLayer = 0;
        layers.layerCount = 1;
        layers.aspectMask = this.GetAspectFlags(
            image.layout[mipLevel]
        );
        region.imageSubresource = layers;

        vkCmdCopyBufferToImage(
            this.handle,
            buffer.handle,
            image.handle,
            image.layout[mipLevel],
            1,
            [region]
        );
    }

    public BeginRenderPass(
        framebuffer: Framebuffer,
        subpassContents: VkSubpassContents
    ): void {
        var renderPass = framebuffer.renderPass;
        var clearValues: VkClearValue[] = [];
        for (let attachment of renderPass.attachments) {
            if (attachment.format == RenderPassDefault.format) {

                let value = new VkClearValue();
                value.color = new VkClearColorValue();
                value.color.float32 = [0, 0, 0, 0];
                clearValues.push(value);

            }
            else if (attachment.format == RenderPassDefaultDepth.format) {

                let value = new VkClearValue();
                value.depthStencil = new VkClearDepthStencilValue();
                value.depthStencil.depth = 1.0;
                value.depthStencil.stencil = 0;

                clearValues.push(value);
            }
        }

        let rect = new VkRect2D();

        let offset = new VkOffset2D();
        offset.x = 0;
        offset.y = 0;

        let extent = new VkExtent2D();
        extent.width = framebuffer.width;
        extent.height = framebuffer.height;

        rect.offset = offset;
        rect.extent = extent;

        var renderPassBeginInfo = new VkRenderPassBeginInfo();
        // renderPassBeginInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO;
        renderPassBeginInfo.clearValueCount = clearValues.length;
        renderPassBeginInfo.pClearValues = clearValues;
        renderPassBeginInfo.framebuffer = framebuffer.handle;
        renderPassBeginInfo.renderPass = renderPass.handle;
        renderPassBeginInfo.renderArea = rect;

        vkCmdBeginRenderPass(
            this.handle,
            renderPassBeginInfo,
            subpassContents
        );
        // update the layout for images
        for (let i = 0; i < framebuffer.images.length; i++) {
            for (let key in framebuffer.images[i].layout) {
                framebuffer.images[i].layout[key] = framebuffer.renderPass.attachments[i].finalLayout;
            }
        }
    }

    static SubmitCommands(commandBuffers: CommandBuffer[],
        queue: VkQueue,
        signalSemaphores: Semaphore[] | null = null,
        waitSemaphores: Semaphore[] | null = null,
        waitStageMask: VkPipelineStageFlagBits = VkPipelineStageFlagBits.VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT) {

        if (commandBuffers.length == 0)
            return;

        var commands: VkCommandBuffer[] = [];
        for (let cmd of commandBuffers) {
            if (cmd.handle != null)
                commands.push(cmd.handle);

            else throw Error("cant find commands handle");
        }

        var signals: VkSemaphore[] = [];
        if (signalSemaphores != null) {
            for (let sigSem of signalSemaphores) {
                if (sigSem.handle != null)
                    signals.push(sigSem.handle);
                else throw Error("cant find signal handle");
            }
        }

        var waits: VkSemaphore[] = [];
        if (waitSemaphores != null) {
            for (let waitSem of waitSemaphores) {
                if (waitSem.handle != null)
                    waits.push(waitSem.handle);
                else throw Error("cant find waitSem handle");
            }
        }

        // reset fences
        for (let cb of commandBuffers)
            cb.Fence.Reset();

        var submitInfo = new VkSubmitInfo();
        //submitInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_SUBMIT_INFO;
        submitInfo.signalSemaphoreCount = signals.length;
        submitInfo.pSignalSemaphores = signals;
        submitInfo.waitSemaphoreCount = waits.length;
        submitInfo.pWaitSemaphores = waits;
        submitInfo.commandBufferCount = commands.length;
        submitInfo.pCommandBuffers = commands;

        let waitStageMaskArray = new Int32Array([
            waitStageMask
        ]);
        
        submitInfo.pWaitDstStageMask = waitStageMaskArray;

        if (commandBuffers[0].Fence.handle == null)
            throw new Error("handle is null!?");

        if (vkQueueSubmit(
            queue,
            1,
            [submitInfo],
            commandBuffers[0].Fence.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to submit commands to queue");
    }

    public BlitImage(
        source: VkImage,
        sourceFormat: VkFormat,
        sourceLayout: VkImageLayout,
        sourceX: number, sourceY: number,
        sourceWidth: number, sourceHeight: number,
        sourceMipLevel: number,
        destination: VkImage,
        destinationFormat: VkFormat,
        destinationLayout: VkImageLayout,
        destinationX: number, destinationY: number,
        destinationWidth: number, destinationHeight: number,
        destinationMipLevel: number
    ) {
        var regionInfo = new VkImageBlit();


        var offset1 = new VkOffset3D();
        offset1.x = sourceX;
        offset1.y = sourceX;
        offset1.z = 0;
        var offset2 = new VkOffset3D();
        offset2.x = sourceWidth;
        offset2.y = sourceHeight;
        offset2.z = 1;

        let subres = new VkImageSubresourceLayers();
        subres.aspectMask = this.GetAspectFlags(
            sourceLayout
        );

        subres.mipLevel = sourceMipLevel;
        subres.baseArrayLayer = 0;
        subres.layerCount = 1;

        regionInfo.srcOffsets = [offset1, offset2];
        regionInfo.srcSubresource = subres;

        var dstoffset1 = new VkOffset3D();
        dstoffset1.x = destinationX;
        dstoffset1.y = destinationY;
        dstoffset1.z = 0;

        var dstoffset2 = new VkOffset3D();
        dstoffset2.x = destinationWidth;
        dstoffset2.y = destinationHeight;
        dstoffset2.z = 1;

        let destsubres = new VkImageSubresourceLayers();
        destsubres.aspectMask = this.GetAspectFlags(
            destinationLayout
        );

        destsubres.mipLevel = destinationMipLevel;
        destsubres.baseArrayLayer = 0;
        destsubres.layerCount = 1;

        regionInfo.dstOffsets = [dstoffset1, dstoffset2];
        regionInfo.dstSubresource = destsubres;

        vkCmdBlitImage(
            this.handle,
            source,
            sourceLayout,
            destination,
            destinationLayout,
            1,
            [regionInfo],
            VkFilter.VK_FILTER_LINEAR
        );
    }


    public GenerateMipMaps(image: VulkanImage) {
        let mipMapWidth: number = Math.floor(image.width);
        let mipMapHeight: number = Math.floor(image.height);

        if (image.handle == null)
            throw Error("No image handle found.");;


        for (let i = 1; i < image.mipLevel; i++) {


            // transfer image layout
            this.TransferImageLayoutParameters(
                image.handle,
                image.format,
                image.layout[i - 1],
                VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
                i - 1
            );
            this.TransferImageLayoutParameters(
                image.handle,
                image.format,
                image.layout[i],
                VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
                i
            );

            // calculate mip map width and height
            var newMapWidth = Math.max(mipMapWidth / 2, 1);
            var newMapHeight = Math.max(mipMapHeight / 2, 1);

            // create mip map
            this.BlitImage(
                image.handle, image.format, VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
                0, 0, mipMapWidth, mipMapHeight, i - 1,

                image.handle, image.format, VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
                0, 0, newMapWidth, newMapHeight, i
            );

            mipMapWidth = newMapWidth;
            mipMapHeight = newMapHeight;
        }


        this.TransferImageLayoutParameters(
            image.handle,
            image.format,
            VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL,
            VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL,
            image.mipLevel - 1
        );

        for (let i in image.layout) {
            image.layout[i] = VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL;
        }
    }
}