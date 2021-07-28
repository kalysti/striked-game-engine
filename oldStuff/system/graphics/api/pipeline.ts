import { pipeline } from "stream";
import { VkPipelineLayout, VkPipeline, vkDestroyPipeline, vkDestroyPipelineLayout, VkCompareOp, VkDescriptorSetLayout, VkDynamicState, VkFrontFace, VkGraphicsPipelineCreateInfo, VkLogicOp, VkPipelineCache, VkPipelineColorBlendAttachmentState, VkPipelineColorBlendStateCreateInfo, VkPipelineDepthStencilStateCreateInfo, VkPipelineDynamicStateCreateInfo, VkPipelineInputAssemblyStateCreateInfo, VkPipelineLayoutCreateInfo, VkPipelineMultisampleStateCreateInfo, VkPipelineRasterizationStateCreateInfo, VkPipelineShaderStageCreateInfo, VkPipelineVertexInputStateCreateInfo, VkPipelineViewportStateCreateInfo, VkPolygonMode, VkPrimitiveTopology, VkRect2D, VkResult, VkStructureType, VkVertexInputAttributeDescription, VkVertexInputBindingDescription, VkViewport, VkCullModeFlagBits, vkCreatePipelineLayout, VkSampleCountFlagBits, VkImageUsageFlagBits, VkColorComponentFlagBits, VkShaderStageFlagBits, vkCreateGraphicsPipelines } from "vulkan-api/generated/1.2.162/win32";
import { DescriptorLayout } from "./desc-layout";
import { Device } from "./device";
import { PipelineInputBuilder } from "./pipeline-builder";
import { RenderPass } from "./render-pass";
import { ShaderModule } from "./shader-module";


export class Pipeline {

    protected _device: Device;
    protected _renderPass: RenderPass;
    protected _layout: VkPipelineLayout | null = null;
    protected _handle: VkPipeline | null = null;

    get device(): Device {
        return this._device;
    }
    get renderPass(): RenderPass {
        return this._renderPass;

    }
    get layout(): VkPipelineLayout | null {
        return this._layout;

    }
    get handle(): VkPipeline | null {
        return this._handle;
    }

    constructor(
        device: Device,
        renderPass: RenderPass,
        layout: VkPipelineLayout | null,
        handle: VkPipeline | null
    ) {
        this._device = device;
        this._renderPass = renderPass;
        this._layout = layout;
        this._handle = handle;
    }

    destroy() {
        if (this._handle != null) {
            vkDestroyPipeline(
                this._device.handle,
                this._handle,
                null
            );
            this._handle = null;
        }
        if (this._layout != null) {
            vkDestroyPipelineLayout(
                this._device.handle,
                this._layout,
                null
            );
            this._layout = null;
        }
    }
}

export class PipelineOptions {
    /// <summary>
    /// Topology to use for rendering
    /// </summary>
    public Topology: VkPrimitiveTopology;
    /// <summary>
    /// Polygon mode to use for rendering
    /// </summary>
    public PolygonMode: VkPolygonMode;
    /// <summary>
    /// Culling mode to use
    /// </summary>
    public CullMode: VkCullModeFlagBits;
    /// <summary>
    /// Specifies which faces are front for back face culling
    /// </summary>
    public FrontFace: VkFrontFace;


    constructor() {
        this.Topology = VkPrimitiveTopology.VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST;
        this.PolygonMode = VkPolygonMode.VK_POLYGON_MODE_FILL;
        this.CullMode = VkCullModeFlagBits.VK_CULL_MODE_BACK_BIT;
        this.FrontFace = VkFrontFace.VK_FRONT_FACE_CLOCKWISE;
    }

    static get Default(): PipelineOptions {
        return new PipelineOptions();
    }
}


export class GraphicsPipeline extends Pipeline {

    constructor(
        device: Device,
        renderPass: RenderPass,
        layouts: DescriptorLayout[],
        shaders: ShaderModule[],
        pipelineInputBuilder: PipelineInputBuilder,
        subPass: number = 0,
        options: PipelineOptions | null = null
    ) {
        super(device, renderPass, null, null);

        if (options == null)
            options = PipelineOptions.Default;


        var setLayout: VkDescriptorSetLayout[] = [];
        for (let layout of layouts) {
            if (layout.handle != null)
                setLayout.push(layout.handle);
        }

        var pipelineLayoutInfo = new VkPipelineLayoutCreateInfo();

        //  pipelineLayoutInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_LAYOUT_CREATE_INFO;
        pipelineLayoutInfo.setLayoutCount = setLayout.length;
        pipelineLayoutInfo.pSetLayouts = setLayout;
        pipelineLayoutInfo.pushConstantRangeCount = 0;

        this._layout = new VkPipelineLayout();

        if (vkCreatePipelineLayout(
            device.handle,
            pipelineLayoutInfo,
            null,
            this._layout
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create pipeline layout");

        var bindingDescriptions = pipelineInputBuilder.BindingDescriptions;
        var attributeDescriptions = pipelineInputBuilder.AttributeDescriptions;

        console.log("DESCRIPTIUON!!!");
        console.log(bindingDescriptions);

        var vertexInputInfo = new VkPipelineVertexInputStateCreateInfo();

        vertexInputInfo.vertexBindingDescriptionCount = bindingDescriptions.length;
        vertexInputInfo.pVertexBindingDescriptions = bindingDescriptions;
        vertexInputInfo.vertexAttributeDescriptionCount = attributeDescriptions.length;
        vertexInputInfo.pVertexAttributeDescriptions = attributeDescriptions;


        var inputAssemble = new VkPipelineInputAssemblyStateCreateInfo();
        //inputAssemble.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_INPUT_ASSEMBLY_STATE_CREATE_INFO;
        inputAssemble.topology = options.Topology;
        inputAssemble.primitiveRestartEnable = false;

        var viewport = new VkViewport(); //dynamic (ignored)
        var scissor = new VkRect2D(); //dynamic (ignored)

        var viewportState = new VkPipelineViewportStateCreateInfo();
        //   viewportState.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_VIEWPORT_STATE_CREATE_INFO;
        viewportState.viewportCount = 1;
        viewportState.pViewports = [viewport];
        viewportState.scissorCount = 1;
        viewportState.pScissors = [scissor];


        var rasterizer = new VkPipelineRasterizationStateCreateInfo();

        //rasterizer.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_RASTERIZATION_STATE_CREATE_INFO;
        rasterizer.depthClampEnable = false;
        rasterizer.rasterizerDiscardEnable = false;
        rasterizer.polygonMode = options.PolygonMode;
        rasterizer.lineWidth = 1.0;
        rasterizer.cullMode = options.CullMode;
        rasterizer.frontFace = options.FrontFace;
        rasterizer.depthBiasEnable = false;


        var multisampling = new VkPipelineMultisampleStateCreateInfo();

        //multisampling.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_MULTISAMPLE_STATE_CREATE_INFO;
        multisampling.sampleShadingEnable = false;
        multisampling.rasterizationSamples = VkSampleCountFlagBits.VK_SAMPLE_COUNT_1_BIT;
        multisampling.minSampleShading = 1.0;
        multisampling.pSampleMask = null;
        multisampling.alphaToCoverageEnable = false;
        multisampling.alphaToOneEnable = false;


        let hasDepthAttachment = false;
        var colorBlendAttachments: VkPipelineColorBlendAttachmentState[] = [];
        for (var attachment of renderPass.attachments) {
            if ((attachment.imageUsageFlags & VkImageUsageFlagBits.VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT) != 0) {
                hasDepthAttachment = true;
                continue;
            }

            let colorblend = new VkPipelineColorBlendAttachmentState();
            colorblend.colorWriteMask = (
                VkColorComponentFlagBits.VK_COLOR_COMPONENT_R_BIT |
                VkColorComponentFlagBits.VK_COLOR_COMPONENT_G_BIT |
                VkColorComponentFlagBits.VK_COLOR_COMPONENT_B_BIT |
                VkColorComponentFlagBits.VK_COLOR_COMPONENT_A_BIT
            );

            colorblend.blendEnable = false;
            colorBlendAttachments.push(colorblend);
        }

        var depthStencil = new VkPipelineDepthStencilStateCreateInfo();

        //   depthStencil.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_DEPTH_STENCIL_STATE_CREATE_INFO;
        depthStencil.depthTestEnable = true;
        depthStencil.depthWriteEnable = true;
        depthStencil.depthCompareOp = VkCompareOp.VK_COMPARE_OP_LESS;
        depthStencil.depthBoundsTestEnable = false;
        depthStencil.stencilTestEnable = false;


        var colorBlending = new VkPipelineColorBlendStateCreateInfo();

        //    colorBlending.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_COLOR_BLEND_STATE_CREATE_INFO;
        colorBlending.logicOpEnable = false;
        colorBlending.logicOp = VkLogicOp.VK_LOGIC_OP_COPY;
        colorBlending.attachmentCount = colorBlendAttachments.length;
        colorBlending.pAttachments = colorBlendAttachments;
        colorBlending.blendConstants = [0.0, 0.0, 0.0, 0.0];




        var dynamicStates: VkDynamicState[] = [];
        dynamicStates.push(VkDynamicState.VK_DYNAMIC_STATE_VIEWPORT);
        dynamicStates.push(VkDynamicState.VK_DYNAMIC_STATE_SCISSOR);
        dynamicStates.push(VkDynamicState.VK_DYNAMIC_STATE_LINE_WIDTH);

        var dynamicStateInfo = new VkPipelineDynamicStateCreateInfo();
        // dynamicStateInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_DYNAMIC_STATE_CREATE_INFO;
        dynamicStateInfo.dynamicStateCount = dynamicStates.length;
        dynamicStateInfo.pDynamicStates = new Int32Array(dynamicStates);


        var shaderInfo: VkPipelineShaderStageCreateInfo[] = [];
        for (let shader of shaders) {

            if(shader.handle== null)
                throw Error("broken shader");

            let info = new VkPipelineShaderStageCreateInfo();
            //     info.sType = VkStructureType.VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO;
            info.module = shader.handle;
            info.stage = shader.typeVulkan;
            info.pName = "main";
            info.pSpecializationInfo = null;

            shaderInfo.push(info);
        }

        var pipelineInfo = new VkGraphicsPipelineCreateInfo();

    //    pipelineInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_GRAPHICS_PIPELINE_CREATE_INFO
        pipelineInfo.stageCount = shaderInfo.length;
        pipelineInfo.pStages = shaderInfo;
        pipelineInfo.pVertexInputState = vertexInputInfo;
        pipelineInfo.pInputAssemblyState = inputAssemble;
        pipelineInfo.pViewportState = viewportState;
        pipelineInfo.pRasterizationState = rasterizer;
        pipelineInfo.pMultisampleState = multisampling;
        pipelineInfo.pDepthStencilState = hasDepthAttachment ? depthStencil : null;
        pipelineInfo.pColorBlendState = colorBlending;
        pipelineInfo.pDynamicState = dynamicStateInfo;
        pipelineInfo.layout = this._layout;
        pipelineInfo.renderPass = this._renderPass.handle;
        pipelineInfo.subpass = subPass;
        pipelineInfo.basePipelineHandle = null;
        pipelineInfo.basePipelineIndex = -1;

        this._handle = new VkPipeline();


        if (vkCreateGraphicsPipelines(
            this._device.handle,
            null,
            1,
            [pipelineInfo],
            null,
            [this._handle]
        ) != VkResult.VK_SUCCESS)
            throw new Error("faield to create graphics pipeline");
    }

}