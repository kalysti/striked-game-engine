import { CubeMesh } from '../resources/CubeMesh';
import { EditorGrid } from '../resources/EditorGrid';
import { Mesh } from '../resources/Mesh';
import { SceneNode } from "../resources/Node";
import { PlaneMesh } from '../resources/PlaneMesh';
import { Camera } from './camera';
import { EditorCamera } from "./editorcamera";
import { Sky } from '../resources/sky';
import { Geometry } from '../resources/Geometry';

export class Scene {
    nodes: any[] = [];    

    constructor() {

     this.nodes.push(new EditorCamera());
  this.nodes.push(new Sky());

    this.nodes.push(new EditorGrid());

    this.nodes.push(new CubeMesh());

       // this.nodes.push(new CubeMesh());
    this.nodes.push(new PlaneMesh());
       // 

     
    }

    getCameras(): Camera[] {
        return this.nodes.filter(df => df instanceof Camera) as Camera[];
    }

    getActiveCamera() {
        return this.getCameras().filter(df => df.isActive).shift();
    }

    getMeshes() : Geometry[]{
        return this.nodes.filter(df => df instanceof Geometry) as Geometry[];
    }

  
    getNodes() {
        return this.nodes.filter(df => df instanceof SceneNode) as SceneNode[];
    }
}