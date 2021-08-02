import { VkDevice } from "vulkan-api";
import { LogicalDevice } from "./logical.device";
import { RenderBackplane } from "./render.backplane";

export abstract class RenderElement extends RenderBackplane {

    protected device: LogicalDevice; 

    constructor(device: LogicalDevice) {
        super();
        this.device = device;
    }
    
 
}