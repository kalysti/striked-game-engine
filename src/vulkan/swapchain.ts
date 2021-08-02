import { VkComponentMapping, vkCreateImageView, vkCreateSwapchainKHR, vkDestroyImageView, vkGetSwapchainImagesKHR, VkImage, VkImageSubresourceRange, VkImageView, VkImageViewCreateInfo, VkSurfaceKHR, VkSwapchainCreateInfoKHR, VkSwapchainKHR, VK_COLOR_SPACE_SRGB_NONLINEAR_KHR, VK_COMPONENT_SWIZZLE_IDENTITY, VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR, VK_FORMAT_B8G8R8A8_UNORM, VK_IMAGE_ASPECT_COLOR_BIT, VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT, VK_IMAGE_VIEW_TYPE_2D, VK_PRESENT_MODE_FIFO_KHR, VK_PRESENT_MODE_IMMEDIATE_KHR, VK_SHARING_MODE_EXCLUSIVE, VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR, VulkanWindow } from 'vulkan-api';
import { ASSERT_VK_RESULT } from "../utils/helpers";
import { LogicalDevice } from './logical.device';
import { RenderElement } from './render.element';

export class Swapchain extends RenderElement {
    private swapchain: VkSwapchainKHR | null = null;
    private surface: VkSurfaceKHR;
    private window: VulkanWindow;

    imageCount: number = 0;
    images: VkImage[] = [];
    views: VkImageView[] = [];
    vsync: boolean = true;

    get handle() {
        return this.swapchain;
    }


    protected onDestroy() {

        for (let ii = 0; ii < this.imageCount; ++ii) {
            vkDestroyImageView(this.device.handle, this.views[ii], null);
        };


        this.views = [];

        //vkDestroyPipelineLayout(device, pipelineLayout, null);
        //vkDestroyShaderModule(device, vertShaderModule, null);
        //vkDestroyShaderModule(device, fragShaderModule, null);
    };

    constructor(device: LogicalDevice, surface: VkSurfaceKHR, window: VulkanWindow) {
        super(device);
        this.surface = surface;
        this.window = window;
        this.create();
    }

    protected onCreate(){
        this.createSwapChain();
        this.createImageViews();
    }

    createSwapChain() {

        let swap = new VkSwapchainKHR();
        let swapchainInfo = new VkSwapchainCreateInfoKHR();
        swapchainInfo.surface = this.surface;
        swapchainInfo.minImageCount = 3;
        swapchainInfo.imageFormat = VK_FORMAT_B8G8R8A8_UNORM;
        swapchainInfo.imageColorSpace = VK_COLOR_SPACE_SRGB_NONLINEAR_KHR;
        swapchainInfo.imageExtent.width = this.window.width;
        swapchainInfo.imageExtent.height = this.window.height;
        swapchainInfo.imageArrayLayers = 1;
        swapchainInfo.imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;
        swapchainInfo.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
        swapchainInfo.queueFamilyIndexCount = 0;
        swapchainInfo.preTransform = VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR;
        swapchainInfo.compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
        swapchainInfo.presentMode = (this.vsync) ?  VK_PRESENT_MODE_FIFO_KHR : VK_PRESENT_MODE_IMMEDIATE_KHR; //VK_PRESENT_MODE_IMMEDIATE_KHR vsync off
        swapchainInfo.clipped = true;
        swapchainInfo.oldSwapchain = this.swapchain || null;

        let result = vkCreateSwapchainKHR(this.device.handle, swapchainInfo, null, swap);
        ASSERT_VK_RESULT(result);

        this.swapchain = swap;
    }

    createImageViews() {

        //get amount of images
        let amountOfImagesInSwapchain = { $: 0 };
        vkGetSwapchainImagesKHR(this.device.handle, this.swapchain, amountOfImagesInSwapchain, null);
        this.imageCount = amountOfImagesInSwapchain.$;

        //get images
        let swapchainImages = [...Array(this.imageCount)].map(() => new VkImage());
        let result = vkGetSwapchainImagesKHR(this.device.handle, this.swapchain, amountOfImagesInSwapchain, swapchainImages);
        this.images = swapchainImages;

        ASSERT_VK_RESULT(result);

        //create views
        let imageViews = [...Array(this.imageCount)].map(() => new VkImageView());

        for (let ii = 0; ii < this.imageCount; ++ii) {

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
            imageViewInfo.image = swapchainImages[ii];
            imageViewInfo.viewType = VK_IMAGE_VIEW_TYPE_2D;
            imageViewInfo.format = VK_FORMAT_B8G8R8A8_UNORM;
            imageViewInfo.components = components;
            imageViewInfo.subresourceRange = subresourceRange;


            let result = vkCreateImageView(this.device.handle, imageViewInfo, null, imageViews[ii])
            ASSERT_VK_RESULT(result);

        };

        this.views = imageViews;
    }
}