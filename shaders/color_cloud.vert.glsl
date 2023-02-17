const int SRGB = 0;
const int xyY = 1;
const int lab = 2;

const mat3 XYZ_conversion = mat3(
    0.4124, 0.2126, 0.0193,
    0.3576, 0.7152, 0.1192,
    0.1805, 0.0722, 0.9505
);

uniform lowp sampler2D tex;
uniform int mode;

out vec3 color;

vec3 srgbToXYZ(vec3 srgb) 
{
    bvec3 underThreshold = lessThanEqual(srgb, vec3(0.04045));

    vec3 lowPart = srgb / 12.92;
    vec3 highPart = pow((srgb + vec3(0.055)) / 1.055, vec3(2.4));

    vec3 rgb = mix(highPart, lowPart, underThreshold);

    return XYZ_conversion * rgb;
}

vec3 XYZToxyY(vec3 XYZ)
{
    vec3 xyY;
    xyY.z = XYZ.y;
    xyY.xy = XYZ.xy / (XYZ.x + XYZ.y + XYZ.z);

    return xyY;
}

void main() {
    ivec2 texSize = textureSize(tex, 0);
    ivec2 texelCoord = ivec2(gl_VertexID / texSize.x, gl_VertexID % texSize.x);

    vec3 texColor = texelFetch(tex, texelCoord, 0).rgb;

    color = texColor;

    vec3 pos;
    if (mode == xyY) 
    {
        vec3 XYZ = srgbToXYZ(texColor);
        vec3 xyY = XYZToxyY(XYZ);
        pos = xyY.xzy - vec3(0.5);
    }
    else 
    {
        pos = texColor - vec3(0.5);
    }


    vec4 viewPos = modelViewMatrix * vec4(pos, 1.);
    gl_Position = projectionMatrix * viewPos;
    gl_PointSize = 10. / -viewPos.z;
}