#version 450 
#extension GL_ARB_separate_shader_objects : enable
layout (location = 0) in vec2 fragTexCoord;
layout (location = 1) in vec4 colorIn;
layout (location = 0) out vec4 outColor;

layout (binding = 2) uniform sampler2D samplerFont; 

void main() {

	float color = texture(samplerFont, fragTexCoord).r;
	outColor = colorIn;

	if(color <= 0.0)
    	outColor.a = 0.0;
	else
    	outColor.a = 1.0;
}