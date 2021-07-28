#version 450

#extension GL_ARB_separate_shader_objects : enable
#extension GL_ARB_shading_language_420pack : enable
#extension GL_GOOGLE_include_directive : enable


layout (binding = 0) uniform UBO {
  mat4 view;
  mat4 projection;
  vec3 lightPosition;
} ubo;

layout (binding = 1) uniform UBOModel {
  mat4 model;
} uboModel;

layout (binding = 2) uniform SkyboxCameraData
{
	mat4 view;
	mat4 projection;
}
sky;

layout (location = 0) in vec3 inPos;
layout (location = 0) out vec3 outUVW;

out gl_PerVertex { vec4 gl_Position; };

void main ()
{
	outUVW = inPos;
	outUVW.x *= -1.0;
	vec4 pos = sky.projection * sky.view * vec4 (inPos, 1.0);
	pos.z = 0;

	gl_Position = pos;
}