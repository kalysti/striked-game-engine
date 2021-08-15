import { EntityObject } from "@engine/resources";

export class Vector2D extends EntityObject {
    x: number = 0;
    y: number = 0;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
    }

    toDataStream(): Float32Array {
        return new Float32Array([this.x, this.y]);
    }

    set values(values: number[]) 
    {
        if(values.length == 2)
        {
            this.x = values[0];
            this.y = values[1];
        }
    }

    get values(): number[] {
        return [this.x, this.y];
    }

    static get Zero() {
        return new Vector2D(0, 0);
    }
}