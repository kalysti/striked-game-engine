import { MathCommon } from "../math/Common";
import { Vector3D } from "../math/Vector3D";
import { Matrix4 } from '../math/Mat4';
import { Vector2D } from "../math/Vector2D";
import { SceneNode } from '../resources/Node';

export enum CameraType { lookat = 0, firstperson = 1 };

export class MatricesStruct {
    perspective: Matrix4 = Matrix4.Zero;
    view: Matrix4 = Matrix4.Zero;
}

export class Camera extends SceneNode {

    isActive: boolean = true;
    type: CameraType = CameraType.lookat;

    fov: number = 0;
    znear: number = 0;
    zfar: number = 0;

    rotation: Vector3D = Vector3D.Zero;
    position: Vector3D = Vector3D.Zero;

    rotationSpeed: number = 0.2;
    movementSpeed: number = 1.0;

    matrices: MatricesStruct = new MatricesStruct();


    setPerspective(fov: number, aspect: number, znear: number, zfar: number): void {
        this.fov = fov;
        this.znear = znear;
        this.zfar = zfar;
        this.matrices.perspective = this.matrices.perspective.perspective(MathCommon.toRadian(fov), aspect, znear, zfar);
    };

    updateAspectRatio(aspect: number): void {
        //  this.matrices.perspective = glm:: perspective(glm:: radians(fov), aspect, znear, zfar);
        this.matrices.perspective = this.matrices.perspective.perspective(MathCommon.toRadian(this.fov), aspect, this.znear, this.zfar);
    }

    setRotation(rotation: Vector3D): void {
        this.rotation = rotation;
        this.updateViewMatrix();
    };

    rotate(delta: Vector3D): void {
        this.rotation = this.rotation.add(delta);
        this.updateViewMatrix();
    }

    setTranslation(translation: Vector3D): void {
        this.position = translation;
        this.updateViewMatrix();
    };

    translate(delta: Vector3D): void {
        this.position = this.position.add(delta);
        this.updateViewMatrix();
    }

    protected updateViewMatrix(): void {
        let rotM = Matrix4.Identity;
        let transM = Matrix4.Identity;

        rotM = rotM.rotate(MathCommon.toRadian(this.rotation.x), new Vector3D(1.0, 0.0, 0.0));
        rotM = rotM.rotate(MathCommon.toRadian(this.rotation.y), new Vector3D(0.0, 1.0, 0.0));
        rotM = rotM.rotate(MathCommon.toRadian(this.rotation.z), new Vector3D(0.0, 0.0, 1.0));

        transM = transM.translate(this.position);


        if (this.type == CameraType.firstperson) {
            this.matrices.view = rotM.mul(transM);
        }
        else {
            this.matrices.view = transM.mul(rotM);
        }
    };

}