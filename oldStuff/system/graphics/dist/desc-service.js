"use strict";
exports.__esModule = true;
exports.DescriptorService = void 0;
var win32_1 = require("vulkan-api/generated/1.2.162/win32");
var engine_1 = require("../core/engine");
var buffer_1 = require("./api/buffer");
var command_service_1 = require("./api/command-service");
var desc_pool_1 = require("./api/desc-pool");
var desc_set_1 = require("./api/desc-set");
var image_1 = require("./api/image");
var imageview_1 = require("./api/imageview");
var sampler_1 = require("./api/sampler");
var graphics_module_1 = require("./graphics.module");
var DescriptorService = /** @class */ (function () {
    function DescriptorService() {
        this._imageNeedsTransfered = false;
        this._handle = new Map();
        this._module = engine_1.Engine.instance.GetModule(graphics_module_1.GraphicsModule);
    }
    Object.defineProperty(DescriptorService.prototype, "handle", {
        get: function () {
            return this._handle;
        },
        enumerable: false,
        configurable: true
    });
    DescriptorService.prototype.InsertKey = function (key, layout) {
        if (this._handle.has(key))
            return;
        if (layout == null) {
            var value = { StagingBuffers: [], ImageViews: [], Buffers: [], CommandBuffer: [], Images: [], Samplers: [] };
            this._handle.set(key, value);
        }
        else {
            var pool = new desc_pool_1.DescriptorPool(layout, 1);
            var value = { StagingBuffers: [], ImageViews: [], Images: [], Samplers: [], CommandBuffer: [], Buffers: [], Layout: layout, Pool: pool, DescriptorSet: new desc_set_1.DescriptorSet(pool), Amount: layout.bindings.length };
            this._handle.set(key, value);
        }
    };
    DescriptorService.prototype.RemoveKey = function (key) {
        if (this._handle.has(key) == false)
            return;
        this._handle["delete"](key);
    };
    DescriptorService.prototype.TransferImageAndUpdateDescriptorSet = function (key, binding) {
        //update image layout for descriptor set
        var transferImageCommand = this._module.CommandBufferService.GetNewCommand(win32_1.VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT, command_service_1.CommandType.Primary);
        var item = this._handle.get(key);
        if (item == null)
            throw Error("Cant found descriptor by key");
        if (item.Images == null)
            throw Error("No images collection found");
        var imageView = item.ImageViews[binding];
        var image = item.Images[binding];
        var sampler = item.Samplers[binding];
        if (image == null)
            throw Error("No image found");
        if (sampler == null)
            throw Error("No sampler found");
        transferImageCommand.Begin(win32_1.VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);
        transferImageCommand.TransferImageLayout(image, win32_1.VkImageLayout.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL);
        transferImageCommand.End();
        this._module.CommandBufferService.SubmitSingle(transferImageCommand);
        transferImageCommand.Fence.Wait();
        if (item.DescriptorSet == null)
            throw Error("No DescriptorSet found");
        if (imageView == null)
            throw Error("No ImageViews found");
        if (item.Samplers == null)
            throw Error("No Samplers found");
        item.DescriptorSet.UpdateSampledImage(imageView, sampler, binding);
        this._handle.set(key, item);
    };
    DescriptorService.prototype.SetupBuffers = function (key, binding, size) {
        var item = this._handle.get(key);
        if (item == null)
            throw new Error("you must insert this key before using it");
        var stagingBuffer = item.StagingBuffers[binding];
        if (stagingBuffer == null)
            return;
        if (stagingBuffer.size <= size)
            return;
        if (item.Layout == null)
            throw Error("No layout found");
        var device = item.Layout.device;
        item.StagingBuffers[binding] = new buffer_1.VulkanBuffer(device, size, win32_1.VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_SRC_BIT | win32_1.VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT, win32_1.VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT | win32_1.VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT);
        item.Buffers[binding] = new buffer_1.VulkanBuffer(device, size, win32_1.VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT | win32_1.VkBufferUsageFlagBits.VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, win32_1.VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT);
        if (item.CommandBuffer == null)
            throw Error("No Buffers found");
        item.CommandBuffer[binding] = this._module.CommandBufferService.GetNewCommand(win32_1.VkQueueFlagBits.VK_QUEUE_TRANSFER_BIT, command_service_1.CommandType.Primary);
        if (item.DescriptorSet == null)
            throw Error("No DescriptorSet found");
        var buffer = item.Buffers[binding];
        if (buffer == null)
            throw Error("Empty buffer?");
        item.DescriptorSet.UpdateBuffer(buffer, binding);
        var commandBuffer = item.CommandBuffer[binding];
        if (commandBuffer == null)
            throw Error("cant find command buffer");
        var stageBuffer = item.StagingBuffers[binding];
        if (stageBuffer == null)
            throw Error("Empty stageBuffer?");
        //record command
        commandBuffer.Begin(win32_1.VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT);
        commandBuffer.CopyBuffer(stageBuffer, buffer);
        commandBuffer.End();
        item.CommandBuffer[binding] = commandBuffer;
        this._handle.set(key, item);
    };
    DescriptorService.prototype.SetupImage = function (key, binding, size, width, height, format) {
        var item = this._handle.get(key);
        if (item == null)
            throw new Error("you must insert this key before using it");
        var stageBufferOld = item.StagingBuffers[binding];
        if (stageBufferOld != null && stageBufferOld.size <= size)
            return;
        if (item.Layout == null)
            throw Error("No layout found");
        var device = item.Layout.device;
        var stageBuffer = new buffer_1.VulkanBuffer(device, size, win32_1.VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_SRC_BIT | win32_1.VkBufferUsageFlagBits.VK_BUFFER_USAGE_TRANSFER_DST_BIT, win32_1.VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_COHERENT_BIT | win32_1.VkMemoryPropertyFlagBits.VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT);
        var image = new image_1.VulkanImage(device, width, height, format, (win32_1.VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_DST_BIT |
            win32_1.VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_SRC_BIT |
            win32_1.VkImageUsageFlagBits.VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT |
            win32_1.VkImageUsageFlagBits.VK_IMAGE_USAGE_SAMPLED_BIT));
        var imageView = new imageview_1.ImageView(image, win32_1.VkImageAspectFlagBits.VK_IMAGE_ASPECT_COLOR_BIT);
        var sampler = new sampler_1.Sampler(image);
        var commandBuffer = this._module.CommandBufferService.GetNewCommand(win32_1.VkQueueFlagBits.VK_QUEUE_TRANSFER_BIT, command_service_1.CommandType.Primary);
        this.TransferImageAndUpdateDescriptorSet(key, binding);
        //record command
        commandBuffer.Begin(win32_1.VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT);
        commandBuffer.TransferImageLayout(image, win32_1.VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL);
        commandBuffer.CopyBufferToImage(stageBuffer, image);
        commandBuffer.GenerateMipMaps(image);
        commandBuffer.End();
        item.CommandBuffer[binding] = commandBuffer;
        item.Images[binding] = image;
        item.StagingBuffers[binding] = stageBuffer;
        item.ImageViews[binding] = imageView;
        item.Samplers[binding] = sampler;
        this._handle.set(key, item);
    };
    /// <summary>
    /// bind a buffer to this descriptor set
    /// </summary>
    DescriptorService.prototype.BindBuffer = function (key, binding, data) {
        var item = this._handle.get(key);
        if (item == null)
            throw new Error("you must insert this key before using it");
        if (data == null)
            return;
        var stageBuffer = item.StagingBuffers[binding];
        if (stageBuffer == null)
            return;
        var CommandBuffer = item.CommandBuffer[binding];
        if (CommandBuffer == null)
            return;
        this.SetupBuffers(key, binding, data.byteLength);
        stageBuffer.SetData(data, data.byteLength);
        item.StagingBuffers[binding] = stageBuffer;
        if (item.CommandBuffer != null) {
            this._module.CommandBufferService.SubmitSingle(CommandBuffer);
        }
        else {
            throw Error("Cant find CommandBuffer: " + binding);
        }
        this._handle.set(key, item);
    };
    /// <summary>
    /// bind an image to this descriptor set
    /// </summary>
    DescriptorService.prototype.BindImageParamters = function (key, binding, pixels, width, height, format, elementPerPixel) {
        if (format === void 0) { format = win32_1.VkFormat.VK_FORMAT_R8G8B8A8_UNORM; }
        if (elementPerPixel === void 0) { elementPerPixel = 1; }
        if (pixels == null)
            return;
        if (width <= 0 || height <= 0 || elementPerPixel <= 0)
            return;
        var item = this._handle.get(key);
        if (item == null)
            throw new Error("you must insert this key before using it");
        var stageBuffer = item.StagingBuffers[binding];
        if (stageBuffer == null)
            return;
        var commandBuffer = item.CommandBuffer[binding];
        if (commandBuffer == null)
            throw new Error("no commandbuffer");
        this.SetupImage(key, binding, pixels.byteLength, width, height, format);
        item.StagingBuffers[binding].SetData(pixels, pixels.byteLength);
        if (item.CommandBuffer != null) {
            this._module.CommandBufferService.SubmitSingle(commandBuffer);
        }
        else {
            throw Error("cant find CommandBuffer buffer");
        }
        this._imageNeedsTransfered = true;
        this._handle.set(key, item);
    };
    /// <summary>
    /// Bind a texture to the material
    /// </summary>
    DescriptorService.prototype.BindImageTexture = function (key, binding, texture, format) {
        if (format === void 0) { format = win32_1.VkFormat.VK_FORMAT_R8G8B8A8_UNORM; }
        var byteArray = new Float32Array(texture.pixels.length * 4);
        console.log("BIND TEXTURE TO PIXEL!!");
        for (var i in texture.pixels) {
            console.log(i); /*
            byteArray[0 + i] = this.R;
            byteArray[1 + i] = this.G;
            byteArray[2 + i] = this.B;
            byteArray[3 + i] = this.A;
            texture.pixels*/
        }
        this.BindImageParamters(key, binding, new Float32Array(), texture.width, texture.height, format);
    };
    DescriptorService.prototype.BindImage = function (key, binding, image, imageView) {
        if (image == null)
            return;
        var item = this._handle.get(key);
        if (item == null)
            throw new Error("you must insert this key before using it");
        //un-used variables
        //item.CommandBuffer[binding] = null;
        //item.StagingBuffers[binding] = null;
        item.Images[binding] = image;
        item.ImageViews[binding] = imageView;
        item.Samplers[binding] = new sampler_1.Sampler(image);
        this.TransferImageAndUpdateDescriptorSet(key, binding);
        this._imageNeedsTransfered = true;
        this._handle.set(key, item);
    };
    /// <summary>
    /// transfers images being used by the mesh to correct layout for rendering
    /// NOTE: you need to submit the command yourself
    /// </summary>
    DescriptorService.prototype.TransferImages = function (layout) {
        if (layout === void 0) { layout = win32_1.VkImageLayout.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL; }
        if (this._imageNeedsTransfered == false)
            return null;
        var transferCommand = this._module.CommandBufferService.GetNewCommand(win32_1.VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT, command_service_1.CommandType.Primary);
        transferCommand.Begin(win32_1.VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);
        //transfer images to correct layouts
        for (var _i = 0, _a = this._handle; _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value.Images == null)
                continue;
            for (var _c = 0, _d = value.Images; _c < _d.length; _c++) {
                var image = _d[_c];
                if (image == null)
                    continue;
                //if (image.Layout.Where(l => l != layout).Count() == 0) continue;
                transferCommand.TransferImageLayout(image, layout);
            }
        }
        transferCommand.End();
        this._imageNeedsTransfered = false;
        return transferCommand;
    };
    DescriptorService.prototype.Clear = function () {
        this._handle.clear();
    };
    return DescriptorService;
}());
exports.DescriptorService = DescriptorService;
