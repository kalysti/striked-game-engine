import { EntityObject } from '@engine/resources';
import { Vector2D, Vector4D } from '@engine/types';

export class MeshData2D extends EntityObject {

    vertices: Vector2D[] = [];
    uv0: Vector2D[] = [];
    colors: Vector4D[] = [];
    uvs: Vector2D[] = [];

    clear(){
        this.vertices = [];
        this.uv0 = [];
        this.colors = [];
        this.uvs = [];
    }

    toDataStream(): Float32Array {
        let numbers = [];
        for (let i in this.vertices) {
            numbers.push(this.vertices[i].x);
            numbers.push(this.vertices[i].y);
            numbers.push(this.uvs[i].x);
            numbers.push(this.uvs[i].y);
            numbers.push(this.colors[i].x);
            numbers.push(this.colors[i].y);
            numbers.push(this.colors[i].z);
            numbers.push(this.colors[i].d);
        }

        return new Float32Array(numbers);
    }

    /**
     * Gets uv0 byte array
     */
    get uv0ByteArray() {
        if (this.uv0.length <= 0) {
            let array = this.vertices.map(df => new Vector2D(0, 0).values).reduce((a, b) => a.concat(b));
            return new Float32Array(array);

        }
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