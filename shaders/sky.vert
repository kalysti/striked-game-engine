#version 450
#extension GL_ARB_separate_shader_objects : enable


layout (location = 0) out vec3 pos;
layout (location = 1) out vec3 fsun;

layout (location = 2) out float time;
layout (location = 3) out float cirrus;
layout (location = 4) out float cumulus;
layout (location = 5) out float Br;
layout (location = 6) out float Bm;
layout (location = 7) out float g;
layout (location = 8) out vec3 nitrogen;


layout(binding = 0) uniform UBOModel { mat4 view;  mat4 projection;  float far; float near; }
uboModel;

layout (binding = 1) uniform Sky {
  float time;
  float cirrus;
  float cumulus;
  float Br;
  float Bm;
  float g;
  vec3 nitrogen;
} skyValues;


const vec2 data[4] = vec2[](
vec2(-1.0,  1.0), vec2(-1.0, -1.0),
vec2( 1.0,  1.0), vec2( 1.0, -1.0));

void main()
{
	gl_Position = vec4(data[gl_VertexIndex], 0.0, 1.0);
	
	pos = transpose(mat3(uboModel.view)) * (inverse(uboModel.projection) * gl_Position).xyz;
	pos.y *= -1;
	fsun = vec3(0.0, sin(skyValues.time.x* 0.01), cos(skyValues.time.x * 0.01));

	time = skyValues.time;
	cirrus = skyValues.cirrus;
	cumulus = skyValues.cumulus;

	Br = skyValues.Br;
	Bm = skyValues.Bm;
	g = skyValues.g;
	nitrogen = skyValues.nitrogen;
}