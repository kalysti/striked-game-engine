import { GraphicsModule } from '@engine/modules';
import { RenderableNode } from '@engine/nodes';
import { RenderTopology } from '@engine/nodes/renderable';
import { List } from '@engine/types';
import fs from 'fs';
import essentials from 'nvk-essentials';
import {
    vkAllocateDescriptorSets, VkCompareOp,
    vkCreateDescriptorPool,
    vkCreateDescriptorSetLayout,
    vkCreateGraphicsPipelines,
    vkCreatePipelineLayout, VkCullModeFlagBits, VkDescriptorPool,
    VkDescriptorPoolCreateInfo,
    VkDescriptorSetAllocateInfo,
    VkDescriptorSetLayout,
    VkDescriptorSetLayoutBinding,
    VkDescriptorSetLayoutCreateInfo, VkExtent2D,
    VkFrontFace,
    VkGraphicsPipelineCreateInfo,
    VkLogicOp,
    VkOffset2D,
    VkPipeline,
    VkPipelineColorBlendAttachmentState,
    VkPipelineColorBlendStateCreateInfo,
    VkPipelineDepthStencilStateCreateInfo,
    VkPipelineDynamicStateCreateInfo,
    VkPipelineInputAssemblyStateCreateInfo,
    VkPipelineLayout,
    VkPipelineLayoutCreateInfo,
    VkPipelineMultisampleStateCreateInfo,
    VkPipelineRasterizationStateCreateInfo,
    VkPipelineShaderStageCreateInfo,
    VkPipelineVertexInputStateCreateInfo,
    VkPipelineViewportStateCreateInfo,
    VkPolygonMode,
    VkPrimitiveTopology,
    VkRect2D, VkShaderModule,
    VkShaderStageFlagBits,
    vkUpdateDescriptorSets,
    VkVertexInputAttributeDescription,
    VkVertexInputBindingDescription,
    VkViewport,
    VkWriteDescriptorSet, VK_COMPARE_OP_ALWAYS, VK_COMPARE_OP_LESS_OR_EQUAL, VK_CULL_MODE_NONE, VK_DYNAMIC_STATE_SCISSOR,
    VK_DYNAMIC_STATE_VIEWPORT, VK_FRONT_FACE_COUNTER_CLOCKWISE, VK_LOGIC_OP_COPY,
    VK_LOGIC_OP_NO_OP, VK_POLYGON_MODE_FILL,
    VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST, VK_SAMPLE_COUNT_1_BIT, VK_VERTEX_INPUT_RATE_VERTEX
} from 'vulkan-api';
import { ASSERT_VK_RESULT, calculateVertexDescriptorStride, createColorAttachment, createDescPoolSize, createDescriptionLayout, createShaderModule, createVertexDescriptor } from '../utils/helpers';
import { LogicalDevice } from './logical.device';
import { RenderElement } from './render.element';
import { RenderPass } from './renderpass';

const { GLSL } = essentials;

export class Pipeline extends RenderElement {
    private renderPass: RenderPass;
    //private pipelines: Map<string, VkPipeline> = new Map<string, VkPipeline>();

    private descLayouts: List<VkDescriptorSetLayout> = new List<VkDescriptorSetLayout>();
    pipelineLayouts: List<VkPipelineLayout> = new List<VkPipelineLayout>();
    private pipelineShaders: List<VkPipelineShaderStageCreateInfo[]> = new List<VkPipelineShaderStageCreateInfo[]>();
    pipelineList: List<VkPipeline> = new List<VkPipeline>();
    private pipelinePools: List<VkDescriptorPool> = new List<VkDescriptorPool>();
    private rasterizeInfos: List<VkPipelineRasterizationStateCreateInfo> = new List<VkPipelineRasterizationStateCreateInfo>();
    private vertexDescriptions: List<VkVertexInputAttributeDescription[]> = new List<VkVertexInputAttributeDescription[]>();
    private colorBlends: List<VkPipelineColorBlendStateCreateInfo> = new List<VkPipelineColorBlendStateCreateInfo>();
    private layoutBindings: List<VkDescriptorSetLayoutBinding[]> = new List<VkDescriptorSetLayoutBinding[]>();
    private depthStencil: List<VkPipelineDepthStencilStateCreateInfo> = new List<VkPipelineDepthStencilStateCreateInfo>();

    constructor(device: LogicalDevice, renderPass: RenderPass) {
        super(device);
        this.renderPass = renderPass;

        this.create();
    }

    protected onDestroy() { }

    //at first create desc layout
    protected getFallback<T>(value: Object, fallbackValue: T): T {
        if (value == undefined || value == null) return fallbackValue;
        else return value as T;
    }

    protected onCreate() {
        for (let [key, pipe] of GraphicsModule.getRegisterModules()) {
            let value = pipe.info;
            this.createDepthStencil(
                key,
                this.getFallback<boolean>(value.depthStencil?.testEnable, false),
                this.getFallback<boolean>(value.depthStencil?.testWriteEnable, false),
                this.getFallback<VkCompareOp>(value.depthStencil?.compareOp, VK_COMPARE_OP_LESS_OR_EQUAL),
                false,
                false,
                0,
                this.getFallback<number>(value.depthStencil?.maxBounds, 0.0),
            );

            let shaders = [];
            for (let shader of value.shaders) {
                var extension = shader.substring(shader.lastIndexOf('.') + 1);
                shaders.push(this.createShader(shader, extension));
            }

            this.pipelineShaders.add(key, shaders);

            let descLayouts: VkDescriptorSetLayoutBinding[] = [];
            let vertexAttributes: VkVertexInputAttributeDescription[] = [];

            if (pipe.info.descriptors != undefined && pipe.info.descriptors.length > 0) {
                for (let registervalue of pipe.info.descriptors) {
                    descLayouts.push(createDescriptionLayout(registervalue.bind, registervalue.type, registervalue.flags));
                }
            }
            if (pipe.info.vertexDesc != undefined && pipe.info.vertexDesc.length > 0) {
                for (let registervalue of pipe.info.vertexDesc) {
                    let stride = 0;
                    let key = 0;

                    for (let vertexDesc of registervalue.list) {
                        let attribute = createVertexDescriptor(key, stride, vertexDesc, registervalue.bind);
                        stride += calculateVertexDescriptorStride([attribute]);
                        vertexAttributes.push(attribute);

                        key++;
                    }
                }
            }


            this.vertexDescriptions.add(key, vertexAttributes);
            this.createDescLayout(key, descLayouts);
            this.createPipeLineLayout(key);
            this.createColorBlend(key, this.getFallback<VkLogicOp>(value.colorBlend?.logicOp, VK_LOGIC_OP_NO_OP), [
                createColorAttachment(this.getFallback<boolean>(value.colorBlend?.blendEnable, false)),
            ]);
            this.createRasterizeInfo(
                key,
                this.getFallback<VkCullModeFlagBits>(value.rasterize?.cullMode, VK_CULL_MODE_NONE),
                this.getFallback<VkFrontFace>(value.rasterize?.frontFace, VK_FRONT_FACE_COUNTER_CLOCKWISE),
                this.getFallback<VkPolygonMode>(value.rasterize?.polyMode, VK_POLYGON_MODE_FILL),
            );

            let topology = VkPrimitiveTopology.VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;

            switch (value?.topology) {
                case RenderTopology.TRINAGLE_LIST:
                    topology = VkPrimitiveTopology.VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
                    break;
                case RenderTopology.TRIANGLE_STRIPES:
                    topology = VkPrimitiveTopology.VK_PRIMITIVE_TOPOLOGY_TRIANGLE_STRIP;
                    break;
                default:
                    break;
            }
            this.createPipeline(key, topology);
        }

    }

    createDepthStencil(
        name: string,
        testEnable: boolean,
        testWriteEnable: boolean,
        depthCompareOp: VkCompareOp,
        depthBoundTestEnable: boolean,
        stencilTestEnable: boolean,
        minBound: number,
        maxBound: number,
    ) {
        let depthStencilInfo = new VkPipelineDepthStencilStateCreateInfo();
        depthStencilInfo.depthTestEnable = testEnable;
        depthStencilInfo.depthWriteEnable = testWriteEnable;
        depthStencilInfo.depthCompareOp = depthCompareOp;
        depthStencilInfo.depthBoundsTestEnable = depthBoundTestEnable;
        depthStencilInfo.stencilTestEnable = stencilTestEnable;
        depthStencilInfo.minDepthBounds = minBound;
        depthStencilInfo.minDepthBounds = maxBound;
        depthStencilInfo.back.compareOp = VK_COMPARE_OP_ALWAYS;

        this.depthStencil.add(name, depthStencilInfo);
    }

    updateDescriptions(pipeName: string, mesh: RenderableNode, setList: VkWriteDescriptorSet[]) {

        console.log("[Pipeline] Update descritions");
        let pool = this.pipelinePools.get(pipeName);
        let descLayout = this.descLayouts.get(pipeName);

        let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
        descriptorSetAllocInfo.descriptorSetCount = 1;
        descriptorSetAllocInfo.descriptorPool = pool;
        descriptorSetAllocInfo.pSetLayouts = [descLayout];

        let result = vkAllocateDescriptorSets(this.device.handle, descriptorSetAllocInfo, [mesh.descriptorSet]);
        ASSERT_VK_RESULT(result);

        let bindings = this.layoutBindings.get(pipeName);

        if (bindings.length != setList.length) throw new Error('Binding size needs to be : ' + bindings.length + " but is " + setList.length);

        for (let setId in setList.sort((a, b) => a.dstBinding - b.dstBinding)) {
            let bind = bindings[setId];
            let set = setList[setId];

            if (bind.binding != set.dstBinding)
                throw new Error('Not the same  dstBinding for pipe ' + pipeName + ' for bind: ' + set.dstBinding + ' needs to be ' + bind.binding + ' but got ' + set.dstBinding);

            if (bind.descriptorType != set.descriptorType) throw new Error('Not the same desc type  ' + pipeName + ' for bind: ' + set.dstBinding);

            setList[setId].dstSet = mesh.descriptorSet;
        }

        let setVlaues = [...setList.values()];
        vkUpdateDescriptorSets(this.device.handle, setVlaues.length, setVlaues, 0, null);
    }

    private createPipeline(name: string, primType: VkPrimitiveTopology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST) {
        let pipelineLayout = this.pipelineLayouts.get(name);
        let shaderStages = this.pipelineShaders.get(name);
        let rasterRizeInfo = this.rasterizeInfos.get(name);
        let vertexDesciptors = this.vertexDescriptions.get(name);
        let colorBlend = this.colorBlends.get(name);
        let depthStencil = this.depthStencil.getOrNull(name);

        let dynamicStates = new Int32Array([VK_DYNAMIC_STATE_VIEWPORT, VK_DYNAMIC_STATE_SCISSOR]);

        let pipelineDynamicStateInfo = new VkPipelineDynamicStateCreateInfo();
        pipelineDynamicStateInfo.dynamicStateCount = dynamicStates.length;
        pipelineDynamicStateInfo.pDynamicStates = dynamicStates;

        let vertexInputInfo = new VkPipelineVertexInputStateCreateInfo();

        if (vertexDesciptors.length > 0) {
            let binding = 0;
            let vertexDescBinds: VkVertexInputBindingDescription[] = [];
            for (let desc of vertexDesciptors) {
                let vertexDescBind = new VkVertexInputBindingDescription();
                vertexDescBind.binding = binding;
                vertexDescBind.stride = calculateVertexDescriptorStride([desc]);
                vertexDescBind.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;
                vertexDescBinds.push(vertexDescBind);
                binding++;
            }

            let posVertexBindingDescr = new VkVertexInputBindingDescription();

            posVertexBindingDescr.binding = 0;
            posVertexBindingDescr.stride = calculateVertexDescriptorStride(vertexDesciptors);
            posVertexBindingDescr.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;
            /*
            vertexInputInfo.vertexBindingDescriptionCount =
                vertexDescBinds.length;
            vertexInputInfo.pVertexBindingDescriptions = vertexDescBinds;
       */
            vertexInputInfo.vertexBindingDescriptionCount = 1;

            vertexInputInfo.pVertexBindingDescriptions = [posVertexBindingDescr];

            vertexInputInfo.vertexAttributeDescriptionCount = vertexDesciptors.length;
            vertexInputInfo.pVertexAttributeDescriptions = vertexDesciptors;
        }

        let multisampleInfo = new VkPipelineMultisampleStateCreateInfo();
        multisampleInfo.rasterizationSamples = VK_SAMPLE_COUNT_1_BIT;
        multisampleInfo.minSampleShading = 1.0;
        multisampleInfo.pSampleMask = null;
        multisampleInfo.alphaToCoverageEnable = false;
        multisampleInfo.alphaToOneEnable = false;
        multisampleInfo.sampleShadingEnable = false;

        let inputAssemblyStateInfo = new VkPipelineInputAssemblyStateCreateInfo();
        inputAssemblyStateInfo.topology = primType;
        inputAssemblyStateInfo.primitiveRestartEnable = false;

        let graphicsPipelineInfo = new VkGraphicsPipelineCreateInfo();
        graphicsPipelineInfo.stageCount = shaderStages.length;
        graphicsPipelineInfo.pStages = shaderStages;
        graphicsPipelineInfo.pVertexInputState = vertexInputInfo;
        graphicsPipelineInfo.pInputAssemblyState = inputAssemblyStateInfo;
        graphicsPipelineInfo.pViewportState = this.getViewport();
        graphicsPipelineInfo.pRasterizationState = rasterRizeInfo;
        graphicsPipelineInfo.pMultisampleState = multisampleInfo;
        graphicsPipelineInfo.pColorBlendState = colorBlend;
        graphicsPipelineInfo.pDynamicState = pipelineDynamicStateInfo;
        graphicsPipelineInfo.pDepthStencilState = depthStencil;
        graphicsPipelineInfo.layout = pipelineLayout;
        graphicsPipelineInfo.renderPass = this.renderPass.handle;
        graphicsPipelineInfo.subpass = 0;
        graphicsPipelineInfo.basePipelineIndex = -1;

        let pipe = new VkPipeline();
        let result = vkCreateGraphicsPipelines(this.device.handle, null, 1, [graphicsPipelineInfo], null, [pipe]);
        ASSERT_VK_RESULT(result);

        this.pipelineList.add(name, pipe);
    }

    private loadShader(filename, ext) {
        return GLSL.toSPIRVSync({
            source: fs.readFileSync(filename),
            extension: ext,
        }).output;
    }

    private createShader(filename: string, ext: string) {
        console.log('[Shader][' + filename + '] Loaded');
        let shaderFlag: VkShaderStageFlagBits;
        switch (ext) {
            case 'vert':
                shaderFlag = VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT;
                break;

            case 'frag':
                shaderFlag = VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT;
                break;
            default:
                throw new Error('Cant find module');
        }

        let shaderModule = createShaderModule(this.device.handle, this.loadShader(filename, ext), new VkShaderModule());

        let shaderStageInfoVert = new VkPipelineShaderStageCreateInfo();
        shaderStageInfoVert.stage = shaderFlag;
        shaderStageInfoVert.module = shaderModule;
        shaderStageInfoVert.pName = 'main';

        return shaderStageInfoVert;
    }

    private createDescLayout(name: string, bindings: VkDescriptorSetLayoutBinding[]) {
        //create layout info
        let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
        layoutInfo.bindingCount = bindings.length;
        layoutInfo.pBindings = bindings;

        let layout = new VkDescriptorSetLayout();
        let result = vkCreateDescriptorSetLayout(this.device.handle, layoutInfo, null, layout);
        ASSERT_VK_RESULT(result);

        this.descLayouts.add(name, layout);
        this.layoutBindings.add(name, bindings);

        //create pool desctiptor
        let poolSizes = bindings.map((df) => createDescPoolSize(df.descriptorType));

        let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
        descriptorPoolInfo.poolSizeCount = poolSizes.length;
        descriptorPoolInfo.pPoolSizes = poolSizes;
        descriptorPoolInfo.maxSets = 64;

        let pool = new VkDescriptorPool();
        result = vkCreateDescriptorPool(this.device.handle, descriptorPoolInfo, null, pool);
        ASSERT_VK_RESULT(result);

        this.pipelinePools.add(name, pool);
    }

    private createRasterizeInfo(
        name: string,
        cullMode: VkCullModeFlagBits = VK_CULL_MODE_NONE,
        frontFace: VkFrontFace = VK_FRONT_FACE_COUNTER_CLOCKWISE,
        polyMode: VkPolygonMode = VK_POLYGON_MODE_FILL,
    ) {
        let rasterizationInfo = new VkPipelineRasterizationStateCreateInfo();
        rasterizationInfo.depthClampEnable = false;
        rasterizationInfo.rasterizerDiscardEnable = false;
        rasterizationInfo.polygonMode = polyMode;
        rasterizationInfo.cullMode = cullMode;
        rasterizationInfo.frontFace = frontFace;
        rasterizationInfo.depthBiasEnable = false;
        rasterizationInfo.depthBiasConstantFactor = 0.0;
        rasterizationInfo.depthBiasClamp = 0.0;
        rasterizationInfo.depthBiasSlopeFactor = 0.0;
        rasterizationInfo.lineWidth = 1.0;

        this.rasterizeInfos.add(name, rasterizationInfo);
    }

    private createPipeLineLayout(name: string) {
        let layout = this.descLayouts.getOrNull(name);

        let pipelineLayout = new VkPipelineLayout();
        let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
        pipelineLayoutInfo.setLayoutCount = layout != null ? 1 : 0;
        pipelineLayoutInfo.pushConstantRangeCount = 0;
        pipelineLayoutInfo.pSetLayouts = layout != null ? [layout] : null;

        let result = vkCreatePipelineLayout(this.device.handle, pipelineLayoutInfo, null, pipelineLayout);
        ASSERT_VK_RESULT(result);

        this.pipelineLayouts.add(name, pipelineLayout);
    }

    private getViewport() {

        let viewport = new VkViewport();
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = GraphicsModule.mainWindow.width;
        viewport.height = GraphicsModule.mainWindow.height;
        viewport.minDepth = 0.0;
        viewport.maxDepth = 1.0;

        let scissorOffset = new VkOffset2D();
        scissorOffset.x = 0;
        scissorOffset.y = 0;

        let scissorExtent = new VkExtent2D();
        scissorExtent.width = GraphicsModule.mainWindow.width;
        scissorExtent.height = GraphicsModule.mainWindow.height;

        let scissor = new VkRect2D();
        scissor.offset = scissorOffset;
        scissor.extent = scissorExtent;

        let viewportStateInfo = new VkPipelineViewportStateCreateInfo();
        viewportStateInfo.viewportCount = 1;
        viewportStateInfo.pViewports = [viewport];
        viewportStateInfo.scissorCount = 1;
        viewportStateInfo.pScissors = [scissor];

        return viewportStateInfo;
    }

    private createColorBlend(name: string, logicOp: VkLogicOp, attachments: VkPipelineColorBlendAttachmentState[]) {
        let colorBlendInfo = new VkPipelineColorBlendStateCreateInfo();
        colorBlendInfo.logicOpEnable = false;
        colorBlendInfo.logicOp = VK_LOGIC_OP_COPY;
        colorBlendInfo.attachmentCount = attachments.length;
        colorBlendInfo.pAttachments = attachments;
        colorBlendInfo.blendConstants = [0.0, 0.0, 0.0, 0.0];

        this.colorBlends.add(name, colorBlendInfo);
    }



}
