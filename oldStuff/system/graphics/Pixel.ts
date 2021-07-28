
/// <summary>
/// Graphics Color Mapper

import { Color } from "./api/colors";


/// <summary>
/// A single color information that is used by the gpu
/// </summary>
export class GraphicsColor {
    /// <summary>
    /// R
    /// </summary>
    public R: number;
    /// <summary>
    /// G
    /// </summary>
    public G: number;
    /// <summary>
    /// B
    /// </summary>
    public B: number;
    /// <summary>
    /// A
    /// </summary>
    public A: number;


    /// <summary>
    /// constructor for graphics color
    /// </summary>
    /// <param name="r">red</param>
    /// <param name="g">green</param>
    /// <param name="b">blue</param>
    /// <param name="a">alpha</param>
    constructor(
        r: number = 255,
        g: number = 255,
        b: number = 255,
        a: number = 255
    ) {
        this.R = r;
        this.B = b;
        this.G = g;
        this.A = a;
    }

    toByteArray(): Float32Array {


        let byteArray = new Float32Array(
            4
        );
        byteArray[0] = this.R;
        byteArray[1] = this.G;
        byteArray[2] = this.B;
        byteArray[3] = this.A;

        return byteArray;
    }
}


/// </summary>
export class GraphicsColorMapper {
    /// <summary>
    /// System.Drawing.Color to GraphicsColor mapper
    /// </summary>
    /// <param name="color">System.Drawing.Color</param>
    /// <returns>GraphicsColor</returns>
    static ToGraphicsColor(color: Color): GraphicsColor {

        return new GraphicsColor(
            color.r,
            color.g,
            color.b,
            color.a
        );
    }
}