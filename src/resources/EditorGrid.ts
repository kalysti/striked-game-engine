import { VkCommandPool, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from 'vulkan-api';
import { VulkanBuffer } from '../vulkan/buffer';
import { Geometry } from './Geometry';
import { Transform } from '../math/Transform';
import { LogicalDevice } from '../vulkan/logical.device';

export class EditorGrid extends Geometry {
    transform: Transform = Transform.Identity;

    constructor() {
        super();
        this._pipes = ["grid"];
    }

    createBuffers(device: LogicalDevice) {
   
        let transform = new Float32Array(this.transform.matrix.values);

        this.transform.uniformBuffer = new VulkanBuffer(device, transform.byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.transform.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }

    uploadBuffers(cpool: VkCommandPool) {
  
        let transform = new Float32Array(this.transform.matrix.values);
        this.transform.uniformBuffer.upload(cpool, transform);
    }

}