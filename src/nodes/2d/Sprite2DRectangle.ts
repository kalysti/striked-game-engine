import { Color } from '@engine/types';
import { Sprite2D } from './Sprite2D';
import { Vector2D } from '@engine/types';
import { GraphicsModule } from '@engine/modules';

export class Sprite2DRectangle extends Sprite2D {
    private _color: Color = new Color(255, 0, 0, 255);
    private _size: Vector2D = Vector2D.Zero;
    private _scale: number = 1.0;

    get color() {
        return this._color;
    }

    set color(value: Color) {

        this._color = value;
        this.setData(true);
    }

    get size() {
        return this._size;
    }

    set size(value: Vector2D) {

        this._size = value;
        this.setData(true);
    }

    get scale() {
        return this._scale;
    }

    set scale(value: number) {
        this._scale = value;
        this.setData(true);
    }

    constructor(position: Vector2D, size: Vector2D, scale: number = 1.0) {
        super();
    
        this._size = size;
        this._scale = scale;

        this.position.values = position.values;
        this.setData();
    }

    get endPosition() {
        return new Vector2D(this.position.x + this.size.x, this.position.y + this.size.y);
    }

    private setData(onUpdate = false) {

        this.meshDataEntity.clear();
        //start by y = 0
        // y += (h / 1.5) * scale;

        let x0 = 0;
        let y0 = 0;

        let width = this.size.x;
        let height = this.size.y;

        this.meshDataEntity.vertices.push(new Vector2D(x0 * this.scale, y0 * this.scale));
        this.meshDataEntity.vertices.push(new Vector2D(x0 * this.scale, (y0 + height) * this.scale));
        this.meshDataEntity.vertices.push(
            new Vector2D((x0 + width) * this.scale, (y0 + height) * this.scale),
        );
        this.meshDataEntity.vertices.push(new Vector2D((x0 + width) * this.scale, y0 * this.scale));

        let uv_x0 = 0;
        let uv_y0 = 0;
        let uv_x1 = 1;
        let uv_y1 = 1;

        this.meshDataEntity.uvs.push(new Vector2D(uv_x0, uv_y0));
        this.meshDataEntity.uvs.push(new Vector2D(uv_x0, uv_y1));
        this.meshDataEntity.uvs.push(new Vector2D(uv_x1, uv_y1));
        this.meshDataEntity.uvs.push(new Vector2D(uv_x1, uv_y0));

        this.meshDataEntity.colors.push(this._color.ToVector4D());
        this.meshDataEntity.colors.push(this._color.ToVector4D());
        this.meshDataEntity.colors.push(this._color.ToVector4D());
        this.meshDataEntity.colors.push(this._color.ToVector4D());

        if (onUpdate)
            GraphicsModule.setIsDirty(this.meshDataEntity);
    }
}
