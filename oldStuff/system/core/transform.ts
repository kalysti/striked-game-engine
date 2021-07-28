import { mat4, quat, vec2, vec3 } from "gl-matrix";
import sizeof from 'object-sizeof'

export class Transform {



    private _position: vec3 = vec3.create();
    private _rotation: quat = quat.create();
    private _scale: vec3 = vec3.create();
    private _matrix: mat4 = mat4.create();

    IsStatic: boolean = false;


    get matrix(): mat4 {
        return this._matrix;
    }

    get position(): vec3 {
        return this._position;
    }

    get rotation(): quat {
        return this._rotation;
    }

    get scale(): vec3 {
        return this._scale;
    }

    set position(val: vec3) {

        if (this._position.valueOf() == val.valueOf())
            return;

        this._position = val;

        this.RecalculateMatrix();
    }

    set rotation(val: quat) {

        if (this._rotation.valueOf() == val.valueOf())
            return;

        this._rotation = val;

        this.RecalculateMatrix();
    }

    set scale(val: vec3) {

        if (this._scale.valueOf() == val.valueOf())
            return;

        this._scale = val;

        this.RecalculateMatrix();
    }


    constructor() {
        vec3.zero(this._position);
        quat.identity(this._rotation);
        vec3.fromValues(1, 1, 1);

        this.RecalculateMatrix();
    }

    public Right(): vec3 {

        let mat = this._matrix;
        let vec = vec3.create();
        vec3.normalize(vec, vec3.fromValues(mat[5], mat[6], mat[7]));

        return vec;
    }

    get Up(): vec3 {

        let mat = this._matrix;
        let vec = vec3.create();
        vec3.normalize(vec, vec3.fromValues(mat[9], mat[10], mat[11]));

        return vec;
    }

    get Forward(): vec3 {

        let mat = this._matrix;
        let vec = vec3.create();
        vec3.normalize(vec, vec3.fromValues(mat[13], mat[14], mat[15]));

        return vec;
    }

    public get InstancedData(): Float32Array {
        return this._matrix as Float32Array;
    }

    public get GetBytes(): number {
        return this.InstancedData.byteLength;
    }

    private RecalculateMatrix() {
        var mat = mat4.create();
        mat4.identity(mat);

        let scaledMat = mat4.create();
        mat4.fromScaling(scaledMat, this._scale);

        let rotatedMat = mat4.create();
        mat4.fromQuat(rotatedMat, this.rotation);

        let translatedMat = mat4.create();
        mat4.fromTranslation(translatedMat, this.position);

        mat4.multiply(mat, mat, scaledMat);
        mat4.multiply(mat, mat, rotatedMat);
        mat4.multiply(mat, mat, translatedMat);

        return mat;
    }
}
