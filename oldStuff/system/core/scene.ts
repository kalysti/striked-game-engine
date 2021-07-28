import { BaseSystem } from "./base.system";
import { BaseNode } from "./base-node";
import { Texture } from "../graphics/Texture";
import { debug } from "console";

export class Scene {

    protected _nodes = new Map<string, BaseNode>();
    protected _systems: BaseSystem[] = [];

    public addSystem<T extends BaseSystem>(type: { new(): T; }): T {

        let df = new type() as T;
        debug("Add system: " + (df as Object).constructor.name);

        df.init(this);

        this._systems.push(df);
        return df;
    }

    public getSystems() {
        return this._systems;
    }

    public addNode(node: BaseNode) {
        debug("Load node: " + (node as Object).constructor.name);
        node.onEnable();
        this._nodes.set(node.id, node);
    }

    public getNode(id: string) {
        return this._nodes.get(id);
    }

    getNodesByType<T extends BaseNode>(TCtor: new (...args: any[]) => T): T[] {

        let nodes: T[] = [];
        for (let mod of this._nodes.values()) {

            if (typeof (mod) == 'object') {
                let m = mod as Object;
                if (TCtor.name.includes(m.constructor.name))
                {
                    nodes.push(mod as T);
                }
            }
        }

        return nodes;
    }

    public getNodes(): BaseNode[] {
        return Array.from(this._nodes).map(([name, value]) => (value))
    }
}
