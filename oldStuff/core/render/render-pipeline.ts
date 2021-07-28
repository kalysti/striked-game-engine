"use strict";

import { RenderPipelineObject } from "./render-pipeline-object";

export interface PipelineElement {
    [key: string]: RenderPipelineObject;
 } 

export class RenderPipeline  {
    elements: PipelineElement = {};
    attach(_element: RenderPipelineObject)
    {        
        this.elements[_element.uuid] = _element;
    } 
    
    loop( delta: number)
    {
      for(let key in this.elements)
      {
         const val = this.elements[key];
        val.draw(delta);
      }
    }
}