uniform sampler2D tex;
uniform vec3 color;

void main()
{
    ivec2 texSize = textureSize(tex);
    ivec2 texelCoord = ivec2(gl_VertexID / texSize.x, gl_VertexID % texSize.x);

    vec3 texColor = texelFetch(tex, texelCoord);
    float pos = dot(color, texColor);

    gl_Position = vec4(pos*2. - 1., 0., 0., 1.);
}