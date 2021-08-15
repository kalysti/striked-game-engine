import { Scene } from '@engine/scene';
import { GraphicsModule } from '@engine/modules';
import { Vector2D } from '@engine/types';
import { BindInterface } from '@engine/nodes/renderable';
import { EngineObject } from '@engine/resources';

export interface ResizeEvent {
    width: number;
    height: number;
}

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
    pos: Vector2D;

    constructor(value: Vector2D, pos: Vector2D) {
        super();
        this.value = value;
        this.pos = pos;
    }
}

export abstract class BaseNode extends EngineObject {
    private childs: any[] = [];
    private parent: any;
    protected scene: Scene;

    addChild(node: any) {
        if (node instanceof BaseNode) {
            node.scene = this.scene;
            node.parent = this;

            this.childs.push(node);
        }
    }

    getParent<T>(key: (new (...args: any[]) => T) | Function): T | null {
        if (this.parent instanceof key)
            return this.parent as T;
        else
            return null;
    }

    getChildsOfType<T>(key: (new (...args: any[]) => T) | Function): T[] {
        return this.childs.filter(
            (df) => df instanceof key
        ) as T[];
    }

    setScene(scene: Scene) {
        this.scene = scene;

        for (let mesh of this.getChildsOfType(BaseNode)) {
            mesh.setScene(this.scene);
        }
    }

    protected getSubClasses(obj: any, values: string[]): string[] {

        let parentObj = Object.getPrototypeOf(obj);

        if (parentObj == null || parentObj.prototype == undefined) {
            return values;
        }
        else {
            values.push(parentObj.name);
            values = this.getSubClasses(parentObj, values);

            return values;
        }
    }

    getBindings(): BindInterface[] {

        let classes = this.getSubClasses(this.constructor, [this.constructor.name]);
        let attributes = [];
        for (let className of classes) {
            if (GraphicsModule.getBindings().has(className)) {
                let attributesOfClass = GraphicsModule.getBindings().get(className);
                attributes = attributes.concat(attributesOfClass);
            }
        }


        return attributes;
    }

    getAttribute(name: string) {
        return this[name];
    }

    onResize(event: ResizeEvent): void {
        for (let node of this.childs) {
            node.onResize(event);
        }
    };

    onEnable(): void {
        for (let node of this.childs) {
            node.onEnable();
        }
    };

    onInput(handler: EngineInputEvent): void {
        for (let node of this.childs) {
            node.onInput(handler);
        }
    };

    onUpdate(delta: number): void {
        for (let node of this.childs) {
            node.onUpdate(delta);
        }
    };

    beforeUpdate(delta: number): void {
        for (let node of this.childs) {
            node.beforeUpdate(delta);
        }
    };
}