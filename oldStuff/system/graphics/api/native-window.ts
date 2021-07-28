import { throws } from "assert";
import { VulkanWindow, VkSurfaceKHR, ResizeEvent, VkInstance } from "vulkan-api/generated/1.2.162/win32";
import { GraphicsService } from "./graphics-service";

export class NativeWindow {

    protected _window: VulkanWindow;
    protected _surface: VkSurfaceKHR = new VkSurfaceKHR();

    get surface(): VkSurfaceKHR {
        return this._surface;
    }
    constructor(graphicsService: GraphicsService
        , title: string, width: number = 480, height: number = 320) {

        this._window = new VulkanWindow({
            width: width,
            height: height,
            title: title
        });

        this._window.onresize = (ev: ResizeEvent) => {
            console.log("on resize!");
        };

        if(graphicsService.handle == null)
            throw Error("handle is empty");

        this.createSurface(graphicsService.handle);

    }

    get width(): number {
        return this._window.width;
    }
    get height(): number {
        return this._window.height;
    }

    set title(val: string) {
        this._window.title = val;
    }

    draw(delta: number): void {
        this._window.pollEvents();
    }

    focus() {
        this._window.focus();
    }

    close(): boolean {
        return this._window.shouldClose();
    }

    createSurface(_instance: VkInstance) {
        this._window.createSurface(_instance, null, this._surface);
    }

    getSurface(): VkSurfaceKHR {
        return this._surface;
    }
    getWindow(): VulkanWindow {
        return this._window;
    }

    requiredVulkanExtensions(): string[] {
        return this._window.getRequiredInstanceExtensions();
    }

    shouldClose(): boolean {
        return this._window.shouldClose();
    }
}