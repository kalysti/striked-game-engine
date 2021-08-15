import { Vector2D } from '@engine/types';
import { BaseNode } from '@engine/core';
import { UISize, UISizeType } from './UISize';
export abstract class UIElement extends BaseNode {

    abstract width: UISize;
    abstract height: UISize;
    abstract positionX: UISize;
    abstract positionY: UISize;


    constructor() {
        super();
    } 

    getPosition() {
        return new Vector2D(this.calcPixel(this.positionX,  this.scene.viewport.width), this.calcPixel(this.positionY, this.scene.viewport.height));
    }
    getDimensions() {
        return new Vector2D(this.calcPixel(this.width,  this.scene.viewport.width), this.calcPixel(this.height, this.scene.viewport.height));
    }

    private calcPixel(element: UISize, viewportValue: number): number {

        let value = 0;
        if (element.type == UISizeType.Percentage) {
            value = ( viewportValue / 100) * element.value;
        }
        else {
            value = element.value;
        }

        if (element.minimum != -1 && value < element.minimum)
            value = element.minimum;

        if (element.maximum != -1 && value > element.maximum)
            value = element.maximum;

        return value;
    }
}