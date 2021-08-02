import { SceneNode } from "./Node";
import { VulkanBuffer } from '../../vulkan/buffer';
import { LogicalDevice } from "../../vulkan/logical.device";
import { VkCommandPool, VkDescriptorSet } from "vulkan-api";


export abstract class Geometry extends SceneNode {
    protected _pipes: string[] = ['mesh'];
    descriptorSet: VkDescriptorSet = new VkDescriptorSet();

    updateRequired: boolean = false;

    get pipelines() {
        return this._pipes;
    }

    abstract createBuffers(device: LogicalDevice) : void;
    abstract uploadBuffers(cpool: VkCommandPool) : void;
}