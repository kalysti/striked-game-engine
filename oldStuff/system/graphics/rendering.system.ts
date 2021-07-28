import { VkCommandBufferUsageFlagBits, VkImageLayout, VkQueueFlagBits, VkSubpassContents, VulkanWindow } from "vulkan-api/generated/1.2.162/win32";
import { BaseSystem } from "../core/base.system";
import { Engine } from "../core/engine";
import { CommandBuffer } from "./api/command-buffer";
import { CommandType } from "./api/command-service";
import { Device } from "./api/device";
import { RenderPassDefault } from "./api/render-pass";
import { Semaphore } from "./api/semaphore";
import { GraphicsModule } from "./graphics.module";
import { Camera } from "./nodes/camera";
import { Light } from "./nodes/light";
import { SystemWindow } from "./SystemWindow";

export interface WindowResult {
    window: SystemWindow;
    index: number;
}
export class RenderingSystem extends BaseSystem {
    private _module: GraphicsModule | null = null;
    private _device: Device | null = null;
    private _renderCommand: CommandBuffer | null = null;
    private _deferredCommand: CommandBuffer | null = null;
    private _presentCommand: CommandBuffer | null = null;
    private _transferCommandSemaphore: Semaphore | null = null;
    private _renderCommandSemaphore: Semaphore | null = null;
    private _defferedCommandSemaphore: Semaphore | null = null;
    private _presentCommandSemaphore: Semaphore | null = null;

    override onEnable() {
        this._module = Engine.instance.GetModule(GraphicsModule);
        this._device = this._module.graphicsService.PrimaryDevice;
        if (this._module.CommandBufferService == null)
            throw new Error("No command buffer service");

        this._renderCommand = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT,
            CommandType.Primary
        );

        this._deferredCommand = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT,
            CommandType.Primary
        );

        this._presentCommand = this._module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT,
            CommandType.Primary
        );

        // create semaphore for syncing commands
   //     this._transferCommandSemaphore = new Semaphore(this._device);
        this._renderCommandSemaphore = new Semaphore(this._device);
        this._defferedCommandSemaphore = new Semaphore(this._device);
        this._presentCommandSemaphore = new Semaphore(this._device);
    }


    override beforeUpdate() {

        /*
        var instanced = new Dictionary<KeyValuePair<Material, Mesh>, List<MeshRenderer>>();
        foreach(var meshRenderer in MyScene.GetComponents<MeshRenderer>())
        {
            if (meshRenderer.Material.Instanced == false)
                continue;

            var key = new KeyValuePair<Material, Mesh>(
                meshRenderer.Material,
                meshRenderer.Mesh
            );
            if (instanced.ContainsKey(key) == false)
                instanced[key] = new List<MeshRenderer>();

            instanced[key].Add(meshRenderer);
        }
        return instanced;*/
    }

    override update(delta: number) {

        console.log("RUN UPDATE!!");

        var cameras = this.MyScene.getNodesByType(Camera);
        var lights = this.MyScene.getNodesByType(Light);
        var transferCommands: CommandBuffer[] = [];
        var meshRenderers: [] = [];

        //var cameraTasks = new List<Task>();
        let windows: SystemWindow[] = [];
        for (let camera of cameras) {

            var window = camera.RenderTarget as SystemWindow;
            if (window != null) {
                windows.push( window );
            }
            else {
                throw Error("No render Target: " + (camera as Object).constructor.name);
            }
        }

        this._renderCommand?.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);
        this._deferredCommand?.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);
        this._presentCommand?.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);

        //var cameraTasks = new List<Task>();
        for (let camera of cameras) {

            // update camera descriptor sets
            camera.UpdateDescriptorSets();

            // update lighting information
            camera.UpdateLights(lights.map(f => f as Light));

            let attachmentCount = 0;
            if (camera.mrtFramebuffer == null)
                throw Error("No mrt frame buffer");


            for (let attachment of camera.mrtFramebuffer.renderPass.attachments) {
                if (attachment.format != RenderPassDefault.format) continue;

                // transfer image layout to color attachment optimial
                // used in render command
                this._renderCommand?.TransferImageLayout(
                    camera.mrtFramebuffer.images[attachmentCount],
                    VkImageLayout.VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL
                );
                // transfer image layout to shader read only optimal
                // used in deffered command
                this._deferredCommand?.TransferImageLayout(
                    camera.mrtFramebuffer.images[attachmentCount],
                    VkImageLayout.VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL
                );
                // transfer image layout to color attachment optimal
                // used in deffered command
                this._presentCommand?.TransferImageLayout(
                    camera.mrtFramebuffer.images[attachmentCount],
                    VkImageLayout.VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL
                );
                attachmentCount++;
            }


         /*   this._renderCommand?.BeginRenderPass(
                camera.mrtFramebuffer,
                VkSubpassContents.VK_SUBPASS_CONTENTS_SECONDARY_COMMAND_BUFFERS
            );
*/
            var secondaryDrawCommands: CommandBuffer[] = [];
           // this._renderCommand?.EndRenderPass();


            if (camera.defferedFramebuffer == null)
                throw Error("camera.defferedFramebuffer  is null");

            if (this._deferredCommand == null)
                throw Error("_deferredCommand  is null");


            this._deferredCommand.BeginRenderPass(
                camera.defferedFramebuffer,
                VkSubpassContents.VK_SUBPASS_CONTENTS_INLINE
            );

           this._deferredCommand.BindDescriptorSets(
                Camera.defferedPipeline,
                camera.MrtDescriptorSets
            );
                  
            this._deferredCommand.BindPipeline(Camera.defferedPipeline);

            this._deferredCommand.SetScissor(
                0, 0,
                camera.defferedFramebuffer.width,
                camera.defferedFramebuffer.height
            );
            this._deferredCommand.SetViewport(
                0, 0,
                camera.defferedFramebuffer.width,
                camera.defferedFramebuffer.height
            );

         
            console.log("STTARTTT");

            this._deferredCommand.Draw(6, 1);
            this._deferredCommand.EndRenderPass();


            if (camera.defferedFramebuffer == null)
                throw Error("camera.defferedFramebuffer  is null");

            if (this._deferredCommand == null)
                throw Error("_deferredCommand  is null");


            this._deferredCommand.BeginRenderPass(
                camera.defferedFramebuffer,
                VkSubpassContents.VK_SUBPASS_CONTENTS_INLINE
            );

            this._deferredCommand.EndRenderPass();


            if (camera.RenderTarget != null) {
                this._presentCommand?.TransferImageLayout(
                    camera.defferedFramebuffer.images[0],
                    VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL
                );
                this._presentCommand?.TransferImageLayout(
                    camera.RenderTarget.RenderedImage,
                    VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL
                );
                // copy image from camera framebuffer to render target
                if (camera.defferedFramebuffer.images[0].handle != null && camera.RenderTarget.RenderedImage.handle != null) {
                    this._presentCommand?.BlitImage(
                        camera.defferedFramebuffer.images[0].handle,
                        camera.defferedFramebuffer.images[0].format,
                        camera.defferedFramebuffer.images[0].layout[0],
                        0, 0,
                        camera.defferedFramebuffer.width,
                        camera.defferedFramebuffer.height,
                        0,
                        camera.RenderTarget.RenderedImage.handle,
                        camera.RenderTarget.RenderedImage.format,
                        camera.RenderTarget.RenderedImage.layout[0],
                        0, 0,
                        camera.RenderTarget.RenderedImage.width,
                        camera.RenderTarget.RenderedImage.height,
                        0
                    );
                }
                else throw Error("camera.defferedFramebuffer.images[0].handle  is null");
            }

            else throw Error("no render target for camera found.");
        }


        this._renderCommand?.End();
        this._deferredCommand?.End();


        var transformCommandSemaphores: Semaphore[] = [];
        transferCommands = transferCommands.filter(t => t != null);

        if (transferCommands.length > 0) {
            // submit transfer command
/*
            if (this._transferCommandSemaphore != null) {
                this._module?.CommandBufferService.Submit(
                    transferCommands,
                    [this._transferCommandSemaphore]
                );
                transformCommandSemaphores.push(this._transferCommandSemaphore);
            }*/
        }

        if (this._renderCommand != null && this._renderCommandSemaphore != null) {
            // submit render commnad
            this._module?.CommandBufferService.Submit(
                [this._renderCommand],
                [this._renderCommandSemaphore],
                transformCommandSemaphores
            );
        }

        if (this._deferredCommand != null && this._defferedCommandSemaphore != null && this._renderCommandSemaphore != null) {

            // submit deffered command
            this._module?.CommandBufferService.Submit(
                [this._deferredCommand],
                [this._defferedCommandSemaphore],
                [this._renderCommandSemaphore]
            );
        }

        if (this._presentCommand == null)
            throw Error("Render _presentCommand not found");

        let indexes: number[] = [];

        for (let u in windows) {

            let win = windows[u];
            indexes[u] =  win.AcquireSwapchainImage();
            let swapchainIndex = indexes[u];

            let swapImg = win.swapchain.images[swapchainIndex];
            let swapHandle = swapImg.handle;

            if (win.RenderedImage.handle == null || swapHandle == null)
                throw Error("Render image handle nulled");

            win.RenderedImage = this._presentCommand.TransferImageLayout(
                win.RenderedImage,
                VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_SRC_OPTIMAL
            );

            swapImg = this._presentCommand.TransferImageLayout(
                swapImg,
                VkImageLayout.VK_IMAGE_LAYOUT_TRANSFER_DST_OPTIMAL
            );

            if (win.RenderedImage.handle == null)
                throw Error("No handle found");


            this._presentCommand.BlitImage(
                win.RenderedImage.handle,
                win.RenderedImage.format,
                win.RenderedImage.layout[0],
                0, 0,
                win.RenderedImage.width,
                win.RenderedImage.height,
                0,
                swapHandle,
                win.swapchain.images[swapchainIndex].format,
                win.swapchain.images[swapchainIndex].layout[0],
                0, 0,
                win.swapchain.SurfaceExtent.width,
                win.swapchain.SurfaceExtent.height,
                0
            );

            swapImg = this._presentCommand.TransferImageLayout(
                swapImg,
                VkImageLayout.VK_IMAGE_LAYOUT_PRESENT_SRC_KHR
            );

            windows[u].swapchain.images[swapchainIndex] = swapImg;
        }

        if (this._presentCommandSemaphore == null)
            throw Error("this._presentCommandSemaphore  cant be empty");


        if (this._defferedCommandSemaphore == null)
            throw Error("this._defferedCommandSemaphore  cant be empty");


        this._presentCommand.End();

        this._module?.CommandBufferService.Submit(
            [this._presentCommand],
            [this._presentCommandSemaphore],
            [this._defferedCommandSemaphore]
        );

        for (let u in windows) {

            let win = windows[u];
            let index = indexes[u];

            for (let img of win.swapchain.images) {
                console.log("["+img.id+"] layout " + img.layout);
            }

            this._module?.CommandBufferService.Present(
                win.swapchain,
                index,
                [this._presentCommandSemaphore]
            );
           
        }
    
    }


    override afterUpdate() {
        this._presentCommand?.Fence.Wait();
    }
}