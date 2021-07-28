/// This class is used to create a window used by tortuga engine

import { vkAcquireNextImageKHR } from "vulkan-api/generated/1.2.162/win32";
import { Engine } from "../core/engine";
import { Fence } from "./api/fence";
import { NativeWindow } from "./api/native-window";
import { Swapchain } from "./api/swapchain";
import { GraphicsModule } from "./graphics.module";
import { RenderTarget } from "./render-target";
export enum WindowFlags {
    /// <summary>
    /// Set's window to full screen mode
    /// </summary>
    FullScreen = 0,
    /// <summary>
    /// Window should be visible to the user
    /// </summary>
    Shown = 1,
    /// <summary>
    /// Window should be hidden to the user
    /// </summary>
    Hidden = 2,
    /// <summary>
    /// Window should be borderless
    /// </summary>
    Borderless = 3,
    /// <summary>
    /// Window should be resiable
    /// </summary>
    Resizeable = 4,
    /// <summary>
    /// Window should be minimized
    /// </summary>
    Minimized = 5,
    /// <summary>
    /// Window should be maximized
    /// </summary>
    Maximized = 6,
    /// <summary>
    /// Window has grabbed input focus
    /// </summary>
    InputGrabbed = 7,
    /// <summary>
    /// Window has input focus
    /// </summary>
    InputFocused = 8,
    /// <summary>
    /// Window has mouse focus
    /// </summary>
    MouseFocus = 9,
    /// <summary>
    /// Set's window to full screen desktop mode
    /// </summary>
    FullScreenDesktop = 10,
    /// <summary>
    /// Allow window to use high Dpi setting
    /// </summary>
    AllowHighDpi = 11,
    /// <summary>
    /// Window has mouse capture (unrelated to input grabbed)
    /// </summary>
    MouseCapture = 12,
    /// <summary>
    /// Window should always be on top
    /// </summary>
    AlwaysOnTop = 13,
    /// <summary>
    /// Hide window from task bar
    /// </summary>
    SkipTaskbar = 14,
    /// <summary>
    /// Window should be treated as a tooltip
    /// </summary>
    Tooltip = 15,
    /// <summary>
    /// Window should be treated as a popup menu
    /// </summary>
    PopupMenu = 16
}

/// </summary>
export class SystemWindow extends RenderTarget {

    public Windows: SystemWindow[] = [];


    private _graphicsModule: GraphicsModule;
    private _nativeWindow: NativeWindow;
    private _swapchain: Swapchain
    private _fence: Fence;

    get nativeWindow(): NativeWindow {
        return this._nativeWindow;
    }

    get swapchain(): Swapchain {
        return this._swapchain;
    }

    constructor(
        title: string,
        width: number, height: number,
        flags: WindowFlags = (
            WindowFlags.AllowHighDpi |
            WindowFlags.Shown
        )
    ) {
        let primaryDevice = Engine.instance.GetModule(GraphicsModule).graphicsService.PrimaryDevice;
        super(primaryDevice, width, height);
        this.Windows.push(this);

        this._graphicsModule = Engine.instance.GetModule(GraphicsModule);
        this._nativeWindow = new NativeWindow(
            this._graphicsModule.graphicsService,
            title,
            width, height
        );

        this._swapchain = new Swapchain(
            primaryDevice,
            this._nativeWindow
        );

        this._fence = new Fence(primaryDevice);
    }
    /// <summary>
    /// De-Constructor
    /// </summary> 
    destroy() {
        for (let i in this.Windows) {
            let val = this.Windows[i];

            if (val == this)
                delete this.Windows[i];
        }
    }

    /// <summary>
    /// acquire's swapchain image index
    /// </summary>
    /// <returns>image index</returns>
    public AcquireSwapchainImage(): number {
        this._fence.Reset();

        let imageIndex = { $: 0 };

        vkAcquireNextImageKHR(
            this._graphicsModule.graphicsService.PrimaryDevice.handle,
            this._swapchain.handle,
            Number.MAX_SAFE_INTEGER,
            null,
            this._fence.handle,
            imageIndex
        );

        this._fence.Wait();
        return imageIndex.$;
    }
}