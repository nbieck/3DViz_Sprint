// Simple position pass-through
out vec2 out_uv;

void main() 
{
    out_uv = uv;
    gl_Position = vec4(position, 1.);
}