import { bindings, registeredModules } from "@engine/nodes/renderable";
import { EntityObject } from "@engine/resources";
import { Scene } from "@engine/scene";
import { List } from "@engine/types";
import { RenderInstance, RenderWindow } from "@render";

export class GraphicsModule {

    private static renderInstances = new List<RenderInstance>();
    private static windows = new List<RenderWindow>();
    private static _mainWindow: RenderWindow | null = null;

    static getRegisterModules() {
        return registeredModules;
    }

    static getBindings() {
        return bindings;
    }

    static drawFrame() {
        for (let [key, value] of this.renderInstances.resources) {
            value.drawFrame();
        }
    }

    static setIsDirty(et: EntityObject) {
        for (let [key, value] of this.renderInstances.resources) {
            value.setIsDirty(et);
        }
    }

    static get mainWindow(): RenderWindow | null {
        return this._mainWindow;
    }

    static createInstance(windowId: string) {

        let window = this.windows.get(windowId);
        let ri = new RenderInstance(window);

        this.renderInstances.add(ri.id.toString(), ri);
        return ri.id.toString();
    }

    static loadScene(instanceId: string, scene: Scene) {

        let instance = this.renderInstances.get(instanceId);
        instance.loadScene(scene);
    }

    static createWindow(): string {

        let window = new RenderWindow(
            800,
            600,
            'Demo',
        );

        GraphicsModule.windows.add(window.id.toString(), window);

        if (GraphicsModule._mainWindow == null)
            GraphicsModule._mainWindow = window;

        window.bindEvents();

        return window.id.toString();
    }
}