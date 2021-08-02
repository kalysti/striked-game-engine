import { Quad2D } from '../resources/2d/Quad2D';
import { Text } from '../resources/2d/Text';
import { Triangle2D } from '../resources/2d/Triangle2D';
import { CubeMesh } from '../resources/3d/CubeMesh';
import { EditorGrid } from '../resources/3d/EditorGrid';
import { Geometry } from '../resources/core/Geometry';
import { SceneNode } from "../resources/core/Node";
import { Camera } from './camera';
import { EditorCamera } from "./editorcamera";

export class Scene {
    nodes: any[] = [];

    constructor() {

        this.nodes.push(new EditorCamera());
       // this.nodes.push(new ProSky());
        this.nodes.push(new EditorGrid());
        this.nodes.push(new CubeMesh());
    this.nodes.push(new Quad2D());
  //   this.nodes.push(new Text());


        // this.nodes.push(new CubeMesh());
        //  this.nodes.push(new PlaneMesh());
        // 


    }

    getCameras(): Camera[] {
        return this.nodes.filter(df => df instanceof Camera) as Camera[];
    }

    getActiveCamera() {
        return this.getCameras().filter(df => df.isActive).shift();
    }

    getMeshes(): Geometry[] {
        return this.nodes.filter(df => df instanceof Geometry) as Geometry[];
    }


    getNodes() {
        return this.nodes.filter(df => df instanceof SceneNode) as SceneNode[];
    }
}