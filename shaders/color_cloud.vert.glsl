uniform lowp sampler2D tex;

out vec3 color;

void main() {
    ivec2 texSize = textureSize(tex, 0);
    ivec2 texelCoord = ivec2(gl_VertexID / texSize.x, gl_VertexID % texSize.x);

    vec3 texColor = texelFetch(tex, texelCoord, 0).rgb;

    color = texColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(texColor - vec3(0.5), 1.);
}