import { RenderableRenderer, GraphicsModule } from '@engine/modules';
import { BaseNode } from '@engine/core';
import { VkDescriptorSet } from 'vulkan-api';

export abstract class RenderableNode extends BaseNode {

    getPipelineName(): string {

        let classes = this.getSubClasses(this.constructor, [this.constructor.name]);

        for (let className of classes) {
            if (GraphicsModule.getRegisterModules().has(className)) {
                return className;
            }
        }

        return null;
    }


    constructor() {
        super();
    }

    descriptorSet: VkDescriptorSet = new VkDescriptorSet();

    updateRequired: boolean = false;


  //  abstract dataLayout(): EntityObject[];
    abstract onRender(renderer: RenderableRenderer);
}
