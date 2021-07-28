import { vkCreateDevice, VkDevice, VkDeviceCreateInfo, VkDeviceQueueCreateInfo, vkEnumeratePhysicalDevices, VkEvent, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueueFamilyProperties, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR, VK_KHR_SWAPCHAIN_EXTENSION_NAME, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";

export class LogicalDevice {

    protected _device: VkDevice = new VkDevice();

    getDevice() : VkDevice
    {
        return this._device;
    }

    create(_physicalDevice: VkPhysicalDevice, _surface: VkSurfaceKHR) {
        let deviceQueueInfo = new VkDeviceQueueCreateInfo();
        deviceQueueInfo.queueFamilyIndex = 0;
        deviceQueueInfo.queueCount = 1;
        deviceQueueInfo.pQueuePriorities = new Float32Array([1.0, 1.0, 1.0, 1.0]);
      
        let deviceExtensions: string[] = [
          VK_KHR_SWAPCHAIN_EXTENSION_NAME.toString()
        ];

        let usedFeatures = new VkPhysicalDeviceFeatures();
        usedFeatures.samplerAnisotropy = true;
      
        let deviceInfo = new VkDeviceCreateInfo();
        deviceInfo.queueCreateInfoCount = 1;
        deviceInfo.pQueueCreateInfos = [deviceQueueInfo];
        deviceInfo.enabledExtensionCount = deviceExtensions.length;
        deviceInfo.ppEnabledExtensionNames = deviceExtensions;
        deviceInfo.pEnabledFeatures = usedFeatures;
      
        let result = vkCreateDevice(_physicalDevice, deviceInfo, null, this._device);
        
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }
}