import { vkGetSwapchainImagesKHR, VkImage, VK_SUCCESS, VkImageView, VkComponentMapping, VK_COMPONENT_SWIZZLE_IDENTITY, VkImageSubresourceRange, VK_IMAGE_ASPECT_COLOR_BIT, VkImageViewCreateInfo, VK_IMAGE_VIEW_TYPE_2D, VK_FORMAT_B8G8R8A8_UNORM, vkCreateImageView, VkDevice, vkCreateSwapchainKHR, VkExtent2D, VkSwapchainCreateInfoKHR, VkSwapchainKHR, VK_COLOR_SPACE_SRGB_NONLINEAR_KHR, VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR, VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT, VK_PRESENT_MODE_FIFO_KHR, VK_SHARING_MODE_EXCLUSIVE, VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR, VK_TRUE, VulkanWindow, VK_PRESENT_MODE_IMMEDIATE_KHR } from "vulkan-api/generated/1.2.162/win32";
import { UIWindow } from "../components/window/ui-window";
import { Renderer } from "./renderer";

export class Swapchain {
    private swapchain!: VkSwapchainKHR;

    getSwapchain(): VkSwapchainKHR {
        return this.swapchain;
    }

    destroy(_instance: Renderer)
    {
        _instance.freeCommandBuffers();
        _instance.freeCommandPool();
        _instance.freeFrameBuffers();
        _instance.freeRenderPass();
        _instance.freeSwapChainView();
    }

    create(_device: VkDevice, _window: UIWindow) {
        let imageExtent = new VkExtent2D();
        imageExtent.width = _window.getWindow().width;
        imageExtent.height = _window.getWindow().height;

        let swapchainInfo = new VkSwapchainCreateInfoKHR();
        swapchainInfo.surface = _window.getSurface();
        swapchainInfo.minImageCount = 3;
        swapchainInfo.imageFormat = VK_FORMAT_B8G8R8A8_UNORM;
        swapchainInfo.imageColorSpace = VK_COLOR_SPACE_SRGB_NONLINEAR_KHR;
        swapchainInfo.imageExtent = imageExtent;
        swapchainInfo.imageArrayLayers = 1;
        swapchainInfo.imageUsage = VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;
        swapchainInfo.imageSharingMode = VK_SHARING_MODE_EXCLUSIVE;
        swapchainInfo.queueFamilyIndexCount = 0;
        swapchainInfo.preTransform = VK_SURFACE_TRANSFORM_IDENTITY_BIT_KHR;
        swapchainInfo.compositeAlpha = VK_COMPOSITE_ALPHA_OPAQUE_BIT_KHR;
        swapchainInfo.presentMode = VK_PRESENT_MODE_IMMEDIATE_KHR; //vsync on => VK_PRESENT_MODE_FIFO_KHR
        swapchainInfo.clipped = true;
        swapchainInfo.oldSwapchain = this.swapchain || null;

        this.swapchain = new VkSwapchainKHR();

        let result = vkCreateSwapchainKHR(_device, swapchainInfo, null, this.swapchain);
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }
}