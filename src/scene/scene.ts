
import { Viewport } from '../resources/Viewport';
import { EditorCamera, Camera } from '@engine/nodes';
import { BaseNode } from '@engine/core';
import { UIYContainer, UIBUtton } from '@engine/nodes/ui';
import { EditorGrid } from '@engine/nodes/3d';
import { Sky } from '@engine/nodes/2d';

export class Scene {
    private nodes: any[] = [];
    currentCamera: Camera | null = null;
    viewport: Viewport = new Viewport();

    addChild(node: any) {
        if (node instanceof BaseNode) {
            node.setScene(this);
            this.nodes.push(node);
        }
    }

    constructor() {

        let camera = new EditorCamera();
        this.addChild(camera);

        this.currentCamera = camera;
        // this.nodes.push(new ProSky());

        let grid = new EditorGrid();
        this.addChild(grid);

        let sky = new Sky();
        this.addChild(sky);

        let buttpon = new UIYContainer();
       // buttpon.addChild(new UIBUtton());
      //  this.addChild(buttpon);


        // this.nodes.push(new EditorGrid());
        //this.nodes.push(new CubeMesh());

        // this.nodes.push(new CubeMesh());
        //   this.nodes.push(new Triangle2D());
        //
    }

    getActiveCamera() {
        return this.getNodesOfType(Camera)
            .filter((df) => df.isActive)
            .shift();
    }

    getNodesOfType<T>(key: (new (...args: any[]) => T) | Function): T[] {
        return this.nodes.filter(
            (df) => df instanceof key
        ) as T[];
    }

    getNodes() {
        return this.nodes.filter(
            (df) => df instanceof BaseNode,
        ) as BaseNode[];
    }

    getNodesWithChilds() {
        return this.nodes.map(df => df.get);
    }
}
