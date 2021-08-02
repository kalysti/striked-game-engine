import { setTimeout } from 'timers';
import { parentPort } from 'worker_threads';
import { Scene } from './nodes/scene';
import { Renderer } from "./renderer";
import { UI } from './resources/ui';

const test = new Renderer();

if (parentPort != null) {
    console.log("start engine with electron as thread");

    parentPort.on('message', (result) => {
        
        if (test.currentScene != null) {
            for (let mesh of test.currentScene.nodes) {
                if (mesh instanceof UI) {
                    if (mesh.texture != null) {
                        mesh.texture.update(result.value as Buffer, 800, 600);
                    }
                }
            }
        }
    });
}

test.loadScene();

var looping = function () {

    if (test.runningLoop != false) {
        setTimeout(looping, 0);
    }

    test.run();
};

//test.loadScene(scene);
looping();