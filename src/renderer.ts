import essentials from "nvk-essentials";
import { performance } from 'perf_hooks';
import { VkApplicationInfo, vkCreateInstance, vkDestroySwapchainKHR, vkDeviceWaitIdle, vkEnumerateInstanceLayerProperties, VkInstance, VkInstanceCreateInfo, VkLayerProperties, VkSurfaceKHR, VK_API_VERSION_1_2, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER, VK_EXT_DEBUG_REPORT_EXTENSION_NAME, VK_IMAGE_ASPECT_DEPTH_BIT, VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT, VK_IMAGE_VIEW_TYPE_CUBE, VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME, VK_MAKE_VERSION, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT, VK_MEMORY_PROPERTY_HOST_COHERENT_BIT, VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT, VulkanWindow } from 'vulkan-api';
import { Matrix4 } from './math/Mat4';
import { Vector2D } from './math/Vector2D';
import { Vector3D } from './math/Vector3D';
import { Scene } from './nodes/scene';
import { EditorGrid } from './resources/3d/EditorGrid';
import { Geometry } from './resources/core/Geometry';
import { Mesh3D } from './resources/3d/Mesh3D';
import { EngineInputKeyEvent, EngineInputKeyEventType, EngineInputMouseEvent, EngineInputMouseMotionEvent, EngineMouseButton, SceneNode } from './resources/core/Node';
import { Primitive2D } from "./resources/2d/Primitive2D";
import { ProSky } from './resources/ProSky';
import { Sky } from './resources/sky';
import { Texture2D } from './resources/2d/Texture2D';
import { UI } from "./resources/ui";
import { ASSERT_VK_RESULT, createDescImageInfo, createDescSet } from "./utils/helpers";
import { VulkanBuffer } from './vulkan/buffer';
import { CommandBuffer } from "./vulkan/command.buffers";
import { CommandPool } from './vulkan/command.pool';
import { Frame } from './vulkan/frame';
import { Framebuffer } from "./vulkan/framebuffer";
import { LogicalDevice } from './vulkan/logical.device';
import { PhysicalDevice } from './vulkan/physical.device';
import { Pipeline } from './vulkan/pipeline';
import { RenderPass } from './vulkan/renderpass';
import { ResourceManager } from "./vulkan/resource.manager";
import { Swapchain } from './vulkan/swapchain';
import { Text } from "./resources/2d/Text";
const { GLSL } = essentials;



export class Renderer {
  static physicalDevice: PhysicalDevice;
  static logicalDevice: LogicalDevice;
  instance = new VkInstance();
  surface = new VkSurfaceKHR();
  swapchain: Swapchain;
  renderPass: RenderPass;
  framebuffer: Framebuffer;
  pipeline: Pipeline;
  static commandPool: CommandPool;
  commandBuffers: CommandBuffer;

  static window: VulkanWindow;
  frame: Frame;

  runningLoop = false;

  //ubo
  mView: Matrix4 = Matrix4.Zero;
  mProjection: Matrix4 = Matrix4.Zero;

  vLightPosition = new Vector3D(1.0, 3.0, 2.0);

  getUbo(): Float32Array {
    let list: number[][] = [this.mView.getArray(), this.mProjection.getArray(), this.vLightPosition.values, [0]]
    let array = list.reduce((a, b) => a.concat(b));
    return new Float32Array(array);
  };

  uniformBuffer: VulkanBuffer;
  currentScene: Scene | null = null;
  titleUpdateTimer: NodeJS.Timeout;
  constructor() {

    this.createWindow();
    this.createInstance();
    this.createSurface();


    this.titleUpdateTimer = setInterval(() => { this.updateWindowTitle() }, 1000);

    Renderer.window.onmouseup = (e) => {
      let key = EngineMouseButton[e.button];
      var keyButton: EngineMouseButton = EngineMouseButton[key as keyof typeof EngineMouseButton]; //Works with --noImplicitAny

      if (this.currentScene != null) {
        for (let obj of this.currentScene.getNodes()) {
          obj.onInput(new EngineInputMouseEvent(keyButton, EngineInputKeyEventType.released));
        }
      }
    };

    Renderer.window.onmousedown = (e) => {
      let key = EngineMouseButton[e.button];
      var keyButton: EngineMouseButton = EngineMouseButton[key as keyof typeof EngineMouseButton]; //Works with --noImplicitAny

      if (this.currentScene != null) {
        for (let obj of this.currentScene.getNodes()) {
          obj.onInput(new EngineInputMouseEvent(keyButton, EngineInputKeyEventType.pressed));
        }
      }
    };

    Renderer.window.onmousemove = (e) => {
      if (this.currentScene != null) {
        for (let obj of this.currentScene.getNodes()) {
          obj.onInput(new EngineInputMouseMotionEvent(new Vector2D(e.movementX, e.movementY)));
        }
      }
    };

    Renderer.window.onkeyup = (e) => {
      if (this.currentScene != null) {
        for (let obj of this.currentScene.getNodes()) {
          obj.onInput(new EngineInputKeyEvent(e.keyCode, EngineInputKeyEventType.released));
        }
      }
    };

    Renderer.window.onkeydown = (e) => {
      if (this.currentScene != null) {
        for (let obj of this.currentScene.getNodes()) {
          obj.onInput(new EngineInputKeyEvent(e.keyCode, EngineInputKeyEventType.pressed));
        }
      }
    };

    Renderer.window.onresize = (e) => {
      this.recreateSwapchain();
    }

    Renderer.physicalDevice = new PhysicalDevice(this.instance, this.surface);
    Renderer.logicalDevice = new LogicalDevice(Renderer.physicalDevice);

    this.swapchain = new Swapchain(Renderer.logicalDevice, this.surface, Renderer.window);
    this.renderPass = new RenderPass(Renderer.logicalDevice);
    Renderer.commandPool = new CommandPool(Renderer.logicalDevice);


    this.currentScene = new Scene();


    let depthTexture = new Texture2D(Renderer.logicalDevice, Renderer.physicalDevice.handle, Renderer.commandPool);
    depthTexture.create(Renderer.logicalDevice.depthFormat, VK_IMAGE_TILING_OPTIMAL, VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT, VK_MEMORY_PROPERTY_DEVICE_LOCAL_BIT);
    depthTexture.createImageView(Renderer.logicalDevice.depthFormat, VK_IMAGE_ASPECT_DEPTH_BIT);
    depthTexture.setNewLayout(VK_IMAGE_LAYOUT_DEPTH_STENCIL_ATTACHMENT_OPTIMAL);


    this.framebuffer = new Framebuffer(Renderer.logicalDevice, this.swapchain, this.renderPass, Renderer.window, depthTexture);
    this.pipeline = new Pipeline(Renderer.logicalDevice, Renderer.window, this.renderPass);
    this.commandBuffers = new CommandBuffer(Renderer.logicalDevice, this.swapchain, Renderer.commandPool, this.renderPass, this.framebuffer, this.pipeline);


    //load placeholder textures
    let texture = new Texture2D(Renderer.logicalDevice, Renderer.physicalDevice.handle, Renderer.commandPool);
    texture.fromImagePath('./assets/sponza/dummy.png');
    texture.upload();

    let cubemap = new Texture2D(Renderer.logicalDevice, Renderer.physicalDevice.handle, Renderer.commandPool);
    cubemap.fromImagePath('./assets/sponza/skybox.png');
    cubemap.upload(VK_IMAGE_VIEW_TYPE_CUBE);

    ResourceManager.add(cubemap);
    ResourceManager.add(texture);

    let palcerHolderTextureId = texture.id;
    let palcerHolderCubemapId = cubemap.id;

    this.uniformBuffer = new VulkanBuffer(Renderer.logicalDevice, this.getUbo().byteLength, VK_BUFFER_USAGE_UNIFORM_BUFFER_BIT);
    this.uniformBuffer.create(VK_MEMORY_PROPERTY_HOST_VISIBLE_BIT | VK_MEMORY_PROPERTY_HOST_COHERENT_BIT);

    let meshes = this.currentScene.nodes;
    for (let mesh of meshes) {
      if (mesh instanceof Geometry) {
        mesh.createBuffers(Renderer.logicalDevice);
        mesh.uploadBuffers(Renderer.commandPool.handle);
      }
    }

    //create and upload buffers

    for (let mesh of meshes.filter(of => of instanceof Geometry)) {

      if (mesh instanceof Sky) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.transform.uniformBuffer, 1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.uniformBuffer, 2, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescImageInfo(ResourceManager.get<Texture2D>(palcerHolderCubemapId), 3, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER),
        ];

        this.pipeline.updateDescriptions('sky', mesh, buffers);
      }
      else if (mesh instanceof UI) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescImageInfo(mesh.texture, 1, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER),
        ];

        this.pipeline.updateDescriptions('ui', mesh, buffers);
      }
      else if (mesh instanceof ProSky) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.transform.uniformBuffer, 1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.uniformBuffer, 2, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
        ];

        this.pipeline.updateDescriptions('prosky', mesh, buffers);
      }
      else if (mesh instanceof Mesh3D) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.transform.uniformBuffer, 1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescImageInfo(ResourceManager.get<Texture2D>(palcerHolderTextureId), 2, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER),
        ];

        this.pipeline.updateDescriptions('mesh', mesh, buffers);
      }
      else if (mesh instanceof Text) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.transform.uniformBuffer, 1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescImageInfo(mesh.texture, 2, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER),
        ];

        this.pipeline.updateDescriptions('primitive', mesh, buffers);
      }
      else if (mesh instanceof Primitive2D) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.transform.uniformBuffer, 1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescImageInfo(ResourceManager.get<Texture2D>(palcerHolderTextureId), 2, VK_DESCRIPTOR_TYPE_COMBINED_IMAGE_SAMPLER),
        ];

        this.pipeline.updateDescriptions('primitive', mesh, buffers);
      }
      else if (mesh instanceof EditorGrid) {
        let buffers = [
          createDescSet(this.uniformBuffer, 0, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER),
          createDescSet(mesh.transform.uniformBuffer, 1, VK_DESCRIPTOR_TYPE_UNIFORM_BUFFER)
        ];

        this.pipeline.updateDescriptions('grid', mesh, buffers);
      }
    }


    //bind buffers
    this.commandBuffers.bindBuffer(meshes.filter(of => of instanceof Geometry), Renderer.window.width, Renderer.window.height);

    //init frame
    this.frame = new Frame(Renderer.logicalDevice, this.swapchain, this.commandBuffers);

    //allow running loop
    this.runningLoop = true;
  }


  recreateSwapchain() {

    console.log("recreate");
    let oldSwapChain = this.swapchain.handle;

    Renderer.physicalDevice.getSurfaceCaps();
    vkDeviceWaitIdle(Renderer.logicalDevice.handle);

    this.commandBuffers.destroy();
    this.framebuffer.destroy();
    this.renderPass.destroy();
    this.swapchain.destroy();
    Renderer.commandPool.destroy();

    Renderer.commandPool.create();
    this.swapchain.create();
    this.renderPass.create();
    this.framebuffer.create();
    this.commandBuffers.create();

    vkDestroySwapchainKHR(Renderer.logicalDevice.handle, oldSwapChain, null);

    let meshes = this.currentScene.nodes;
    for (let mesh of meshes) {
      if (mesh instanceof Geometry) {
        // mesh.uploadBuffers(Renderer.commandPool.handle);
      }
    }

    this.commandBuffers.bindBuffer(meshes.filter(of => of instanceof Geometry), Renderer.window.width, Renderer.window.height);
  }
  updateTransforms() {
    // console.log(this.mView);
    if (this.currentScene.getActiveCamera() != null) {
      let cam = this.currentScene.getActiveCamera();
      this.mProjection = cam.matrices.perspective;
      this.mView = cam.matrices.view;
    }

    this.uniformBuffer.updateValues(this.getUbo());
  }

  private getLayers(): string[] {
    let amountOfLayers = { $: 0 };
    vkEnumerateInstanceLayerProperties(amountOfLayers, null);
    let layers = [...Array(amountOfLayers.$)].map(() => new VkLayerProperties());
    vkEnumerateInstanceLayerProperties(amountOfLayers, layers);
    return layers.map(df => df.layerName);
  }

  private createWindow() {
    Renderer.window = new VulkanWindow({
      width: 800,
      height: 600,
      title: "Demo"
    });
  }

  private createInstance() {
    this.getLayers();

    // app info
    let appInfo = new VkApplicationInfo();
    appInfo.pApplicationName = "Hello!";
    appInfo.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
    appInfo.pEngineName = "No Engine";
    appInfo.engineVersion = VK_MAKE_VERSION(1, 0, 0);
    appInfo.apiVersion = VK_API_VERSION_1_2;

    // create info
    let createInfo = new VkInstanceCreateInfo();
    createInfo.pApplicationInfo = appInfo;

    let instanceExtensions = Renderer.window.getRequiredInstanceExtensions();
    instanceExtensions.push(VK_EXT_DEBUG_REPORT_EXTENSION_NAME.toString());
    instanceExtensions.push(VK_KHR_GET_PHYSICAL_DEVICE_PROPERTIES_2_EXTENSION_NAME.toString());


    createInfo.enabledExtensionCount = instanceExtensions.length;
    createInfo.ppEnabledExtensionNames = instanceExtensions;
    createInfo.enabledLayerCount = 0;

    // validation layers
    let validationLayers = ['VK_LAYER_KHRONOS_validation'];
    createInfo.enabledLayerCount = validationLayers.length;
    createInfo.ppEnabledLayerNames = validationLayers;

    let result = vkCreateInstance(createInfo, null, this.instance);
    ASSERT_VK_RESULT(result);
  }

  private createSurface() {

    let result = Renderer.window.createSurface(this.instance, null, this.surface);
    ASSERT_VK_RESULT(result);
  }

  deltaTime: number = 0;
  frameCounter: number = 0;
  fpsTimer: number = 0;
  lastFPS: number = 0;

  loadScene(scene: Scene | null = null) {

    //this.currentScene = scene;

    for (let node of this.currentScene.nodes) {
      node.onEnable();
    }
  }

  start() {
    while (this.runningLoop) {
      this.run();
    }

  }

  lasttime = 0;

  run() {

    let t = performance.now();
    let diff: number = t - this.lasttime;

    this.deltaTime = diff / 1000;

    if (diff >= 1000.0) {
      this.lastFPS = this.frameCounter * 1000 / diff;
      this.frameCounter = 0;
    }
    this.lasttime = t;

    this.frameCounter++;



    if (Renderer.window.shouldClose()) {
      this.runningLoop = false;
      return;
    }

    Renderer.window.pollEvents();
    if (this.currentScene != null) {
      for (let obj of this.currentScene.nodes) {
        if (obj instanceof SceneNode) {
          obj.onUpdate(this.deltaTime);
        }
      }
    }


    this.updateTransforms();
    this.frame.draw();
  }


  updateWindowTitle() {
    let text = this.deltaTime.toPrecision(8) + "s (" + this.lastFPS + " fps)";
    if (this.currentScene != null) {
      let cam = this.currentScene.getActiveCamera();
      if (cam != null)
        Renderer.window.title = text + " - cam: " + cam.position.toString();
      else {
        Renderer.window.title = text;

      }

    }
    else
      Renderer.window.title = text;
  }
}