import { v4 as uuidv4 } from 'uuid';
export class ObjectId {
    private _uid = uuidv4();

    toString(): string {
        return this._uid;
    }
}
