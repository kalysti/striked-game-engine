import { Engine } from "../../core/engine";
import { BaseNode } from "../../core/base-node";
import { Framebuffer } from "../api/framebuffer";
import { GraphicsPipeline, Pipeline } from "../api/pipeline";
import { GraphicsModule } from "../graphics.module";
import { ShaderModule } from "../api/shader-module";
import { PipelineInputBuilder } from "../api/pipeline-builder";
import { Color } from "../api/colors";
import { vec4 } from "gl-matrix";

export enum TypeOfLight {

    Directional = 0,
    Point = 1
}
export interface LightShaderInfo {
    /// <summary>
    /// position of the light
    /// </summary>
    Position: vec4;
    /// <summary>
    /// direction of the light
    /// </summary>
    Forward: vec4;
    /// <summary>
    /// color of the light
    /// </summary>
    Color: Color;
    /// <summary>
    /// type of light
    /// </summary>
    Type: number;
    /// <summary>
    /// intensity of light
    /// </summary>
    Intensity: number;
    /// <summary>
    /// reserved for future use
    /// </summary>
    Reserved1?: number;
    /// <summary>
    /// reserved for future use
    /// </summary>
    Reserved2?: number;
}

export class Light extends BaseNode {
    /// <summary>
    /// Color of the light source
    /// </summary>
    public Color = new Color(255, 255, 255, 0);
    /// <summary>
    /// How strong is the light source
    /// </summary>
    public Intensity: number = 1.0;
    /// <summary>
    /// Defines the type of light
    /// </summary>
    public Type: TypeOfLight = TypeOfLight.Directional;

    /// <summary>
    /// Shader information structure
    /// </summary>

    private _framebuffer: Framebuffer | null = null;

    public get Framebuffer(): Framebuffer | null {
        return this._framebuffer;
    }

    static pipeline: Pipeline;


    override onEnable() {

        var module = Engine.instance.GetModule(GraphicsModule);
        var LIGHT_KEY = "_LIGHT";

        let renderPass = module.renderPasses.get(LIGHT_KEY);

        if (renderPass == null)
            throw Error("cant find render pass");

        this._framebuffer = new Framebuffer(
            renderPass,
            1024, 1024
        );

        let projectionDesc = module.descriptorLayouts.get("_PROJECTION");
        if (projectionDesc == null)
            throw Error("cant find _PROJECTION desc");


        let modelDesc = module.descriptorLayouts.get("_MODEL");
        if (modelDesc == null)
            throw Error("cant find _MODEL desc");


        let viewDesc = module.descriptorLayouts.get("_VIEW");
        if (viewDesc == null)
            throw Error("cant find _VIEW desc");


        if (Light.pipeline == null) {
            Light.pipeline = new GraphicsPipeline(
                module.graphicsService.PrimaryDevice,
                renderPass,
                [
                    projectionDesc,
                    viewDesc,
                    modelDesc
                ],
                [
                    new ShaderModule(
                        module.graphicsService.PrimaryDevice,
                        "Assets/Shaders/Default/Light.vert"
                    ),
                    new ShaderModule(
                        module.graphicsService.PrimaryDevice,
                        "Assets/Shaders/Default/Light.frag"
                    )
                ],
                new PipelineInputBuilder()
            );
        }
    }

    /// <summary>
    /// get's the shader information data for this component
    /// </summary>
    public get ToShaderInfo(): Float32Array {

        var position = vec4.fromValues(0, 0, 0, 0);
        var forward = vec4.fromValues(0, 0, 1, 0);

        if (this._transform != null) {
            position = vec4.fromValues(this._transform.position[0], this._transform.position[1], this._transform.position[2], 1.0);
            forward = vec4.fromValues(this._transform.Forward[0], this._transform.Forward[1], this._transform.Forward[2], 0.0);
        }

        let c = new Color(255, 255, 255, 0);

        let projectionMatrix = new Float32Array(
            position.length + forward.length + 4 + 1 + 1
        );

        projectionMatrix[0] = position[0];
        projectionMatrix[1] = position[1];
        projectionMatrix[2] = position[2];
        projectionMatrix[3] = position[3];

        projectionMatrix[4] = forward[0];
        projectionMatrix[5] = forward[1];
        projectionMatrix[6] = forward[2];
        projectionMatrix[7] = forward[3];
        projectionMatrix[8] = c.r;
        projectionMatrix[9] = c.g;
        projectionMatrix[10] = c.b;
        projectionMatrix[11] = c.a;
        projectionMatrix[12] = this.Intensity;
        projectionMatrix[13] = this.Type;
     
        return projectionMatrix;

    }
}