#version 450
#extension GL_ARB_separate_shader_objects : enable

layout (location = 0) in vec3 vSurfaceNormal;
layout (location = 1) in vec3 vCameraPosition;
layout (location = 2) in vec3 vLightPosition;
layout (location = 3) in vec2 vTextureCoord;

layout (location = 0) out vec4 fragColor;

layout (binding = 2) uniform sampler2D uDiffuseTexture; 

layout (constant_id = 0) const float NEAR_PLANE = 0.1f;
layout (constant_id = 1) const float FAR_PLANE = 64.0f;
layout (constant_id = 2) const int ENABLE_DISCARD = 0;

void main() {
  vec3 color = vec3(1, 0, 0);
  color = texture(uDiffuseTexture, vTextureCoord).rgb;
  vec3 N = normalize(vSurfaceNormal);
  vec3 V = normalize(vCameraPosition);
  vec3 L = normalize(vLightPosition);
  vec3 ambient = color * 0.1;
  vec3 diffuse = max(dot(L, N), 0.0) * color;
  fragColor = vec4(ambient + diffuse, 1.0);
}