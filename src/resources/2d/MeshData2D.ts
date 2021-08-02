import { Vector3D } from "../../math/Vector3D";
import { Vector2D } from '../../math/Vector2D';

export class MeshData2D {

    vertices: Vector2D[] = [];
    uv0: Vector2D[] = [];

    /**
     * Gets uv0 byte array
     */
    get uv0ByteArray() {
        if (this.uv0.length <= 0)
            return new Float32Array(0);
        let array = this.uv0.map(df => df.values).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }

    /*
     * Gets vertices byte array
     */
    get verticesByteArray(): Float32Array {
        let array = this.vertices.map(df => df.values).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }
}