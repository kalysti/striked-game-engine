import { VkCommandPool, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from 'vulkan-api';
import { Matrix4 } from '../math/Mat4';
import { Renderer } from '../renderer';
import { VulkanBuffer } from '../vulkan/buffer';
import { LogicalDevice } from '../vulkan/logical.device';
import { Geometry } from './core/Geometry';
import { Texture2D } from './2d/Texture2D';

export class UI extends Geometry {

    mView: Matrix4 = Matrix4.Identity;
    mProjection: Matrix4 = Matrix4.Identity;
    uniformBuffer: VulkanBuffer;
    texture: Texture2D | null = null;

    constructor() {
        super();
        this._pipes = ['ui'];
    }

    getUbo(): Float32Array {
        let list: number[][] = [this.mView.getArray(), this.mProjection.getArray()]
        let array = list.reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    };

    override onEnable() {
        console.log("on enable");
    }

    override onUpdate(delta: number) {
     //   console.log("on update: " +  this.texture);
     //   this.texture.update('./assets/sponza/skybox.png');
    }

    override createBuffers(device: LogicalDevice) {

        this.texture = new Texture2D(Renderer.logicalDevice, Renderer.physicalDevice.handle, Renderer.commandPool);
        this.texture.fromImagePath('./assets/sponza/skybox.png');

        
        this.uniformBuffer = new VulkanBuffer(device, this.getUbo().byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }

    override uploadBuffers(cpool: VkCommandPool) {
        this.texture.upload();
        this.uniformBuffer.upload(cpool, this.getUbo());
    }

}