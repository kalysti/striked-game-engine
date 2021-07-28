import { debug } from "console";
import { NativeWindow } from "../graphics/api/native-window";
import { BaseModule } from "./base.module";
import { Scene } from "./scene";

export class Engine {

    protected _activeScene: Scene | null = null;

    protected _mainThread: NodeJS.Timeout | null = null;
    protected _runThread: boolean = false;

    protected _oldTime: number = 0;
    protected _currentTime: number = 0;
    protected _deltaTime: number = 0;

    static instance: Engine = new Engine();

    protected _modules: BaseModule[] = [];

    nativeWindow: NativeWindow | null = null;


    public AddModule<T extends BaseModule>(type: { new(): T; }): T {

        let df = new type() as T;
        debug("Add system: " + (df as Object).constructor.name);

        this._modules.push(df);
        return df;
    }


    GetModule<T extends BaseModule>(TCtor: new (...args: any[]) => T): T {

        for (let mod of this._modules) {

            if (typeof (mod) == 'object') {
                let m = mod as Object;
                if (TCtor.toString().includes(m.constructor.name))
                    return mod as T;
            }
        }
        throw Error("Cant find basemodule from type: " + typeof (TCtor));
    }

    LoadScene(scene: Scene) {
        this.UnloadScene();
        this._activeScene = scene;

        for (let system of this._activeScene.getSystems()) {
            let obj = system as Object;
            debug("Enable module: " + obj.constructor.name);
            system.onEnable();
        }

    }

    UnloadScene() {
        this._activeScene = new Scene();
    }

    start() {
        this._runThread = true;
        this._mainThread = setInterval(() => {
            //  this.loop();
        }, 0);

        while (this._runThread) {
            this.loop();
        }
    }

    stop() {
        if (this._mainThread != null) {
            clearInterval(this._mainThread);
        }
    }

    profileDeltaTime(): number {
        this._oldTime = this._currentTime;
        this._currentTime = performance.now();
        this._deltaTime = (this._currentTime - this._oldTime) / 1000;

        return this._deltaTime;
    }

    loop() {
        if (!this._runThread) {
            console.log("try to cloose: " + this._runThread);
            this.stop();
            return;
        }
        var deltaTime = this.profileDeltaTime();

        try {
            //run modules
            for (let module of this._modules) {
                module.update(deltaTime);
            }

            if (this._activeScene) {

                for (let system of this._activeScene.getSystems()) {
                    system.beforeUpdate();
                }

                for (let node of this._activeScene.getNodes()) {
                    node.beforeUpdate();
                }

                for (let system of this._activeScene.getSystems()) {
                    system.onGui();
                }

                for (let node of this._activeScene.getNodes()) {
                    node.onGui();
                }

                for (let system of this._activeScene.getSystems()) {
                    system.update(deltaTime);
                }

                for (let node of this._activeScene.getNodes()) {
                    node.update(deltaTime);
                }

                for (let system of this._activeScene.getSystems()) {
                    system.afterUpdate();
                }

                for (let node of this._activeScene.getNodes()) {
                    node.afterUpdate();
                }


            }


            if (this.nativeWindow != null)
                this.nativeWindow.draw(deltaTime);


        }
        catch (e) {
            console.error(e);
            this._runThread = false;

        }

        this._runThread = false;
    }

    get deltaTime(): number {
        return this._deltaTime;
    }

}
