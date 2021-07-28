import { Vector2D } from './Vector2D';
export class Vector3D {
    x: number = 0;
    y: number = 0;
    z: number = 0;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get length() {
        return 3;
    }

    toString()
    {
        return "x: " + this.x + ", y:" + this.y + ", z:" + this.z;
    }

    div(value: Vector3D | Vector2D | number) {

        let values = this.values;

        if (value instanceof Vector2D) {
            values[0] /= value.x;
            values[1] /= value.y;
        }
        else if (value instanceof Vector3D) {
            values[0] /= value.x;
            values[1] /= value.y;
            values[2] /= value.z;
        }
        else {
            values[0] /= value;
            values[1] /= value;
            values[2] /= value;
        }

        let newVec = Vector3D.Zero;
        newVec.values = values;

        return newVec;
    }
    mul(value: Vector3D | Vector2D | number) {

        let values = this.values;

        if (value instanceof Vector2D) {
            values[0] *= value.x;
            values[1] *= value.y;
        }
        else if (value instanceof Vector3D) {
            values[0] *= value.x;
            values[1] *= value.y;
            values[2] *= value.z;
        }
        else {
            values[0] *= value;
            values[1] *= value;
            values[2] *= value;
        }

        let newVec = Vector3D.Zero;
        newVec.values = values;

        return newVec;
    }

    sub(value: Vector3D | Vector2D | number) {
        let values = this.values;

        if (value instanceof Vector2D) {
            values[0] -= value.x;
            values[1] -= value.y;
        }
        else if (value instanceof Vector3D) {
            values[0] -= value.x;
            values[1] -= value.y;
            values[2] -= value.z;
        }
        else {
            values[0] -= value;
            values[1] -= value;
            values[2] -= value;
        }

        let newVec = Vector3D.Zero;
        newVec.values = values;

        return newVec;
    }

    add(value: Vector3D | Vector2D | number) {

        let values = Object.assign([], this.values);

        if (value instanceof Vector2D) {
            values[0] += value.x;
            values[1] += value.y;
        }
        else if (value instanceof Vector3D) {
            values[0] += value.x;
            values[1] += value.y;
            values[2] += value.z;
        }
        else {
            values[0] += value;
            values[1] += value;
            values[2] += value;
        }

        let newVec = Vector3D.Zero;
        newVec.values = values;

        return newVec;
    }

    cross(bV: Vector3D) {
        let out = Vector3D.Zero.values;
        let a: number[] = Object.assign([], this.values);
        let b: number[] = Object.assign([], bV.values);


        let ax = a[0],
            ay = a[1],
            az = a[2];
        let bx = b[0],
            by = b[1],
            bz = b[2];

        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;

        let newVec = Vector3D.Zero;
        newVec.values = out;

        return newVec;
    }

    normalize() {
        let out = Vector3D.Zero.values;

        let x = this.x;
        let y = this.y;
        let z = this.z;

        let len = x * x + y * y + z * z;
        if (len > 0) {
            //TODO: evaluate use of glm_invsqrt here?
            len = 1 / Math.sqrt(len);
        }
        out[0] = x * len;
        out[1] = y * len;
        out[2] = z * len;

        this.values = out;
        return this;
    }


    get values(): number[] {
        return [this.x, this.y, this.z];
    }

    set values(values: number[]) {
        if (values.length != 3)
            throw new Error("Have to be 3 values");

        this.x = values[0];
        this.y = values[1];
        this.z = values[2];
    }

    static get One() {
        return new Vector3D(1, 1, 1);
    }

    static get Zero() {
        return new Vector3D(0, 0, 0);
    }

    static get Back() {
        return new Vector3D(0, 0, 1);
    }

    static get Forward() {
        return new Vector3D(0, 0, -1);
    }

    static get Right() {
        return new Vector3D(1, 0, 0);
    }

    static get Left() {
        return new Vector3D(-1, 0, 0);
    }

    static get Up() {
        return new Vector3D(0, 1, 0);
    }

    static get Down() {
        return new Vector3D(0, -1, 0);
    }
}