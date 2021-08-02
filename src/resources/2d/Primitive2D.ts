import { Transform } from '../../math/Transform';
import { VkCommandPool, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from 'vulkan-api';
import { LogicalDevice } from '../../vulkan/logical.device';
import { Geometry } from '../core/Geometry';
import { MeshData2D } from './MeshData2D';
import { VulkanBuffer } from '../../vulkan/buffer';
import { Vector2D } from '../../math/Vector2D';
export abstract class Primitive2D extends Geometry {

    protected _data: MeshData2D = new MeshData2D();
    transform: Transform = Transform.Identity;
    vertexBuffer: VulkanBuffer;
    uvBuffer: VulkanBuffer;

    set data(data: MeshData2D) {
        this._data = data;
    }

    get data(): MeshData2D {
        return this._data;
    }

    constructor() {
        super();
        this._pipes = ["primitive"];
    }

    get getVertexBufferData(): Float32Array {


        let mesh = new Float32Array(this.data.verticesByteArray.length + this.data.verticesByteArray.length);
        for (let ii = 0; ii < mesh.length; ++ii) {
            let offset8 = ii * 4;
            let offset2 = ii * 2;

            mesh[offset8 + 0] = this.data.verticesByteArray[offset2 + 0];
            mesh[offset8 + 1] = this.data.verticesByteArray[offset2 + 1];
            mesh[offset8 + 2] = this.data.uv0ByteArray[offset2 + 0] | 0;
            mesh[offset8 + 3] = this.data.uv0ByteArray[offset2 + 1] | 0;
        };

        return mesh;
    }

    createBuffers(device: LogicalDevice) {

        this.vertexBuffer = new VulkanBuffer(device, this.getVertexBufferData.byteLength, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT);

        let transform = new Float32Array(this.transform.matrix.values);

        this.transform.uniformBuffer = new VulkanBuffer(device, transform.byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.transform.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }

    uploadBuffers(cpool: VkCommandPool) {

        this.vertexBuffer.upload(cpool, this.getVertexBufferData);

        console.log(this.getVertexBufferData);

        let transform = new Float32Array(this.transform.matrix.values);
        this.transform.uniformBuffer.upload(cpool, transform);
    }
}