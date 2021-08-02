import { Vector2D } from '../../math/Vector2D';
import { Vector3D } from "../../math/Vector3D";
import { Mesh3D } from "./Mesh3D";
import { Transform } from '../../math/Transform';

export class CubeMesh extends Mesh3D {

    transform: Transform = Transform.Identity;

    constructor() {
        super();
        this.generateUv0();
        this.generateIndicies();
        this.generateVertices();
        this.generateColors();
        this.generateNormals();
    }

    private generateColors() {
        this._data.colors = [new Vector3D(1, 0, 0)];
    }

    private generateNormals() {
        this._data.normals = [
            // Front
            new Vector3D(0.0, 0.0, 1.0),
            new Vector3D(0.0, 0.0, 1.0),
            new Vector3D(0.0, 0.0, 1.0),
            new Vector3D(0.0, 0.0, 1.0),
            // Back
            new Vector3D(0.0, 0.0, -1.0),
            new Vector3D(0.0, 0.0, -1.0),
            new Vector3D(0.0, 0.0, -1.0),
            new Vector3D(0.0, 0.0, -1.0),
            // Top
            new Vector3D(0.0, 1.0, 0.0),
            new Vector3D(0.0, 1.0, 0.0),
            new Vector3D(0.0, 1.0, 0.0),
            new Vector3D(0.0, 1.0, 0.0),
            // Bottom
            new Vector3D(0.0, -1.0, 0.0),
            new Vector3D(0.0, -1.0, 0.0),
            new Vector3D(0.0, -1.0, 0.0),
            new Vector3D(0.0, -1.0, 0.0),
            // Right
            new Vector3D(1.0, 0.0, 0.0),
            new Vector3D(1.0, 0.0, 0.0),
            new Vector3D(1.0, 0.0, 0.0),
            new Vector3D(1.0, 0.0, 0.0),
            // Left
            new Vector3D(-1.0, 0.0, 0.0),
            new Vector3D(-1.0, 0.0, 0.0),
            new Vector3D(-1.0, 0.0, 0.0),
            new Vector3D(-1.0, 0.0, 0.0)
        ];
    }

    private generateVertices() {
        // Front face
        this._data.vertices = [
            new Vector3D(-1.0, -1.0, 1.0),
            new Vector3D(1.0, -1.0, 1.0),
            new Vector3D(1.0, 1.0, 1.0),
            new Vector3D(-1.0, 1.0, 1.0),
            // Back face
            new Vector3D(-1.0, -1.0, -1.0),
            new Vector3D(-1.0, 1.0, -1.0),
            new Vector3D(1.0, 1.0, -1.0),
            new Vector3D(1.0, -1.0, -1.0),
            // Top face
            new Vector3D(-1.0, 1.0, -1.0),
            new Vector3D(-1.0, 1.0, 1.0),
            new Vector3D(1.0, 1.0, 1.0),
            new Vector3D(1.0, 1.0, -1.0),
            // Bottom face
            new Vector3D(-1.0, -1.0, -1.0),
            new Vector3D(1.0, -1.0, -1.0),
            new Vector3D(1.0, -1.0, 1.0),
            new Vector3D(-1.0, -1.0, 1.0),
            // Right face
            new Vector3D(1.0, -1.0, -1.0),
            new Vector3D(1.0, 1.0, -1.0),
            new Vector3D(1.0, 1.0, 1.0),
            new Vector3D(1.0, -1.0, 1.0),
            // Left face
            new Vector3D(-1.0, -1.0, -1.0),
            new Vector3D(-1.0, -1.0, 1.0),
            new Vector3D(-1.0, 1.0, 1.0),
            new Vector3D(-1.0, 1.0, -1.0)];
    }

    private generateIndicies() {
        this._data.indicies = [
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
            22, 23, 20];
    }
    private generateUv0() {
        // Front
        this._data.uvs[0] = [
            new Vector2D(0.025, 0.01),
            new Vector2D(0.175, 0.01),
            new Vector2D(0.175, 0.175),
            new Vector2D(0.025, 0.175),
            // Back
            new Vector2D(0.0, 0.0),
            new Vector2D(1.0, 0.0),
            new Vector2D(1.0, 1.0),
            new Vector2D(0.0, 1.0),
            // Top
            new Vector2D(1.0, 0.0),
            new Vector2D(1.0, -1.0),
            new Vector2D(0.0, -1.0),
            new Vector2D(0.0, 0.0),
            // Bottom
            new Vector2D(0.0, 0.0),
            new Vector2D(1.0, 0.0),
            new Vector2D(1.0, -1.0),
            new Vector2D(0.0, -1.0),
            // Right
            new Vector2D(0.0, 0.0),
            new Vector2D(-1.0, 0.0),
            new Vector2D(-1.0, -1.0),
            new Vector2D(0.0, -1.0),
            // Left
            new Vector2D(1.0, 0.0),
            new Vector2D(1.0, -1.0),
            new Vector2D(0.0, -1.0),
            new Vector2D(0.0, 0.0)
        ];
    }
}