import { Transform } from '../math/Transform';
import { VkCommandPool, VK_BUFFER_USAGE_INDEX_BUFFER_BIT, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT } from 'vulkan-api';
import { Vector3D } from '../math/Vector3D';
import { VulkanBuffer } from '../vulkan/buffer';
import { LogicalDevice } from '../vulkan/logical.device';
import { Geometry } from './core/Geometry';

export enum Month {
    January = 0,
    February = 1,
    March = 2,
    April = 3,
    May = 4,
    June = 5,
    July = 6,
    August = 7,
    September = 8,
    October = 9,
    November = 10,
    December = 11
};

export class Sun {
    m_northDirection = Vector3D.Zero;
    m_sunDirection = Vector3D.Zero;
    m_upvector = Vector3D.Zero;
    m_latitude = 0;
    m_eclipticObliquity = 0;
    m_delta = 0;
    m_month = Month.January;

    constructor() {
        this.m_latitude = 50;

        this.m_northDirection = new Vector3D(1.0, 0.0, 0.0);
        this.m_sunDirection = new Vector3D(1.0, 1.0, 1.0);
        this.m_eclipticObliquity = (23.4 * Math.PI / 180.0);
        this.m_delta = 0.0;
    }


    CalculateSunOrbit() {

        var weekEndNumber: string = Month[this.m_month];
        var weekEndNumber2: number = Month[weekEndNumber];

        let day = 30.0 * weekEndNumber2 + 15.0;
        let lambda = 280.46 + 0.9856474 * day;

        lambda *= Math.PI / 180.0;

        this.m_delta = Math.asin(Math.sin(this.m_eclipticObliquity) * Math.sin(lambda));
    }

    UpdateSunPosition(hour: number) {
        let latitude_ = this.m_latitude * Math.PI / 180.0;
        let h = hour * Math.PI / 12.0;
        let azimuth = Math.atan2(
            Math.sin(h),
            Math.cos(h) * Math.sin(latitude_) - Math.tan(this.m_delta) * Math.cos(latitude_)
        );

        let altitude = Math.asin(
            Math.sin(latitude_) * Math.sin(this.m_delta) + Math.cos(latitude_) * Math.cos(this.m_delta) * Math.cos(h)
        );

        let direction = this.m_northDirection.rotate(this.m_upvector, -azimuth);
        let v = direction.cross(this.m_upvector);

      //  this.m_sunDirection = direction.rotate(v, altitude);
    }

    Update(time: number) {
        this.CalculateSunOrbit();
        this.UpdateSunPosition(8.0);
    }

    SetMonth(month: Month) {
        this.m_month = month;
    }

    SetLatitude(latitude: number) {
        this.m_latitude = latitude;
    }

    SetNorthDirection(direction: Vector3D) {
        this.m_northDirection = direction;
    }

    SetUpVector(up: Vector3D) {
        this.m_upvector = up;
    }

    GetMonth(): Month {
        return this.m_month;
    }

    GetLatitude() {
        return this.m_latitude;
    }

    GetSunDirection(): Vector3D {
        return this.m_sunDirection.normalize();
    }
}
export class ProSky extends Geometry {

    m_skyLuminanceXYZ = new Vector3D(0.264, 0.264, 0.352);
    m_skyDirection = new Vector3D(0.000000, 0.000000, 1.000000);
    m_exposition: number = 10.0;
    transform: Transform = Transform.Identity;

    m_vboHandles: number[] = [0, 0];
    m_indicesCount = 0;
    horizontalCount = 32;
    verticalCount = 32;

    vertexBuffer: VulkanBuffer;
    indexBuffer: VulkanBuffer;
    uniformBuffer: VulkanBuffer;

    sun: Sun = new Sun();

    constructor() {
        super();
        this._pipes = ["prosky"];
        this.sun.SetUpVector(new Vector3D(0.0, 0.0, 1.0));
        this.sun.SetMonth(Month.June);
        this.sun.Update(0.1);
    }

    createBuffers(device: LogicalDevice) {

        let vertices = this.getVertices();
        let indicies = this.getIndicies();
        this.vertexBuffer = new VulkanBuffer(device, vertices.byteLength, VK_BUFFER_USAGE_VERTEX_BUFFER_BIT);
        this.indexBuffer = new VulkanBuffer(device, indicies.byteLength, VK_BUFFER_USAGE_INDEX_BUFFER_BIT);

        this.uniformBuffer = new VulkanBuffer(device, this.getUbo().byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);

        let transform = new Float32Array(this.transform.matrix.values);
        this.transform.uniformBuffer = new VulkanBuffer(device, transform.byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
        this.transform.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);
    }

    uploadBuffers(cpool: VkCommandPool) {
        
        let vertices = this.getVertices();
        let indicies = this.getIndicies();

        this.vertexBuffer.upload(cpool, vertices);
        this.indexBuffer.upload(cpool, indicies);


        this.uniformBuffer.upload(cpool, this.getUbo());


        let transform = new Float32Array(this.transform.matrix.values);
        this.transform.uniformBuffer.upload(cpool, transform);
    }

    override onUpdate( delta : number)
    {
        this.sun.Update(delta);
    }

    getUbo(): Float32Array {
        let list: number[][] = [this.m_skyDirection.values, [0], this.sun.m_sunDirection.values, [0],this.m_skyLuminanceXYZ.values, [0], [this.m_exposition,0,0]];//+trasnform //+projection matrix

        let array = list.reduce((a, b) => a.concat(b));


        return new Float32Array(array);
    };

    getIndicies(): Uint16Array {
        let screenSpaceMeshIB: number[] = [];
        for (let i = 0; i < this.verticalCount - 1; i++) {
            for (let j = 0; j < this.horizontalCount - 1; j++) {
                screenSpaceMeshIB.push(j + 0 + this.horizontalCount * (i + 0));
                screenSpaceMeshIB.push(j + 1 + this.horizontalCount * (i + 0));
                screenSpaceMeshIB.push(j + 0 + this.horizontalCount * (i + 1));
                screenSpaceMeshIB.push(j + 1 + this.horizontalCount * (i + 0));
                screenSpaceMeshIB.push(j + 1 + this.horizontalCount * (i + 1));
                screenSpaceMeshIB.push(j + 0 + this.horizontalCount * (i + 1));
            }
        }

        return new Uint16Array(screenSpaceMeshIB);
    }

    getVertices(): Float32Array {

        let screenSpaceMeshVB: Vector3D[] = [];
        for (let i = 0; i < this.verticalCount; i++) {
            for (let j = 0; j < this.horizontalCount; j++) {
                let v = Vector3D.Zero;
                v.x = j / (this.horizontalCount - 1) * 2.0 - 1.0;
                v.y = i / (this.verticalCount - 1) * 2.0 - 1.0;

                screenSpaceMeshVB.push(v);
            }
        }

        let array = screenSpaceMeshVB.map(df => df.values).reduce((a, b) => a.concat(b));
        return new Float32Array(array);
    }


}