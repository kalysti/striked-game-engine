import { vkAllocateCommandBuffers, VkCommandBuffer, VkCommandBufferAllocateInfo, VkCommandPool, VkCommandPoolCreateInfo, vkCreateCommandPool, vkCreateDevice, VkDevice, VkDeviceCreateInfo, VkDeviceQueueCreateInfo, vkEnumeratePhysicalDevices, VkEvent, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueueFamilyProperties, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR, VK_COMMAND_BUFFER_LEVEL_PRIMARY, VK_KHR_SWAPCHAIN_EXTENSION_NAME, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";
import { CommandPool } from "./command-pool";
import { LogicalDevice } from "./logical-device";
import { SwapchainImageView } from "./swapchain-imageview";

export class CommandBuffer {

    cmdBuffers: VkCommandBuffer[] = [];

    create(_device: LogicalDevice, _pool: CommandPool, _swapchainview: SwapchainImageView) {

        let cmdBufferAllocInfo = new VkCommandBufferAllocateInfo();
        cmdBufferAllocInfo.commandPool = _pool.getPool();
        cmdBufferAllocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        cmdBufferAllocInfo.commandBufferCount = _swapchainview.getCount();
        this.cmdBuffers = [...Array(_swapchainview.getCount())].map(() => new VkCommandBuffer());

        let result = vkAllocateCommandBuffers(_device.getDevice(), cmdBufferAllocInfo, this.cmdBuffers);

        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }

    clear(){
        this.cmdBuffers = [];
    }
}