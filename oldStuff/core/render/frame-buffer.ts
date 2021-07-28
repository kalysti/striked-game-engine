import { VkFramebuffer, VkFramebufferCreateInfo, vkCreateFramebuffer, VK_SUCCESS, vkDestroyFramebuffer, VkDevice } from "vulkan-api/generated/1.2.162/win32";
import { UIWindow } from "../components/window/ui-window";
import { LogicalDevice } from "./logical-device";
import { RenderPass } from "./render-pass";
import { SwapchainImageView } from "./swapchain-imageview";


export class FrameBuffer {
    framebuffers: VkFramebuffer[] = [];

    destroy(_device: VkDevice, imageAmount: number) {
        for (let ii = 0; ii < imageAmount; ++ii) {
            vkDestroyFramebuffer(_device, this.framebuffers[ii], null);
        };
        this.framebuffers = [];
    }

    create(_device: LogicalDevice, _renderPass: RenderPass, _swapchainview: SwapchainImageView, _window: UIWindow) {
        this.framebuffers = [...Array(_swapchainview.getCount())].map(() => new VkFramebuffer());
        for (let ii = 0; ii < _swapchainview.getCount(); ++ii) {
            let framebufferInfo = new VkFramebufferCreateInfo();
            framebufferInfo.renderPass = _renderPass.getRenderPass();
            framebufferInfo.attachmentCount = 1;
            let views = _swapchainview.getViews();
            framebufferInfo.pAttachments = [views[ii]];
            framebufferInfo.width = _window.getWindow().width;
            framebufferInfo.height = _window.getWindow().height;
            framebufferInfo.layers = 1;
            let result = vkCreateFramebuffer(_device.getDevice(), framebufferInfo, null, this.framebuffers[ii]);

            if (result !== VK_SUCCESS)
                throw new Error(`Vulkan assertion failed!`);
        };
    }
}