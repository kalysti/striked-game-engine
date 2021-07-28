import { Renderer } from "./test";
import { Scene } from './nodes/scene';

let test = new Renderer();
let scene = new Scene();

test.loadScene(scene);
test.loop();