import { mat4, vec2, vec4 } from "gl-matrix";
import { get } from "http";
import { Engine } from "../../core/engine";
import { BaseNode } from "../../core/base-node";
import { DescriptorLayout } from "../api/desc-layout";
import { Framebuffer } from "../api/framebuffer";
import { GraphicsModule } from "../graphics.module";
import { RenderTarget } from "../render-target";
import { Light } from "./light";
import { DescriptorService } from "../desc-service";
import { DescriptorSet } from "../api/desc-set";
import { RenderPassDefault } from "../api/render-pass";
import { GraphicsPipeline, Pipeline } from "../api/pipeline";
import { ShaderModule } from "../api/shader-module";
import { PipelineInputBuilder } from "../api/pipeline-builder";

export enum CameraProjectionType {
    Perspective = 0,
    Orthographic = 1
}

export class Camera extends BaseNode {

    /// <summary>
    /// Field of view for the camera
    /// </summary>
    public FieldOfView: number = 70.0;
    /// <summary>
    /// Viewport, where in the render target this camera should be rendered
    /// 0,0,1,1 = full screen
    /// </summary>
    public Viewport: vec4 = vec4.fromValues(0, 0, 1, 1);
    /// <summary>
    /// How far an object the camera can see
    /// </summary>
    public FarClipPlane: number = 100.0;
    /// <summary>
    /// How close an object the camera can see
    /// </summary>
    public NearClipPlane: number = 0.01;

    /// <summary>
    /// Where the camera rendered output should be stored
    /// </summary>
    public RenderTarget: RenderTarget | null = null;

    /*
    internal DescriptorService DescriptorService => _descriptorService;
    internal Framebuffer MrtFramebuffer => _mrtFramebuffer;
    internal Framebuffer DefferedFramebuffer => _defferedFramebuffer;
    internal static Pipeline DefferedPipeline => _defferedPipeline;

    */
    static defferedPipeline: Pipeline;

    private _projectionType: CameraProjectionType = CameraProjectionType.Perspective;
    private _resolution: vec2 = vec2.fromValues(0, 0);
    private _descriptorService: DescriptorService | null = null;
    private _mrtFramebuffer: Framebuffer | null = null;
    private _defferedFramebuffer: Framebuffer | null = null;
    private _graphicsModule: GraphicsModule | null = null;
    private _viewMatrixCache: Float32Array = new Float32Array();

    get mrtFramebuffer(): Framebuffer | null {
        return this._mrtFramebuffer;
    }

    get defferedFramebuffer(): Framebuffer | null {
        return this._defferedFramebuffer;
    }

    set defferedFramebuffer(val: Framebuffer | null) {
        this._defferedFramebuffer = val;
    }

    public set Resolution(res: vec2) {

        let mrt = this._graphicsModule?.renderPasses.get("_MRT");

        if (mrt == null)
            throw Error("cant find _MRT render pass");

        this._mrtFramebuffer = new Framebuffer(
            mrt,
            res[0], res[1]
        );

        let defered = this._graphicsModule?.renderPasses.get("_DEFFERED");
        if (defered == null)
            throw Error("cant find _DEFFERED render pass");

        this._defferedFramebuffer = new Framebuffer(
            defered,
            res[0], res[1]
        );

        this._resolution = res;
    }

    public get Resolution(): vec2 {
        return this._resolution;
    }

    /// <summary>
    /// Runs when component is enabled in the scene
    /// </summary>
    override onEnable() {
        console.log(" enable camera");
        this._graphicsModule = Engine.instance.GetModule(GraphicsModule);
        this._descriptorService = new DescriptorService();
        this._resolution = vec2.fromValues(1280, 720);

        //PROJECTION
        let projection = this._graphicsModule.descriptorLayouts.get('_PROJECTION');
        if (projection == null)
            throw Error("Cant find projection.");


        let projectionMatrix = new Float32Array(
            this.ProjectionMatrix.length
        );

        for (let ii = 0; ii < this.ProjectionMatrix.length; ++ii) projectionMatrix[0 + ii] = this.ProjectionMatrix[ii];

        this._descriptorService.InsertKey("_PROJECTION", projection);
        this._descriptorService.BindBuffer("_PROJECTION", 0, projectionMatrix);

        //VIEW
        let view = this._graphicsModule.descriptorLayouts.get('_VIEW');
        if (view == null)
            throw Error("Cant find view.");


        let viewMatrix = new Float32Array(
            this.ViewMatrix.length
        );

        for (let ii = 0; ii < this.ViewMatrix.length; ++ii) viewMatrix[0 + ii] = this.ViewMatrix[ii];

        this._descriptorService.InsertKey('_VIEW', view);
        this._descriptorService.BindBuffer('_VIEW', 0, viewMatrix);

        //MRT

        let mrt = this._graphicsModule.renderPasses.get('_MRT');
        let mrtDesc = this._graphicsModule.descriptorLayouts.get('_MRT');

        if (mrt == null || mrtDesc == null)
            throw Error("Cant find mrt.");

        this._mrtFramebuffer = new Framebuffer(
            mrt,
            this._resolution[0],
            this._resolution[1]
        );

        //make sure frame buffer is created with the correct MRT details
        this._descriptorService.InsertKey('_MRT', mrtDesc);


        let mrtBindingCount = 0;
        for (let attachment of this._mrtFramebuffer.renderPass.attachments) {
            if (attachment.format != RenderPassDefault.format) continue;

            this._descriptorService.BindImage(
                '_MRT',
                mrtBindingCount,
                this._mrtFramebuffer.images[mrtBindingCount],
                this._mrtFramebuffer.imageViews[mrtBindingCount]
            );

            mrtBindingCount++;
        }

        //camera position descriptor set
        let cameraDesc = this._graphicsModule.descriptorLayouts.get('_CAMERA');
        if (cameraDesc == null)
            throw Error("Cant find cameraDesc.");


        let Position = new Float32Array(
            this.ViewMatrix.length
        );

        for (let ii = 0; ii < this.Position.length; ++ii) Position[0 + ii] = this.Position[ii];
        
        this._descriptorService.InsertKey("_CAMERA", cameraDesc);
        this._descriptorService.BindBuffer("_CAMERA", 0, Position);

        //light
        let lightDesc = this._graphicsModule.descriptorLayouts.get('_LIGHT');
        if (lightDesc == null)
            throw Error("Cant find lightDesc.");

        this._descriptorService.InsertKey('_LIGHT', lightDesc);

        //deffered pipeline
        var DEFFERED_KEY = "_DEFFERED";
        let deffPass = this._graphicsModule.renderPasses.get('_DEFFERED');
        if (deffPass == null)
            throw Error("Cant find deffPass.");

        this._defferedFramebuffer = new Framebuffer(
            deffPass,
            this._resolution[0],
            this._resolution[1]
        );

        if (this._graphicsModule == null)
            throw Error("No graphics module loaded.");

        if (Camera.defferedPipeline == null) {
            console.log("create pipeline!!!");
            Camera.defferedPipeline = new GraphicsPipeline(
                this._graphicsModule.graphicsService.PrimaryDevice,
                deffPass,
                [
                    mrtDesc,
                    cameraDesc,
                    lightDesc
                ],
                [

                    new ShaderModule(
                        this._graphicsModule.graphicsService.PrimaryDevice,
                        "./assets/shaders/default/Deffered.vert"
                    ),
                    new ShaderModule(
                        this._graphicsModule.graphicsService.PrimaryDevice,
                        "./assets/shaders/default/Deffered.frag"
                    )
                ],
                new PipelineInputBuilder()
            );

            this._graphicsModule.renderPasses.set('_DEFFERED', deffPass);
        }
    }


    public get IsStatic(): boolean {
        return this._transform.IsStatic;
    }


    public get ProjectionMatrix(): mat4 {
        let matrixValue: mat4 = mat4.create();

        if (this._projectionType == CameraProjectionType.Perspective) {

            /* return Matrix4x4.CreatePerspectiveFieldOfView(
                 FieldOfView.ToRadians(),
                 _resolution.X / _resolution.Y,
                 NearClipPlane,
                 FarClipPlane
             );*/


            mat4.perspectiveFromFieldOfView(matrixValue, this.FieldOfView, this.NearClipPlane, this.FarClipPlane);

            return matrixValue;
        }
        else if (this._projectionType == CameraProjectionType.Orthographic) {
            /*
              return Matrix4x4.CreateOrthographic(
                                    _resolution.X,
                                    _resolution.Y,
                                    NearClipPlane,
                                    FarClipPlane
                                );*/
            mat4.ortho(
                matrixValue,
                0, 0,
                this._resolution[0],
                this._resolution[1],
                this.NearClipPlane,
                this.FarClipPlane
            );

            return matrixValue;
        }
        else
            throw new Error("This type of projection is not supported by the camera");

    }

    /// <summary>
    /// Create view matrix for this camera
    /// </summary>
    public get ViewMatrix(): mat4 {
        let tf = this._transform;
        let mt = mat4.create();

        if (tf == null)
            mat4.identity(mt);
        else
            mat4.invert(mt, this.transform.matrix);

        return mt;
    }

    public get Position(): vec4 {

        let tf = this._transform;
        let vec = vec4.create();


        if (tf == null)
            vec4.zero(vec);
        else
            vec = vec4.fromValues(tf.position[0], tf.position[1], tf.position[2], 1.0);

        return vec;
    }


    public get ProjectionDescriptorSet(): DescriptorSet | undefined {

        if (this._descriptorService == null)
            throw Error("Cant find description service.");

        let item = this._descriptorService.handle.get("_PROJECTION");
        if (item == null)
            throw new Error("_PROJECTION not setted up.");

        return item.DescriptorSet;
    }

    public get ViewDescriptorSet(): DescriptorSet | undefined {

        if (this._descriptorService == null)
            throw Error("Cant find description service.");

        let view = this._descriptorService.handle.get("_VIEW");
        if (view == null)
            throw new Error("_VIEW not setted up.");

        return view.DescriptorSet;
    }

    public get MrtDescriptorSets(): DescriptorSet[] {

        if (this._descriptorService == null)
            throw Error("Cant find description service.");

        let mrt = this._descriptorService.handle.get("_MRT");
        if (mrt == null)
            throw Error("cant find _MRT render pass");

        let camera = this._descriptorService.handle.get("_CAMERA");
        if (camera == null)
            throw Error("cant find _MRT render pass");

        let light = this._descriptorService.handle.get("_LIGHT");
        if (light == null)
            throw Error("cant find _MRT render pass");



        if (mrt.DescriptorSet == null)
            throw Error("cant find _MRT DescriptorSet");

        if (camera.DescriptorSet == null)
            throw Error("cant find _MRT DescriptorSet");

        if (light.DescriptorSet == null)
            throw Error("cant find _MRT DescriptorSet");

        return [mrt.DescriptorSet, camera.DescriptorSet, light.DescriptorSet];
    }

    /// <summary>
    /// updates camera's descriptor set objects
    /// </summary>
    public UpdateDescriptorSets() {
        if (this._descriptorService == null)
            throw Error("Cant find description service.");


        let ViewMatrix = new Float32Array(
            this.ViewMatrix.length
        );

        for (let ii = 0; ii < this.ViewMatrix.length; ++ii) ViewMatrix[0 + ii] = this.ViewMatrix[ii];

        if (this._viewMatrixCache?.byteLength == ViewMatrix.byteLength)
            return;

        if (this.IsStatic && this._viewMatrixCache != null)
            return;

        this._viewMatrixCache = ViewMatrix;
        this._descriptorService.BindBuffer("_VIEW", 0, this._viewMatrixCache);
    }


    public UpdateLights(lights: Light[]) {

        if (this._descriptorService == null)
            throw Error("Cant find description service.");
        if(lights.length <= 0)
            return;
        var first = lights[0];
        if (first !== null) {
            this._descriptorService.BindBuffer(
                "_LIGHT",
                0,
                first.ToShaderInfo
            );
        }
    }
}
