#version 450
#extension GL_ARB_separate_shader_objects : enable

layout(location = 0) in vec4 wp;

layout(location = 0) out vec4 fragColor;

void main() {

  vec2 p = wp.xz / wp.w;
  vec2 g = 0.5 * abs(fract(p) - 0.5) / fwidth(p);

  float a = min(min(g.x, g.y), 1.0);

  vec4 color = vec4(0.2, 0.2, 0.2, 1.0 - a);
  fragColor = color;
}
