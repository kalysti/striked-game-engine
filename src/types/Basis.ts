import { Vector3D } from './Vector3D';

export class Basis {
    x = Vector3D.Zero;
    y = Vector3D.Zero;
    z = Vector3D.Zero;

    constructor(_x: Vector3D, _y: Vector3D, _z: Vector3D) {
        this.x = _x;
        this.y = _y;
        this.z = _z;
    }

    static get Zero(){
        return new Basis(Vector3D.Zero, Vector3D.Zero, Vector3D.Zero);
    }

    static get Identity() {
        return new Basis(Vector3D.Right, Vector3D.Up, Vector3D.Back);
    }

}