import Phaser from 'phaser';

// Fragment shader with simplex noise for fog effect
const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uWindAngle;
uniform float uWindSpeed;
uniform vec2 uResolution;
uniform float uOpacity;
uniform float uDriftMultiplier;

varying vec2 outTexCoord;

// Simplex noise functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                            dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Fractal Brownian Motion for layered fog
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

void main() {
    // Sample the original scene
    vec4 sceneColor = texture2D(uMainSampler, outTexCoord);
    
    // DEBUG: Add red tint to verify shader is running
    // Remove this after testing!
    vec3 debugColor = mix(sceneColor.rgb, vec3(1.0, 0.0, 0.0), 0.3);
    gl_FragColor = vec4(debugColor, sceneColor.a);
    return;
    
    // --- ORIGINAL FOG CODE (currently disabled for debug) ---
    // Convert wind angle to direction vector (angle is "from" direction)
    // Add 180 to get "to" direction, then convert to radians
    float radAngle = radians(uWindAngle + 180.0 - 90.0);
    vec2 windDir = vec2(cos(radAngle), sin(radAngle));
    
    // Time-based drift scaled by wind speed
    float driftSpeed = uWindSpeed * uDriftMultiplier * 0.001;
    vec2 drift = windDir * uTime * driftSpeed;
    
    // Scale UV for fog detail (lower = larger fog patches)
    vec2 fogUV = outTexCoord * 2.0 + drift;
    
    // Generate layered fog using FBM
    float fog = fbm(fogUV);
    fog = (fog + 1.0) * 0.5; // Normalize to 0-1
    
    // Softer fog - reduce overall density
    fog = fog * 0.5;
    fog = clamp(fog, 0.0, 1.0);
    
    // Apply opacity
    float fogAlpha = fog * uOpacity;
    
    // White/light gray fog color
    vec3 fogColor = vec3(0.9, 0.92, 0.95);
    
    // Blend fog over scene
    vec3 finalColor = mix(sceneColor.rgb, fogColor, fogAlpha);
    
    gl_FragColor = vec4(finalColor, sceneColor.a);
}
`;


export class FogPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    private _time: number = 0;
    private _windAngle: number = 0;
    private _windSpeed: number = 10;
    private _opacity: number = 0.1;
    private _driftMultiplier: number = 1.0;

    constructor(game: Phaser.Game) {
        super({
            game,
            name: 'FogPipeline',
            fragShader,
        });
    }

    onPreRender(): void {
        this.set1f('uTime', this._time);
        this.set1f('uWindAngle', this._windAngle);
        this.set1f('uWindSpeed', this._windSpeed);
        this.set2f('uResolution', this.renderer.width, this.renderer.height);
        this.set1f('uOpacity', this._opacity);
        this.set1f('uDriftMultiplier', this._driftMultiplier);
    }

    setFogTime(value: number): this {
        this._time = value;
        return this;
    }

    setWindAngle(value: number): this {
        this._windAngle = value;
        return this;
    }

    setWindSpeed(value: number): this {
        this._windSpeed = value;
        return this;
    }

    setOpacity(value: number): this {
        this._opacity = value;
        return this;
    }

    setDriftMultiplier(value: number): this {
        this._driftMultiplier = value;
        return this;
    }
}
