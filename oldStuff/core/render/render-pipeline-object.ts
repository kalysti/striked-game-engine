"use strict";

import { VulkanWindow } from "vulkan-api/generated/1.2.162/win32";
const { v4: uuidv4 } = require('uuid');


export abstract class RenderPipelineObject {
   abstract draw(delta:number): void;
   private _uuid: string = "";

   get uuid(): string {
      return this._uuid;
   }

   constructor() {
      this._uuid = uuidv4();
   }
}