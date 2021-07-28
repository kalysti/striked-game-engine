import { Renderer } from "../render/renderer";

export abstract class BaseObject {
    abstract init(instance: Renderer): void;
    abstract deinit(): void;
}