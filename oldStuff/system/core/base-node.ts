import { v4 as uuidv4 } from 'uuid';
import { Transform } from './transform';

export abstract class BaseNode {

    private _id: string = "";

    _transform: Transform = new Transform();

    get id() {
        return this._id;
    }
    get transform(): Transform {
        return this._transform;
    }

    constructor() {
        this._id = uuidv4();
    }

    update(delta: number): void {

    }

    onGui(): void {

    }

    afterUpdate(): void {

    }


    beforeUpdate(): void {

    }

    onEnable(): void {

    }

    ondDisable(): void {

    }
}