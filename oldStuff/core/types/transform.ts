import { mat4, quat, vec3, vec4 } from "gl-matrix";

export class Transform {
    m_transform: mat4 = mat4.create();
    m_inverse: mat4 = mat4.create();
    m_matrix: mat4 = mat4.create();

    set matrix(inMatrix: mat4) { this.m_matrix = inMatrix; }

    get transform() { return this.m_transform; }
    get inverse() { return this.m_inverse; }

    constructor() {
        this.reset();
    }

    reset() {
        mat4.identity(this.m_matrix);
    }

    update(parentTransform: Transform | null = null) {

        this.m_transform = this.m_matrix;

        if (parentTransform != null) {
            mat4.multiply(this.m_transform, parentTransform.transform, this.m_transform);
        }

        this.m_inverse = this.m_transform;

        mat4.invert(this.m_inverse, this.m_inverse);
        mat4.transpose(this.m_inverse, this.m_inverse);

        this.m_inverse[12] = 0.0;
        this.m_inverse[13] = 0.0;
        this.m_inverse[14] = 0.0;

    }

    translateVec4(inPosition: vec4) {
        let vec = vec3.fromValues(inPosition[0], inPosition[1], inPosition[2]);
        mat4.translate(this.m_matrix, this.m_matrix, vec);
    }

    translateVec3(inX: number, inY: number, inZ: number) {
        let vec = vec3.fromValues(inX, inY, inZ);
        mat4.translate(this.m_matrix, this.m_matrix, vec);
    }

    rotate(inValue: number, inBasis: vec3) {
        mat4.rotate(this.m_matrix, this.m_matrix, inValue, inBasis);
    }

    rotateQuat(inQuat: quat) {
        mat4.rotate(this.m_matrix, this.m_matrix, inQuat[3], vec3.fromValues(inQuat[0], inQuat[1], inQuat[2]));
    }

    scaleVec3(inScale: vec3) {
        mat4.scale(this.m_matrix, this.m_matrix, inScale);
    }

    scale(inX: number, inY: number, inZ: number) {
        mat4.scale(this.m_matrix, this.m_matrix, vec3.fromValues(inX, inY, inZ));
    }

}