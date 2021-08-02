#version 450

layout (location = 0) in vec2 inUV;
layout (location = 0) out vec4 fragColor;
layout (binding = 2) uniform sampler2D samplerFont; 

void main() {

	float color = texture(samplerFont, inUV).r;
	fragColor = vec4(vec3(color), 1.0);
}