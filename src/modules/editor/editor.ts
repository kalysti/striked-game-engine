import { GraphicsModule } from "@engine/modules";
import { FontManager } from "@engine/modules";
import { Scene } from "@engine/scene";

export class Editor {

    constructor() {
        FontManager.loadFont('./assets/fonts/OpenSans-Regular.ttf');
        
        let windowID = GraphicsModule.createWindow();
        let instanceID = GraphicsModule.createInstance(windowID);

        GraphicsModule.loadScene(instanceID, new Scene());
    }
}