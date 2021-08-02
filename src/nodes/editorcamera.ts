import { MathCommon } from '../math/Common';
import { Vector2D } from '../math/Vector2D';
import { Vector3D } from '../math/Vector3D';
import { EngineInputEvent, EngineInputKeyEvent, EngineInputKeyEventType, EngineInputMouseEvent, EngineInputMouseMotionEvent, EngineMouseButton } from '../resources/core/Node';
import { Renderer } from '../renderer';
import { Camera, CameraType } from './camera';

export class InputStruct {
    left: boolean = false;
    right: boolean = false;
    up: boolean = false;
    down: boolean = false;
}

export class EditorCamera extends Camera {

    mousePos: Vector2D = Vector2D.Zero;
    mouseLeftPressed: boolean = false;
    mouseRightPressed: boolean = false;
    zoomSpeed = 1.0;
    keys: InputStruct = new InputStruct();

    constructor() {
        super();
    }

    moving(): boolean {
        return this.keys.left || this.keys.right || this.keys.up || this.keys.down;
    }

    override onEnable(): void {
        this.type = CameraType.firstperson;
        this.setPerspective(60.0, Renderer.window.width / Renderer.window.height, 1.0, 512.0);
        this.setRotation(new Vector3D(6.0, -90.0, 0.0));
        this.setTranslation(new Vector3D(-125.0, 6.25, 0.0));
        this.movementSpeed = 20.0 * 2.0;
    }

    override onInput(handler: EngineInputEvent): void {

        if (handler instanceof EngineInputMouseEvent) {
            let e = handler as EngineInputMouseEvent;
            if (e.type == EngineInputKeyEventType.pressed) {

                if (e.button == EngineMouseButton.left)
                    this.mouseLeftPressed = true;

                if (e.button == EngineMouseButton.right)
                    this.mouseRightPressed = true;

                Renderer.window.enterPointerLock();
            }
            else {


                if (e.button == EngineMouseButton.left)
                    this.mouseLeftPressed = false;

                if (e.button == EngineMouseButton.right)
                    this.mouseRightPressed = false;

                Renderer.window.exitPointerLock();
            }
        }

        else if (handler instanceof EngineInputMouseMotionEvent) {
            let e = handler as EngineInputMouseMotionEvent;

            if (this.mouseRightPressed) {
                this.translate(new Vector3D(-0.00001, 0.0, (this.mousePos.y + e.value.y) * .005 * this.zoomSpeed));
            }

            if (this.mouseLeftPressed) {
                let v = new Vector3D((this.mousePos.y + e.value.y) * this.rotationSpeed, -(this.mousePos.x + e.value.x) * this.rotationSpeed, 0.0);
                this.rotate(v);
            }
            
            this.mousePos = new Vector2D(e.value.x, e.value.y);
        }

        else if (handler instanceof EngineInputKeyEvent) {
            let e = handler as EngineInputKeyEvent;

            if (e.type == EngineInputKeyEventType.released) {
                switch (e.key) {
                    case 83: this.keys.down = false; break;
                    case 87: this.keys.up = false; break;
                    case 65: this.keys.left = false; break;
                    case 68: this.keys.right = false; break;
                }
            }
            else {
                switch (e.key) {
                    case 83: this.keys.down = true; break;
                    case 87: this.keys.up = true; break;
                    case 65: this.keys.left = true; break;
                    case 68: this.keys.right = true; break;
                }
            }
        }
    }

    override onUpdate(deltaTime: number): void {
        if (this.type == CameraType.firstperson && this.moving()) {

            let camFront = Vector3D.Zero;
            camFront.x = -Math.cos(MathCommon.toRadian(this.rotation.x)) * Math.sin(MathCommon.toRadian(this.rotation.y));
            camFront.y = Math.sin(MathCommon.toRadian(this.rotation.x));
            camFront.z = Math.cos(MathCommon.toRadian(this.rotation.x)) * Math.cos(MathCommon.toRadian(this.rotation.y));
            camFront.normalize();

            let moveSpeed = deltaTime * this.movementSpeed;

            let camFrontMultiplier = camFront.mul(moveSpeed);

            if (this.keys.up) {
                this.position = this.position.add(camFrontMultiplier);
            }
            if (this.keys.down)
                this.position = this.position.sub(camFrontMultiplier);

            if (this.keys.left) {

                let forward = Vector3D.Zero;
                forward = camFront.cross(new Vector3D(0, 1, 0));
                forward.normalize();
                forward = forward.mul(moveSpeed);

                this.position = this.position.sub(forward);
            }
            if (this.keys.right) {

                let forward = Vector3D.Zero;
                forward = camFront.cross(new Vector3D(0, 1, 0));
                forward.normalize();
                forward = forward.mul(moveSpeed);

                this.position = this.position.add(forward);
            }

            this.updateViewMatrix();

        }
    }

}