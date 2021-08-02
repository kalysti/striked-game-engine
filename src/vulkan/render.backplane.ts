import { VkDevice } from "vulkan-api";
import { LogicalDevice } from "./logical.device";

export abstract class RenderBackplane {
    protected abstract onCreate(): void;
    protected abstract onDestroy(): void;

    create() {
        console.log("[Modul]["+this.constructor.name+"]  Created" );
        this.onCreate();
    }

    destroy() {
        console.log("[Modul]["+this.constructor.name+"]  Destroyed" );
        this.onDestroy();
    }
}