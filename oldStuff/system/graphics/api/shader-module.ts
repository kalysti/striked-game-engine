import { Device } from "./device";
import * as fs from 'fs';
import { vkCreateShaderModule, vkDestroyShaderModule, VkResult, VkShaderModule, VkShaderModuleCreateInfo, VkShaderStageFlagBits, VkStructureType } from "vulkan-api/generated/1.2.162/win32";
import * as GLSL from "nvk-essentials";

export enum ShaderType {
    Vertex = 1,
    TessellationControl = 2,
    TessellationEvaluation = 4,
    Geometry = 8,
    Fragment = 16,
    Compute = 32,
}

export class ShaderModule {

    private _device: Device;
    private _handle: VkShaderModule | null = null;
    type: ShaderType = ShaderType.Vertex;

    get handle(): VkShaderModule | null {
        return this._handle;
    }
    get device(): Device {
        return this._device;
    }

    get typeVulkan() : VkShaderStageFlagBits{

        switch (this.type) {
            case ShaderType.Vertex: return VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT; 
            case ShaderType.TessellationControl: return VkShaderStageFlagBits.VK_SHADER_STAGE_TESSELLATION_CONTROL_BIT; 
            case ShaderType.TessellationEvaluation: return VkShaderStageFlagBits.VK_SHADER_STAGE_TESSELLATION_EVALUATION_BIT; 
            case ShaderType.Geometry: return VkShaderStageFlagBits.VK_SHADER_STAGE_GEOMETRY_BIT; 
            case ShaderType.Fragment: return VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT; 
            case ShaderType.Compute: return VkShaderStageFlagBits.VK_SHADER_STAGE_COMPUTE_BIT; 
        }
    }

    constructor(device: Device, path: string) {

        this._device = device;

        var fileExtension = path.split('.').pop();

        if (fileExtension == "vert")
            this.type = ShaderType.Vertex;
        else if (fileExtension == "frag")
            this.type = ShaderType.Fragment;
        else if (fileExtension == "geom")
            this.type = ShaderType.Geometry;
        else if (fileExtension == "tesc")
            this.type = ShaderType.TessellationControl;
        else if (fileExtension == "tese")
            this.type = ShaderType.TessellationEvaluation;
        else if (fileExtension == "comp")
            this.type = ShaderType.Compute;
        else
            throw new Error("invalid file format");

        let shaderSrc = GLSL.GLSL.toSPIRVSync({
            source: fs.readFileSync(path),
            extension: fileExtension
        }).output;

        this.Init(shaderSrc);
    }

    public Init(shaderSrc: any) {

        var shaderInfo = new VkShaderModuleCreateInfo();

      //  shaderInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO;
        shaderInfo.codeSize = shaderSrc.byteLength;
        shaderInfo.pCode = shaderSrc;

        this._handle = new VkShaderModule();
        if (vkCreateShaderModule(
            this._device.handle,
            shaderInfo,
            null,
            this._handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create shader module");

    }


    destroy() {
        if (this._handle != null) {
            vkDestroyShaderModule(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
    }




}