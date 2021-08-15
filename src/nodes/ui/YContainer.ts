import { Vector2D } from '@engine/types';
import { ResizeEvent } from '../../vulkan/window';
import { Sprite2DRectangle } from '@engine/nodes/2d';
import { Color } from '@engine/types';
import { UIElement } from './UIELement';
import { UISize, UISizeType } from './UISize';
export class UIYContainer extends UIElement {

    height: UISize = new UISize(100, UISizeType.Percentage, -1, -1);
    width: UISize = new UISize(30, UISizeType.Percentage, -1, 250);
    
    rectangle: Sprite2DRectangle;

    positionX: UISize = new UISize(20, UISizeType.Percentage, -1, -1);
    positionY: UISize = new UISize(0, UISizeType.Percentage, -1, -1);

    constructor() {
        super();

        this.rectangle = new Sprite2DRectangle(new Vector2D(0, 0), new Vector2D(50, 50), 1.0);
        this.rectangle.color = new Color(12,16,23,255);
        this.addChild(this.rectangle);
    }

    override onEnable() {
        super.onEnable();
        this.rectangle.size = this.getDimensions();
        this.rectangle.position = this.getPosition();
    }

    onResize(event: ResizeEvent) {
        super.onResize(event);
        this.rectangle.size =this.getDimensions();
        this.rectangle.position = this.getPosition();
    }

}