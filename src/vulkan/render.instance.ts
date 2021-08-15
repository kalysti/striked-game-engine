import { performance } from 'perf_hooks';
import { VkApplicationInfo, vkBeginCommandBuffer, VkClearColorValue, VkClearDepthStencilValue, VkClearValue, vkCmdBeginRenderPass, vkCmdBindDescriptorSets, vkCmdBindIndexBuffer, vkCmdBindPipeline, vkCmdBindVertexBuffers, vkCmdDraw, vkCmdDrawIndexed, vkCmdEndRenderPass, vkCmdSetScissor, vkCmdSetViewport, VkCommandBufferBeginInfo, vkCreateInstance, vkDestroySwapchainKHR, vkDeviceWaitIdle, vkEndCommandBuffer, vkEnumerateInstanceLayerProperties, VkExtent2D, VkInstance, VkInstanceCreateInfo, VkLayerProperties, VkOffset2D, VkRect2D, VkRenderPassBeginInfo, VkSurfaceKHR, VkViewport, VK_API_VERSION_1_2, VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_EXT_DEBUG_REPORT_EXTENSION_NAME, VK_IMAGE_ASPECT_DEPTH_BIT, VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT, VK_INDEX_TYPE_UINT16, VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME, VK_MAKE_VERSION, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_SUBPASS_CONTENTS_INLINE } from 'vulkan-api';
import { Scene } from '../scene/scene';
import { RenderableRenderer } from '../modules/graphics/renderer';
import { Texture2D } from '../resources/2d/Texture2D';
import { ASSERT_VK_RESULT, createDescImageInfo, createDescSet } from '../utils/helpers';
import { RenderWindow } from './window';
import { BufferManager } from './buffer.manager';
import { CommandBuffer } from './command.buffers';
import { CommandPool } from './command.pool';
import { Frame } from './frame';
import { Framebuffer } from './framebuffer';
import { LogicalDevice } from './logical.device';
import { PhysicalDevice } from './physical.device';
import { Pipeline } from './pipeline';
import { RenderPass } from './renderpass';
import { Swapchain } from './swapchain';
import { VulkanTextureBuffer } from './texture.buffer';
import { ObjectId } from '@engine/types';
import { RenderableNode } from '@engine/nodes';
import { BaseNode } from '@engine/core';
import { EntityObject } from '@engine/resources';
import { BindInterfaceType } from '@engine/nodes/renderable';

export class RenderInstance {

    private _id = new ObjectId();

    get id(): ObjectId {
        return this._id;
    }

    window: RenderWindow;
    private currentScene: Scene;
    instance: VkInstance = new VkInstance();
    private surface: VkSurfaceKHR = new VkSurfaceKHR();
    logicalDevice: LogicalDevice;
    physicalDevice: PhysicalDevice;
    private bufferManager: BufferManager;

    private swapchain: Swapchain;
    private renderPass: RenderPass;
    commandPool: CommandPool;
    private commandBuffers: CommandBuffer;
    private framebuffer: Framebuffer;
    private pipeline: Pipeline;
    private frame: Frame;
    private placeholderTexture = new Texture2D();

    setIsDirty(t: EntityObject) {
        this.bufferManager.setIsDirty(t);
    }

    deltaTime: number = 0;
    frameCounter: number = 0;
    lastFPS: number = 0;
    lasttime = 0;
    lastFpsTime = 0;
    runningLoop = false;

    private getLayers(): string[] {
        let amountOfLayers = { $: 0 };
        vkEnumerateInstanceLayerProperties(amountOfLayers, null);
        let layers = [...Array(amountOfLayers.$)].map(() => new VkLayerProperties());
        vkEnumerateInstanceLayerProperties(amountOfLayers, layers);
        return layers.map(df => df.layerName);
    }


    constructor(window: RenderWindow) {
        this.window = window;
        this.getLayers();

        // app info
        let appInfo = new VkApplicationInfo();
        appInfo.pApplicationName = 'Hello!';
        appInfo.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
        appInfo.pEngineName = 'No Engine';
        appInfo.engineVersion = VK_MAKE_VERSION(1, 0, 0);
        appInfo.apiVersion = VK_API_VERSION_1_2;

        // create info
        let createInfo = new VkInstanceCreateInfo();
        createInfo.pApplicationInfo = appInfo;

        let instanceExtensions = window.getRequiredInstanceExtensions();
        instanceExtensions.push(VK_EXT_DEBUG_REPORT_EXTENSION_NAME.toString());
        instanceExtensions.push(VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME.toString());

        createInfo.enabledExtensionCount = instanceExtensions.length;
        createInfo.ppEnabledExtensionNames = instanceExtensions;
        createInfo.enabledLayerCount = 0;

        // validation layers
        let validationLayers = ['VK_LAYER_KHRONOS_validation'];
        createInfo.enabledLayerCount = validationLayers.length;
        createInfo.ppEnabledLayerNames = validationLayers;

        let result = vkCreateInstance(createInfo, null, this.instance);
        ASSERT_VK_RESULT(result);

        this.createSurface();
        this.createDevice();

        this.swapchain = new Swapchain(this.logicalDevice, this.surface);
        this.renderPass = new RenderPass(this.logicalDevice);
        this.bufferManager = new BufferManager(this);

        this.window.onWindowResize.subscribe(e => {
            this.runningLoop = false;
            if (this.currentScene != null) {
                this.currentScene.viewport.width = e.width;
                this.currentScene.viewport.height = e.height;

                for (let node of this.currentScene.getNodesOfType(BaseNode)) {
                    node.onResize(e);
                }
            }

            this.recreateSwapchain();
        });

        this.commandPool = new CommandPool(this.logicalDevice);

        this.createDepthTexture();

        this.bufferManager.updateDirtyEntities();
        this.framebuffer = new Framebuffer(this.logicalDevice, this.swapchain, this.renderPass, this.depthTexture);
        this.pipeline = new Pipeline(this.logicalDevice, this.renderPass);
        this.commandBuffers = new CommandBuffer(this.logicalDevice, this.swapchain, this.commandPool, this.renderPass, this.framebuffer, this.pipeline);

    }

    private depthTexture: VulkanTextureBuffer;
    createDepthTexture() {

        this.depthTexture = new VulkanTextureBuffer(this);
        this.depthTexture.create(this.logicalDevice.depthFormat, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT);
        this.depthTexture.createImageView(this.logicalDevice.depthFormat, VK_IMAGE_ASPECT_DEPTH_BIT);
        this.depthTexture.setNewLayout(VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL);
    }

    createSurface() {
        let result = this.window.createSurface(this.instance, null, this.surface);
        ASSERT_VK_RESULT(result);
    }

    createDevice() {
        this.physicalDevice = new PhysicalDevice(this.instance, this.surface);
        this.logicalDevice = new LogicalDevice(this.physicalDevice);
    }


    updateDescription(meshes: RenderableNode[]) {
        for (let mesh of meshes) {

            let info = mesh.getPipelineName();
            if (info == null)
                throw Error("Cant find Renderable info for " + mesh.constructor.name);

            let buffers = [];
            for (let layout of mesh.getBindings().filter(df => df.type == BindInterfaceType.UNIFORM || df.type == BindInterfaceType.TEXTURE)) {

                let attribute = mesh.getAttribute(layout.name);

                if (layout.type == BindInterfaceType.TEXTURE) {

                    if (attribute == null || attribute == undefined) {
                        let value = this.bufferManager.getTextureBuffer(this.placeholderTexture.id.toString());
                        buffers.push(createDescImageInfo(value.buffer, layout.bind, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER));
                    }
                    else if (attribute instanceof Texture2D) {
                        let value = this.bufferManager.getTextureBuffer(attribute.id.toString());
                        buffers.push(createDescImageInfo(value.buffer, layout.bind, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER));
                    }
                    else {
                        throw Error(layout.name + " is not a valid texture2d object.");
                    }
                }
                else {

                    if (attribute != null || attribute instanceof EntityObject) {
                        let value = this.bufferManager.getBuffer(attribute.id.toString());
                        buffers.push(createDescSet(value.buffer, layout.bind, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER));
                    }
                    else {
                        throw Error(layout.name + " is not a valid entity object.");
                    }
                }
            }

            this.pipeline.updateDescriptions(info, mesh, buffers);
        }
    }

    getAllChilds(nodes: BaseNode[], list: BaseNode[]) {

        for (let child of nodes) {
            list.push(child)
            this.getAllChilds(child.getChildsOfType(BaseNode), list);
        }
    }

    getRenderables(nodes: BaseNode[], list: RenderableNode[]) {

        for (let child of nodes) {
            if (child instanceof RenderableNode) {
                list.push(child)
            }
            this.getRenderables(child.getChildsOfType(BaseNode), list);
        }
    }

    drawFrame() {

        if (this.window.shouldClose()) {
            this.runningLoop = false;
            return;
        }
        
        if(this.runningLoop == false)
            return;

        let t = performance.now();
        let diff: number = t - this.lasttime;
        let diff2: number = t - this.lastFpsTime;

        this.deltaTime = diff / 1000;

        if (diff2 >= 1000.0) {
            this.lastFPS = this.frameCounter;
            this.frameCounter = 0;
            this.lastFpsTime = t;
        }

        this.lasttime = t;
        this.frameCounter++;

        this.window.pollEvents();
        if (this.currentScene != null) {
            for (let obj of this.currentScene.getNodesOfType(BaseNode)) {
                obj.onUpdate(this.deltaTime);
            }
        }

        this.bufferManager.updateDirtyEntities();
        this.frame.draw();
    }


    recreateSwapchain() {
        this.bufferManager.updateDirtyEntities();

        let oldSwapChain = this.swapchain.handle;

        this.physicalDevice.getSurfaceCaps();
        vkDeviceWaitIdle(this.logicalDevice.handle);

        this.depthTexture.free();


        this.commandBuffers.destroy();
        this.framebuffer.destroy();
        this.renderPass.destroy();
        this.swapchain.destroy();
        this.commandPool.destroy();

        this.commandPool.create();


        this.createDepthTexture();

        this.swapchain.create();
        this.renderPass.create();
        this.framebuffer.depthTexture = this.depthTexture;
        this.framebuffer.create();
        this.commandBuffers.create();

        vkDestroySwapchainKHR(this.logicalDevice.handle, oldSwapChain, null);
        

        if (this.currentScene != null) {
            this.drawMeshes();
        }

        this.runningLoop = true;
    }

    drawMeshes() {

        this.bufferManager.updateDirtyEntities();


        let values: RenderableNode[] = [];
        this.getRenderables(this.currentScene.getNodesOfType(BaseNode), values);

        for (let ii = 0; ii < this.commandBuffers.cmdBuffers.length; ++ii) {
            let cmdBuffer = this.commandBuffers.cmdBuffers[ii];

            //begin command buffer
            let cmdBufferBeginInfo = new VkCommandBufferBeginInfo();
            cmdBufferBeginInfo.flags = VK_COMMAND_BUFFER_USAGE_SIMULTANEOUS_USE_BIT;

            let result = vkBeginCommandBuffer(cmdBuffer, cmdBufferBeginInfo);
            ASSERT_VK_RESULT(result);

            //begin render pass
            let clearValue = new VkClearValue();
            clearValue.color = new VkClearColorValue();
            clearValue.color.float32 = [0, 0, 0, 1];

            let depthClearValue = new VkClearValue();

            depthClearValue.depthStencil = new VkClearDepthStencilValue();
            depthClearValue.depthStencil.depth = 1.0;
            depthClearValue.depthStencil.stencil = 0.0;

            ;
            let renderPassBeginInfo = new VkRenderPassBeginInfo();
            renderPassBeginInfo.renderPass = this.renderPass.handle;
            renderPassBeginInfo.framebuffer = this.framebuffer.handleBuffers[ii];
            renderPassBeginInfo.renderArea.offset.x = 0;
            renderPassBeginInfo.renderArea.offset.y = 0;
            renderPassBeginInfo.renderArea.extent.width = this.window.width;
            renderPassBeginInfo.renderArea.extent.height = this.window.height;
            renderPassBeginInfo.clearValueCount = 2;
            renderPassBeginInfo.pClearValues = [clearValue, depthClearValue];
            vkCmdBeginRenderPass(cmdBuffer, renderPassBeginInfo, VK_SUBPASS_CONTENTS_INLINE);

            //draw meshes
            for (let mesh of values) {
                let pipeName = mesh.getPipelineName();

                let pipe = this.pipeline.pipelineList.get(pipeName);
                let layout = this.pipeline.pipelineLayouts.get(pipeName);

                vkCmdBindPipeline(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, pipe);

                let meshRenderer = new RenderableRenderer();
                mesh.onRender(meshRenderer);

                for (let vertex of meshRenderer.vertexBuffers) {
                    let buffer = this.bufferManager.getBuffer(vertex);
                    vkCmdBindVertexBuffers(cmdBuffer, 0, 1, [buffer.buffer.handle], new BigUint64Array([0n]));
                }

                let index = meshRenderer.indexBuffer;

                if (index != null) {
                    let buffer = this.bufferManager.getBuffer(index);
                    vkCmdBindIndexBuffer(cmdBuffer, buffer.buffer.handle, 0n, VK_INDEX_TYPE_UINT16);
                }

                vkCmdBindDescriptorSets(cmdBuffer, VK_PIPELINE_BIND_POINT_GRAPHICS, layout, 0, 1, [mesh.descriptorSet], 0, null);

                //set viewport
                let viewport = new VkViewport();
                viewport.x = 0;
                viewport.y = 0;
                viewport.width = this.window.width;
                viewport.height = this.window.height;
                viewport.minDepth = 0.0;
                viewport.maxDepth = 1.0;
                vkCmdSetViewport(cmdBuffer, 0, 1, [viewport]);

                //set scissor
                let scissorOffset = new VkOffset2D();
                scissorOffset.x = 0;
                scissorOffset.y = 0;

                let scissorExtent = new VkExtent2D();
                scissorExtent.width = this.window.width;
                scissorExtent.height = this.window.height;

                let scissor = new VkRect2D();
                scissor.offset = scissorOffset;
                scissor.extent = scissorExtent;
                vkCmdSetScissor(cmdBuffer, 0, 1, [scissor]);

                for (let drawIndex of meshRenderer.indexDraws) {
                    vkCmdDrawIndexed(cmdBuffer, drawIndex.length, 1, 0, drawIndex.offset, 0);
                }

                for (let draw of meshRenderer.draws) {
                    vkCmdDraw(cmdBuffer, draw.length, 1, 0, 0);
                }

            }

            //end render pass
            vkCmdEndRenderPass(cmdBuffer);

            //end command buffer
            result = vkEndCommandBuffer(cmdBuffer);
            ASSERT_VK_RESULT(result);
        }
    }


    updateWindowTitle() {
        let text = this.deltaTime.toPrecision(8) + 's (' + this.lastFPS + ' fps)';
        if (this.currentScene != null) {
            let cam = this.currentScene.getActiveCamera();
            if (cam != null) this.window.title = text + ' - cam: ' + cam.position.toString();
            else {
                this.window.title = text;
            }
        } else this.window.title = text;
    }

    loadScene(scene: Scene) {
        scene.viewport.width = this.window.width;
        scene.viewport.height = this.window.height;
        this.currentScene = scene;
        this.window.currentScene = scene;

        this.createBuffers();

        let values: RenderableNode[] = [];
        this.getRenderables(this.currentScene.getNodesOfType(BaseNode), values);
        this.updateDescription(values);

        for (let node of this.currentScene.getNodesOfType(BaseNode)) {
            node.onEnable();
        }

        if (this.currentScene != null) {
            this.drawMeshes();
        }

        //init frame
        this.frame = new Frame(this.logicalDevice, this.swapchain, this.commandBuffers);

        //allow running loop
        this.runningLoop = true;

        this.titleUpdateTimer = setInterval(() => {
            this.updateWindowTitle();
        }, 1000);

    }

    titleUpdateTimer: NodeJS.Timeout;


    createBuffers() {

        this.placeholderTexture.loadFromFilePath('./assets/sponza/dummy.png');

        this.bufferManager.createTextureBuffer(this.placeholderTexture);
        this.bufferManager.createUniformBuffer(this.window.extentEntity);

        let values: RenderableNode[] = [];
        this.getAllChilds(this.currentScene.getNodesOfType(BaseNode), values);

        for (let node of values) {
            for (let attribute of node.getBindings()) {

                if (node[attribute.name] == null)
                    continue;

                let value = node[attribute.name] as EntityObject;
                if (value == null && value != null)
                    continue;

                if (attribute.type == BindInterfaceType.UNIFORM) {

                    this.bufferManager.createUniformBuffer(value);
                }
                else if (attribute.type == BindInterfaceType.TEXTURE) {

                    if (value instanceof Texture2D) {
                        this.bufferManager.createTextureBuffer(value as Texture2D);
                    }
                }

                else if (attribute.type == BindInterfaceType.INDEX) {
                    this.bufferManager.createIndexBuffer(value);
                }

                else if (attribute.type == BindInterfaceType.VERTEX) {
                    this.bufferManager.createVertexBuffer(value);
                }
            }

        }
    }
}