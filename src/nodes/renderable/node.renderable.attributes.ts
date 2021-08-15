import {
    VkCompareOp,
    VkCullModeFlagBits, VkDescriptorType, VkFormat, VkFrontFace,
    VkLogicOp,
    VkPolygonMode, VkShaderStageFlagBits
} from 'vulkan-api';

export enum RenderTopology {
    TRIANGLE_STRIPES,
    TRINAGLE_LIST,
}

export interface RenderModulColorBlend {
    logicOp?: VkLogicOp;
    blendEnable?: boolean;
}
export interface RenderModulDepthStencil {
    testEnable?: boolean;
    testWriteEnable?: boolean;
    compareOp?: VkCompareOp;
    maxBounds?: number;
}

export interface RenderModuleRasterize {
    cullMode?: VkCullModeFlagBits;
    frontFace?: VkFrontFace;
    polyMode?: VkPolygonMode;
}

export const registeredModules: Map<string, RenderModulePipeline> = new Map<
    string,
    RenderModulePipeline
>();
export interface RenderModuleInterface {
    shaders?: string[];
    topology?: RenderTopology;
    colorBlend?: RenderModulColorBlend;
    depthStencil?: RenderModulDepthStencil;
    rasterize?: RenderModuleRasterize;
    descriptors?: RenderModuleDynamicDescriptor[];
    vertexDesc?: RenderModuleStaticDescriptor[];
}

export function RenderModule(face: RenderModuleInterface | null) {
    return function (target: Function) {
        registeredModules.set(target.name, new RenderModulePipeline(face));
    };
}

export enum RenderBufferTypes {
    INDEX,
    VERTEX,
    UNIFORM,
}

export class RenderModulePipeline {
    info: RenderModuleInterface;

    constructor(info: RenderModuleInterface) {
        this.info = info;
    }
}

export class RenderModuleDynamicDescriptors {
    dynamicValues: Map<string, RenderModuleDynamicDescriptor> = new Map<
        string,
        RenderModuleDynamicDescriptor
    >();

    staticValues: Map<string, RenderModuleStaticDescriptor> = new Map<
        string,
        RenderModuleStaticDescriptor
    >();
}

export interface RenderModuleStaticDescriptor {
    bind: number;
    list: VkFormat[];
}

export interface RenderModuleDynamicDescriptor {
    bind: number;
    type: VkDescriptorType;
    flags: VkShaderStageFlagBits;
}

export interface BindInterface {
    name: string;
    type: BindInterfaceType;
    bind: number;
}

export enum BindInterfaceType {
    UNIFORM,
    VERTEX,
    TEXTURE,
    INDEX,
    INDEX_DRAW
}

export const bindings: Map<string, BindInterface[]> = new Map<
    string,
    []
>();

export function Bindable(type: BindInterfaceType, bind: number = 0) {
    return function (target: Object, propertyKey: string) {

        let values = bindings.get(target.constructor.name);

        if (values == undefined || values == null)
            values = [];

        values.push({ name: propertyKey, type: type, bind: bind });
        bindings.set(target.constructor.name, values);
    };
}
