import * as EngineMath from '@engine/math';
import { GraphicsModule } from '@engine/modules';
import { BaseNode } from '@engine/core';
import { Bindable, BindInterfaceType } from '@engine/nodes/renderable';
import { Matrix4, Vector3D } from '@engine/types';
import { CameraData } from './camera.data';

export enum CameraType {
    lookat = 0,
    firstperson = 1,
}

export class Camera extends BaseNode {
    isActive: boolean = true;
    type: CameraType = CameraType.lookat;

    @Bindable(BindInterfaceType.UNIFORM)
    dataEntity: CameraData = new CameraData();

    fov: number = 60;

    rotation: Vector3D = Vector3D.Zero;
    position: Vector3D = Vector3D.Zero;

    rotationSpeed: number = 0.2;
    movementSpeed: number = 1.0;


    constructor() {
        super();
    }

    reset() {
        this.rotation = Vector3D.Zero;
        this.position = Vector3D.Zero;
        this.dataEntity.perspective = Matrix4.Zero;
        this.dataEntity.view = Matrix4.Zero;
    }

    setPerspective(
        fov: number,
        aspect: number,
        near: number,
        far: number,
    ): void {
        this.fov = fov;
        this.dataEntity.near = near;
        this.dataEntity.far = far;
        this.dataEntity.perspective = this.dataEntity.perspective.perspective(
            EngineMath.Common.toRadian(fov),
            aspect,
            near,
            far,
        );

        GraphicsModule.setIsDirty(this.dataEntity);
    }

    updateAspectRatio(aspect: number): void {
        //  this.matrices.perspective = glm:: perspective(glm:: radians(fov), aspect, near, far);
        this.dataEntity.perspective = this.dataEntity.perspective.perspective(
            EngineMath.Common.toRadian(this.fov),
            aspect,
            this.dataEntity.near,
            this.dataEntity.far,
        );

        GraphicsModule.setIsDirty(this.dataEntity);
    }

    setRotation(rotation: Vector3D): void {
        this.rotation = rotation;
        this.updateViewMatrix();
    }

    rotate(delta: Vector3D): void {
        this.rotation = this.rotation.add(delta);
        this.updateViewMatrix();
    }

    setTranslation(translation: Vector3D): void {
        this.position = translation;
        this.updateViewMatrix();
    }

    translate(delta: Vector3D): void {
        this.position = this.position.add(delta);
        this.updateViewMatrix();
    }


    override onUpdate(delta: number): void {
        super.onUpdate(delta);
    }

    override onEnable(): void {
        super.onEnable();
    }

    protected updateViewMatrix(): void {
        let rotM = Matrix4.Identity;
        let transM = Matrix4.Identity;

        rotM = rotM.rotate(
            EngineMath.Common.toRadian(this.rotation.x),
            new Vector3D(1.0, 0.0, 0.0),
        );
        rotM = rotM.rotate(
            EngineMath.Common.toRadian(this.rotation.y),
            new Vector3D(0.0, 1.0, 0.0),
        );
        rotM = rotM.rotate(
            EngineMath.Common.toRadian(this.rotation.z),
            new Vector3D(0.0, 0.0, 1.0),
        );

        transM = transM.translate(this.position);

        if (this.type == CameraType.firstperson) {
            this.dataEntity.view = rotM.mul(transM);
        } else {
            this.dataEntity.view = transM.mul(rotM);
        }

        GraphicsModule.setIsDirty(this.dataEntity);
    }
}
