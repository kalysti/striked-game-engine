import { FontFace, NewFace, RenderMode } from 'freetype2';
import { VkCommandPool } from 'vulkan-api';
import { Vector2D } from '../../math/Vector2D';
import { Renderer } from '../../renderer';
import { Primitive2D } from './Primitive2D';
import { Texture2D } from './Texture2D';

const charCodes = 'ABCD'.split('').map(c => c.charCodeAt(0));

export class Text extends Primitive2D {

    fontFace: FontFace;
    pixelSize: number = 36;
    width: number = 512;
    height: number = 512;
    numLetters: 4;

    texture: Texture2D;

    constructor() {
        super();
        
        this.data.vertices.push(new Vector2D(0.0, 0.0));
        this.data.vertices.push(new Vector2D(0.5, 0.0));
        this.data.vertices.push(new Vector2D(0.5, 0.25));
        this.data.vertices.push(new Vector2D(0.0, 0.25));

        this.texture = new Texture2D(Renderer.logicalDevice, Renderer.physicalDevice.handle, Renderer.commandPool);
        this.texture.fromImagePath('./assets/sponza/dummy.png');

        this.fontFace = NewFace('./assets/fonts/OpenSans-Regular.ttf', 0);
        this.fontFace.setPixelSizes(0, this.pixelSize);
        let rawImage = Buffer.from(new Uint8Array(this.width * this.height * 4));

        let bitmaps: Uint8Array[] = [];
        let i = 0;
        
        let pos = 0;
        let y = 0;

        for (let ch of charCodes) {


            const g = this.fontFace.getCharIndex(0);
            const glyph = this.fontFace.loadChar(ch, {
                render: true,
                loadTarget: RenderMode.MONO
            });

         //   let x0 = pos + (glyph.bitmapLeft()) ? glyph.bitmapLeft() : 0;
           // let y0 = y - glyph.bitmapTop();

            let buffer = Buffer.from(glyph.bitmap.buffer);
            buffer.copy(rawImage, i * (this.pixelSize * this.pixelSize * 4), 0, buffer.byteLength);

            i++;
        };

        this.texture.fromBuffer(rawImage, this.width, this.height);

        let vertices = 0;

    }

    


    override uploadBuffers(cpool: VkCommandPool) {

        super.uploadBuffers(cpool);
        this.texture.upload();

    }

}