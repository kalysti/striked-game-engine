#version 450 
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) in vec2 inPos;
layout(location = 1) in vec2 inUV;
layout(location = 2) in vec4 inColor;

layout (location = 0) out vec2 outUV;
layout (location = 1) out vec4 colorOut;


layout(binding = 0) uniform UBO {
  vec4 extend;
}
ubo;

layout(binding = 1) uniform UBOModel { vec2 position;  }
uboModel;

void main() {


  float halfWidth = ubo.extend.x / 2.0f;
  float halfHeight = ubo.extend.y / 2.0f;
  vec2 pos = vec2((inPos.x + uboModel.position.x) / halfWidth - 1.0f, (inPos.y + uboModel.position.y) / halfHeight - 1.0f);
  gl_Position = vec4(pos, 0.0, 1.0);

  outUV = inUV; 
  colorOut = inColor;
}