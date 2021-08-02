import { VkCommandPool, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from 'vulkan-api';
import { Matrix4 } from '../math/Mat4';
import { VulkanBuffer } from '../vulkan/buffer';
import { LogicalDevice } from '../vulkan/logical.device';
import { CubeMesh } from './3d/CubeMesh';
export class Sky extends CubeMesh {

    mView: Matrix4 = Matrix4.Identity;
    mProjection: Matrix4 = Matrix4.Identity;
    uniformBuffer: VulkanBuffer;

    constructor() {
        super();
        this._pipes = ['sky'];
    }

    getUbo(): Float32Array {
        let list: number[][] = [this.mView.getArray(), this.mProjection.getArray()]
        let array = list.reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    };

    onUpdate(delta: number) {
    }

    override createBuffers(device: LogicalDevice) {
        console.log("create sky");

        super.createBuffers(device);

        this.uniformBuffer = new VulkanBuffer(device, this.getUbo().byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }

    override uploadBuffers(cpool: VkCommandPool) {
        super.uploadBuffers(cpool);
        this.uniformBuffer.upload(cpool, this.getUbo());
    }
   
}