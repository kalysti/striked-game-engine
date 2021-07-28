import { VkDevice, vkEnumeratePhysicalDevices, vkGetDeviceQueue, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueue, VkQueueFamilyProperties, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";

export class RenderQueue {

    protected queue: VkQueue = new VkQueue();

    create(_device: VkDevice) {
        vkGetDeviceQueue(_device, 0, 0, this.queue);
    };

    getQueue(): VkQueue{
        return this.queue;
    }
}