import { vkCreateDevice, vkDestroyDevice, VkDevice, VkDeviceCreateInfo, VkDeviceQueueCreateInfo, VkFormat, VkFormatProperties, vkGetPhysicalDeviceFormatProperties, VkPhysicalDevice, VkPhysicalDeviceFeatures, VK_EXT_LINE_RASTERIZATION_EXTENSION_NAME, VK_FORMAT_D16_UNORM, VK_FORMAT_D16_UNORM_S8_UINT, VK_FORMAT_D24_UNORM_S8_UINT, VK_FORMAT_D32_SFLOAT, VK_FORMAT_D32_SFLOAT_S8_UINT, VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT, VK_KHR_SWAPCHAIN_EXTENSION_NAME } from "vulkan-api";
import { ASSERT_VK_RESULT } from "../utils/helpers";
import { PhysicalDevice } from "./physical.device";
import { DeviceQueue } from "./quene.device";
import { RenderBackplane } from "./render.backplane";

export class LogicalDevice extends RenderBackplane {
    private physicalDevice: PhysicalDevice ;
    private queue: DeviceQueue;
    private device: VkDevice = new VkDevice();

    get handleQueue() {
        return this.queue.handle;
    }

    get handle() {
        return this.device;
    }

    get handlePhysicalDevice() {
        return this.physicalDevice.handle;
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

    constructor(physicalDevice: PhysicalDevice) {

        super();

        this.physicalDevice = physicalDevice;
        this.create();


    }
    protected onDestroy() {
        vkDestroyDevice(this.device, null);
    }

    protected onCreate() {
        this.device = new VkDevice();
        let deviceQueueInfo = new VkDeviceQueueCreateInfo();
        deviceQueueInfo.queueFamilyIndex = 0;
        deviceQueueInfo.queueCount = 1;
        deviceQueueInfo.pQueuePriorities = new Float32Array([1.0, 1.0, 1.0, 1.0]);

        let deviceExtensions = [
            VK_KHR_SWAPCHAIN_EXTENSION_NAME,
            VK_EXT_LINE_RASTERIZATION_EXTENSION_NAME 

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
        deviceInfo.pEnabledFeatures.samplerAnisotropy = true;

        let result = vkCreateDevice(this.physicalDevice.handle, deviceInfo, null, this.device);
        ASSERT_VK_RESULT(result);

        this.queue = new DeviceQueue(this.device);

        let validDepth = this.getSupportedDepthFormat(this.physicalDevice.handle, this.depthFormat);
        if (validDepth.result == false)
            throw new Error("Cant find depth format.");

        this.depthFormat = validDepth.depthFormat;
    }
}