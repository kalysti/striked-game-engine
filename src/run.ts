
import { Editor, GraphicsModule } from '@engine/modules';
import { setTimeout } from 'timers';

const test = new Editor();

var looping = function () {
    setTimeout(looping, 0);
    GraphicsModule.drawFrame();
};

looping();