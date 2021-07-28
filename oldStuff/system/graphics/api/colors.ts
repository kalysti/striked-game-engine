import { vec4 } from "gl-matrix";
import { GraphicsColor } from "../Pixel";

export class Color {

    private _r: number;
    private _g: number;
    private _b: number;
    private _a: number;


    constructor(r: number, g: number, b: number, a: number) {
        this._a = a;
        this._r = r;
        this._g = g;
        this._b = b;
    }

    get asVector(): vec4 {
        return vec4.fromValues(this._r, this._g, this._b, this._a);
    }


    get r(): number {
        return this._r;
    }


    get g(): number {
        return this._g;
    }



    get b(): number {
        return this._b;
    }

    get a(): number {
        return this._a;
    }

    static get Black(): Color {
        return new Color(0, 0, 0, 1);
    }

    public ToGraphicsColor(): GraphicsColor {
        return new GraphicsColor(this.r, this.g, this.r, this.b);
    }

}