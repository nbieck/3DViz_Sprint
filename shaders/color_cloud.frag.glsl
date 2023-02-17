in vec3 color;

uniform bool transparency;
uniform bool isShadow;

void main() {
    float l = length(gl_PointCoord - vec2(0.5));
    if (l > 0.45) discard;

    if (!isShadow) 
    {
        gl_FragColor = vec4(color, mix(1., (0.5-l)*0.5, transparency));
    }
    else 
    {
        gl_FragColor = vec4(vec3(0.), (0.5-l)*0.1);
    }
}