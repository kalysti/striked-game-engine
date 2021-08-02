import { Texture2D } from "../resources/2d/Texture2D";
import { VulkanBuffer } from "./buffer";

export class BufferManager {
    static resources: Map<string, VulkanBuffer> = new Map<string, VulkanBuffer>();

    static add(name: string, resource: VulkanBuffer) {
        if (BufferManager.resources.has(name)) {
            return;
        }
        else {
            BufferManager.resources.set(name, resource);
        }
    }

    static get(name: string): VulkanBuffer {
        if (!BufferManager.resources.has(name))
            throw new Error("Cant find resource");

        return BufferManager.resources.get(name);
    }
}