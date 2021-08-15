import { GraphicsModule } from '@engine/modules';
import { Sprite2DRectangle, Text } from '@engine/nodes/2d';
import { EngineInputEvent, EngineInputKeyEventType, EngineInputMouseEvent, EngineInputMouseMotionEvent, EngineMouseButton } from '@engine/core';
import { Color, Vector2D } from '@engine/types';
import { Subject } from 'rxjs';
import { ResizeEvent } from '../../vulkan/window';
import { UIElement } from './UIELement';
import { UISize, UISizeType } from './UISize';
import { UIYContainer } from './YContainer';

export class UIBUtton extends UIElement {

    onClick: Subject<void> = new Subject<void>();

    private _hovered: boolean = false;
    private mouseLeftPressed: boolean = false;

    height: UISize = new UISize(100, UISizeType.Percentage, -1, -1);
    width: UISize = new UISize(30, UISizeType.Percentage, -1, -1);

    positionX: UISize = new UISize(0, UISizeType.Percentage, -1, -1);
    positionY: UISize = new UISize(0, UISizeType.Percentage, -1, -1);

    rectangle: Sprite2DRectangle;
    text: Text;

    backgroundColor: Color = new Color(21, 92, 143, 255);
    backgroundHoverColor: Color = new Color(255, 92, 143, 255);

    get isHovered() {
        return this._hovered;
    }

    set isHovered(value: boolean) {

        if (value != this._hovered) {
            this._hovered = value;
            this.setColors();
        }
    }

    setColors() {
        this.rectangle.color = (this._hovered) ? this.backgroundHoverColor : this.backgroundColor;
    }

    constructor() {
        super();

        this.rectangle = new Sprite2DRectangle(new Vector2D(0, 0), new Vector2D(50, 50), 1.0);
        this.setColors();

        this.addChild(this.rectangle);

        this.text = new Text();

        this.text.setFont('Open Sans-Regular')
        this.text.addText('TAAADASJO', 0, 0, 1.0);

        this.addChild(this.text);
    }

    override onEnable() {
        super.onEnable();
        this.setSize();
    }

    onInput(handler: EngineInputEvent): void {
        super.onInput(handler);


        if (handler instanceof EngineInputMouseMotionEvent) {
            if (handler.pos.x >= this.rectangle.position.x
                && handler.pos.x <= this.rectangle.endPosition.x
                && handler.pos.y >= this.rectangle.position.y
                && handler.pos.y <= this.rectangle.endPosition.y) {

                this.isHovered = true;
            }
            else {
                this.isHovered = false;
            }
        }

        if (this.isHovered) {
            GraphicsModule.mainWindow.exitPointerLock();
        }


        if (handler instanceof EngineInputMouseEvent) {
            let e = handler as EngineInputMouseEvent;
            if (e.type == EngineInputKeyEventType.pressed) {
                if (e.button == EngineMouseButton.left)
                    this.mouseLeftPressed = true;


            }
            else {

                if (e.button == EngineMouseButton.left) {
                    if (this.mouseLeftPressed == true && this.isHovered) {
                        this.onClick.next();
                    }
                    this.mouseLeftPressed = false;
                }
            }
        }

    };


    setSize() {
        let parent = this.getParent(UIElement);
        if (parent != null) {
            if (parent instanceof UIYContainer) {
                this.rectangle.size = new Vector2D(parent.getDimensions().x, this.rectangle.size.y);
                this.rectangle.position = new Vector2D(parent.getPosition().x, this.getPosition().y);
                this.text.position = new Vector2D(parent.getPosition().x, this.getPosition().y);
            }
        }
    }

    onResize(event: ResizeEvent) {
        super.onResize(event);
        this.setSize();
    }
}