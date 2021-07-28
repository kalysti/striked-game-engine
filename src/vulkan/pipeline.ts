import fs from "fs";
import essentials from "nvk-essentials";
import { vkAllocateDescriptorSets, VkCompareOp, vkCreateDescriptorPool, vkCreateDescriptorSetLayout, vkCreateGraphicsPipelines, vkCreatePipelineLayout, VkDescriptorPool, VkDescriptorPoolCreateInfo, VkDescriptorSetAllocateInfo, VkDescriptorSetLayout, VkDescriptorSetLayoutBinding, VkDescriptorSetLayoutCreateInfo, VkDevice, VkExtent2D, VkGraphicsPipelineCreateInfo, VkOffset2D, VkPipeline, VkPipelineColorBlendAttachmentState, VkPipelineColorBlendStateCreateInfo, VkPipelineDynamicStateCreateInfo, VkPipelineInputAssemblyStateCreateInfo, VkPipelineLayout, VkPipelineLayoutCreateInfo, VkPipelineMultisampleStateCreateInfo, VkPipelineRasterizationStateCreateInfo, VkPipelineShaderStageCreateInfo, VkPipelineVertexInputStateCreateInfo, VkPipelineViewportStateCreateInfo, VkRect2D, VkShaderModule, VkShaderStageFlagBits, vkUpdateDescriptorSets, VkVertexInputAttributeDescription, VkVertexInputBindingDescription, VkViewport, VkWriteDescriptorSet, VK_COMPARE_OP_ALWAYS, VK_COMPARE_OP_GREATER_OR_EQUAL, VK_COMPARE_OP_LESS, VK_COMPARE_OP_LESS_OR_EQUAL, VK_CULL_MODE_BACK_BIT, VK_CULL_MODE_FRONT_BIT, VK_CULL_MODE_NONE, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_DYNAMIC_STATE_SCISSOR, VK_DYNAMIC_STATE_VIEWPORT, VK_FORMAT_R32G32B32_SFLOAT, VK_FORMAT_R32G32_SFLOAT, VK_FRONT_FACE_COUNTER_CLOCKWISE, VK_LOGIC_OP_COPY, VK_LOGIC_OP_NO_OP, VK_POLYGON_MODE_FILL, VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST, VK_SAMPLE_COUNT_1_BIT, VK_SHADER_STAGE_FRAGMENT_BIT, VK_SHADER_STAGE_VERTEX_BIT, VK_VERTEX_INPUT_RATE_VERTEX, VulkanWindow } from 'vulkan-api';
import { VkCullModeFlagBits, VkFrontFace, VkLogicOp, VkPipelineDepthStencilStateCreateInfo, VkPolygonMode } from 'vulkan-api/generated/1.2.162/win32';
import { Mesh } from "../resources/Mesh";
import { ASSERT_VK_RESULT, calculateVertexDescriptorStride, createColorAttachment, createDescPoolSize, createDescriptionLayout, createShaderModule, createVertexDescriptor } from '../test.helpers';
import { ResourceList } from './list';
import { RenderPass } from './renderpass';
import { Geometry } from '../resources/Geometry';
const { GLSL } = essentials;

export class Pipeline {

    private window: VulkanWindow;
    private device: VkDevice;
    private renderPass: RenderPass;
    //private pipelines: Map<string, VkPipeline> = new Map<string, VkPipeline>();


    private descLayouts: ResourceList<VkDescriptorSetLayout> = new ResourceList<VkDescriptorSetLayout>();
    pipelineLayouts: ResourceList<VkPipelineLayout> = new ResourceList<VkPipelineLayout>();
    private pipelineShaders: ResourceList<VkPipelineShaderStageCreateInfo[]> = new ResourceList<VkPipelineShaderStageCreateInfo[]>();
    pipelineList: ResourceList<VkPipeline> = new ResourceList<VkPipeline>();
    private pipelinePools: ResourceList<VkDescriptorPool> = new ResourceList<VkDescriptorPool>();
    private rasterizeInfos: ResourceList<VkPipelineRasterizationStateCreateInfo> = new ResourceList<VkPipelineRasterizationStateCreateInfo>();
    private vertexDescriptions: ResourceList<VkVertexInputAttributeDescription[]> = new ResourceList<VkVertexInputAttributeDescription[]>();
    private colorBlends: ResourceList<VkPipelineColorBlendStateCreateInfo> = new ResourceList<VkPipelineColorBlendStateCreateInfo>();
    private layoutBindings: ResourceList<VkDescriptorSetLayoutBinding[]> = new ResourceList<VkDescriptorSetLayoutBinding[]>();
    private depthStencil: ResourceList<VkPipelineDepthStencilStateCreateInfo> = new ResourceList<VkPipelineDepthStencilStateCreateInfo>();


    constructor(device: VkDevice, window: VulkanWindow, renderPass: RenderPass) {
        this.device = device;
        this.window = window;
        this.renderPass = renderPass;

        this.setup();
    }

    //at first create desc layout
    setup() {


        this.createDepthStencil('mesh', false, false, VK_COMPARE_OP_LESS_OR_EQUAL, false, false, 0, 0);
        this.createDepthStencil('sky', true, true, VK_COMPARE_OP_LESS_OR_EQUAL, false, false, 0, 1.0);
        this.createDepthStencil('grid', false, false, VK_COMPARE_OP_GREATER_OR_EQUAL, false, false, 0, 0.0);

        this.createDescLayout('mesh',
            [
                createDescriptionLayout(0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),
                createDescriptionLayout(1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),
                createDescriptionLayout(2, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_SHADER_STAGE_FRAGMENT_BIT)
            ]);

        this.createDescLayout('grid',
            [

                createDescriptionLayout(0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),
                createDescriptionLayout(1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),

            ]);

        this.createDescLayout('sky',
            [
                createDescriptionLayout(0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),
                createDescriptionLayout(1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),
                createDescriptionLayout(2, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_SHADER_STAGE_VERTEX_BIT),
                createDescriptionLayout(3, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_SHADER_STAGE_FRAGMENT_BIT)

            ]);

        this.createPipeLineLayout('mesh');
        this.createPipeLineLayout('grid');
        this.createPipeLineLayout('sky');

        this.pipelineShaders.add('mesh',
            [
                this.createShader('./shaders/triangle.vert', 'vert'),
                this.createShader('./shaders/triangle.frag', 'frag')
            ]);

        this.pipelineShaders.add('sky',
            [
                this.createShader('./shaders/sky.vert', 'vert'),
                this.createShader('./shaders/sky.frag', 'frag')
            ]);


        this.pipelineShaders.add('grid',
            [
                this.createShader('./shaders/grid.vert', 'vert'),
                this.createShader('./shaders/grid.frag', 'frag')
            ]);

        this.createRasterizeInfo('mesh', VK_CULL_MODE_BACK_BIT);
        this.createRasterizeInfo('sky', VK_CULL_MODE_FRONT_BIT);
        this.createRasterizeInfo('grid', VK_CULL_MODE_NONE);

        this.vertexDescriptions.add('mesh',
            [
                createVertexDescriptor(0, 0, VK_FORMAT_R32G32B32_SFLOAT),
                createVertexDescriptor(1, 3 * 4, VK_FORMAT_R32G32B32_SFLOAT),
                createVertexDescriptor(2, 6 * 4, VK_FORMAT_R32G32_SFLOAT)
            ]);

        this.vertexDescriptions.add('sky',
            [
                createVertexDescriptor(0, 0, VK_FORMAT_R32G32B32_SFLOAT),
                createVertexDescriptor(1, 3 * 4, VK_FORMAT_R32G32B32_SFLOAT),
                createVertexDescriptor(2, 6 * 4, VK_FORMAT_R32G32_SFLOAT)
            ]);

        this.vertexDescriptions.add('grid',
            [

            ]);

        this.createColorBlend('mesh', VK_LOGIC_OP_NO_OP, [
            createColorAttachment()]
        );

        this.createColorBlend('grid', VK_LOGIC_OP_NO_OP, [
            createColorAttachment(true)]
        );

        this.createColorBlend('sky', VK_LOGIC_OP_COPY, [
            createColorAttachment(true)]
        );

        this.createPipeline('mesh');
        this.createPipeline('grid');
        this.createPipeline('sky');

    }

    createDepthStencil(name: string, testEnable: boolean, testWriteEnable: boolean,
        depthCompareOp: VkCompareOp, depthBoundTestEnable: boolean,
        stencilTestEnable: boolean, minBound: number, maxBound: number) {

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


    updateDescriptions(pipeName: string, mesh: Geometry, setList: VkWriteDescriptorSet[]) {

        console.log("start generate mesh for pipe " + pipeName);

        let pool = this.pipelinePools.get(pipeName);
        let descLayout = this.descLayouts.get(pipeName);

        let descriptorSetAllocInfo = new VkDescriptorSetAllocateInfo();
        descriptorSetAllocInfo.descriptorSetCount = 1;
        descriptorSetAllocInfo.descriptorPool = pool;
        descriptorSetAllocInfo.pSetLayouts = [descLayout];

        let result = vkAllocateDescriptorSets(this.device, descriptorSetAllocInfo, [mesh.descriptorSet]);
        ASSERT_VK_RESULT(result);

        let bindings = this.layoutBindings.get(pipeName);

        if (bindings.length != setList.length)
            throw new Error("Binding size needs to be : " + bindings.length);

        for (let setId in setList.sort((a, b) => a.dstBinding - b.dstBinding)) {
            let bind = bindings[setId];
            let set = setList[setId];

            if (bind.binding != set.dstBinding)
                throw new Error("Not the same  dstBinding for pipe " + pipeName + " for bind: " + set.dstBinding + " needs to be " + bind.binding + " but got " + set.dstBinding);

            if (bind.descriptorType != set.descriptorType)
                throw new Error("Not the same desc type  " + pipeName + " for bind: " + set.dstBinding);

            setList[setId].dstSet = mesh.descriptorSet;
        }

        let setVlaues = [...setList.values()];
        vkUpdateDescriptorSets(this.device, setVlaues.length, setVlaues, 0, null);
    };

    private createPipeline(name: string) {
        let pipelineLayout = this.pipelineLayouts.get(name);
        let shaderStages = this.pipelineShaders.get(name);
        let rasterRizeInfo = this.rasterizeInfos.get(name);
        let vertexDesciptors = this.vertexDescriptions.get(name);
        let colorBlend = this.colorBlends.get(name);
        let depthStencil = this.depthStencil.get(name);

        let dynamicStates = new Int32Array([
            VK_DYNAMIC_STATE_VIEWPORT,
            VK_DYNAMIC_STATE_SCISSOR
        ]);

        let pipelineDynamicStateInfo = new VkPipelineDynamicStateCreateInfo();
        pipelineDynamicStateInfo.dynamicStateCount = dynamicStates.length;
        pipelineDynamicStateInfo.pDynamicStates = dynamicStates;


        let vertexInputInfo = new VkPipelineVertexInputStateCreateInfo();

        if (vertexDesciptors.length > 0) {
            let posVertexBindingDescr = new VkVertexInputBindingDescription();

            posVertexBindingDescr.binding = 0;
            posVertexBindingDescr.stride = calculateVertexDescriptorStride(vertexDesciptors);
            posVertexBindingDescr.inputRate = VK_VERTEX_INPUT_RATE_VERTEX;

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
        inputAssemblyStateInfo.topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
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
        let result = vkCreateGraphicsPipelines(this.device, null, 1, [graphicsPipelineInfo], null, [pipe]);
        ASSERT_VK_RESULT(result);

        this.pipelineList.add(name, pipe);
    }
    private loadShader(filename, ext) {
        return GLSL.toSPIRVSync({
            source: fs.readFileSync(filename),
            extension: ext
        }).output;
    }

    private createShader(filename: string, ext: string) {

        console.log("Load shader: " + filename);
        let shaderFlag: VkShaderStageFlagBits;
        switch (ext) {
            case "vert":
                shaderFlag = VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT;
                break;

            case "frag":
                shaderFlag = VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT;
                break;
            default: throw new Error("Cant find module");
        }

        let shaderModule = createShaderModule(this.device, this.loadShader(filename, ext), new VkShaderModule());

        let shaderStageInfoVert = new VkPipelineShaderStageCreateInfo();
        shaderStageInfoVert.stage = shaderFlag;
        shaderStageInfoVert.module = shaderModule;
        shaderStageInfoVert.pName = "main";

        return shaderStageInfoVert;
    }

    private createDescLayout(name: string, bindings: VkDescriptorSetLayoutBinding[]) {
        //create layout info
        let layoutInfo = new VkDescriptorSetLayoutCreateInfo();
        layoutInfo.bindingCount = bindings.length;
        layoutInfo.pBindings = bindings;

        let layout = new VkDescriptorSetLayout();
        let result = vkCreateDescriptorSetLayout(this.device, layoutInfo, null, layout);
        ASSERT_VK_RESULT(result);

        this.descLayouts.add(name, layout);
        this.layoutBindings.add(name, bindings);

        //create pool desctiptor
        let poolSizes = bindings.map(df => createDescPoolSize(df.descriptorType));

        let descriptorPoolInfo = new VkDescriptorPoolCreateInfo();
        descriptorPoolInfo.poolSizeCount = poolSizes.length;
        descriptorPoolInfo.pPoolSizes = poolSizes;
        descriptorPoolInfo.maxSets = 64;

        let pool = new VkDescriptorPool();
        result = vkCreateDescriptorPool(this.device, descriptorPoolInfo, null, pool);
        ASSERT_VK_RESULT(result);

        this.pipelinePools.add(name, pool);
    }

    private createRasterizeInfo(name: string, cullMode: VkCullModeFlagBits = VK_CULL_MODE_NONE, frontFace: VkFrontFace = VK_FRONT_FACE_COUNTER_CLOCKWISE, polyMode: VkPolygonMode = VK_POLYGON_MODE_FILL) {
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
        let layout = this.descLayouts.get(name);

        let pipelineLayout = new VkPipelineLayout();
        let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
        pipelineLayoutInfo.setLayoutCount = 1;
        pipelineLayoutInfo.pushConstantRangeCount = 0;
        pipelineLayoutInfo.pSetLayouts = [layout];

        let result = vkCreatePipelineLayout(this.device, pipelineLayoutInfo, null, pipelineLayout);
        ASSERT_VK_RESULT(result);

        this.pipelineLayouts.add(name, pipelineLayout);
    }

    private getViewport() {

        let viewport = new VkViewport();
        viewport.x = 0;
        viewport.y = 0;
        viewport.width = this.window.width;
        viewport.height = this.window.height;
        viewport.minDepth = 0.0;
        viewport.maxDepth = 1.0;

        let scissorOffset = new VkOffset2D();
        scissorOffset.x = 0;
        scissorOffset.y = 0;

        let scissorExtent = new VkExtent2D();
        scissorExtent.width = this.window.width;
        scissorExtent.height = this.window.height;

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