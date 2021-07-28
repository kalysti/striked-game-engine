import { ASSERT_VK_RESULT } from '../test.helpers';
import { VkCommandPool, VkCommandPoolCreateInfo, vkCreateCommandPool, VkDevice } from 'vulkan-api';
export class CommandPool {

    private cmdPool: VkCommandPool = new VkCommandPool();
    private device: VkDevice;
    constructor(device: VkDevice) {
        this.device = device;
        this.createPool();
    }

    get handle() {
        return this.cmdPool;
    }

    createPool() {

        let cmdPoolInfo = new VkCommandPoolCreateInfo();
        cmdPoolInfo.flags = 0;
        cmdPoolInfo.queueFamilyIndex = 0;

        let result = vkCreateCommandPool(this.device, cmdPoolInfo, null, this.cmdPool);
        ASSERT_VK_RESULT(result);
    }

}