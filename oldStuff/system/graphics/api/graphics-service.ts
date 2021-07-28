import { Console, debug } from "console";
import { get } from "http";
import { VkAllocationCallbacks, VkApplicationInfo, vkCreateInstance, VkDebugReportCallbackCreateInfoEXT, VkDebugReportCallbackEXT, VkDebugReportFlagBitsEXT, VkDebugReportObjectTypeEXT, vkDestroyInstance, vkEnumerateInstanceLayerProperties, vkEnumeratePhysicalDevices, vkGetInstanceProcAddr, VkInstance, VkInstanceCreateInfo, VkLayerProperties, VkPhysicalDevice, VkResult, VkStructureType, VK_API_VERSION_1_1, VK_EXT_DEBUG_REPORT_EXTENSION_NAME, VK_KHR_SURFACE_EXTENSION_NAME, VK_KHR_WIN32_SURFACE_EXTENSION_NAME, VK_KHR_XLIB_SURFACE_EXTENSION_NAME, VK_MAKE_VERSION, VK_MVK_MACOS_SURFACE_EXTENSION_NAME } from "vulkan-api/generated/1.2.162/win32";
import { GraphicsApiDebugLevel, GraphicsApiDebugLevelType, Settings } from "../settings";
import { Device } from "./device";
import { NativeWindow } from "./native-window";
import * as path from 'path';
import * as fs from 'fs';
import { SystemWindow } from "../SystemWindow";

const allowedLayers: string[] = ['VK_LAYER_NV_optimus', 'VK_LAYER_LUNARG_device_simulation', 'VK_LAYER_LUNARG_screenshot', 'VK_LAYER_LUNARG_monitor',  'VK_LAYER_KHRONOS_validation'];
export class GraphicsService {

    public handle: VkInstance = new VkInstance();
    private _devices: Device[] = [];


    // private _debugCallbackHandle: VkDebugReportCallbackEXT;
    // private _debugCallbackFunction: PFN_vkDebugReportCallbackEXT;

    public get PrimaryDevice(): Device {
        return this._devices[0];
        
    }

    constructor() {


        //create vulkan info
        var applicationInfo = new VkApplicationInfo();
        applicationInfo.apiVersion = VK_API_VERSION_1_1;
        applicationInfo.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
        applicationInfo.engineVersion = VK_MAKE_VERSION(1, 0, 0);
        applicationInfo.pApplicationName = "Tortuga";
        applicationInfo.pEngineName = "Tortuga";

        var opsys = process.platform;

        //vulkan extensions
        var instanceExtensions: string[] = [VK_KHR_WIN32_SURFACE_EXTENSION_NAME.toString(), VK_KHR_SURFACE_EXTENSION_NAME.toString()];

       // if (Settings.IsGraphicsApiDebugingEnabled)
            instanceExtensions.push(VK_EXT_DEBUG_REPORT_EXTENSION_NAME.toString());


        //vulkan validation layers
        var validationLayer: string[] = [];
        if (Settings.IsGraphicsApiDebugingEnabled) {

            let supportedLayersCount = { $: 0 };
            vkEnumerateInstanceLayerProperties(supportedLayersCount, null);

            let supportedLayers = [...Array(supportedLayersCount.$)].map(() => new VkLayerProperties());

            vkEnumerateInstanceLayerProperties(
                supportedLayersCount,
                supportedLayers
            );

            for (var vl of supportedLayers) {
                if (vl.layerName != null) {
                    var validationName = vl.layerName.toString()
                    debug("Supported Validation Layer: " + validationName);
                    validationLayer.push(vl.layerName);
                }
                else {
                    throw Error("No validation");
                }
            }
        }


        //delete non allowed layers
        let layers = allowedLayers.filter(t => validationLayer.includes(t));

     //   validationLayer = ['VK_LAYER_LUNARG_screenshot', 'VK_LAYER_NV_optimus', 'VK_LAYER_KHRONOS_validation'];
        var instanceInfo = new VkInstanceCreateInfo();
       // instanceInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
        instanceInfo.pApplicationInfo = applicationInfo;
        instanceInfo.enabledExtensionCount = instanceExtensions.length;
        instanceInfo.ppEnabledExtensionNames = instanceExtensions;
        instanceInfo.enabledLayerCount = layers.length;
        instanceInfo.ppEnabledLayerNames = layers;

        this.handle = new VkInstance();

        if (vkCreateInstance(
            instanceInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to initialize graphics api");


        if (Settings.IsGraphicsApiDebugingEnabled) {

            /*if (CreateDebugReportCallback(
                GetVulkanDebugFlags
            ) != VkResult.Success)
                throw new Exception("failed to start graphics api debugger");*/
        }
        //get vulkan physical device list
        let deviceCount = { $: 0 };

        if (vkEnumeratePhysicalDevices(
            this.handle,
            deviceCount,
            null
        ) != VkResult.VK_SUCCESS)
            throw new Error("could not get physical devices");


        let physicalDevices = [...Array(deviceCount.$)].map(() => new VkPhysicalDevice());

        if (vkEnumeratePhysicalDevices(
            this.handle,
            deviceCount,
            physicalDevices
        ) != VkResult.VK_SUCCESS)
            throw new Error("could not get physical devices");
         
        //setup devices
        for (let device of physicalDevices) {
            this._devices.push(new Device(device));
        }

        //sort devices with best to worst
        this._devices = this._devices.sort((a, b) => b._score.toString().localeCompare(a._score.toString()));
    }

    destroy() {
        // if (Settings.IsGraphicsApiDebugingEnabled)
        //  DestroyDebugReportCallback();

        if (this.handle != null) {
            vkDestroyInstance(
                this.handle,
                null
            );
        }
    }

    public test(){

    }
   

    private get GetVulkanDebugFlags(): VkDebugReportFlagBitsEXT {

        var debugFlags: VkDebugReportFlagBitsEXT = 0;
        if ((GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Error) != 0)
            debugFlags |= VkDebugReportFlagBitsEXT.VK_DEBUG_REPORT_ERROR_BIT_EXT;
        if ((GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Warning) != 0)
            debugFlags |= VkDebugReportFlagBitsEXT.VK_DEBUG_REPORT_WARNING_BIT_EXT;
        if ((GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Info) != 0)
            debugFlags |= VkDebugReportFlagBitsEXT.VK_DEBUG_REPORT_INFORMATION_BIT_EXT | VkDebugReportFlagBitsEXT.VK_DEBUG_REPORT_PERFORMANCE_WARNING_BIT_EXT;
        if ((GraphicsApiDebugLevel & GraphicsApiDebugLevelType.Debug) != 0)
            debugFlags |= VkDebugReportFlagBitsEXT.VK_DEBUG_REPORT_DEBUG_BIT_EXT;

        return debugFlags;
    }

}
