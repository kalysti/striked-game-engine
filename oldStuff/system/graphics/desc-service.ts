import { VkImageLayout, VkFormat, VkQueueFlagBits, VkCommandBufferUsageFlagBits, VkBufferUsageFlagBits, VkMemoryPropertyFlagBits, VkImageUsageFlagBits, VkImageAspectFlagBits } from "vulkan-api/generated/1.2.162/win32";
import { Engine } from "../core/engine";
import { VulkanBuffer } from "./api/buffer";
import { CommandBuffer } from "./api/command-buffer";
import { CommandType } from "./api/command-service";
import { DescriptorLayout } from "./api/desc-layout";
import { DescriptorPool } from "./api/desc-pool";
import { DescriptorSet } from "./api/desc-set";
import { BaseVulkanImage, VulkanImage } from "./api/image";
import { ImageView } from "./api/imageview";
import { Sampler } from "./api/sampler";
import { GraphicsModule } from "./graphics.module";
import { Texture } from "./Texture";

export interface DescriptorObject {
    Layout?: DescriptorLayout;
    Pool?: DescriptorPool;
    DescriptorSet?: DescriptorSet;
    StagingBuffers: VulkanBuffer[];
    CommandBuffer: CommandBuffer[];
    Buffers: VulkanBuffer[];
    Images: VulkanImage[];
    ImageViews: ImageView[];
    Samplers: Sampler[];
    Amount?: number
}

export class DescriptorService {

    protected _handle: Map<string, DescriptorObject>;

    private _module: GraphicsModule;
    private _imageNeedsTransfered: boolean = false;

    get handle(): Map<string, DescriptorObject> {
        return this._handle;
    }

    constructor() {
        this._handle = new Map<string, DescriptorObject>();
        this._module = Engine.instance.GetModule(GraphicsModule);
    }

    public InsertKey(
        key: string,
        layout: DescriptorLayout
    ) {
        if (this._handle.has(key))
            return;

        if (layout == null) {
            let value: DescriptorObject = { StagingBuffers: [], ImageViews: [], Buffers: [], CommandBuffer: [], Images: [], Samplers: [] };
            this._handle.set(key, value);
        }
        else {
            var pool = new DescriptorPool(layout, 1);
            let value: DescriptorObject = { StagingBuffers: [], ImageViews: [], Images: [], Samplers: [], CommandBuffer: [], Buffers: [], Layout: layout, Pool: pool, DescriptorSet: new DescriptorSet(pool), Amount: layout.bindings.length };

            this._handle.set(key, value);
        }
    }

    public RemoveKey(key: string) {
        if (this._handle.has(key) == false)
            return;

        this._handle.delete(key);
    }

    private TransferImageAndUpdateDescriptorSet(key: string, binding: number) {

        //update image layout for descriptor set
        var transferImageCommand = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT,
            CommandType.Primary
        );
        let item = this._handle.get(key);
        if (item == null)
            throw Error("Cant found descriptor by key");
        if (item.Images == null)
            throw Error("No images collection found");


        let imageView = item.ImageViews[binding];
        let image = item.Images[binding];
        let sampler = item.Samplers[binding];

        if (image == null)
            throw Error("No image found");

        if (sampler == null)
            throw Error("No sampler found");

        transferImageCommand.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);
        transferImageCommand.TransferImageLayout(
            image,
            VkImageLayout.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL
        );
        transferImageCommand.End();


        this._module.CommandBufferService.SubmitSingle(transferImageCommand);

        transferImageCommand.Fence.Wait();

        if (item.DescriptorSet == null)
            throw Error("No DescriptorSet found");
        if (imageView == null)
            throw Error("No ImageViews found");
        if (item.Samplers == null)
            throw Error("No Samplers found");

        item.DescriptorSet.UpdateSampledImage(
            imageView,
            sampler,
            binding
        );

        this._handle.set(key, item);
    }

    SetupBuffers(key: string, binding: number, size: number) {
        let item = this._handle.get(key);

        if (item == null)
            throw new Error("you must insert this key before using it");

        if (item.StagingBuffers[binding] != null) {
            if (item.StagingBuffers[binding].size <= size)
                return;
        }

        let stagingBuffer = item.StagingBuffers[binding];
        if (stagingBuffer == null)
            return;
            
        if (item.Layout == null)
            throw Error("No layout found");

        var device = item.Layout.device;

        item.StagingBuffers[binding] = new VulkanBuffer(
            device,
            size,
            VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_SRC_BIT | VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT,
            VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT | VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT
        );

        item.Buffers[binding] = new VulkanBuffer(
            device,
            size,
            VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT | VkBufferUsageFlagBits.VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT,
            VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT
        );

        if (item.CommandBuffer == null)
            throw Error("No Buffers found");

        item.CommandBuffer[binding] = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_TRANSFER_BIT,
            CommandType.Primary
        );

        if (item.DescriptorSet == null)
            throw Error("No DescriptorSet found");

        let buffer = item.Buffers[binding];

        if (buffer == null)
            throw Error("Empty buffer?");

        item.DescriptorSet.UpdateBuffer(
            item.Buffers[binding],
            binding
        );

        let commandBuffer = item.CommandBuffer[binding];
        if (commandBuffer == null)
            throw Error("cant find command buffer");

        let stageBuffer = item.StagingBuffers[binding];
        if (stageBuffer == null)
            throw Error("Empty stageBuffer?");

        //record command
        item.CommandBuffer[binding].Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT);
        item.CommandBuffer[binding].CopyBuffer(
            item.StagingBuffers[binding],
            item.Buffers[binding]
        );

        item.CommandBuffer[binding].End();

        this._handle.set(key, item);
    }

    SetupImage(
        key: string,
        binding: number,
        size: number,
        width: number, height: number,
        format: VkFormat) {

        let item = this._handle.get(key);

        if (item == null)
            throw new Error("you must insert this key before using it");

        let stageBufferOld = item.StagingBuffers[binding];
        if (stageBufferOld != null && stageBufferOld.size <= size)
            return;

        if (item.Layout == null)
            throw Error("No layout found");

        var device = item.Layout.device;

        let stageBuffer = new VulkanBuffer(
            device,
            size,
            VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_SRC_BIT | VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT,
            VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT | VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT
        );

        let image = new VulkanImage(
            device,
            width,
            height,
            format,
            (
                VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_DST_BIT |
                VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_SRC_BIT |
                VkImageUsageFlagBits.VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT |
                VkImageUsageFlagBits.VK_IMAGE_USAGE_SAMPLED_BIT
            )
        );

        let imageView = new ImageView(
            image,
            VkImageAspectFlagBits.VK_IMAGE_ASPECT_COLOR_BIT
        );

        let sampler = new Sampler(
            image
        );

        let commandBuffer = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_TRANSFER_BIT,
            CommandType.Primary
        );

        this.TransferImageAndUpdateDescriptorSet(key, binding);

        //record command
        commandBuffer.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT);
        commandBuffer.TransferImageLayout(
            image,
            VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL
        );
        commandBuffer.CopyBufferToImage(
            stageBuffer,
            image
        );
        commandBuffer.GenerateMipMaps(image);
        commandBuffer.End();

        item.CommandBuffer[binding] = commandBuffer;
        item.Images[binding] = image;
        item.StagingBuffers[binding] = stageBuffer;
        item.ImageViews[binding] = imageView;
        item.Samplers[binding] = sampler;


        this._handle.set(key, item);
    }

    /// <summary>
    /// bind a buffer to this descriptor set
    /// </summary>
    BindBuffer(key: string, binding: number, data: Float32Array) {

        let item = this._handle.get(key);

        if (item == null)
            throw new Error("you must insert this key before using it");

        if (data == null)
            return;

        let stageBuffer = item.StagingBuffers[binding];
        if (stageBuffer == null)
            return;

        let CommandBuffer = item.CommandBuffer[binding];
        if (CommandBuffer == null)
            return;

        this.SetupBuffers(key, binding, data.byteLength);
        stageBuffer.SetData(data, data.byteLength);
        item.StagingBuffers[binding] = stageBuffer;

        if (item.CommandBuffer != null) {
            this._module.CommandBufferService.SubmitSingle(
                CommandBuffer
            );
        } else {
            throw Error("Cant find CommandBuffer: " + binding);
        }

        this._handle.set(key, item);

    }

    /// <summary>
    /// bind an image to this descriptor set
    /// </summary>
    BindImageParamters(
        key: string,
        binding: number,
        pixels: Float32Array,
        width: number,
        height: number,
        format: VkFormat = VkFormat.VK_FORMAT_R8G8B8A8_UNORM,
        elementPerPixel: number = 1
    ) {
        if (pixels == null)
            return;

        if (width <= 0 || height <= 0 || elementPerPixel <= 0)
            return;

        let item = this._handle.get(key);

        if (item == null)
            throw new Error("you must insert this key before using it");

        let stageBuffer = item.StagingBuffers[binding];
        if (stageBuffer == null)
            return;

        let commandBuffer = item.CommandBuffer[binding];
        if (commandBuffer == null)
            throw new Error("no commandbuffer");

        this.SetupImage(key, binding, pixels.byteLength, width, height, format);
        item.StagingBuffers[binding].SetData(pixels, pixels.byteLength);

        if (item.CommandBuffer != null) {
            this._module.CommandBufferService.SubmitSingle(
                commandBuffer
            );
        } else {
            throw Error("cant find CommandBuffer buffer");
        }

        this._imageNeedsTransfered = true;
        this._handle.set(key, item);
    }

    /// <summary>
    /// Bind a texture to the material
    /// </summary>
    BindImageTexture(
        key: string,
        binding: number,
        texture: Texture,
        format: VkFormat = VkFormat.VK_FORMAT_R8G8B8A8_UNORM
    ) {

        let byteArray = new Float32Array(
            texture.pixels.length * 4
        )

        console.log("BIND TEXTURE TO PIXEL!!")

        for (let i in texture.pixels) {
            console.log(i);/*
            byteArray[0 + i] = this.R;
            byteArray[1 + i] = this.G;
            byteArray[2 + i] = this.B;
            byteArray[3 + i] = this.A;
            texture.pixels*/
        }


        this.BindImageParamters(key,
            binding,
            new Float32Array(),
            texture.width,
            texture.height,
            format);
    }

    BindImage(
        key: string,
        binding: number,
        image: BaseVulkanImage,
        imageView: ImageView
    ) {
        if (image == null)
            return;

        let item = this._handle.get(key);

        if (item == null)
            throw new Error("you must insert this key before using it");

        //un-used variables

        //item.CommandBuffer[binding] = null;
        //item.StagingBuffers[binding] = null;

        item.Images[binding] = image;
        item.ImageViews[binding] = imageView;
        item.Samplers[binding] = new Sampler(
            image
        );

        this.TransferImageAndUpdateDescriptorSet(key, binding);
        this._imageNeedsTransfered = true;

        this._handle.set(key, item);
    }

    /// <summary>
    /// transfers images being used by the mesh to correct layout for rendering
    /// NOTE: you need to submit the command yourself
    /// </summary>
    TransferImages(layout: VkImageLayout = VkImageLayout.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL): CommandBuffer | null {
        if (this._imageNeedsTransfered == false)
            return null;

        var transferCommand = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT,
            CommandType.Primary
        );
        transferCommand.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);
        //transfer images to correct layouts
        for (let [key, value] of this._handle) {
            if (value.Images == null) continue;

            for (let image of value.Images) {
                if (image == null)
                    continue;
                //if (image.Layout.Where(l => l != layout).Count() == 0) continue;

                transferCommand.TransferImageLayout(
                    image,
                    layout
                );
            }
        }
        transferCommand.End();
        this._imageNeedsTransfered = false;
        return transferCommand;
    }

    public Clear() {
        this._handle.clear();
    }
}