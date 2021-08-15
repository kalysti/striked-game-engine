#version 450

out gl_PerVertex { vec4 gl_Position; };

layout(location = 0, set = 0) in vec2 pos;
layout(location = 1 , set = 1) in vec2 inUV;

layout (location = 0) out vec2 outUV;


layout(binding = 0) uniform UBO {
  mat4 view;
  mat4 projection;
  vec3 lightPosition;
}
ubo;

layout(binding = 1) uniform UBOModel { mat4 model; }
uboModel;


void main() {
  gl_Position =  uboModel.model *  vec4(pos, 0.0, 1.0);
  outUV = inUV;
}