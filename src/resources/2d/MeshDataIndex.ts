import { EntityObject } from "@engine/resources";

export class MeshDataIndicies extends EntityObject {

    indexes: number[] = [];

    constructor(values: number[] = []){
        super();
        this.indexes = values;
    }

    toDataStream(): Uint16Array {
        return new Uint16Array(this.indexes);
    }
}