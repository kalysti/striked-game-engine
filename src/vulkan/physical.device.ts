import { vkEnumeratePhysicalDevices, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueueFamilyProperties, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR } from 'vulkan-api';
import { ASSERT_VK_RESULT } from '../utils/helpers';
import { RenderBackplane } from './render.backplane';
export class PhysicalDevice  extends RenderBackplane{
    private physicalDevice: VkPhysicalDevice = new VkPhysicalDevice();
    private instance: VkInstance = new VkInstance();
    private surface: VkSurfaceKHR = new VkSurfaceKHR();
    
    get handle() {
        return this.physicalDevice;
    }

    protected onCreate(){

        let devices = this.getDevices();
        this.physicalDevice = devices[0];

        let deviceFeatures = new VkPhysicalDeviceFeatures();
        vkGetPhysicalDeviceFeatures(this.physicalDevice, deviceFeatures);

        let deviceProperties = new VkPhysicalDeviceProperties();
        vkGetPhysicalDeviceProperties(this.physicalDevice, deviceProperties);

        let deviceMemoryProperties = new VkPhysicalDeviceMemoryProperties();
        vkGetPhysicalDeviceMemoryProperties(this.physicalDevice, deviceMemoryProperties);

        let queueFamilyCount = { $: 0 };
        vkGetPhysicalDeviceQueueFamilyProperties(this.physicalDevice, queueFamilyCount, null);

        let queueFamilies = [...Array(queueFamilyCount.$)].map(() => new VkQueueFamilyProperties());
        vkGetPhysicalDeviceQueueFamilyProperties(this.physicalDevice, queueFamilyCount, queueFamilies);

        this.getSurfaceCaps();

        let surfaceFormatCount = { $: 0 };
        vkGetPhysicalDeviceSurfaceFormatsKHR(this.physicalDevice, this.surface, surfaceFormatCount, null);

        let surfaceFormats = [...Array(surfaceFormatCount.$)].map(() => new VkSurfaceFormatKHR());
        vkGetPhysicalDeviceSurfaceFormatsKHR(this.physicalDevice, this.surface, surfaceFormatCount, surfaceFormats);

        let presentModeCount = { $: 0 };
        vkGetPhysicalDeviceSurfacePresentModesKHR(this.physicalDevice, this.surface, presentModeCount, null);

        let presentModes = new Int32Array(presentModeCount.$);
        vkGetPhysicalDeviceSurfacePresentModesKHR(this.physicalDevice, this.surface, presentModeCount, presentModes);

        let surfaceSupport = { $: false };
        vkGetPhysicalDeviceSurfaceSupportKHR(this.physicalDevice, 0, this.surface, surfaceSupport);
        if (!surfaceSupport) throw new Error(`No surface creation support!`);
    }

    protected onDestroy(){
    }

    constructor(instance: VkInstance, surface: VkSurfaceKHR) {
        super();

        this.instance = instance;
        this.surface = surface;

        this.create();
    }

    getSurfaceCaps()
    {
        let surfaceCapabilities = new VkSurfaceCapabilitiesKHR();
        vkGetPhysicalDeviceSurfaceCapabilitiesKHR(this.physicalDevice, this.surface, surfaceCapabilities);
    }

    private getDevices(): VkPhysicalDevice[] {

        let deviceCount = { $: 0 };
        vkEnumeratePhysicalDevices(this.instance, deviceCount, null);
        if (deviceCount.$ <= 0) console.error("Error: No render devices available!");

        let devices = [...Array(deviceCount.$)].map(() => new VkPhysicalDevice());

        let result = vkEnumeratePhysicalDevices(this.instance, deviceCount, devices);
        ASSERT_VK_RESULT(result);

        return devices;

    }

}