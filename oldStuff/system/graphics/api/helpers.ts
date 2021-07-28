import { VkMemoryType, VkPhysicalDeviceMemoryProperties } from "vulkan-api/generated/1.2.162/win32";

export class Helpers {
    static GetMemoryType(
        memoryProperties: VkPhysicalDeviceMemoryProperties,
        i: number
    ): VkMemoryType {

        if (memoryProperties.memoryTypes == null ||   i > memoryProperties.memoryTypes?.length) {
     
            throw new Error("this type of memory is not supported");
        }
        else {
            return memoryProperties.memoryTypes[i];
        }
    }
}