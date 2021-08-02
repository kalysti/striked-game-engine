import { Basis } from './Basis';
import { Vector2D } from './Vector2D';
import { Vector3D } from './Vector3D';
import { Matrix4 } from './Mat4';
import { VulkanBuffer } from '../vulkan/buffer';
import { EngineObject } from '../resources/core/EngineObject';

export class Transform extends EngineObject{

    _translation: Vector3D = Vector3D.Zero;
    _rotation: Vector3D = Vector3D.Zero;
    _scale: Vector3D = Vector3D.One;
    uniformBuffer: VulkanBuffer;

    get matrix(): Matrix4 {
        let tf =  Matrix4.Identity;
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