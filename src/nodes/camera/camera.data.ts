import { EntityObject } from '@engine/resources';
import { Matrix4 } from '@engine/types';

export class CameraData extends EntityObject {

    perspective: Matrix4 = Matrix4.Zero;
    view: Matrix4 = Matrix4.Zero;
    
    near: number = 0.01;
    far: number = 1000;

    toDataStream(): Float32Array {
        let list: number[][] = [
            this.view.getArray(),
            this.perspective.getArray(),
            [this.far],
            [0],
            [0],
            [0],
            [this.near],
            [0],
            [0],
            [0],
        ];
        let array = list.reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }

}