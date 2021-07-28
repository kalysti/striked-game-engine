import { Texture2D } from "../resources/Texture2D";
import { EngineObject } from '../resources/EngineObject';

export class ResourceManager {
    static resources: Map<string, EngineObject> = new Map<string, EngineObject>();

    static add(resource: EngineObject) {
        if (ResourceManager.resources.has(resource.id)) {
            return;
        }
        else {
            ResourceManager.resources.set(resource.id, resource);
        }
    }

    static get<T extends EngineObject>(uuid: string): T {

        if (!ResourceManager.resources.has(uuid))
            throw new Error("Cant find resource");

        return ResourceManager.resources.get(uuid) as T;
    }
}