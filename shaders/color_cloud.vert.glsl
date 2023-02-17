const int SRGB = 0;
const int xyY = 1;
const int lab = 2;

uniform lowp sampler2D tex;
uniform int mode;

out vec3 color;

void main() {
    ivec2 texSize = textureSize(tex, 0);
    ivec2 texelCoord = ivec2(gl_VertexID / texSize.x, gl_VertexID % texSize.x);

    vec3 texColor = texelFetch(tex, texelCoord, 0).rgb;

    color = texColor;
    vec4 viewPos = modelViewMatrix * vec4(texColor - vec3(0.5), 1.);
    gl_Position = projectionMatrix * viewPos;
    gl_PointSize = 10. / -viewPos.z;
}