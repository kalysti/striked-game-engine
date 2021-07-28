import { VkDescriptorType, VkPipelineBindPoint, VkShaderStageFlagBits } from "vulkan-api/generated/1.2.162/win32";
import { BaseModule } from "../core/base.module";
import { CommandBufferService } from "./api/command-service";
import { DescriptorBindingInfo, DescriptorLayout } from "./api/desc-layout";
import { GraphicsService } from "./api/graphics-service";
import { NativeWindow } from "./api/native-window";
import { RenderPass, RenderPassAttachment, RenderPassDefault, RenderPassDefaultDepth, RenderPassSubPass } from "./api/render-pass";
import { SystemWindow } from "./SystemWindow";

export class GraphicsModule extends BaseModule {

    private _graphicsService: GraphicsService;
    private _commandBufferService: CommandBufferService;
    private _descriptorLayouts: Map<string, DescriptorLayout> = new Map<string, DescriptorLayout>();
    public renderPasses: Map<string, RenderPass> = new Map<string, RenderPass>();

    override update(delta: number) {
  
    }

    get CommandBufferService(): CommandBufferService {
        return this._commandBufferService;
    }

    set CommandBufferService(val: CommandBufferService) {
        this._commandBufferService = val;
    }

    get graphicsService(): GraphicsService {
        return this._graphicsService;
    }

    set graphicsService(val: GraphicsService) {
        this._graphicsService = val;
    }

    get descriptorLayouts(): Map<string, DescriptorLayout> {
        return this._descriptorLayouts;
    }

    set descriptorLayouts(val: Map<string, DescriptorLayout>) {
        this._descriptorLayouts = val;
    }

    constructor() {
        super();

        this._graphicsService = new GraphicsService();
        this._commandBufferService = new CommandBufferService(this._graphicsService.PrimaryDevice);

        this.InitDescriptorLayouts();
        this.InitRenderPasses();
    }

    private InitRenderPasses() {
        this.renderPasses.set('_MRT', new RenderPass(
            this._graphicsService.PrimaryDevice,
            [
                RenderPassDefault,//albedo
                RenderPassDefault,//normal
                RenderPassDefault,//position
                RenderPassDefault,//detail
                RenderPassDefaultDepth//depth
            ],
            [
                new RenderPassSubPass
                    (
                        VkPipelineBindPoint.VK_PIPELINE_BIND_POINT_GRAPHICS,
                        [
                            0, 1, 2, 3
                        ],
                        4
                    )
            ]
        ));



        this.renderPasses.set('_DEFFERED', new RenderPass(
            this._graphicsService.PrimaryDevice,
            [
                RenderPassDefault,
            ],
            [
                new RenderPassSubPass
                    (
                        VkPipelineBindPoint.VK_PIPELINE_BIND_POINT_GRAPHICS,
                        [
                            0
                        ]
                    )
            ]
        ));

        this.renderPasses.set('_LIGHT', new RenderPass(
            this._graphicsService.PrimaryDevice,
            [
                RenderPassDefault,
            ],
            [
                new RenderPassSubPass
                    (
                        VkPipelineBindPoint.VK_PIPELINE_BIND_POINT_GRAPHICS,
                        [
                            0
                        ]
                    )
            ]
        ));


    }

    private InitDescriptorLayouts() {

        this._descriptorLayouts.set('_PROJECTION', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT,
                )
            ]
        ));

        this._descriptorLayouts.set('_VIEW', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT,
                )
            ]
        ));


        this._descriptorLayouts.set('_MODEL', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT,
                )
            ]
        ));

        this._descriptorLayouts.set('_MRT', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                //albedo
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT,
                ),
                //normal
                new DescriptorBindingInfo(
                    1,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT,
                ),
                //position
                new DescriptorBindingInfo(
                    2,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT,
                ),
                //detail
                new DescriptorBindingInfo(
                    3,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT,
                )
            ]
        ));

        this._descriptorLayouts.set('_CAMERA', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT,
                )
            ]
        ));

        this._descriptorLayouts.set('_LIGHT', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT,
                )
            ]
        ));

        this._descriptorLayouts.set('_UI', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                    1,
                    (VkShaderStageFlagBits.VK_SHADER_STAGE_VERTEX_BIT | VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT),
                )
            ]
        ));

        this._descriptorLayouts.set('_UI_TEXTURE', new DescriptorLayout(
            this._graphicsService.PrimaryDevice,
            [
                new DescriptorBindingInfo(
                    0,
                    VkDescriptorType.VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
                    1,
                    VkShaderStageFlagBits.VK_SHADER_STAGE_FRAGMENT_BIT ,
                )
            ]
        ));
    }
}