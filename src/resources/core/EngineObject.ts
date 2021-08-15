import { ObjectId } from "@engine/types";

export abstract class EngineObject {
    private _id = new ObjectId();

    get id(): ObjectId {
        return this._id;
    }
}
