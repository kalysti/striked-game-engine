import { Color } from "./api/colors";
import { GraphicsColor } from "./Pixel";
export enum TextureChannelFlags {
    /// <summary>
    /// R
    /// </summary>
    R,
    /// <summary>
    /// G
    /// </summary>
    G,
    /// <summary>
    /// B
    /// </summary>
    B,
    /// <summary>
    /// A
    /// </summary>
    A
}
export class Texture {

    private _width: number = 0;
    private _height: number = 0;
    private _pixels: GraphicsColor[] = [];

    get pixels(): GraphicsColor[] {
        return this._pixels;
    }

    get height(): number {
        return this._height;
    }
    get width(): number {
        return this._width;
    }


    static get Empty() {
        return new Texture(1, 1, [Color.Black]);
    }

    public GetPixels(): Color[] {
        return this._pixels.map(p => new Color(p.A, p.R, p.G, p.B));
    }

    constructor(_width: number = 1, _height: number = 1, _colors: Color[]) {
        this._width = _width;
        this._height = _height;

        for (let color of _colors) {
            this._pixels.push(color.ToGraphicsColor());
        }

        if (this._pixels == null)
            throw new Error("pixels are set to null");
        if (this._pixels.length != _width * _height)
            throw new Error("pixels are not the correct size");
    }

    public Resize(width: number, height: number) {
        this._width = width;
        this._height = height;

        for (let i = 0; i < (width * height); i++) {
            this._pixels.push(new GraphicsColor());
        }
    }

    public SetPixels(pixels: Color[]) {
        if (pixels.length != this._pixels.length)
            throw new Error("pixels length does not match image size");

        this._pixels = pixels.map(p => p.ToGraphicsColor());
    }

    public CopyChannel(source: Texture, channel: TextureChannelFlags) {
        for (let x = 0; x < this._width; x++) {
            for (let y = 0; y < this._height; y++) {
                let percentX = Math.floor(x) / Math.floor(this._width);
                let percentY = Math.floor(y) / Math.floor(this._height);
                let sourceX = Math.floor(percentX * source.width);
                let sourceY = Math.floor(percentY * source.height);

                if ((channel & TextureChannelFlags.R) != 0)
                    this._pixels[(y * this._width) + x].R = source.pixels[(sourceY * source.width) + sourceX].R;
                if ((channel & TextureChannelFlags.G) != 0)
                    this._pixels[(y * this._width) + x].G = source.pixels[(sourceY * source.width) + sourceX].G;
                if ((channel & TextureChannelFlags.B) != 0)
                    this._pixels[(y * this._width) + x].B = source.pixels[(sourceY * source.width) + sourceX].B;
                if ((channel & TextureChannelFlags.A) != 0)
                    this._pixels[(y * this._width) + x].A = source.pixels[(sourceY * source.width) + sourceX].A;
            }
        }
    }
}
