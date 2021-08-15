import { EntityObject } from '@engine/resources';
import { MeshDataIndicies } from '../../resources/2d/MeshDataIndex';

export class IndexDraw {
    offset: number = 0;
    length: number = 0;
}
export class Draw {
    length: number = 0;
}
export class RenderableRenderer {
    indexBuffer: string | null = null;
    vertexBuffers: string[] = [];
    indexDraws: IndexDraw[] = [];
    draws: Draw[] = [];

    bindIndex(index: MeshDataIndicies) {
        this.indexBuffer = index.id.toString();
    }

    bindVertex(index: EntityObject) {
        this.vertexBuffers.push(index.id.toString());
    }

    draw(vertices: number) {
        let draw = new Draw();
        draw.length = vertices;

        this.draws.push(draw);
    }

    drawIndexed(length: number, offset: number) {
        let draw = new IndexDraw();
        draw.offset = offset;
        draw.length = length;

        this.indexDraws.push(draw);
    }
}

