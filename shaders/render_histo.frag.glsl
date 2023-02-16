uniform lowp sampler2D histo_buckets;
uniform lowp sampler2D max_val;

in vec2 vUv;

void main()
{
    vec2 uv = vUv;

    vec3 counts = texture(histo_buckets, uv).rgb;
    vec3 max_count = vec3(texture(max_val, uv).r);

    vec3 relative = counts / 10000.;//max_count;

    bvec3 larger = lessThan(relative, vec3(uv.y));
    if (all(larger)) discard;


    gl_FragColor = vec4(mix(vec3(1.), vec3(0.), larger), 1.);
}