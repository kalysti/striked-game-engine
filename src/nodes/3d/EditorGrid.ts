import { RenderableNode } from '@engine/nodes';
import { Bindable, BindInterfaceType, RenderModule, RenderTopology } from '@engine/nodes/renderable';
import { VK_COMPARE_OP_GREATER_OR_EQUAL, VK_CULL_MODE_NONE, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_FRONT_FACE_COUNTER_CLOCKWISE, VK_LOGIC_OP_NO_OP, VK_SHADER_STAGE_VERTEX_BIT } from 'vulkan-api';
import { Transform } from '@engine/types';
import { RenderableRenderer } from '@engine/modules';

@RenderModule({
    shaders: ['./shaders/grid.frag', './shaders/grid.vert'],
    colorBlend: { blendEnable: true, logicOp: VK_LOGIC_OP_NO_OP },
    depthStencil: { testEnable: false, testWriteEnable: false, compareOp: VK_COMPARE_OP_GREATER_OR_EQUAL, maxBounds: 0.0 },
    topology: RenderTopology.TRINAGLE_LIST,
    rasterize: {
        cullMode: VK_CULL_MODE_NONE,
        frontFace: VK_FRONT_FACE_COUNTER_CLOCKWISE
    },
    descriptors:
        [
            {
                bind: 0,
                type: VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
                flags: VK_SHADER_STAGE_VERTEX_BIT,
            }
        ]
})
export class EditorGrid extends RenderableNode {
    transform: Transform = Transform.Identity;
    transformEntity: Transform = Transform.Identity;

    onRender(render: RenderableRenderer)
    {
        render.draw(6);
    }
    
    constructor() {
        super();
    }

    @Bindable(BindInterfaceType.UNIFORM, 0)
    get cameraEntity()
    {
        return this.scene.getActiveCamera().dataEntity
    };

}