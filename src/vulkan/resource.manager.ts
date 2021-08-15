import { EngineObject } from "@engine/nodes";

export class ResourceManager {
    static resources: Map<string, EngineObject> = new Map<string, EngineObject>();

    static add(resource: EngineObject) {
        if (ResourceManager.resources.has(resource.id.toString())) {
            return;
        }
        else {
            ResourceManager.resources.set(resource.id.toString(), resource);
        }
    }

    static get<T extends EngineObject>(uuid: string): T {

        if (!ResourceManager.resources.has(uuid))
            throw new Error("Cant find resource");

        return ResourceManager.resources.get(uuid) as T;
    }
}