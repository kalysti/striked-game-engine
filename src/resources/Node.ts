import { EngineObject } from './EngineObject';
import { Vector2D } from '../math/Vector2D';

export class EngineInputEvent {

}

export class EngineInputKeyEvent extends EngineInputEvent {
    key: number;
    type: EngineInputKeyEventType;

    constructor(value: number, type: EngineInputKeyEventType) {
        super();
        this.key = value;
        this.type = type;
    }
}

export enum EngineMouseButton {
    left = 0,
    middle = 1,
    right = 2
}
export enum EngineInputKeyEventType {
    pressed,
    released
}

export class EngineInputMouseEvent extends EngineInputEvent {
    button: EngineMouseButton;
    type: EngineInputKeyEventType;

    constructor(button: EngineMouseButton, type: EngineInputKeyEventType) {
        super();
        this.button = button;
        this.type = type;
    }
}


export class EngineInputMouseMotionEvent extends EngineInputEvent {
    value: Vector2D;

    constructor(value: Vector2D) {
        super();
        this.value = value;
    }
}

export class SceneNode extends EngineObject {
    onEnable(): void {

    };
    onInput(handler: EngineInputEvent): void {

    };

    onUpdate(delta: number) : void {

    };
}