uniform float uTime;
uniform float uHue;
uniform float uIntensity;
uniform float uBlur;
uniform vec2 uResolution;
varying vec2 vUv;

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Smooth noise function
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise with interpolation
float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise
float fractalNoise(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * smoothNoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    
    // Create radial gradient from center
    float dist = distance(uv, center);
    
    // Animated noise for organic movement
    vec2 noisePos = uv * 3.0 + uTime * 0.2;
    float n = fractalNoise(noisePos);
    
    // Create bloom effect
    float bloom = 1.0 - smoothstep(0.0, 0.8, dist + n * 0.2);
    bloom = pow(bloom, 2.0);
    
    // Pulsing animation
    float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
    bloom *= (0.7 + pulse * 0.3);
    
    // Color mixing
    vec3 white = vec3(1.0);
    vec3 pink = hsv2rgb(vec3(uHue, 0.3, 1.0));
    
    // Blend white to pink based on bloom and intensity
    vec3 color = mix(white, pink, bloom * uIntensity);
    
    // Apply blur effect for exit transition
    if (uBlur > 0.0) {
        // Create blur displacement
        vec2 blurOffset = vec2(
            sin(uv.x * 10.0 + uTime) * uBlur * 0.1,
            cos(uv.y * 10.0 + uTime) * uBlur * 0.1
        );
        
        // Fade out with blur
        color = mix(color, vec3(1.0), uBlur);
        color *= (1.0 - uBlur * 0.8);
    }
    
    gl_FragColor = vec4(color, 1.0);
}
