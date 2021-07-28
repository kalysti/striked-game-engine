import { mat4, quat, quat, quat, vec3, vec4 } from "gl-matrix";
import { Transform } from "../types/transform";

export class Node {

    m_position: vec3 = vec3.create();
    m_rotation: vec3 = vec3.create();
    m_scale: vec3 = vec3.create();
    m_transform_needs_update: boolean = false;
    parent: Node | null = null;
    childs: Node[] = [];

    m_transform: Transform = new Transform();

    constructor() {
        this.m_position = vec3.fromValues(0, 0, 0);
        this.m_rotation = vec3.fromValues(0, 0, 0);
        this.m_scale = vec3.fromValues(1, 1, 1);
        this.m_transform_needs_update = true;
    }

    get transform() {
        return this.m_transform;
    }

    update(inUpdateChildren: boolean = false) {
        let updated = false;

        //m_transform_needs_update = true;
        if (this.m_transform_needs_update || inUpdateChildren) {

            let parentTransform: Transform | null = null;
            if (this.parent != null) {
                parentTransform = this.parent.transform;
            }

            this.m_transform.reset();
            let tra = vec4.fromValues(this.m_position[0], this.m_position[1], this.m_position[2], 1.0);
            this.m_transform.translateVec4(tra);

            let q = quat.create();
            quat.fromEuler(q, this.m_rotation[0], this.m_rotation[1], this.m_rotation[2]);
            this.m_transform.rotateQuat(q);

            this.m_transform.update(parentTransform);
            this.m_transform_needs_update = false;
            updated = true;
        }

        if (updated) {
            for (let child of this.childs) {
                child.update(updated);
            }
        }

        return updated;
    }

    getWorldPosition(): vec4 {
        nvmath:: vec4f outPosition(0.0, 0.0, 0.0, 1.0);

        return this.m_transform(outPosition);
    }

    getWorldPosition(inPosition: vec4) {
        return this.m_transform(inPosition);
    }


    set position(inX: number, inY: number, inZ: number) {
        this.m_position[0] = inX;
        this.m_position[1] = inY;
        this.m_position[2] = inZ;
        this.m_transform_needs_update = true;
    }

    setRotationQuat(inQuat: quat) {
        let angles: vec3 = vec3.create();
        quat.getAxisAngle(angles, inQuat);

        this.setRotation(angles[0], angles[1], angles[2]);
    }

    setRotation(inX: number, inY: number, inZ: number) {
        this.m_rotation[0] = inX;
        this.m_rotation[1] = inY;
        this.m_rotation[2] = inZ;
        this.m_transform_needs_update = true;
    }

    setScale(inX: number, inY: number, inZ: number) {
        this.m_scale[0] = inX;
        this.m_scale[1] = inY;
        this.m_scale[2] = inZ;
        this.m_transform_needs_update = true;
    }

    setScaleFloat(inScale: number) {
        this.setScale(inScale, inScale, inScale);
    }




}