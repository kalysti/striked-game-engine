import { v4 as uuidv4 } from 'uuid';

export class EngineObject {

    private _uid = uuidv4();

    get id() {
        return this._uid;
    }
}