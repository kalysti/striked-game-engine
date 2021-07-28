import { vkCreateDevice, vkDestroyDevice, VkDevice, VkDeviceCreateInfo, VkDeviceQueueCreateInfo, VkFormat, VkFormatFeatureFlagBits, VkFormatProperties, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceFormatProperties, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, VkImageTiling, VkMemoryPropertyFlagBits, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkPhysicalDeviceType, VkQueueFamilyProperties, VkQueueFlagBits, VkResult, VkStructureType, VK_KHR_SWAPCHAIN_EXTENSION_NAME } from "vulkan-api/generated/1.2.162/win32";
import { DEPTH_FORMAT_CANDIDATES } from "./graphic-constacts";
import { Helpers } from "./helpers";
import { QueueFamily } from "./queue-family";

export class Device {

    handle: VkDevice | null = null;
    _physicalDevice: VkPhysicalDevice;
    _properties: VkPhysicalDeviceProperties = new VkPhysicalDeviceProperties();
    _memoryProperties: VkPhysicalDeviceMemoryProperties = new VkPhysicalDeviceMemoryProperties();
    _features: VkPhysicalDeviceFeatures = new VkPhysicalDeviceFeatures();
    _queueFamilies: QueueFamily[] = [];
    _score: number = 0;

    public get GraphicsQueueFamily(): QueueFamily | undefined {
        return this._queueFamilies.find(q => (q.type & VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT) != 0);
    }
    public get TransferQueueFamily(): QueueFamily | undefined {
        return this._queueFamilies.find(q => (q.type & VkQueueFlagBits.VK_QUEUE_TRANSFER_BIT) != 0);
    }
    public get ComputeQueueFamily(): QueueFamily | undefined {
        return this._queueFamilies.find(q => (q.type & VkQueueFlagBits.VK_QUEUE_COMPUTE_BIT) != 0);
    }


    public get QueueFamilies(): QueueFamily[] {
        return this._queueFamilies;
    }

    public get PhysicalDevice(): VkPhysicalDevice {
        return this._physicalDevice;
    }

    constructor(_physicalDevice: VkPhysicalDevice) {
        this._physicalDevice = _physicalDevice;

        vkGetPhysicalDeviceProperties(
            _physicalDevice,
            this._properties
        );


        vkGetPhysicalDeviceMemoryProperties(
            _physicalDevice,
            this._memoryProperties
        );
        vkGetPhysicalDeviceFeatures(
            _physicalDevice,
            this._features
        );

        //get family queue properties
        let queueFamilyCount = { $: 0 };
        vkGetPhysicalDeviceQueueFamilyProperties(
            _physicalDevice,
            queueFamilyCount,
            null
        );

        let familyQueueProperties = [...Array(queueFamilyCount.$)].map(() => new VkQueueFamilyProperties());
        vkGetPhysicalDeviceQueueFamilyProperties(_physicalDevice, queueFamilyCount, familyQueueProperties);

        //setup queue families
        for (let q in familyQueueProperties) {
            let property = familyQueueProperties[q];
            this._queueFamilies.push(new QueueFamily(
                Number(q),
                property.queueCount,
                property.queueFlags
            ));
        }

        //get queue create infos
        var queueCreateInfos: VkDeviceQueueCreateInfo[] = [];

        for (let qInfo of this._queueFamilies) {
            queueCreateInfos.push(qInfo.QueueCreateInfo);
        }


        //enable extra device features
        var enabledFeatures = new VkPhysicalDeviceFeatures();
        enabledFeatures.samplerAnisotropy = true;
        enabledFeatures.dualSrcBlend = true;



        //enable swapchain extension for window support
        let enabledExtensions: string[] = [
            VK_KHR_SWAPCHAIN_EXTENSION_NAME.toString()
        ];

        var deviceInfo = new VkDeviceCreateInfo();
      //  deviceInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO;
        deviceInfo.pEnabledFeatures = enabledFeatures;
        deviceInfo.enabledExtensionCount = enabledExtensions.length;
        deviceInfo.ppEnabledExtensionNames = enabledExtensions;
        deviceInfo.enabledLayerCount = 0;
        deviceInfo.ppEnabledLayerNames = null;
        deviceInfo.queueCreateInfoCount = queueCreateInfos.length;
        deviceInfo.pQueueCreateInfos = queueCreateInfos;

        this.handle = new VkDevice();

        //setup device
        if (vkCreateDevice(
            _physicalDevice,
            deviceInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to initialize device");


        //setup device queues
        for (let queueFamily of this._queueFamilies)
            queueFamily.GetQueuesFromDevice(this);

        //calculate device score
        this._score = 0;

        if (this._properties != null) {
            if (this._properties.deviceType == VkPhysicalDeviceType.VK_PHYSICAL_DEVICE_TYPE_DISCRETE_GPU)
                this._score += 10;
            else if (this._properties.deviceType == VkPhysicalDeviceType.VK_PHYSICAL_DEVICE_TYPE_INTEGRATED_GPU)
                this._score += 5;
            else if (this._properties.deviceType == VkPhysicalDeviceType.VK_PHYSICAL_DEVICE_TYPE_VIRTUAL_GPU)
                this._score += 3;
            else if (this._properties.deviceType == VkPhysicalDeviceType.VK_PHYSICAL_DEVICE_TYPE_CPU)
                this._score += 1;

            if (this._properties.limits != null) {
                this._score += (
                    //1073741824 = 1024 * 1024 * 1024
                    this._properties.limits.maxMemoryAllocationCount / 1073741824.0
                );
            }
        }
    }

    get FindDepthFormat(): VkFormat {

        var tiling = VkImageTiling.VK_IMAGE_TILING_OPTIMAL;
        var features = VkFormatFeatureFlagBits.VK_FORMAT_FEATURE_DEPTH_STENCIL_ATTACHMENT_BIT;

        for (let format of DEPTH_FORMAT_CANDIDATES) {
            let formatProperties: VkFormatProperties = new VkFormatProperties();;
            vkGetPhysicalDeviceFormatProperties(
                this._physicalDevice,
                format,
                formatProperties
            );

            if (
                tiling == VkImageTiling.VK_IMAGE_TILING_LINEAR &&
                (formatProperties.linearTilingFeatures & features) == features
            )
                return format;
            else if (
                tiling == VkImageTiling.VK_IMAGE_TILING_OPTIMAL &&
                (formatProperties.optimalTilingFeatures & features) == features
            )
                return format;
        }
        throw new Error("failed to find any depth format supported by this device");
    }




    getMemoryTypeIndex(typeFilter: number, propertyFlag: number | VkMemoryPropertyFlagBits, physicalDevice: VkPhysicalDevice): number {
        let memoryProperties = new VkPhysicalDeviceMemoryProperties();
        vkGetPhysicalDeviceMemoryProperties(physicalDevice, memoryProperties);
        if (memoryProperties.memoryTypes != null) {
            for (let ii = 0; ii < memoryProperties.memoryTypeCount; ++ii) {
                if (
                    (typeFilter & (1 << ii)) &&
                    (memoryProperties.memoryTypes[ii].propertyFlags & propertyFlag) === propertyFlag
                ) {
                    return ii;
                }
            };
        }

        throw new Error("failed to find suitable memory type on device");
    };

    destroy() {
        if (this.handle != null) {
            vkDestroyDevice(
                this.handle,
                null
            );
            this.handle = null;
        }
    }
}