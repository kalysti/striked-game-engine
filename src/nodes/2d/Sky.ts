import { RenderableRenderer } from '@engine/modules';
import { RenderableNode } from '@engine/nodes';
import { Bindable, BindInterfaceType, RenderModule, RenderTopology } from '@engine/nodes/renderable';
import { EntityObject } from '@engine/resources';
import { Vector2D, Vector3D } from '@engine/types';
import {
    VK_COMPARE_OP_LESS_OR_EQUAL,
    VK_CULL_MODE_BACK_BIT, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_FRONT_FACE_CLOCKWISE, VK_LOGIC_OP_NO_OP, VK_SHADER_STAGE_VERTEX_BIT
} from 'vulkan-api';

export class SkyData extends EntityObject {

    time: number = 0.0;
    cirrus: number = 0.3;
    cumulus: number = 0.8;

    Br: number = 0.0005; // Rayleigh coefficient
    Bm: number = 0.0003; // Mie coefficient
    g: number = 0.9200; // Mie scattering direction. Should be ALMOST 1.0f

    nitrogen: Vector3D = new Vector3D(0.650, 0.570, 0.475);

    toDataStream(): Float32Array {
        let list: number[][] = [
            [this.time],
            [this.cirrus],
            [this.cumulus],
            [this.Br],
            [this.Bm],
            [this.g],
            [0],
            [0],
            this.nitrogen.values,

        ];
        let array = list.reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }
}

@RenderModule({
    shaders: ['./shaders/sky.frag', './shaders/sky.vert'],
    colorBlend: { blendEnable: true, logicOp: VK_LOGIC_OP_NO_OP },
    depthStencil: {
        testEnable: true,
        testWriteEnable: true,
        compareOp: VK_COMPARE_OP_LESS_OR_EQUAL,
        maxBounds: 1.0,
    },
    topology: RenderTopology.TRIANGLE_STRIPES,
    rasterize: {
        cullMode: VK_CULL_MODE_BACK_BIT,
        frontFace: VK_FRONT_FACE_CLOCKWISE,
    },
    descriptors: [
        {
            bind: 0,
            type: VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
            flags: VK_SHADER_STAGE_VERTEX_BIT,
        },
        {
            bind: 1,
            type: VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER,
            flags: VK_SHADER_STAGE_VERTEX_BIT,
        }
    ],
    vertexDesc: [

    ]
})
export class Sky extends RenderableNode {

    position: Vector2D = Vector2D.Zero;


    constructor() {
        super();
    }

    @Bindable(BindInterfaceType.UNIFORM, 0)
    get cameraEntity() {
        return this.scene.getActiveCamera().dataEntity
    };


    @Bindable(BindInterfaceType.UNIFORM, 1)
    meshDataEntity: SkyData = new SkyData();

    onRender(renderer: RenderableRenderer) {
        renderer.draw(4);
    }

    override onUpdate(delta: number): void {
       // this.meshDataEntity.time = process.uptime() * 0.2 - 0.0;
        //Graphics.setIsDirty(this.meshDataEntity);
    }
}
