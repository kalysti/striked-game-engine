import { VkCommandBufferLevel, VkPipelineStageFlagBits, VkPresentInfoKHR, VkQueue, VkQueueFlagBits, vkQueuePresentKHR, VkResult, VkSemaphore, VkStructureType, VkSwapchainKHR } from "vulkan-api/generated/1.2.162/win32";
import { CommandBuffer } from "./command-buffer";
import { CommandPool } from "./command-pool";
import { Device } from "./device";
import { QueueFamily } from "./queue-family";
import { Semaphore } from "./semaphore";
import { Swapchain } from "./swapchain";

export enum CommandType {
    Primary = 0,
    Secondary = 1
};


export class CommandBufferService {
    private _device: Device;
    private _queueFamilies: Map<VkQueueFlagBits, QueueFamily> = new Map<VkQueueFlagBits, QueueFamily>();
    private _commandPools: Map<VkQueueFlagBits, CommandPool> = new Map<VkQueueFlagBits, CommandPool>();
    private _queueCounter: number = 0;

    constructor(device: Device) {
        this._device = device;
        //setup different types of queue families

        if (device.GraphicsQueueFamily != null)
            this._queueFamilies.set(VkQueueFlagBits.VK_QUEUE_GRAPHICS_BIT, device.GraphicsQueueFamily);
        if (device.ComputeQueueFamily != null)
            this._queueFamilies.set(VkQueueFlagBits.VK_QUEUE_COMPUTE_BIT, device.ComputeQueueFamily);
        if (device.TransferQueueFamily != null)
            this._queueFamilies.set(VkQueueFlagBits.VK_QUEUE_TRANSFER_BIT, device.TransferQueueFamily);

        //setup command pools for each queue family
        for (let [key, value] of this._queueFamilies) {
            this._commandPools.set(key, new CommandPool(value));
        }
    }

    public GetNewCommand(
        queueType: VkQueueFlagBits,
        commandType: CommandType
    ): CommandBuffer {
        var type = VkCommandBufferLevel.VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        if (commandType == CommandType.Secondary)
            type = VkCommandBufferLevel.VK_COMMAND_BUFFER_LEVEL_SECONDARY;

        let pool = this._commandPools.get(queueType);

        if (pool == undefined)
            throw new Error("No pool found");

        return new CommandBuffer(pool, type);
    }

    private GetQueue(queueFamily: QueueFamily): VkQueue {
        if (queueFamily.queues == null || queueFamily.queues.length == 0)
            throw new Error("queue family does not contain any queues");

        if (this._queueCounter >= queueFamily.queues.length)
            this._queueCounter = 0;

        var queue = queueFamily.queues[this._queueCounter];
        this._queueCounter++;
        return queue;
    }

    public SubmitSingle(command: CommandBuffer,
        signalSemaphores: Semaphore[] | null = null,
        waitSemaphores: Semaphore[] | null = null) {

        this.Submit([command], signalSemaphores, waitSemaphores);
    }

    public Submit(
        commands: CommandBuffer[],
        signalSemaphores: Semaphore[] | null = null,
        waitSemaphores: Semaphore[] | null = null,
    ): void {
        //make sure atleast one command is passed
        if (commands.length == 0) return;

        //get a free device queue
        var queue = this.GetQueue(commands[0].CommandPool.QueueFamily);

        //submit command to queue
        CommandBuffer.SubmitCommands(
            commands,
            queue,
            signalSemaphores,
            waitSemaphores,
            VkPipelineStageFlagBits.VK_PIPELINE_STAGE_TOP_OF_PIPE_BIT
        );
    }


    public Present(
        swapchain: Swapchain,
        imageIndex: number = 0,
        waitSemaphores: Semaphore[] | null = null
    ): void {
        var semaphores: VkSemaphore[] = [];
        if (waitSemaphores != null) {
            for (let s of waitSemaphores) {
                if (s.handle == null)
                    throw Error("No handle found for swapchain");
                semaphores.push(s.handle);
            }
        }

        if (swapchain.handle == null)
            throw Error("No handle found for swapchain");

        var presentInfo = new VkPresentInfoKHR();
       // presentInfo.sType = VkStructureType.VK_STRUCTURE_TYPE_PRESENT_INFO_KHR;
        presentInfo.swapchainCount = 1;
        presentInfo.waitSemaphoreCount = semaphores.length;
        presentInfo.pImageIndices = new Uint32Array([imageIndex]);
        presentInfo.pWaitSemaphores = semaphores;
        presentInfo.pSwapchains = [swapchain.handle];
        presentInfo.pResults = null;

        //get a free device queue
        var queue = this.GetQueue(swapchain.PresentQueueFamily);

        if (vkQueuePresentKHR(
            queue,
            presentInfo
        ) != VkResult.VK_SUCCESS)
            throw new Error("failed to present swapchain image");
    }
}