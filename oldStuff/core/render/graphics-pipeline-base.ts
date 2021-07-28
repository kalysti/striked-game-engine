import { vkCreateGraphicsPipelines, vkCreatePipelineLayout, VkExtent2D, VkGraphicsPipelineCreateInfo, VkOffset2D, VkPipeline, VkPipelineColorBlendAttachmentState, VkPipelineColorBlendStateCreateInfo, VkPipelineDynamicStateCreateInfo, VkPipelineInputAssemblyStateCreateInfo, VkPipelineLayout, VkPipelineLayoutCreateInfo, VkPipelineMultisampleStateCreateInfo, VkPipelineRasterizationStateCreateInfo, VkPipelineShaderStageCreateInfo, VkPipelineVertexInputStateCreateInfo, VkPipelineViewportStateCreateInfo, VkRect2D, VkRenderPass, VkShaderModule, VkVertexInputBindingDescription, VkViewport, VK_BLEND_FACTOR_ONE, VK_BLEND_FACTOR_ONE_MINUS_SRC_ALPHA, VK_BLEND_FACTOR_SRC_ALPHA, VK_BLEND_FACTOR_ZERO, VK_BLEND_OP_ADD, VK_COLOR_COMPONENT_A_BIT, VK_COLOR_COMPONENT_B_BIT, VK_COLOR_COMPONENT_G_BIT, VK_COLOR_COMPONENT_R_BIT, VK_CULL_MODE_BACK_BIT, VK_DYNAMIC_STATE_SCISSOR, VK_DYNAMIC_STATE_VIEWPORT, VK_FRONT_FACE_COUNTER_CLOCKWISE, VK_LOGIC_OP_NO_OP, VK_POLYGON_MODE_FILL, VK_PRIMITIVE_TOPOLOGY_TRIANGLE_LIST, VK_SAMPLE_COUNT_1_BIT, VK_SHADER_STAGE_FRAGMENT_BIT, VK_SHADER_STAGE_VERTEX_BIT, VK_SUCCESS, VK_VERTEX_INPUT_RATE_VERTEX } from "vulkan-api/generated/1.2.162/win32";
import { UIWindow } from "../components/window/ui-window";
import { Cube } from "../objects/cube";
import { DescriptorSetLayout } from "./desc-set-layout";
import { Renderer } from "./renderer";
import { LogicalDevice } from "./logical-device";

export abstract class GraphicsPipelineBase {

    protected pipelineLayout: VkPipelineLayout = new VkPipelineLayout();
    protected _pipeline: VkPipeline = new VkPipeline();

    getLayout(): VkPipelineLayout {
        return this.pipelineLayout;
    }

    getPipeline(): VkPipeline {
        return this._pipeline;
    }

}