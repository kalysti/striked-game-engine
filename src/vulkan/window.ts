import { GraphicsModule } from '@engine/modules';
import { BaseNode, EngineInputKeyEvent, EngineInputKeyEventType, EngineInputMouseEvent, EngineInputMouseMotionEvent, EngineMouseButton } from '@engine/core';
import { ObjectId, Vector2D, Vector4D } from '@engine/types';
import { Subject } from 'rxjs';
import {
    VulkanWindow
} from 'vulkan-api';
import { Scene } from '@engine/scene';
import { VulkanBuffer } from './buffer';

export interface ResizeEvent {
    width: number;
    height: number;
}

export class RenderWindow extends VulkanWindow {
    uniformBuffer: VulkanBuffer | null = null;
    extentEntity: Vector4D = Vector4D.Zero;
    private _id = new ObjectId();
    currentScene: Scene;

    onWindowResize: Subject<ResizeEvent> = new Subject<ResizeEvent>();

    get id(): ObjectId {
        return this._id;
    }

    constructor(width: number, height: number, title: string) {
        super({
            width: width,
            height: height,
            title: title,
        });

        this.extentEntity.x = this.width;
        this.extentEntity.y = this.height;
    }

    bindEvents() {
        this.onmouseup = (e) => {
            let key = EngineMouseButton[e.button];
            var keyButton: EngineMouseButton =
                EngineMouseButton[key as keyof typeof EngineMouseButton];

            if (this.currentScene != null) {
                for (let obj of this.currentScene.getNodesOfType(BaseNode)) {
                    obj.onInput(
                        new EngineInputMouseEvent(
                            keyButton,
                            EngineInputKeyEventType.released,
                        ),
                    );
                }
            }
        };

        this.onmousedown = (e) => {
            let key = EngineMouseButton[e.button];
            var keyButton: EngineMouseButton =
                EngineMouseButton[key as keyof typeof EngineMouseButton];

            if (this.currentScene != null) {
                for (let obj of this.currentScene.getNodesOfType(BaseNode)) {
                    obj.onInput(
                        new EngineInputMouseEvent(
                            keyButton,
                            EngineInputKeyEventType.pressed,
                        ),
                    );
                }
            }
        };

        this.onmousemove = (e) => {
            if (this.currentScene != null) {
                for (let obj of this.currentScene.getNodesOfType(BaseNode)) {
                    obj.onInput(
                        new EngineInputMouseMotionEvent(
                            new Vector2D(e.movementX, e.movementY),
                            new Vector2D(e.x, e.y),
                        ),
                    );
                }
            }
        };

        this.onkeyup = (e) => {
            if (this.currentScene != null) {
                for (let obj of this.currentScene.getNodesOfType(BaseNode)) {
                    obj.onInput(
                        new EngineInputKeyEvent(
                            e.keyCode,
                            EngineInputKeyEventType.released,
                        ),
                    );
                }
            }
        };

        this.onkeydown = (e) => {
            if (this.currentScene != null) {
                for (let obj of this.currentScene.getNodesOfType(BaseNode)) {
                    obj.onInput(
                        new EngineInputKeyEvent(
                            e.keyCode,
                            EngineInputKeyEventType.pressed,
                        ),
                    );
                }
            }
        };

        this.onresize = (e) => {


            this.extentEntity.x = e.width;
            this.extentEntity.y = e.height;

            GraphicsModule.setIsDirty(this.extentEntity);
            this.onWindowResize.next({ width: e.width, height: e.height });

        };
    }
}
