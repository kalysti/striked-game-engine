import { Vector3D } from "../math/Vector3D";
import { Vector2D } from '../math/Vector2D';

export class MeshData3D {

    indicies: number[] = [];
    vertices: Vector3D[] = [];
    normals: Vector3D[] = [];
    uvs: Vector2D[][] = [[], []];
    colors: Vector3D[] = [];

    /**
     * Gets indicies byte array
     */
    get indiciesByteArray(): Uint16Array {
        return new Uint16Array(this.indicies);
    }

    /**
     * Gets vertices byte array
     */
    get verticesByteArray(): Float32Array {
        let array = this.vertices.map(df => df.values).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }

    /**
     * Gets colors byte array
     */
    get colorsByteArray(): Float32Array {
        let array = this.colors.map(df => df.values).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }

    /**
     * Gets normals byte array
     */
    get normalsByteArray(): Float32Array {
        let array = this.normals.map(df => df.values).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }

    /**
     * Gets uv0 byte array
     */
    get uv0ByteArray() {
        let array = this.uvs[0].map(df => df.getArray()).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }

    /**
     * Gets uv1 byte array
     */
    get uv1ByteArray() {
        let array = this.uvs[1].map(df => df.getArray()).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }
}