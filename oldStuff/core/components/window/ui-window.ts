"use strict";

import { ResizeEvent, VkInstance, VkSurfaceKHR, VulkanWindow } from "vulkan-api/generated/1.2.162/win32";
import { RenderPipelineObject } from "../../render/render-pipeline-object";

export class UIWindow extends RenderPipelineObject {
    protected _window: VulkanWindow;
    protected _surface: VkSurfaceKHR = new VkSurfaceKHR();
    constructor(title: string, width: number = 480, height: number = 320)
    {
        super();

        this._window = new VulkanWindow({
            width: width,
            height: height,
            title: title
         });

         this._window.onresize = (ev: ResizeEvent) => {
             console.log("on resize!");
         };

    }

    set title(val: string){
        this._window.title = val;
    }
    
    draw(delta: number) : void {
        this._window.pollEvents();
    }

    focus(){
        this._window.focus();
    }

    close() : boolean{
        return this._window.shouldClose();
    }

    attachToSurface(_instance: VkInstance){
         this._window.createSurface(_instance, null, this._surface);
    }

    getSurface() : VkSurfaceKHR
    {
        return this._surface;
    }
    getWindow(): VulkanWindow{
        return this._window;
    }

    requiredVulkanExtensions(): string[] {
        return this._window.getRequiredInstanceExtensions();
    }

    shouldClose() : boolean{
        return this._window.shouldClose();
    }
}