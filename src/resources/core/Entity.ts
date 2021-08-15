import { EngineObject } from "./EngineObject";

export abstract class EntityObject extends EngineObject {
    abstract toDataStream(): Float32Array|Uint16Array|Uint8Array;
}
