export class Vector2D {
    x: number = 0;
    y: number = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get values(): number[] {
        return [this.x, this.y];
    }

    static get Zero()
    {
        return new Vector2D(0,0);
    }
}