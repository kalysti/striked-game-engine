import { VkFormat, VkVertexInputAttributeDescription, VkVertexInputBindingDescription, VkVertexInputRate } from "vulkan-api/generated/1.2.162/win32";

export enum FormatType {
    /// <summary>
    /// 32-bit Float X 1
    /// </summary>
    Float1,
    /// <summary>
    /// 32-bit Float X 2
    /// </summary>
    Float2,
    /// <summary>
    /// 32-bit Float X 3
    /// </summary>
    Float3,
    /// <summary>
    /// 32-bit Float X 4
    /// </summary>
    Float4,
    /// <summary>
    /// 8-bit byte X 2
    /// </summary>
    Byte2Norm,
    /// <summary>
    /// 8-bit byte X 2
    /// </summary>
    Byte2,
    /// <summary>
    /// 8-bit signed byte X 2
    /// </summary>
    SByte2,
    /// <summary>
    /// 8-bit byte X 4
    /// </summary>
    Byte4Norm,
    /// <summary>
    /// 8-bit byte X 4
    /// </summary>
    Byte4,
    /// <summary>
    /// 8-bit signed byte X 4
    /// </summary>
    SByte4Norm,
    /// <summary>
    /// 8-bit signed byte X 4
    /// </summary>
    SByte4,
    /// <summary>
    /// 16-bit unsigned short X 2
    /// </summary>
    UShort2Norm,
    /// <summary>
    /// 16-bit unsigned short X 2
    /// </summary>
    UShort2,
    /// <summary>
    /// 16-bit unsigned short X 4
    /// </summary>
    UShort4Norm,
    /// <summary>
    /// 16-bit unsigned short X 4
    /// </summary>
    UShort4,
    /// <summary>
    /// 16-bit short X 4
    /// </summary>
    Short2Norm,
    /// <summary>
    /// 16-bit short X 4
    /// </summary>
    Short4,
    /// <summary>
    /// 32-bit uint X 1
    /// </summary>
    UInt1,
    /// <summary>
    /// 32-bit uint X 2
    /// </summary>
    UInt2,
    /// <summary>
    /// 32-bit uint X 3
    /// </summary>
    UInt3,
    /// <summary>
    /// 32-bit uint X 4
    /// </summary>
    UInt4,
    /// <summary>
    /// 32-bit int X 1
    /// </summary>
    Int1,
    /// <summary>
    /// 32-bit int X 2
    /// </summary>
    Int2,
    /// <summary>
    /// 32-bit int X 3
    /// </summary>
    Int3,
    /// <summary>
    /// 32-bit int X 4
    /// </summary>
    Int4
}
export class AttributeElement {



    private _size: number;
    private _vulkanFormat: VkFormat;

    get VulkanFormat(): VkFormat {
        return this._vulkanFormat;
    }
    get Size(): number {
        return this._size;
    }

    constructor(format: FormatType) {
        switch (format) {
            case FormatType.Float1:
                this._size = 4 * 1;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32_SFLOAT;
                break;
            case FormatType.Float2:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32_SFLOAT;
                break;
            case FormatType.Float3:
                this._size = 4 * 3;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32B32_SFLOAT;
                break;
            case FormatType.Float4:
                this._size = 4 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32B32A32_SFLOAT;
                break;
            case FormatType.Byte2Norm:
                this._size = 1 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8_SNORM;
                break;
            case FormatType.Byte2:
                this._size = 1 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8_UNORM;
                break;
            case FormatType.SByte2:
                this._size = 1 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8_SINT;
                break;
            case FormatType.Byte4Norm:
                this._size = 1 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8B8A8_UNORM;
                break;
            case FormatType.Byte4:
                this._size = 1 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8B8A8_UINT;
                break;
            case FormatType.SByte4Norm:
                this._size = 1 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8B8A8_SNORM;
                break;
            case FormatType.SByte4:
                this._size = 1 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R8G8B8A8_SINT;
                break;
            case FormatType.UShort2Norm:
                this._size = 2 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R16G16_UNORM;
                break;
            case FormatType.UShort2:
                this._size = 2 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R16G16_UINT;
                break;
            case FormatType.Short2Norm:
                this._size = 2 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R16G16B16A16_SNORM;
                break;
            case FormatType.UShort4Norm:
                this._size = 2 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R16G16B16A16_UNORM;
                break;
            case FormatType.UShort4:
                this._size = 2 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R16G16B16A16_UINT;
                break;
            case FormatType.Short4:
                this._size = 2 * 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R16G16B16A16_SINT;
                break;
            case FormatType.UInt1:
                this._size = 4;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32_UINT;
                break;
            case FormatType.UInt2:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32_UINT;
                break;
            case FormatType.UInt3:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32B32_UINT;
                break;
            case FormatType.UInt4:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32B32A32_UINT;
                break;
            case FormatType.Int1:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32_SINT;
                break;
            case FormatType.Int2:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32_SINT;
                break;
            case FormatType.Int3:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32B32_SINT;
                break;
            case FormatType.Int4:
                this._size = 4 * 2;
                this._vulkanFormat = VkFormat.VK_FORMAT_R32G32B32A32_SINT;
                break;

            default:
                throw new Error("Not supported size");
        }
    }
}

export enum BindingType {
    Vertex,
    Instance
}

export class BindingElement {

    public Type: BindingType;

    public Elements: AttributeElement[];

    public get Size(): number {
        let size: number = 0;
        for (let e of this.Elements)
            size += e.Size;
        return size;
    }

    constructor(elements: AttributeElement[], bindingType: BindingType) {
        this.Elements = elements;
        this.Type = bindingType;
    }
}

export class PipelineInputBuilder {


    public Bindings: BindingElement[] = [];


    constructor(bindings: BindingElement[] = []) {
        this.Bindings = bindings;
    }

    get BindingDescriptions(): VkVertexInputBindingDescription[] {

        var bindingDescriptions: VkVertexInputBindingDescription[] = [];
        for (let i = 0; i < this.Bindings.length; i++) {
            let type: VkVertexInputRate | null = null;
            if (this.Bindings[i].Type == BindingType.Vertex)
                type = VkVertexInputRate.VK_VERTEX_INPUT_RATE_VERTEX;
            else if (this.Bindings[i].Type == BindingType.Instance)
                type = VkVertexInputRate.VK_VERTEX_INPUT_RATE_INSTANCE;
            else
                throw new Error("Not supported");

            let info = new VkVertexInputBindingDescription();

            info.binding = i;
            info.stride = this.Bindings[i].Size;
            info.inputRate = type;

            bindingDescriptions.push(info);
        }

        return bindingDescriptions;
    }


    get AttributeDescriptions(): VkVertexInputAttributeDescription[] {

        var attributeDescriptions: VkVertexInputAttributeDescription[] = []
        let location = 0;
        for (let i = 0; i < this.Bindings.length; i++) {
            let offset = 0;
            for (let j = 0; j < this.Bindings[i].Elements.length; j++) {
                var element = this.Bindings[i].Elements[j];

                let push = new VkVertexInputAttributeDescription();

                push.binding = i;
                push.format = element.VulkanFormat;
                push.location = location;
                push.offset = offset;

                attributeDescriptions.push(push);
                offset += element.Size;
                location++;
            }
        }
        
        return attributeDescriptions;
    }


}