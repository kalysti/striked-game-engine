import { VkAttachmentDescription, VkAttachmentReference, vkCreateRenderPass, vkDestroyRenderPass, VkDevice, vkEnumeratePhysicalDevices, vkGetDeviceQueue, vkGetPhysicalDeviceFeatures, vkGetPhysicalDeviceMemoryProperties, vkGetPhysicalDeviceProperties, vkGetPhysicalDeviceQueueFamilyProperties, vkGetPhysicalDeviceSurfaceCapabilitiesKHR, vkGetPhysicalDeviceSurfaceFormatsKHR, vkGetPhysicalDeviceSurfacePresentModesKHR, vkGetPhysicalDeviceSurfaceSupportKHR, VkInstance, VkPhysicalDevice, VkPhysicalDeviceFeatures, VkPhysicalDeviceMemoryProperties, VkPhysicalDeviceProperties, VkQueue, VkQueueFamilyProperties, VkRenderPass, VkRenderPassCreateInfo, VkSubpassDependency, VkSubpassDescription, VkSurfaceCapabilitiesKHR, VkSurfaceFormatKHR, VkSurfaceKHR, VK_ACCESS_COLOR_ATTACHMENT_READ_BIT, VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT, VK_ATTACHMENT_LOAD_OP_CLEAR, VK_ATTACHMENT_LOAD_OP_DONT_CARE, VK_ATTACHMENT_STORE_OP_DONT_CARE, VK_ATTACHMENT_STORE_OP_STORE, VK_FORMAT_B8G8R8A8_UNORM, VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL, VK_IMAGE_LAYOUT_PRESENT_SRC_KHR, VK_IMAGE_LAYOUT_UNDEFINED, VK_PIPELINE_BIND_POINT_GRAPHICS, VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT, VK_SAMPLE_COUNT_1_BIT, VK_SUBPASS_EXTERNAL, VK_SUCCESS } from "vulkan-api/generated/1.2.162/win32";

export class RenderPass {

    protected renderPass: VkRenderPass = new VkRenderPass();

    create(_device: VkDevice) {
        let attachmentDescription = new VkAttachmentDescription();
        attachmentDescription.flags = 0;
        attachmentDescription.format = VK_FORMAT_B8G8R8A8_UNORM;
        attachmentDescription.samples = VK_SAMPLE_COUNT_1_BIT;
        attachmentDescription.loadOp = VK_ATTACHMENT_LOAD_OP_CLEAR;
        attachmentDescription.storeOp = VK_ATTACHMENT_STORE_OP_STORE;
        attachmentDescription.stencilLoadOp = VK_ATTACHMENT_LOAD_OP_DONT_CARE;
        attachmentDescription.stencilStoreOp = VK_ATTACHMENT_STORE_OP_DONT_CARE;
        attachmentDescription.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        attachmentDescription.finalLayout = VK_IMAGE_LAYOUT_PRESENT_SRC_KHR;
      
        let attachmentReference = new VkAttachmentReference();
        attachmentReference.attachment = 0;
        attachmentReference.layout = VK_IMAGE_LAYOUT_COLOR_ATTACHMENT_OPTIMAL;
      
        let subpassDescription = new VkSubpassDescription();
        subpassDescription.pipelineBindPoint = VK_PIPELINE_BIND_POINT_GRAPHICS;
        subpassDescription.inputAttachmentCount = 0;
        subpassDescription.pInputAttachments = null;
        subpassDescription.colorAttachmentCount = 1;
        subpassDescription.pColorAttachments = [attachmentReference];
        subpassDescription.pResolveAttachments = null;
        subpassDescription.pDepthStencilAttachment = null;
        subpassDescription.preserveAttachmentCount = 0;
        subpassDescription.pPreserveAttachments = null;
      
        let subpassDependency = new VkSubpassDependency();
        subpassDependency.srcSubpass = 0;
        subpassDependency.dstSubpass = 0;
        subpassDependency.srcStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
        subpassDependency.dstStageMask = VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT;
        subpassDependency.srcAccessMask = 0;
        subpassDependency.dstAccessMask = (
          VK_ACCESS_COLOR_ATTACHMENT_READ_BIT |
          VK_ACCESS_COLOR_ATTACHMENT_WRITE_BIT
        );
        console.log("dstAccessMask!!!!: " + subpassDependency.dstAccessMask);

        subpassDependency.dependencyFlags = 0;
      
        let renderPassInfo = new VkRenderPassCreateInfo();
        renderPassInfo.attachmentCount = 1;
        renderPassInfo.pAttachments = [attachmentDescription];
        renderPassInfo.subpassCount = 1;
        renderPassInfo.pSubpasses = [subpassDescription];
        renderPassInfo.dependencyCount = 1;
        renderPassInfo.pDependencies = [subpassDependency];
      
        let result = vkCreateRenderPass(_device, renderPassInfo, null, this.renderPass);
               
        if (result !== VK_SUCCESS)
            throw new Error(`Vulkan assertion failed!`);
    }
    getRenderPass(): VkRenderPass{
      return this.renderPass;
    }
    
    destroy(device: VkDevice){
      vkDestroyRenderPass(device, this.renderPass, null);
    }
}