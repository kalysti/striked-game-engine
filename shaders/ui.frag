#version 450

#extension GL_ARB_separate_shader_objects : enable

layout  (binding = 1) uniform sampler2D samplerCubeMap;

layout (location = 0) in vec2  inUVW;
layout (location = 0) out vec4 outFragColor;

void main() 
{
	vec4 obj = texture(samplerCubeMap, inUVW);
 	outFragColor = obj;
	// outFragColor = vec4(1,0,0,1);
}