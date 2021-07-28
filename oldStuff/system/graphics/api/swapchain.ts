import clamp from "clamp";
import { VkColorSpaceKHR, VkCommandBufferUsageFlagBits, VkCompositeAlphaFlagBitsKHR, vkCreateSwapchainKHR, VkExtent2D, VkFormat, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, vkGetSwapchainImagesKHR, VkImage, VkImageAspectFlagBits, VkImageLayout, VkImageUsageFlagBits, VkPresentModeKHR, VkQueueFlagBits, VkResult, VkSharingMode, VkStructureType, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSwapchainCreateInfoKHR, VkSwapchainKHR } from "vulkan-api/generated/1.2.162/win32";
import { Engine } from "../../../system/core/engine";
import { GraphicsModule } from "../graphics.module";
import { CommandType } from "./command-service";
import { Device } from "./device";
import { BaseVulkanImage, VulkanImage, VulkanImageEmpty } from "./image";
import { ImageView } from "./imageview";
import { NativeWindow } from "./native-window";
import { QueueFamily } from "./queue-family";


export class Swapchain {
    private _device: Device;
    private _window: NativeWindow;
    private _presentQueueFamily: QueueFamily;
    private _surfaceCapabilities: VkSurfaceCapabilitiesKHR;
    private _supportedSurfaceFormats: VkSurfaceFormatKHR[] = [];
    private _supportedPresentModes: Int32Array;
    private _surfaceFormat: VkSurfaceFormatKHR | null = null;
    private _surfacePresentMode: VkPresentModeKHR;
    private _surfaceExtent: VkExtent2D;
    private _handle: VkSwapchainKHR | null = null;
    private _images: BaseVulkanImage[] = [];
    private _imageViews: ImageView[] = [];
    private _depthImage: BaseVulkanImage | null = null;
    private _depthImageView: ImageView | null = null;

    get handle(): VkSwapchainKHR | null {
        return this._handle;
    }

    get PresentQueueFamily(): QueueFamily {
        return this._presentQueueFamily;
    }
    get images(): BaseVulkanImage[] {
        return this._images;
    }

    get SurfaceExtent(): VkExtent2D {
        return this._surfaceExtent;
    }

    constructor(device: Device, window: NativeWindow) {
        this._device = device;
        this._window = window;

        //get present queue
        this._presentQueueFamily = this.GetQueueFamilyWithPresentationSupport(
            device,
            window
        );

        //get surface capabilities
        this._surfaceCapabilities = this.GetSurfaceCapabilities(
            device,
            window
        );

        //get surface format support
        this._supportedSurfaceFormats = this.GetSupportedSurfaceFormats(
            device,
            window
        );

        //get present mode support
        this._supportedPresentModes = this.GetSupportedPresentModes(
            device,
            window
        );

        //choose best surface format
        if (
            this._supportedSurfaceFormats.length == 1 &&
            this._supportedSurfaceFormats[0].format == VkFormat.VK_FORMAT_UNDEFINED
        ) {
            this._surfaceFormat = new VkSurfaceFormatKHR();
            //  this._surfaceFormat.colorSpace = VkColorSpaceKHR.VK_COLORSPACE_SRGB_NONLINEAR_KHR;
            // this._surfaceFormat.format = VkFormat.VK_FORMAT_R8G8B8_UNORM;
        }
        else {
            let choosenFormat = false;
            for (let format of this._supportedSurfaceFormats) {
                if (
                    format.format == VkFormat.VK_FORMAT_R8G8B8_UNORM &&
                    format.colorSpace == VkColorSpaceKHR.VK_COLORSPACE_SRGB_NONLINEAR_KHR
                ) {
                    this._surfaceFormat = format;
                    choosenFormat = true;
                    break;
                }
            }
            if (choosenFormat == false)
                this._surfaceFormat = this._supportedSurfaceFormats[0];
        }


        this._surfacePresentMode = VkPresentModeKHR.VK_PRESENT_MODE_FIFO_KHR;
        for (let presentMode of this._supportedPresentModes) {
            if (VkPresentModeKHR[presentMode] == VkPresentModeKHR.VK_PRESENT_MODE_MAILBOX_KHR.toString()) {
                this._surfacePresentMode = presentMode;
                break;
            }
            else if (VkPresentModeKHR[presentMode] == VkPresentModeKHR.VK_PRESENT_MODE_IMMEDIATE_KHR.toString())
                this._surfacePresentMode = presentMode;
        }

        if (this._surfaceCapabilities.currentExtent != null && this._surfaceCapabilities.currentExtent.width != Number.MAX_VALUE) {
            this._surfaceExtent = this._surfaceCapabilities.currentExtent;
        }
        else {
            this._surfaceExtent = new VkExtent2D();
            this._surfaceExtent.width = clamp(
                window.width,
                this._surfaceCapabilities.minImageExtent ? this._surfaceCapabilities.minImageExtent.width : 0,
                this._surfaceCapabilities.maxImageExtent ? this._surfaceCapabilities.maxImageExtent.width : 0
            );
            this._surfaceExtent.height = clamp(
                window.height,
                this._surfaceCapabilities.minImageExtent ? this._surfaceCapabilities.minImageExtent.height : 0,
                this._surfaceCapabilities.maxImageExtent ? this._surfaceCapabilities.maxImageExtent.height : 0
            );
        };

        var imagesCount = this._surfaceCapabilities.minImageCount + 1;
        if (this._surfaceCapabilities.maxImageCount > 0)
            if (imagesCount > this._surfaceCapabilities.maxImageCount)
                imagesCount = Math.min(this._surfaceCapabilities.maxImageCount, 2);


        var queueFamilyIndices: number[] = [];
        for (let queueFamily of device.QueueFamilies)
            queueFamilyIndices.push(queueFamily.index);

        var swapchainInfo = new VkSwapchainCreateInfoKHR();

        if (this._surfaceFormat == null)
            throw Error("No surface format");

        //swapchainInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_SWAPCHAIN_CREATE_INFO_KHR;
        swapchainInfo.compositeAlpha = VkCompositeAlphaFlagBitsKHR.VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
        swapchainInfo.minImageCount = imagesCount;
        swapchainInfo.imageFormat = this._surfaceFormat.format;
        swapchainInfo.imageColorSpace = this._surfaceFormat.colorSpace;
        swapchainInfo.imageExtent = this._surfaceExtent;
        swapchainInfo.imageArrayLayers = 1;
        swapchainInfo.imageUsage = (
            VkImageUsageFlagBits.VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT |
            VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_DST_BIT
        );
        swapchainInfo.imageSharingMode = VkSharingMode.VK_SHARING_MODE_CONCURRENT;
        swapchainInfo.preTransform = this._surfaceCapabilities.currentTransform;
        swapchainInfo.presentMode = this._surfacePresentMode;
        swapchainInfo.surface = window.surface;
        swapchainInfo.clipped = true;
        swapchainInfo.queueFamilyIndexCount = queueFamilyIndices.length;
        swapchainInfo.pQueueFamilyIndices = new Uint32Array(queueFamilyIndices);

        this._handle = new VkSwapchainKHR();
        if (vkCreateSwapchainKHR(
            device.handle,
            swapchainInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create swapchain");

        this.SetupSwapchainImages();
    }

    private SetupSwapchainImages() {


        let imagesCount = { $: 0 };
        if (vkGetSwapchainImagesKHR(
            this._device.handle,
            this._handle,
            imagesCount,
            null
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to get swapchain images");


        let swapchainImages = [...Array(imagesCount.$)].map(() => new VkImage());
        
        if (vkGetSwapchainImagesKHR(this._device.handle, this._handle, imagesCount, swapchainImages) != VkResult.VK_SUCCESS)
            throw new Error("failed to get swapchain images");

        for (let img of swapchainImages) {
            if (this._surfaceFormat == null)
                throw Error("No surface format providen");


            let imageObj = new VulkanImageEmpty(
                this._device,
                this._surfaceExtent.width,
                this._surfaceExtent.height,
                this._surfaceFormat.format,
                img,
                [VkImageLayout.VK_IMAGE_LAYOUT_UNDEFINED],
                null
            );

            this._images.push(imageObj);
        }

        console.log("objects:" + this._images.length);

        this._imageViews = [];
        for (let image of this._images) {
            this._imageViews.push(new ImageView(image, VkImageAspectFlagBits.VK_IMAGE_ASPECT_COLOR_BIT));
        }

        this._depthImage = new VulkanImage(
            this._device,
            this._surfaceExtent.width,
            this._surfaceExtent.height,
            this._device.FindDepthFormat,
            VkImageUsageFlagBits.VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT,
            1
        );

        this._depthImageView = new ImageView(
            this._depthImage,
            VkImageAspectFlagBits.VK_IMAGE_ASPECT_DEPTH_BIT
        );

        var module = Engine.instance.GetModule(GraphicsModule);
        var graphicsQueue = this._device.GraphicsQueueFamily;

        if (module.CommandBufferService == null)
            throw Error("Cant find graphics module");

        var command = module.CommandBufferService.GetNewCommand(
            VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT,
            CommandType.Primary
        );

        command.Begin(VkCommandBufferUsageFlagBits.VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT);

        //transfer images to correct layout
        for (let key in this._images) {
            this._images[key] = command.TransferImageLayout(
                this._images[key],
                VkImageLayout.VK_IMAGE_LAYOUT_PRESENT_SRC_KHR
            );
        }

        //transfer depth image to correct layout
        if (this._depthImage == null)
            throw Error("NO depth image is settetd up");

        command.TransferImageLayout(
            this._depthImage,
            VkImageLayout.VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL
        );
        
        command.End();
        module.CommandBufferService.SubmitSingle(command);
        command.Fence.Wait();

    }

    private GetQueueFamilyWithPresentationSupport(
        device: Device,
        window: NativeWindow
    ): QueueFamily {
        var queueFamiliesSupportingPresentation: boolean[] = [];
        for (let queueFamily of device.QueueFamilies) {
            let isSupported = { $: false };
            if (vkGetPhysicalDeviceSurfaceSupportKHR(
                this._device.PhysicalDevice,
                0,
                window.surface,
                isSupported
            ) != VkResult.VK_SUCCESS)
                throw new Error("failed to check if device supports presentation");

            queueFamiliesSupportingPresentation.push(isSupported.$);
        }

        var familySupportingPresentation = queueFamiliesSupportingPresentation.findIndex((val, index) => { return (val == true) });

        if (familySupportingPresentation == -1)
            throw new Error("device does not support presentation");

        return device.QueueFamilies[familySupportingPresentation];
    }

    private GetSupportedSurfaceFormats(
        device: Device,
        window: NativeWindow
    ): VkSurfaceFormatKHR[] {
        let surfaceFormatCount = { $: 0 };
        if (vkGetPhysicalDeviceSurfaceFormatsKHR(
            device.PhysicalDevice,
            window.surface,
            surfaceFormatCount,
            null
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to get device support formats");

        let surfaceFormats = [...Array(surfaceFormatCount.$)].map(() => new VkSurfaceFormatKHR());
        let result = vkGetPhysicalDeviceSurfaceFormatsKHR(device.PhysicalDevice, window.surface, surfaceFormatCount, surfaceFormats);

        if (result != VkResult.VK_SUCCESS)
            throw new Error("failed to get device support formats");

        return surfaceFormats;
    }

    private GetSurfaceCapabilities(
        device: Device,
        window: NativeWindow
    ): VkSurfaceCapabilitiesKHR {
        let surfaceCapabilities = new VkSurfaceCapabilitiesKHR();
        if (vkGetPhysicalDeviceSurfaceCapabilitiesKHR(
            device.PhysicalDevice,
            window.surface,
            surfaceCapabilities
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to get device surface presentation");
        return surfaceCapabilities;
    }

    private GetSupportedPresentModes(
        device: Device,
        window: NativeWindow
    ): Int32Array {

        let presentModeCount = { $: 0 };
        if (vkGetPhysicalDeviceSurfacePresentModesKHR(device.PhysicalDevice, window.surface, presentModeCount, null) != VkResult.VK_SUCCESS)
            throw new Error("failed to get device supported present modes");

        let presentModes = new Int32Array(presentModeCount.$);
        if (vkGetPhysicalDeviceSurfacePresentModesKHR(device.PhysicalDevice, window.surface, presentModeCount, presentModes) != VkResult.VK_SUCCESS)
            throw new Error("failed to get device supported present modes");

        return presentModes;
    }

}