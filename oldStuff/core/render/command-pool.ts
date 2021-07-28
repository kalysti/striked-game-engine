import { VkCommandPool, VkCommandPoolCreateInfo, vkCreateCommandPool, vkCreateDevice, vkDestroyCommandPool, VkDevice, VkDeviceCreateInfo, VkDeviceQueueCreateInfo, vkEnumeratePhysicalDevices, VkEvent, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueueFamilyProperties, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR, VK_KHR_SWAPCHAIN_EXTENSION_NAME, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";
import { LogicalDevice } from "./logical-device";

export class CommandPool {

    protected _pool: VkCommandPool = new VkCommandPool();

    getPool() : VkDevice
    {
        return this._pool;
    }

    destroy(device: VkDevice){
        vkDestroyCommandPool(device, this._pool, null);
    }

    create(_device: LogicalDevice) {
      
        let cmdPoolInfo = new VkCommandPoolCreateInfo();
        cmdPoolInfo.flags = 0;
        cmdPoolInfo.queueFamilyIndex = 0;
      
       let result = vkCreateCommandPool(_device.getDevice(), cmdPoolInfo, null, this._pool);
               
       if (result !== VK_SUCCESS)
       throw new Error(`Vulkan assertion failed!`);
    }
}