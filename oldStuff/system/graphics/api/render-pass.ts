import { VkAccessFlagBits, VkAttachmentDescription, VkAttachmentLoadOp, VkAttachmentReference, VkAttachmentStoreOp, vkCreateRenderPass, vkDestroyRenderPass, VkFormat, VkImage, VkImageAspectFlagBits, VkImageLayout, VkImageUsageFlagBits, VkPipelineBindPoint, VkPipelineStageFlagBits, VkRenderPass, VkRenderPassCreateInfo, VkResult, VkSampleCountFlagBits, VkStructureType, VkSubpassDependency, VkSubpassDescription, VK_DEPENDENCY_BY_REGION_BIT, VK_SUBPASS_EXTERNAL } from "vulkan-api/generated/1.2.162/win32";
import { Device } from "./device";

export class RenderPass {

    public device: Device;
    public handle: VkRenderPass | null = null;
    public attachments: RenderPassAttachment[];
    public subPassInfo: RenderPassSubPass[];

    constructor(_device: Device, _attachments: RenderPassAttachment[], _subPasses: RenderPassSubPass[]) {

        // update depth format to one that this device supports
        var correctDepthFormat = _device.FindDepthFormat;
        for (let i = 0; i < _attachments.length; i++) {
            if (_attachments[i].format == RenderPassDefaultDepth.format) {
                _attachments[i] = new RenderPassAttachment
                    (
                        correctDepthFormat,
                        _attachments[i].clear,
                        _attachments[i].store,
                        _attachments[i].initialLayout,
                        _attachments[i].finalLayout,
                        _attachments[i].imageUsageFlags,
                        _attachments[i].imageAspectFlags
                    );
            }
        }

        this.device = _device;
        this.attachments = _attachments;
        this.subPassInfo = _subPasses;

        //setup attachments
        var attachmentDescriptions: VkAttachmentDescription[] = [];
        for (let attachment of _attachments) {
            let attachDesc = new VkAttachmentDescription();
            attachDesc.format = attachment.format;
            attachDesc.samples = VkSampleCountFlagBits.VK_SAMPLE_COUNT_1_BIT;
            attachDesc.loadOp = (
                attachment.clear ?
                    VkAttachmentLoadOp.VK_ATTACHMENT_LOAD_OP_CLEAR :
                    VkAttachmentLoadOp.VK_ATTACHMENT_LOAD_OP_LOAD
            );
            attachDesc.storeOp = (
                attachment.store ?
                    VkAttachmentStoreOp.VK_ATTACHMENT_STORE_OP_STORE :
                    VkAttachmentStoreOp.VK_ATTACHMENT_STORE_OP_DONT_CARE
            );
            attachDesc.stencilLoadOp = VkAttachmentLoadOp.VK_ATTACHMENT_LOAD_OP_DONT_CARE;
            attachDesc.stencilStoreOp = VkAttachmentStoreOp.VK_ATTACHMENT_STORE_OP_DONT_CARE;
            attachDesc.initialLayout = attachment.initialLayout;
            attachDesc.finalLayout = attachment.finalLayout;

            attachmentDescriptions.push(attachDesc);
        }

        //setup subpasses
        var subPassInfos: VkSubpassDescription[] = [];
        var dependencies: VkSubpassDependency[] = [];
        var colorAttachmentRefs: any[] = [];
        var depthAttachmentRefs: VkAttachmentReference[] = [];

        for (let subpass of _subPasses) {
            var colorAttachmentRef: VkAttachmentReference[] = [];
            for (let i = 0; i < subpass.ColorAttachments.length; i++) {
                var colorAttachmentIndex = subpass.ColorAttachments[i];

                var ref = new VkAttachmentReference();
                ref.attachment = colorAttachmentIndex;
                ref.layout = _attachments[colorAttachmentIndex].finalLayout;

                colorAttachmentRef.push(ref);
            }

            colorAttachmentRefs.push(colorAttachmentRef);

            var depthAttachment: VkAttachmentReference | null = null;
            if (subpass.DepthAttachments != null) {

                var depthAttachmentRef = new VkAttachmentReference();
                depthAttachmentRef.attachment = subpass.DepthAttachments;
                depthAttachmentRef.layout = _attachments[subpass.DepthAttachments].finalLayout;

                depthAttachmentRefs.push(depthAttachmentRef);
                depthAttachment = depthAttachmentRef;
            }



            let subPassDesc = new VkSubpassDescription();
            subPassDesc.pipelineBindPoint = subpass.BindPoint;
            subPassDesc.colorAttachmentCount = colorAttachmentRef.length;
            subPassDesc.pColorAttachments = colorAttachmentRef;
            subPassDesc.pDepthStencilAttachment = depthAttachment;

            subPassInfos.push(subPassDesc);

            let dep = new VkSubpassDependency();
            dep.srcSubpass = 0; // VK_SUBPASS_EXTERNAL
            dep.dstSubpass = 0;
            dep.dependencyFlags = VK_DEPENDENCY_BY_REGION_BIT;
            dep.srcStageMask = (
                VkPipelineStageFlagBits.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT |
                VkPipelineStageFlagBits.VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT
            );
            dep.srcAccessMask = 0; 
            dep.dstStageMask = (
                VkPipelineStageFlagBits.VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT |
                VkPipelineStageFlagBits.VK_PIPELINE_STAGE_EARLY_FRAGMENT_TESTS_BIT
            );
            dep.dstAccessMask = subpass.DepthAttachments != null ? (
                VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT |
                VkAccessFlagBits.VK_ACCESS_DEPTH_STENCIL_ATTACHMENT_WRITE_BIT
            ) : VkAccessFlagBits.VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT;
            console.log("dstAccessMask!!!!: " +  dep.dstAccessMask );

            dependencies.push(dep);

        }

        var renderPassInfo = new VkRenderPassCreateInfo();
        //  renderPassInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_RENDER_PASS_CREATE_INFO;
        renderPassInfo.attachmentCount = attachmentDescriptions.length;
        renderPassInfo.pAttachments = attachmentDescriptions;

        renderPassInfo.subpassCount = subPassInfos.length;
        renderPassInfo.pSubpasses = subPassInfos;

        renderPassInfo.dependencyCount = dependencies.length;
        renderPassInfo.pDependencies = dependencies;

        this.handle = new VkRenderPass();
        if (vkCreateRenderPass(
            _device.handle,
            renderPassInfo,
            null,
            this.handle
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to create render pass");
    }

    destroy() {
        if (this.handle != null) {
            vkDestroyRenderPass(
                this.device.handle,
                this.handle,
                null
            );
            this.handle = null;
        }
    }
}

export class RenderPassSubPass {

    BindPoint: VkPipelineBindPoint;
    ColorAttachments: number[] = [];
    DepthAttachments: number | null = null;

    constructor(
        _bindPoint: VkPipelineBindPoint,
        _colorAttachments: number[],
        _depthAttachments: number | null = null
    ) {
        this.BindPoint = _bindPoint;
        this.ColorAttachments = _colorAttachments;
        this.DepthAttachments = _depthAttachments;
    }

}

export class RenderPassAttachment {
    format: VkFormat;
    clear: boolean;
    store: boolean;
    initialLayout: VkImageLayout;
    finalLayout: VkImageLayout;
    imageUsageFlags: VkImageUsageFlagBits;
    imageAspectFlags: VkImageAspectFlagBits;

    constructor(_format: VkFormat, _clear: boolean, _store: boolean, _initLayout:
        VkImageLayout, _finalLayout: VkImageLayout, _imageUsageFlags: VkImageUsageFlagBits,
        _imageAspectFlags: VkImageAspectFlagBits) {
        this.format = _format;
        this.clear = _clear;
        this.store = _store;
        this.initialLayout = _initLayout;
        this.finalLayout = _finalLayout;
        this.imageUsageFlags = _imageUsageFlags;
        this.imageAspectFlags = _imageAspectFlags;
    }
}

export var RenderPassDefault = new RenderPassAttachment(VkFormat.VK_FORMAT_R32G32B32A32_SFLOAT,
    true,
    true,
    VkImageLayout.VK_IMAGE_LAYOUT_UNDEFINED,
    VkImageLayout.VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL,
    (
        VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_DST_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_SRC_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_SAMPLED_BIT
    ),
    VkImageAspectFlagBits.VK_IMAGE_ASPECT_COLOR_BIT);

export var RenderPassDefaultDepth = new RenderPassAttachment(VkFormat.VK_FORMAT_D32_SFLOAT,
    true,
    true,
    VkImageLayout.VK_IMAGE_LAYOUT_UNDEFINED,
    VkImageLayout.VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL,
    (
        VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_SRC_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_TRANSFER_DST_BIT |
        VkImageUsageFlagBits.VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT
    ),
    VkImageAspectFlagBits.VK_IMAGE_ASPECT_DEPTH_BIT
);
