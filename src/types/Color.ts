import { Vector4D } from '@engine/types';
export class Color {
    r: number = 0;
    g: number = 0;
    b: number = 0;
    a: number = 0;

    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    ToVector4D(): Vector4D {
        return new Vector4D(
            this.r / 255,
            this.g / 255,
            this.b / 255,
            this.a / 255,
        );
    }

    ToArgb() {
        return this.r + this.g + this.b + this.a;
    }

    static FromArgb(color: number) {
        let value = new Color(0, 0, 0, 0);
        value.r = ((color >> 16) & 0xff) / 255.0;
        value.g = ((color >> 8) & 0xff) / 255.0;
        value.b = (color & 0xff) / 255.0;
        value.a = ((color >> 24) & 0xff) / 255.0;

        return value;
    }
}
