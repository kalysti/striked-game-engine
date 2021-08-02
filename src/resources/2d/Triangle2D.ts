import { Vector2D } from '../../math/Vector2D';
import { Primitive2D } from './Primitive2D';

export class Triangle2D extends Primitive2D
{
    constructor()
    {
        super();
        
        this.data.vertices.push(new Vector2D(0.0, -0.5));
        this.data.vertices.push(new Vector2D(0.5, 0.5));
        this.data.vertices.push(new Vector2D(-0.5, 0.5));
    }
}