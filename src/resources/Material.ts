import { VkDescriptorImageInfo, VK_IMAGE_LAYOUT_SHADER_READ_ONLY_OPTIMAL } from "vulkan-api";
import { Texture2D } from "./Texture2D";

export class Material {

    diffuse: Texture2D = null;
}