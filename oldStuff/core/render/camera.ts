import { mat4, vec4 } from "gl-matrix";

export class Camera extends Node {

    m_projection: mat4 = mat4.create();
    m_viewport: vec4 = vec4.create();

    m_fov: number;
    m_near: number;
    m_far: number;

    m_projection_dirty: boolean = false;

    constructor(inFOV: number, inNear: number, inFar: number) {
        super();
        
        this.m_fov = inFOV;
        this.m_near = inNear;
        this.m_far = inFar;

        this.initProjection();
    }

    get fov(): number { return this.m_fov; };
    set fov(inFOV: number) {
        this.m_fov = inFOV;
        this.m_projection_dirty = true;
    }

    get near() { return this.m_near; }
    set near(inNear: number) {
        this.m_near = inNear;
        this.m_projection_dirty = true;
    }

    get far() { return this.m_far; }
    set far(inFar: number) {
        this.m_far = inFar;
        this.m_projection_dirty = true;
    }

    setViewport(inMinX: number, inMinY: number, inMaxX: number, inMaxY: number) {
        this.m_viewport[0] = inMinX;
        this.m_viewport[1] = inMinY;
        this.m_viewport[2] = inMaxX;
        this.m_viewport[3] = inMaxY;
    }

    initProjection() {

        this.m_viewport[2] = 800.0;
        this.m_viewport[3] = 800.0;

        this.m_projection_dirty = true;
    }

    updateProjection() {

        if (!this.m_projection_dirty)
            return;


        let vw = this.m_viewport[2] - this.m_viewport[0];
        let vh = this.m_viewport[3] - this.m_viewport[1];

        let aspect = vw / vh;

        mat4.perspective(
            this.m_projection,
            this.m_fov, aspect, this.m_near, this.m_far
        );

        this.m_projection_dirty = false;
    }
}