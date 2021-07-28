import { VkCommandPool, VkDescriptorSet, VK_BUFFER_USAGE_INDEX_BUFFER_BIT, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from 'vulkan-api';
import { Transform } from '../math/Transform';
import { VulkanBuffer } from '../vulkan/buffer';
import { LogicalDevice } from '../vulkan/logical.device';
import { Geometry } from './Geometry';
import { Material } from './Material';
import { MeshData3D } from './MeshData3D';

export abstract class Mesh extends Geometry {

    transform: Transform = Transform.Identity;

    protected _data: MeshData3D = new MeshData3D();

    material: Material = new Material();

    set data(data: MeshData3D) {
        this._data = data;
    }

    get data(): MeshData3D {
        return this._data;
    }

    get getIndiciesBufferData(): Uint16Array {
        return this.data.indiciesByteArray;
    }

    get getVertexBufferData(): Float32Array {

        let mesh = new Float32Array(this.data.verticesByteArray.length + this.data.normalsByteArray.length + this.data.uv0ByteArray.length);
        for (let ii = 0; ii < mesh.length; ++ii) {
            let offset8 = ii * 8;
            let offset3 = ii * 3;
            let offset2 = ii * 2;

            mesh[offset8 + 0] = this.data.verticesByteArray[offset3 + 0];
            mesh[offset8 + 1] = this.data.verticesByteArray[offset3 + 1];
            mesh[offset8 + 2] = this.data.verticesByteArray[offset3 + 2];
            mesh[offset8 + 3] = this.data.normalsByteArray[offset3 + 0];
            mesh[offset8 + 4] = this.data.normalsByteArray[offset3 + 1];
            mesh[offset8 + 5] = this.data.normalsByteArray[offset3 + 2];
            mesh[offset8 + 6] = this.data.uv0ByteArray[offset2 + 0];
            mesh[offset8 + 7] = this.data.uv0ByteArray[offset2 + 1];
        };

        return mesh;
    }

    vertexBuffer: VulkanBuffer;
    indexBuffer: VulkanBuffer;

    createBuffers(device: LogicalDevice) {

        if (this._pipes.includes("mesh") || this._pipes.includes("sky")) {
            let vertices = this.getVertexBufferData;
            let indicies = this.getIndiciesBufferData;
            this.vertexBuffer = new VulkanBuffer(device, vertices.byteLength, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT);
            this.indexBuffer = new VulkanBuffer(device, indicies.byteLength, VK_BUFFER_USAGE_INDEX_BUFFER_BIT);
        }

        let transform = new Float32Array(this.transform.matrix.values);

        this.transform.uniformBuffer = new VulkanBuffer(device, transform.byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.transform.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }

    uploadBuffers(cpool: VkCommandPool) {
        let vertices = this.getVertexBufferData;
        let indicies = this.getIndiciesBufferData;

        if (this._pipes.includes("mesh") || this._pipes.includes("sky")) {
            this.vertexBuffer.upload(cpool, vertices);
            this.indexBuffer.upload(cpool, indicies);
        }

        let transform = new Float32Array(this.transform.matrix.values);
        this.transform.uniformBuffer.upload(cpool, transform);
    }
}