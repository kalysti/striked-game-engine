import { ASSERT_VK_RESULT } from '../utils/helpers';
import { VkCommandPool, VkCommandPoolCreateInfo, vkCreateCommandPool, vkDestroyCommandPool, vkDestroyFramebuffer, VkDevice } from 'vulkan-api';
import { RenderElement } from './render.element';
import { LogicalDevice } from './logical.device';

export class CommandPool extends RenderElement {

    private cmdPool: VkCommandPool = new VkCommandPool();
    constructor(device: LogicalDevice) {
        super(device);
        this.create();
    }

    get handle() {
        return this.cmdPool;
    }

    protected onDestroy() {
        vkDestroyCommandPool(this.device.handle, this.cmdPool, null);
    }

    protected onCreate() {

        this.cmdPool = new VkCommandPool();
        let cmdPoolInfo = new VkCommandPoolCreateInfo();
        cmdPoolInfo.flags = 0;
        cmdPoolInfo.queueFamilyIndex = 0;

        let result = vkCreateCommandPool(this.device.handle, cmdPoolInfo, null, this.cmdPool);
        ASSERT_VK_RESULT(result);
    }

}