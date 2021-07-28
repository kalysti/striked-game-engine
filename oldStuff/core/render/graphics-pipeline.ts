import { vkCreateGraphicsPipelines, vkCreatePipelineLayout, VkExtent2D, VkGraphicsPipelineCreateInfo, VkOffset2D, VkPipeline, VkPipelineColorBlendAttachmentState, VkPipelineColorBlendStateCreateInfo, VkPipelineDynamicStateCreateInfo, VkPipelineInputAssemblyStateCreateInfo, VkPipelineLayout, VkPipelineLayoutCreateInfo, VkPipelineMultisampleStateCreateInfo, VkPipelineRasterizationStateCreateInfo, VkPipelineShaderStageCreateInfo, VkPipelineVertexInputStateCreateInfo, VkPipelineViewportStateCreateInfo, VkRect2D, VkRenderPass, VkShaderModule, VkVertexInputBindingDescription, VkViewport, VK_BLEND_FACTOR_ONE, VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA, VK_BLEND_FACTOR_SRC_ALPHA, VK_BLEND_FACTOR_ZERO, VK_BLEND_OP_ADD, VK_COLOR_COMPONENT_A_BIT, VK_COLOR_COMPONENT_B_BIT, VK_COLOR_COMPONENT_G_BIT, VK_COLOR_COMPONENT_R_BIT, VK_CULL_MODE_BACK_BIT, VK_DYNAMIC_STATE_SCISSOR, VK_DYNAMIC_STATE_VIEWPORT, VK_FRONT_FACE_COUNTER_CLOCKWISE, VK_LOGIC_OP_NO_OP, VK_POLYGON_MODE_FILL, VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST, VK_SAMPLE_COUNT_1_BIT, VK_SHADER_STAGE_FRAGMENT_BIT, VK_SHADER_STAGE_VERTEX_BIT, VK_SUCCESS, VK_VERTEX_INPUT_RATE_VERTEX } from "vulkan-api/generated/1.2.162/win32";
import { UIWindow } from "../components/window/ui-window";
import { Cube } from "../objects/cube";
import { DescriptorSetLayout } from "./desc-set-layout";
import { Renderer } from "./renderer";
import { LogicalDevice } from "./logical-device";
import { GraphicsPipelineBase } from "./graphics-pipeline-base";

export class GraphicsPipeline extends GraphicsPipelineBase {

    private vertexShader!: VkShaderModule;
    private fragShader!: VkShaderModule;

    create(_instance: Renderer, _cube: Cube, _device: LogicalDevice, _window: UIWindow, _renderPass: VkRenderPass, _descSetLayout: DescriptorSetLayout) {

        this.vertexShader = _instance.loadShaderFromPath('./shaders/cube.vert', 'vert');
        this.fragShader = _instance.loadShaderFromPath('./shaders/cube.frag', 'frag');

        let shaderStageInfoVert = _instance.createShaderStageInfo(this.vertexShader);
        let shaderStageInfoFrag = _instance.createShaderStageInfo(this.fragShader, VK_SHADER_STAGE_FRAGMENT_BIT);
 
        let shaderStages = [shaderStageInfoVert, shaderStageInfoFrag];

        //create vertex input
        let vertexInputInfo = _instance.createVertexInputInfo(_cube.bytesPerElement(), _cube.getAttributes());

        let inputAssemblyStateInfo = new VkPipelineInputAssemblyStateCreateInfo();
        inputAssemblyStateInfo.topology = VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
        inputAssemblyStateInfo.primitiveRestartEnable = false;

        let viewport = _instance.createViewport();
        let scissor = _instance.createScissor();

        let viewportStateInfo = new VkPipelineViewportStateCreateInfo();
        viewportStateInfo.viewportCount = 1;
        viewportStateInfo.pViewports = [viewport];
        viewportStateInfo.scissorCount = 1;
        viewportStateInfo.pScissors = [scissor];

        let rasterizationInfo = new VkPipelineRasterizationStateCreateInfo();
        rasterizationInfo.depthClampEnable = false;
        rasterizationInfo.rasterizerDiscardEnable = false;
        rasterizationInfo.polygonMode = VK_POLYGON_MODE_FILL;
        rasterizationInfo.cullMode = VK_CULL_MODE_BACK_BIT;
        rasterizationInfo.frontFace = VK_FRONT_FACE_COUNTER_CLOCKWISE;
        rasterizationInfo.depthBiasEnable = false;
        rasterizationInfo.depthBiasConstantFactor = 0.0;
        rasterizationInfo.depthBiasClamp = 0.0;
        rasterizationInfo.depthBiasSlopeFactor = 0.0;
        rasterizationInfo.lineWidth = 1.0;

        let multisampleInfo = new VkPipelineMultisampleStateCreateInfo();
        multisampleInfo.rasterizationSamples = VK_SAMPLE_COUNT_1_BIT;
        multisampleInfo.minSampleShading = 1.0;
        multisampleInfo.pSampleMask = null;
        multisampleInfo.alphaToCoverageEnable = false;
        multisampleInfo.alphaToOneEnable = false;

        let colorBlendAttachment = new VkPipelineColorBlendAttachmentState();
        colorBlendAttachment.blendEnable = true;
        colorBlendAttachment.srcColorBlendFactor = VK_BLEND_FACTOR_SRC_ALPHA;
        colorBlendAttachment.dstColorBlendFactor = VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA;
        colorBlendAttachment.colorBlendOp = VK_BLEND_OP_ADD;
        colorBlendAttachment.srcAlphaBlendFactor = VK_BLEND_FACTOR_ONE;
        colorBlendAttachment.dstAlphaBlendFactor = VK_BLEND_FACTOR_ZERO;
        colorBlendAttachment.alphaBlendOp = VK_BLEND_OP_ADD;
        colorBlendAttachment.colorWriteMask = (
            VK_COLOR_COMPONENT_R_BIT |
            VK_COLOR_COMPONENT_G_BIT |
            VK_COLOR_COMPONENT_B_BIT |
            VK_COLOR_COMPONENT_A_BIT
        );

        let colorBlendInfo = new VkPipelineColorBlendStateCreateInfo();
        colorBlendInfo.logicOpEnable = false;
        colorBlendInfo.logicOp = VK_LOGIC_OP_NO_OP;
        colorBlendInfo.attachmentCount = 1;
        colorBlendInfo.pAttachments = [colorBlendAttachment];
        colorBlendInfo.blendConstants = [0.0, 0.0, 0.0, 0.0];

        let dynamicStates = new Int32Array([
            VK_DYNAMIC_STATE_VIEWPORT,
            VK_DYNAMIC_STATE_SCISSOR
        ]);

        let pipelineDynamicStateInfo = new VkPipelineDynamicStateCreateInfo();
        pipelineDynamicStateInfo.dynamicStateCount = dynamicStates.length;
        pipelineDynamicStateInfo.pDynamicStates = dynamicStates;

        let pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();
        pipelineLayoutInfo.setLayoutCount = 1;
        pipelineLayoutInfo.pSetLayouts = [_descSetLayout.getDescSet()];
        pipelineLayoutInfo.pushConstantRangeCount = 0;

        let resultLayout = vkCreatePipelineLayout(_device.getDevice(), pipelineLayoutInfo, null, this.pipelineLayout);

        if (resultLayout !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

        let graphicsPipelineInfo = new VkGraphicsPipelineCreateInfo();
        graphicsPipelineInfo.stageCount = shaderStages.length;
        graphicsPipelineInfo.pStages = shaderStages;
        graphicsPipelineInfo.pVertexInputState = vertexInputInfo;
        graphicsPipelineInfo.pInputAssemblyState = inputAssemblyStateInfo;
        graphicsPipelineInfo.pTessellationState = null;
        graphicsPipelineInfo.pViewportState = viewportStateInfo;
        graphicsPipelineInfo.pRasterizationState = rasterizationInfo;
        graphicsPipelineInfo.pMultisampleState = multisampleInfo;
        graphicsPipelineInfo.pDepthStencilState = null;
        graphicsPipelineInfo.pColorBlendState = colorBlendInfo;
        graphicsPipelineInfo.pDynamicState = pipelineDynamicStateInfo;
        graphicsPipelineInfo.layout = this.pipelineLayout;
        graphicsPipelineInfo.renderPass = _renderPass;
        graphicsPipelineInfo.subpass = 0;
        graphicsPipelineInfo.basePipelineHandle = null;
        graphicsPipelineInfo.basePipelineIndex = -1;

        let resultPipeline = vkCreateGraphicsPipelines(_device.getDevice(), null, 1, [graphicsPipelineInfo], null, [this._pipeline]);

        if (resultPipeline !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);

    }
}