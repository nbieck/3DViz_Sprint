uniform lowp sampler2D tex;

void main()
{
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    ivec2 texelCoord = fragCoord * ivec2(4,1);

    vec3 c1 = texelFetch(tex, texelCoord, 0).rgb;
    vec3 c2 = texelFetchOffset(tex, texelCoord, 0, ivec2(1,0)).rgb;
    vec3 c3 = texelFetchOffset(tex, texelCoord, 0, ivec2(2,0)).rgb;
    vec3 c4 = texelFetchOffset(tex, texelCoord, 0, ivec2(3,0)).rgb;

    vec3 maximum = max(max(c1, c2), max(c3, c4));
    float total_max = max(max(maximum.r, maximum.g), maximum.b);

    gl_FragColor = vec4(vec3(total_max), 1.);
}