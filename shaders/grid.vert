#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(binding = 0) uniform UBO {
  mat4 view;
  mat4 projection;
  vec3 lightPosition;
}
ubo;

layout(binding = 1) uniform UBOModel { mat4 model; }
uboModel;

layout(location = 0) out vec4 wp;

// Grid position are in clipped space
vec4 gridPlane[12] = vec4[](
    vec4(-1, 0, -1, 0), vec4(-1, 0, 1, 0), vec4(0, 0, 0, 1), vec4(-1, 0, 1, 0),
    vec4(1, 0, 1, 0), vec4(0, 0, 0, 1), vec4(1, 0, 1, 0), vec4(1, 0, -1, 0),
    vec4(0, 0, 0, 1), vec4(1, 0, -1, 0), vec4(-1, 0, -1, 0), vec4(0, 0, 0, 1));

void main() {
  vec4 p = gridPlane[gl_VertexIndex];
  wp = p;

  gl_Position =  ubo.projection * ubo.view * p; // using directly the clipped coordinates
}
