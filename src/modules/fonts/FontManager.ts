import { NewMemoryFace, RenderMode } from 'freetype2';
import fs from 'fs';
import { VK_FORMAT_R8_UNORM } from 'vulkan-api';
import { List } from '@engine/types';
import { Bitmap, BitmapFormat, Texture2D } from '@engine/resources/2d';

export class RenderGlyph {
    bitmapWidth: number = 0;
    bitmapHeight: number = 0;
    bitmapLeft: number = 0;
    bitmapTop: number = 0;
    advance: number = 0;
    width: number = 0;
    height: number = 0;
    renderX: number = 0;
    renderY: number = 0;
    bitmapData: Uint8Array = new Uint8Array(0);
}

export class RenderFont {
    bitmapData: Uint8Array = new Uint8Array(0);
    height: number = 0;
    width: number = 0;
    chars: Map<Number, RenderGlyph> = new Map<Number, RenderGlyph>();
    texture: Texture2D | null = null;
    minTextHeight :number = 0;

    upload() {
        this.texture.data = this.bitmapData;
        this.texture.width = this.width;
        this.texture.height = this.height;
        this.texture.format = VK_FORMAT_R8_UNORM;
       // this.texture.fromBuffer(this.bitmapData, this.width, this.height);
       // this.texture.upload(VK_IMAGE_VIEW_TYPE_2D, VK_FORMAT_R8_UNORM);
    }
}

export class FontManager {
    static resources: List<RenderFont> = new List<RenderFont>();
    static loadFont(name: string, fontSize: number = 36): RenderFont {
        let file = fs.readFileSync(name);
        let fontFace = NewMemoryFace(file);
        let props = fontFace.properties();
        let fontName = props.familyName + '-' + props.styleName;

        if (FontManager.resources.has(fontName))
            return FontManager.resources.get(fontName);


        let char = fontFace.getFirstChar();
        if (char == null) throw Error('Font is empty');
        let charCode = char.charCode;
        let rendererGlyphs: Map<Number, RenderGlyph> = new Map<
            Number,
            RenderGlyph
        >();
        fontFace.setPixelSizes(0, fontSize);

        let renderFont = new RenderFont();

        let minHeight = 0;
        let minWidth = 0;
        let values = 0;

        while (true) {

            let char = fontFace.getNextChar(charCode);

            if (char == null) break;

            let glyph = fontFace.loadChar(charCode, {
                render: true,
                loadTarget: RenderMode.NORMAL,
            });

            if (glyph.bitmap == null) {
                charCode = char.charCode;
                continue;
            }

            let rg = new RenderGlyph();
            rg.bitmapLeft = glyph.bitmapLeft;
            rg.bitmapTop = glyph.bitmapTop;

            rg.width = glyph.metrics.width / 64;
            rg.height = glyph.metrics.height / 64;
            rg.advance = glyph.metrics.horiAdvance / 64;

            rg.bitmapWidth = glyph.bitmap.width;
            rg.bitmapHeight = glyph.bitmap.height;
            rg.bitmapData = new Uint8Array(glyph.bitmap.buffer);

            rendererGlyphs.set(charCode, rg);
            values++;

            charCode = char.charCode;

            if (rg.bitmapHeight > minHeight) minHeight = rg.bitmapHeight;

            if (rg.bitmapWidth > minWidth) minWidth = rg.bitmapWidth;
        }

        let rows = Math.ceil(Math.sqrt(values));
        let lines = rows;

        let width = rows * minWidth;
        let height = lines * minHeight;

        let rawImage = new Bitmap(width, height, BitmapFormat.R);
        let currentRow = 0;
        let currentLine = 0;
        for (let [key, value] of rendererGlyphs) {
            let regionStartX = minWidth * currentRow;
            let regionStartY = minHeight * currentLine;

            let image = new Bitmap(
                value.bitmapWidth,
                value.bitmapHeight,
                BitmapFormat.R,
            );
            image.SetData(value.bitmapData);

            value.renderX = regionStartX;
            value.renderY = regionStartY;

            for (let x = 0; x < value.bitmapWidth; x++) {
                for (let y = 0; y <  value.bitmapHeight; y++) {
                    let newPixelX = x + regionStartX;
                    let newPixelY = y + regionStartY;
                    let value = image.GetPixel(x, y);

                    rawImage.SetPixel(newPixelX, newPixelY, value);
                }
            }
            currentRow++;

            if (currentRow == rows) {
                currentLine++;
                currentRow = 0;
            } 

            value.bitmapData = null;
        }

        renderFont.width = width;
        renderFont.height = height;
        renderFont.chars = rendererGlyphs;
        renderFont.minTextHeight = minHeight;
        renderFont.bitmapData = rawImage.data;
        renderFont.texture = new Texture2D();
        renderFont.upload();

        console.log('[FontManager] Load ' + fontName);

        FontManager.resources.add(fontName, renderFont);

        return renderFont;
    }
}
