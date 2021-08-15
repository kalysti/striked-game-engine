import { GraphicsModule, RenderableRenderer } from '@engine/modules';
import { RenderableNode } from '@engine/nodes';
import { Bindable, BindInterfaceType, RenderModule, RenderTopology } from '@engine/nodes/renderable';
import { MeshData2D, MeshDataIndicies, Texture2D } from '@engine/resources/2d';
import { Vector2D } from '@engine/types';
import {
    VK_COMPARE_OP_LESS_OR_EQUAL,
    VK_CULL_MODE_NONE,
    VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
    VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_FORMAT_R32G32B32A32_SFLOAT, VK_FORMAT_R32G32_SFLOAT, VK_FRONT_FACE_COUNTER_CLOCKWISE,
    VK_LOGIC_OP_NO_OP, VK_SHADER_STAGE_FRAGMENT_BIT,
    VK_SHADER_STAGE_VERTEX_BIT
} from 'vulkan-api';



@RenderModule({
    shaders: ['./shaders/sprite.frag', './shaders/sprite.vert'],
    colorBlend: { blendEnable: true, logicOp: VK_LOGIC_OP_NO_OP },
    depthStencil: {
        testEnable: true,
        testWriteEnable: true,
        compareOp: VK_COMPARE_OP_LESS_OR_EQUAL,
        maxBounds: 1.0,
    },
    topology: RenderTopology.TRINAGLE_LIST,
    rasterize: {
        cullMode: VK_CULL_MODE_NONE,
        frontFace: VK_FRONT_FACE_COUNTER_CLOCKWISE,
    },
    descriptors: [
        {
            bind: 0,
            type: VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
            flags: VK_SHADER_STAGE_VERTEX_BIT,
        }, {
            bind: 1,
            type: VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
            flags: VK_SHADER_STAGE_VERTEX_BIT,
        },
        {
            bind: 2,
            type: VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER,
            flags: VK_SHADER_STAGE_FRAGMENT_BIT,
        }
    ],
    vertexDesc: [
        {
            bind: 0,
            list: [
                VK_FORMAT_R32G32_SFLOAT,
                VK_FORMAT_R32G32_SFLOAT,
                VK_FORMAT_R32G32B32A32_SFLOAT,
            ],
        }
    ]
})
export class Sprite2D extends RenderableNode {

    @Bindable(BindInterfaceType.UNIFORM, 0)
    get extentEntity() {
        return GraphicsModule.mainWindow.extentEntity;
    };

    @Bindable(BindInterfaceType.UNIFORM, 1)
    _position: Vector2D = Vector2D.Zero;

    get position() {
        return this._position;
    }


    set position(pos: Vector2D) {
        this._position.x = pos.x;
        this._position.y = pos.y;
        GraphicsModule.setIsDirty(this.position);
    }

    @Bindable(BindInterfaceType.TEXTURE, 2)
    texture: Texture2D;

    @Bindable(BindInterfaceType.VERTEX, 0)
    meshDataEntity: MeshData2D = new MeshData2D();

    @Bindable(BindInterfaceType.INDEX, 0)
    meshDataIndex: MeshDataIndicies = new MeshDataIndicies([0, 1, 3, 3, 1, 2]);

    constructor() {
        super();
    }

    onRender(renderer: RenderableRenderer) {
        renderer.bindIndex(this.meshDataIndex);
        renderer.bindVertex(this.meshDataEntity);
        renderer.drawIndexed(this.meshDataIndex.indexes.length, 0);
    }

}
