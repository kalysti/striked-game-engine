import { Color } from "@engine/types";

export enum BitmapFormat {
    R,
    RGB,
    RGBA,
}

export class Bitmap {
    data: Uint8Array;
    width = 0;
    height = 0;
    sizePerPixel = 0;
    format = BitmapFormat.R;

    constructor(width: number, height: number, format = BitmapFormat.R) {
        this.width = width;
        this.height = height;
        this.format = format;

        if (format == BitmapFormat.R) 
            this.sizePerPixel = 1;

        this.data = new Uint8Array(width * height * this.sizePerPixel);
    }

    SetData(data: Uint8Array)
    {
        this.data = data;
    }

    SetPixel(x: number, y: number, color: Color) {
        let index = x + y * this.width;

        if (this.format == BitmapFormat.R) {
            this.data[index] = color.r;
        }
    }

    GetPixel(x: number, y: number): Color {
        let index = x + y * this.width;
        let col = this.data[index];
        if (this.format == BitmapFormat.R) {
            return new Color(col, 0, 0, 0);
        }
    }
}
