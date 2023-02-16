
uniform lowp sampler2D tex;

void main()
{
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    ivec2 texelCoord = fragCoord * ivec2(2,2);

    vec3 c1 = texelFetch(tex, texelCoord, 0).rgb;
    vec3 c2 = texelFetchOffset(tex, texelCoord, 0, ivec2(1,0)).rgb;
    vec3 c3 = texelFetchOffset(tex, texelCoord, 0, ivec2(0,1)).rgb;
    vec3 c4 = texelFetchOffset(tex, texelCoord, 0, ivec2(1,1)).rgb;

    gl_FragColor = vec4((c1 + c2 + c3 + c4) / 4., 1.);
}