import { vkEnumeratePhysicalDevices, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueueFamilyProperties, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";

export class PhysicalDevice {

    protected device!: VkPhysicalDevice;

    createSurfaceCapabilities(_surface: VkSurfaceKHR) {
        let surfaceCapabilities = new VkSurfaceCapabilitiesKHR();
        vkGetPhysicalDeviceSurfaceCapabilitiesKHR(this.device, _surface, surfaceCapabilities);
    };

    getDevice(): VkPhysicalDevice{
        return this.device;
    }

    create(_instance: VkInstance, _surface: VkSurfaceKHR) {
        let deviceCount = { $: 0 };
        vkEnumeratePhysicalDevices(_instance, deviceCount, null);
        if (deviceCount.$ <= 0) console.error("Error: No render devices available!");

        let devices = [...Array(deviceCount.$)].map(() => new VkPhysicalDevice());
        let result = vkEnumeratePhysicalDevices(_instance, deviceCount, devices);

        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        // auto pick first found device
        this.device = devices[0];

        let deviceFeatures = new VkPhysicalDeviceFeatures();
        vkGetPhysicalDeviceFeatures(this.device, deviceFeatures);

        let deviceProperties = new VkPhysicalDeviceProperties();
        vkGetPhysicalDeviceProperties(this.device, deviceProperties);

        console.log(`Using device: ${deviceProperties.deviceName}`);

        let deviceMemoryProperties = new VkPhysicalDeviceMemoryProperties();
        vkGetPhysicalDeviceMemoryProperties(this.device, deviceMemoryProperties);

        let queueFamilyCount = { $: 0 };
        vkGetPhysicalDeviceQueueFamilyProperties(this.device, queueFamilyCount, null);

        let queueFamilies = [...Array(queueFamilyCount.$)].map(() => new VkQueueFamilyProperties());
        vkGetPhysicalDeviceQueueFamilyProperties(this.device, queueFamilyCount, queueFamilies);

        this.createSurfaceCapabilities(_surface);

        let surfaceFormatCount = { $: 0 };
        vkGetPhysicalDeviceSurfaceFormatsKHR(this.device, _surface, surfaceFormatCount, null);
        let surfaceFormats = [...Array(surfaceFormatCount.$)].map(() => new VkSurfaceFormatKHR());
        vkGetPhysicalDeviceSurfaceFormatsKHR(this.device, _surface, surfaceFormatCount, surfaceFormats);

        let presentModeCount = { $: 0 };
        vkGetPhysicalDeviceSurfacePresentModesKHR(this.device, _surface, presentModeCount, null);
        let presentModes = new Int32Array(presentModeCount.$);
        vkGetPhysicalDeviceSurfacePresentModesKHR(this.device, _surface, presentModeCount, presentModes);

        let surfaceSupport = { $: false };
        vkGetPhysicalDeviceSurfaceSupportKHR(this.device, 0, _surface, surfaceSupport);
        if (!surfaceSupport) 
           throw  'No surface creation support!';
    };
}