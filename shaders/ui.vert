#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(binding = 0) uniform UBO {
  mat4 view;
  mat4 projection;
  vec3 lightPosition;
}
ubo;

layout(location = 0) out vec2 inUVW;

// Grid position are in clipped space
vec4 gridPlane[12] = vec4[](
    vec4(-1, 0, -1, 0), vec4(-1, 0, 1, 0), vec4(0, 0, 0, 1), vec4(-1, 0, 1, 0),
    vec4(1, 0, 1, 0), vec4(0, 0, 0, 1), vec4(1, 0, 1, 0), vec4(1, 0, -1, 0),
    vec4(0, 0, 0, 1), vec4(1, 0, -1, 0), vec4(-1, 0, -1, 0), vec4(0, 0, 0, 1));

void main() {
    inUVW = vec2((gl_VertexIndex << 1) & 2, gl_VertexIndex & 2);
    gl_Position = vec4(inUVW * 2.0f + -1.0f, 0.0f, 1.0f);

}
