#version 450
#extension GL_ARB_separate_shader_objects : enable


layout(binding = 0) uniform UBOModel { mat4 view;  mat4 projection;  float far; float near; }
uboModel;

layout(location = 0) out vec3 nearPoint;
layout(location = 1) out vec3 farPoint;
layout(location = 2) out mat4 fragView;
layout(location = 6) out mat4 fragProj;

layout(location = 14) out float far;
layout(location = 18) out float near;



vec3 gridPlane[6] = vec3[] (
    vec3(1, 1, 0), vec3(-1, -1, 0), vec3(-1, 1, 0),
    vec3(-1, -1, 0), vec3(1, 1, 0), vec3(1, -1, 0)
);

vec3 UnprojectPoint(float x, float y, float z, mat4 view, mat4 projection) {
    mat4 viewInv = inverse(view);
    mat4 projInv = inverse(projection);
    vec4 unprojectedPoint =  viewInv * projInv * vec4(x, y, z, 1.0);
    return unprojectedPoint.xyz / unprojectedPoint.w;
}

void main() {
    vec3 p = gridPlane[gl_VertexIndex].xyz;
    nearPoint = UnprojectPoint(p.x, p.y, 0.0, uboModel.view, uboModel.projection).xyz; // unprojecting on the near plane
    farPoint = UnprojectPoint(p.x, p.y, 0.99, uboModel.view, uboModel.projection).xyz; // unprojecting on the far plane
    
    fragView = uboModel.view;
    fragProj = uboModel.projection;

    far = uboModel.far;
    near = uboModel.near;

    gl_Position = vec4(p, 1.0); // using directly the clipped coordinates
}
