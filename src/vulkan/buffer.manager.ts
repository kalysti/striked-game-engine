import { VK_BUFFER_USAGE_INDEX_BUFFER_BIT, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from "vulkan-api";
import { List } from '@engine/types';
import { VulkanBuffer } from "./buffer";
import { RenderInstance } from './render.instance';
import { VulkanTextureBuffer } from "./texture.buffer";
import { EntityObject } from "@engine/resources";
import { Texture2D } from "@engine/resources/2d";

export class GraphicsUniformBuffer {
    entity: EntityObject;
    buffer: VulkanBuffer;
    inUsage: number = 0;
    constructor(entity: EntityObject, buffer: VulkanBuffer) {
        this.entity = entity;
        this.buffer = buffer;
    }
}


export class GraphicsTextureBuffer {
    entity: Texture2D;
    buffer: VulkanTextureBuffer;
    inUsage: number = 0;
    constructor(entity: Texture2D, buffer: VulkanTextureBuffer) {
        this.entity = entity;
        this.buffer = buffer;
    }
}

export class BufferManager {


    private buffers = new List<GraphicsUniformBuffer>();
    private textures = new List<GraphicsTextureBuffer>();
    private renderInstance: RenderInstance;
    private dirtyEntities: string[] = [];

    constructor(renderInstance: RenderInstance) {
        this.renderInstance = renderInstance;
    }

    getTextureBuffer(t: string) {
        return this.textures.get(t);
    }

    getBuffer(t: string) {
        return this.buffers.get(t);
    }

    createUniformBuffer(t: EntityObject) {

        if (this.buffers.has(t.id.toString()))
            return;

        let uniformBuffer = new VulkanBuffer(VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, this.renderInstance.logicalDevice, this.renderInstance.physicalDevice, this.renderInstance.commandPool);
        uniformBuffer.create(t.toDataStream().byteLength, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
        uniformBuffer.updateValues(t.toDataStream());

        this.buffers.add(t.id.toString(), new GraphicsUniformBuffer(t, uniformBuffer));
    }

    updateDirtyEntities() {
        for (let key of this.dirtyEntities) {
            if (this.buffers.has(key)) {
                let entity = this.buffers.get(key);
                console.log("[Dirty]: " + entity.entity.constructor.name);
                entity.buffer.updateValues(entity.entity.toDataStream());
            }
        }
        this.dirtyEntities = [];
    }

    setIsDirty(t: EntityObject) {
        if (!this.dirtyEntities.includes(t.id.toString()))
            this.dirtyEntities.push(t.id.toString());
    }

    createTextureBuffer(t: Texture2D) {

        let bk = new VulkanTextureBuffer(this.renderInstance);
        bk.format = t.format;
        bk.upload(t.data, t.width, t.height);
        this.textures.add(t.id.toString(), new GraphicsTextureBuffer(t, bk));
    }

    createIndexBuffer(t: EntityObject) {

        if (this.buffers.has(t.id.toString()))
            return;

        let uniformBuffer = new VulkanBuffer(VK_BUFFER_USAGE_INDEX_BUFFER_BIT, this.renderInstance.logicalDevice, this.renderInstance.physicalDevice, this.renderInstance.commandPool);
        uniformBuffer.upload(t.toDataStream());
        this.buffers.add(t.id.toString(), new GraphicsUniformBuffer(t, uniformBuffer));
    }

    createVertexBuffer(t: EntityObject) {

        if (this.buffers.has(t.id.toString()))
            return;

        let uniformBuffer = new VulkanBuffer(VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, this.renderInstance.logicalDevice, this.renderInstance.physicalDevice, this.renderInstance.commandPool);
        uniformBuffer.upload(t.toDataStream());
        this.buffers.add(t.id.toString(), new GraphicsUniformBuffer(t, uniformBuffer));
    }

}