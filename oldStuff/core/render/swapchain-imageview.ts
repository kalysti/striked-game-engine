import { vkGetSwapchainImagesKHR, VkImage, VK_SUCCESS, VkImageView, VkComponentMapping, VK_COMPONENT_SWIZZLE_IDENTITY, VkImageSubresourceRange, VK_IMAGE_ASPECT_COLOR_BIT, VkImageViewCreateInfo, VK_IMAGE_VIEW_TYPE_2D, VK_FORMAT_B8G8R8A8_UNORM, vkCreateImageView, VkDevice, vkDestroyImageView } from "vulkan-api/generated/1.2.162/win32";
import { Swapchain } from "./swapchain";

export class SwapchainImageView {
    swapchainImageViews: VkImageView[] = [];
    swapchainImageCount = 0;

    destroy(device: VkDevice) {
        for (let ii = 0; ii < this.swapchainImageCount; ++ii) {
            vkDestroyImageView(device, this.swapchainImageViews[ii], null);
        };
        this.swapchainImageViews = [];
    }

    getCount(): number {
        return this.swapchainImageCount;
    }

    getViews(): VkImageView[] {
        return this.swapchainImageViews;
    }

    create(_device: VkDevice, _swapchain: Swapchain) {
        let amountOfImagesInSwapchain = { $: 0 };
        vkGetSwapchainImagesKHR(_device, _swapchain.getSwapchain(), amountOfImagesInSwapchain, null);
        let swapchainImages = [...Array(amountOfImagesInSwapchain.$)].map(() => new VkImage());

        let result = vkGetSwapchainImagesKHR(_device, _swapchain.getSwapchain(), amountOfImagesInSwapchain, swapchainImages);

        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let imageViews = [...Array(amountOfImagesInSwapchain.$)].map(() => new VkImageView());
        for (let ii = 0; ii < amountOfImagesInSwapchain.$; ++ii) {
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
            let result = vkCreateImageView(_device, imageViewInfo, null, imageViews[ii])
            if (result !== VK_SUCCESS)
                throw new Error(`Vulkan assertion failed!`);
        }

        this.swapchainImageViews = imageViews;
        this.swapchainImageCount = amountOfImagesInSwapchain.$;
    }
}