import { Scene } from "./scene";

export abstract class BaseSystem {

    protected _scene!: Scene;

    get MyScene() : Scene{
        return this._scene;
    }

    init(_scene: Scene) {
        this._scene = _scene;
    }

    update(delta: number): void {

    }

    onGui(): void {

    }

    beforeUpdate(): void {

    }


    afterUpdate(): void {

    }

    onEnable(): void {

    }

    ondDisable(): void {

    }
}
