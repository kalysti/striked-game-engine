import { RenderableNode } from '@engine/nodes';
import { Transform } from '@engine/types';
import { Material } from '../core/Material';
import { MeshData3D } from './MeshData3D';

export abstract class Mesh3D extends RenderableNode {
    transform: Transform = Transform.Identity;

    protected _data: MeshData3D = new MeshData3D();

    material: Material = new Material();

    set data(data: MeshData3D) {
        this._data = data;
    }

    get data(): MeshData3D {
        return this._data;
    }

        
 
    /*
    createBuffers() {
        this.vertexBuffer = new VulkanBuffer(
            VK_BUFFER_USAGE_VERTEX_BUFFER_BIT,
        );
        this.indexBuffer = new VulkanBuffer(
            VK_BUFFER_USAGE_INDEX_BUFFER_BIT,
        );

        let transform = new Float32Array(this.transform.matrix.values);

        this.transform.uniformBuffer = new VulkanBuffer(
            VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT,
        );
        this.transform.uniformBuffer.create(
            transform.byteLength,
            VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT |
                VK_MEMORY_PROPERTY_HOST_COHERENT_BIT,
        );
    }

    uploadBuffers() {
        this.vertexBuffer.upload(this.data.verticesByteArray);
        this.indexBuffer.upload(this.data.indiciesByteArray);

        let transform = new Float32Array(this.transform.matrix.values);
        this.transform.uniformBuffer.updateValues(transform);
    }
    */
}
