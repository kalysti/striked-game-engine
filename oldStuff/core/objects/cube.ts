import { VkVertexInputAttributeDescription, VK_FORMAT_R32G32B32_SFLOAT, VK_FORMAT_R32G32_SFLOAT } from "vulkan-api/generated/1.2.162/win32";
import { IndexBuffer, Renderer, VertexBuffer } from "../render/renderer";
import { Texture2D } from "../resources/texture2d";

export class Cube {

    positions = new Float32Array([
        // Front face
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        // Back face
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,
        // Top face
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,
        // Right face
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0
    ]);

    normals = new Float32Array([
        // Front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        // Back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        // Top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        // Bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        // Right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        // Left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ]);

    uvs = new Float32Array([
        // Front
        0.025, 0.01,
        0.175, 0.01,
        0.175, 0.175,
        0.025, 0.175,
        // Back
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Top
        1.0, 0.0,
        1.0, -1.0,
        0.0, -1.0,
        0.0, 0.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, -1.0,
        0.0, -1.0,
        // Right
        0.0, 0.0,
        -1.0, 0.0,
        -1.0, -1.0,
        0.0, -1.0,
        // Left
        1.0, 0.0,
        1.0, -1.0,
        0.0, -1.0,
        0.0, 0.0
    ]);

    indices = new Uint16Array([
        0, 1, 2,
        2, 3, 0,
        4, 5, 6,
        6, 7, 4,
        8, 9, 10,
        10, 11, 8,
        12, 13, 14,
        14, 15, 12,
        16, 17, 18,
        18, 19, 16,
        20, 21, 22,
        22, 23, 20
    ]);

    meshData = new Float32Array();

    constructor() {
        this.meshData = new Float32Array(this.positions.length + this.normals.length + this.uvs.length);

        for (let ii = 0; ii < this.meshData.length; ++ii) {
            let offset8 = ii * 8;
            let offset3 = ii * 3;
            let offset2 = ii * 2;
            this.meshData[offset8 + 0] = this.positions[offset3 + 0];
            this.meshData[offset8 + 1] = this.positions[offset3 + 1];
            this.meshData[offset8 + 2] = this.positions[offset3 + 2];
            this.meshData[offset8 + 3] = this.normals[offset3 + 0];
            this.meshData[offset8 + 4] = this.normals[offset3 + 1];
            this.meshData[offset8 + 5] = this.normals[offset3 + 2];
            this.meshData[offset8 + 6] = this.uvs[offset2 + 0];
            this.meshData[offset8 + 7] = this.uvs[offset2 + 1];
        };
    }

    indexBuffer!: IndexBuffer;
    vertexBuffer!: VertexBuffer;

    texture: Texture2D = new Texture2D();

    init(_instance: Renderer) {
        this.texture.fromImagePath("./assets/grass-block.png");

        this.vertexBuffer = _instance.createVertexBuffer(this.meshData);
        this.indexBuffer = _instance.createIndexBuffer(this.indices);

        this.texture.init(_instance);
    }

    getAttributes(): VkVertexInputAttributeDescription[] {
        let attributeDescriptions: VkVertexInputAttributeDescription[] = [];

        attributeDescriptions = [...Array(3)].map(() => new VkVertexInputAttributeDescription());
        // vertex
        attributeDescriptions[0].location = 0;
        attributeDescriptions[0].binding = 0;
        attributeDescriptions[0].format = VK_FORMAT_R32G32B32_SFLOAT;
        attributeDescriptions[0].offset = 0;
        // normal
        attributeDescriptions[1].location = 1;
        attributeDescriptions[1].binding = 0;
        attributeDescriptions[1].format = VK_FORMAT_R32G32B32_SFLOAT;
        attributeDescriptions[1].offset = 3 * this.meshData.BYTES_PER_ELEMENT;
        // uvs
        attributeDescriptions[2].location = 2;
        attributeDescriptions[2].binding = 0;
        attributeDescriptions[2].format = VK_FORMAT_R32G32_SFLOAT;
        attributeDescriptions[2].offset = 6 * this.meshData.BYTES_PER_ELEMENT;

        return attributeDescriptions;
    }

    bytesPerElement(): number {
        return this.meshData.BYTES_PER_ELEMENT;;
    }

}