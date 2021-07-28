import { vkCreateDevice, VkDevice, VkDeviceCreateInfo, VkDeviceQueueCreateInfo, VkFormat, VkFormatProperties, vkGetPhysicalDeviceFormatProperties, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VK_FORMAT_D16_UNORM, VK_FORMAT_D16_UNORM_S8_UINT, VK_FORMAT_D24_UNORM_S8_UINT, VK_FORMAT_D32_SFLOAT, VK_FORMAT_D32_SFLOAT_S8_UINT, VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT, VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME, VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_SPEC_VERSION, VK_KHR_PORTABILITY_SUBSET_EXTENSION_NAME, VK_KHR_SWAPCHAIN_EXTENSION_NAME } from "vulkan-api";
import { ASSERT_VK_RESULT } from "../test.helpers";
import { DeviceQueue } from "./quene.device";

export class LogicalDevice {
    private physicalDevice: VkPhysicalDevice = new VkPhysicalDevice();
    private queue: DeviceQueue;
    private device: VkDevice = new VkDevice();

    get handleQueue() {
        return this.queue.handle;
    }

    get handle() {
        return this.device;
    }
    
    get handlePhysicalDevice() {
        return this.physicalDevice;
    }

    getSupportedDepthFormat(physicalDevice: VkPhysicalDevice, depthFormat: VkFormat | null) {
        // Since all depth formats may be optional, we need to find a suitable depth format to use
        // Start with the highest precision packed format
        let depthFormats: VkFormat[] = [
            VK_FORMAT_D32_SFLOAT_S8_UINT,
            VK_FORMAT_D32_SFLOAT,
            VK_FORMAT_D24_UNORM_S8_UINT,
            VK_FORMAT_D16_UNORM_S8_UINT,
            VK_FORMAT_D16_UNORM
        ];

        for (let format of depthFormats) {
            let formatProps = new VkFormatProperties();
            vkGetPhysicalDeviceFormatProperties(physicalDevice, format, formatProps);
            // Format must support depth stencil attachment for optimal tiling
            if (formatProps.optimalTilingFeatures & VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT) {
                return { result: true, depthFormat: format };
            }
        }

        return { result: false, depthFormat: depthFormat };
    }

    depthFormat: VkFormat;

    constructor(instance: VkInstance, physicalDevice: VkPhysicalDevice) {

        this.physicalDevice = physicalDevice;

        let deviceQueueInfo = new VkDeviceQueueCreateInfo();
        deviceQueueInfo.queueFamilyIndex = 0;
        deviceQueueInfo.queueCount = 1;
        deviceQueueInfo.pQueuePriorities = new Float32Array([1.0, 1.0, 1.0, 1.0]);

        let deviceExtensions = [
            VK_KHR_SWAPCHAIN_EXTENSION_NAME
            
        ];

        for (let ext of deviceExtensions) {
            console.log("[LogicalDevice][Extension] Load " + ext.toString());
        }

        let deviceInfo = new VkDeviceCreateInfo();
        deviceInfo.queueCreateInfoCount = 1;
        deviceInfo.pQueueCreateInfos = [deviceQueueInfo];
        deviceInfo.enabledExtensionCount = deviceExtensions.length;
        deviceInfo.ppEnabledExtensionNames = deviceExtensions.map(t => t.toString());
        deviceInfo.pEnabledFeatures = new VkPhysicalDeviceFeatures();

        let result = vkCreateDevice(this.physicalDevice, deviceInfo, null, this.device);
        ASSERT_VK_RESULT(result);

        this.queue = new DeviceQueue(this.device);
        
        let validDepth = this.getSupportedDepthFormat(this.handlePhysicalDevice, this.depthFormat);
        if(validDepth.result == false)
            throw new Error("Cant find depth format.");
            
        this.depthFormat = validDepth.depthFormat;
    }
}