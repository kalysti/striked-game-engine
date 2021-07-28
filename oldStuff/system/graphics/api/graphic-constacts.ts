import { VkFormat } from "vulkan-api/generated/1.2.162/win32";

export var DEPTH_FORMAT_CANDIDATES: VkFormat[] = [

    VkFormat.VK_FORMAT_D32_SFLOAT,
    VkFormat.VK_FORMAT_D32_SFLOAT_S8_UINT,
    VkFormat.VK_FORMAT_D24_UNORM_S8_UINT
];
