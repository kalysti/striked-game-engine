import { Color, Vector2D } from '@engine/types';
import { FontManager, RenderFont } from '../../modules/fonts/FontManager';
import { RenderableRenderer } from '../../modules/graphics/renderer';
import { Sprite2D } from './Sprite2D';


export class Text extends Sprite2D {
    pixelSize: number = 36;
    width: number = 512;
    height: number = 512;
    numLetters: number = 0;
    spacing: number = 0;

    font: RenderFont | null = null;

    color: Color = new Color(255, 0, 0, 255);

    constructor() {
        super();
    }

    override onRender(renderer: RenderableRenderer) {
        renderer.bindIndex(this.meshDataIndex);
        renderer.bindVertex(this.meshDataEntity);

        for (let j = 0; j < this.numLetters; j++) {
            renderer.drawIndexed(this.meshDataIndex.indexes.length, j * 4);
        }
    }

    setFont(name: string) {
        this.font = FontManager.resources.get(name);
        this.texture = this.font.texture;
    }

    addText(text: string, x: number, y: number, scale: number = 1) {

        //start by y = 0
        y += (this.font.minTextHeight / 1.5) * scale;

        let pos = x;
        for (const c of text) {
            let g = this.font.chars.get(c.charCodeAt(0));

            this.numLetters++;

            let x0 = pos + g.bitmapLeft;
            let y0 = y - g.bitmapTop;

            let width = g.width;
            let height = g.height;

            this.meshDataEntity.vertices.push(new Vector2D(x0 * scale, y0 * scale));
            this.meshDataEntity.vertices.push(new Vector2D(x0 * scale, (y0 + height) * scale));
            this.meshDataEntity.vertices.push(
                new Vector2D((x0 + width) * scale, (y0 + height) * scale),
            );
            this.meshDataEntity.vertices.push(new Vector2D((x0 + width) * scale, y0 * scale));

            let uv_x0 = g.renderX / this.font.width;
            let uv_y0 = g.renderY / this.font.height;
            let uv_x1 = (g.renderX + g.bitmapWidth) / this.font.width;
            let uv_y1 = (g.renderY + g.bitmapHeight) / this.font.height;

            this.meshDataEntity.uvs.push(new Vector2D(uv_x0, uv_y0));
            this.meshDataEntity.uvs.push(new Vector2D(uv_x0, uv_y1));
            this.meshDataEntity.uvs.push(new Vector2D(uv_x1, uv_y1));
            this.meshDataEntity.uvs.push(new Vector2D(uv_x1, uv_y0));

            this.meshDataEntity.colors.push(this.color.ToVector4D());
            this.meshDataEntity.colors.push(this.color.ToVector4D());
            this.meshDataEntity.colors.push(this.color.ToVector4D());
            this.meshDataEntity.colors.push(this.color.ToVector4D());

            pos += g.advance + this.spacing;
        }
    }

    setSpacing(space: number) {
        this.spacing = space;
    }

    setColor(color: Color) {
        this.color = color;
    }


}
