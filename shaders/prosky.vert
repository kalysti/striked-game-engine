#version 450

#extension GL_ARB_separate_shader_objects : enable
#extension GL_ARB_shading_language_420pack : enable

layout (location = 0) in vec3 aVertexPosition;

layout (binding = 0) uniform UBO {
  mat4 view;
  mat4 projection;
  vec3 lightPosition;
} ubo;

layout (binding = 1) uniform UBOModel {
  mat4 model;
} uboModel;

layout (binding = 2) uniform Sky {
  vec3 m_skyDirection;
  vec3 m_sunDirection;
  vec3 m_skyLuminanceXYZ;
  vec3 m_exposition;
} sky;

layout (location = 0) out vec3 v_skyColor;

vec3 Perez(vec3 A,vec3 B,vec3 C,vec3 D, vec3 E,float costeta, float cosgamma)
{
	float _1_costeta = 1.0 / costeta;
	float cos2gamma = cosgamma * cosgamma;
	float gamma = acos(cosgamma);
	vec3 f = (vec3(1.0) + A * exp(B * _1_costeta)) * (vec3(1.0) + C *exp(D * gamma) + E * cos2gamma);
	return f;
}

void main ()
{
    vec2 u_projectionParameters = vec2(ubo.projection[0][0], ubo.projection[1][1]);
  	vec4 v_screenPos  = vec4(vec3(aVertexPosition.xy, 0.0), 1.0);

    gl_Position = v_screenPos ;

    vec3 viewDir = vec3(v_screenPos.x / u_projectionParameters.x, v_screenPos.y / u_projectionParameters.y, -1.0);
	
    vec3 lightDir = normalize(sky.m_sunDirection);
    vec3 skyDir = normalize(sky.m_skyDirection);


   vec3 	 v_viewDir =  (ubo.view * vec4(viewDir,0.0)).xyz;
    v_viewDir.z = abs(v_viewDir.z);
    v_viewDir = normalize(v_viewDir);



    vec3 A = vec3(-0.297800, -0.294200, -1.105600);
	vec3 B = vec3(-0.132200, -0.180800, -0.283300);
	vec3 C = vec3(0.211700, 0.194400, 5.279700);
	vec3 D = vec3(-1.027100, -1.741900, -2.335900);
	vec3 E = vec3(0.038600, 0.031100, 0.236300);

					
	float costeta = dot(v_viewDir, skyDir);
	float cosgamma = clamp(dot(v_viewDir, lightDir), -0.9999, 0.9999);
	float cosgammas = dot(skyDir, lightDir);
	
	vec3 P = Perez(A,B,C,D,E, costeta, cosgamma);			
	vec3 P0 = Perez(A,B,C,D,E, 1.0, cosgammas);		


     
	vec3 skyColorxyY = vec3(sky.m_skyLuminanceXYZ.x / (sky.m_skyLuminanceXYZ.x+sky.m_skyLuminanceXYZ.y + sky.m_skyLuminanceXYZ.z),			
							sky.m_skyLuminanceXYZ.y / (sky.m_skyLuminanceXYZ.x+sky.m_skyLuminanceXYZ.y + sky.m_skyLuminanceXYZ.z),			
							sky.m_skyLuminanceXYZ.y);	

  	vec3 Yp = skyColorxyY * P / P0;			
				
	vec3 skyColorXYZ = vec3(Yp.x * Yp.z / Yp.y,Yp.z, (1.0 - Yp.x- Yp.y)*Yp.z/Yp.y);			

	mat3 m = mat3(			
  		3.240479, -0.969256, 0.055648, 			
   		-1.53715, 1.875991, -0.204043, 			
   		-0.49853, 0.041556, 1.057311  			
	);	

    v_skyColor = pow(m * (skyColorXYZ / sky.m_exposition.x) , vec3(1.0/2.2));
  //  v_skyColor = sky.m_skyLuminanceXYZ;    

}