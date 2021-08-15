import { EntityObject } from '@engine/resources';
import { Matrix4, Vector3D } from '@engine/types';
import { VulkanBuffer } from '../vulkan/buffer';

export class Transform extends EntityObject {

    toDataStream(): Uint8Array {
        return new Uint8Array(new Float32Array(this.matrix.values));
    }

    _translation: Vector3D = Vector3D.Zero;
    _rotation: Vector3D = Vector3D.Zero;
    _scale: Vector3D = Vector3D.One;
    uniformBuffer: VulkanBuffer;

    get matrix(): Matrix4 {
        let tf = Matrix4.Identity;
        tf.translate(this._translation);
        tf.rotate(Math.PI / 2, this._rotation);
        tf.scale(this._scale);

        return tf;
    }

    constructor() {
        super();
    }

    static get Identity() {
        return new Transform();
    }
}