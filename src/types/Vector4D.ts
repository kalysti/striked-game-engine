import { EntityObject } from "@engine/resources";

export class Vector4D extends EntityObject {
    x: number = 0;
    y: number = 0;
    z: number = 0;
    d: number = 0;

    toDataStream(): Float32Array {
        return new Float32Array(this.values);
    }

    constructor(x: number, y: number, z: number, d: number) {
        super();
        this.x = x;
        this.y = y;
        this.z = z;
        this.d = d;
    }

    get values(): number[] {
        return [this.x, this.y, this.z, this.d];
    }

    static get Zero() {
        return new Vector4D(0, 0, 0, 0);
    }
}
