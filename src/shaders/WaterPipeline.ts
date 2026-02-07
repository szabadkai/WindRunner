import Phaser from 'phaser';

const fragShader = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform sampler2D uFlowMap;
uniform float uTime;
uniform vec2 uWindDir;
uniform float uWindStrength;
uniform float uBoatSpeed;
uniform float uBoatHeading;
uniform float uFlowIntensity;

varying vec2 outTexCoord;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  const float TAU = 6.28318530718;
  float t = uTime * 0.6;
  vec2 uv = outTexCoord;

  vec2 flowSample = texture2D(uFlowMap, uv).rg * 2.0 - 1.0;
  float flowMag = texture2D(uFlowMap, uv).b;
  vec2 flowUV = fract(uv + flowSample * mix(0.01, 0.03, uFlowIntensity));

  float chopFreq = 12.0;
  vec2 windUV = flowUV * TAU * chopFreq + uWindDir * (t * (0.6 + uWindStrength * 2.0));
  float chop = sin(windUV.x + windUV.y + t * 0.5);

  float crestA = sin(dot(flowUV, uWindDir) * TAU * 8.0 + t * (1.8 + uWindStrength * 2.2));
  float crestB = sin(dot(flowUV, vec2(-uWindDir.y, uWindDir.x)) * TAU * 11.0 + t * 1.3);

  float detail = sin((flowUV.x + flowUV.y) * TAU * 28.0 + t * 1.8) * 0.08;
  detail += sin(flowUV.x * TAU * 36.0 + t * 1.2) * 0.05;
  float micro = hash(flowUV * 96.0 + t) * 0.06;

  float height = chop * 0.22 + crestA * 0.32 + crestB * 0.21 + detail + micro;

  float whitecaps = smoothstep(0.35, 0.7, height + uWindStrength * 0.9);
  vec2 boatDir = vec2(cos(uBoatHeading), sin(uBoatHeading));
  float wakeBias = max(0.0, dot(flowSample, boatDir)) * uBoatSpeed;
  float wakeFoam = (flowMag * 1.5) + wakeBias * 0.4;
  float foam = clamp(whitecaps + wakeFoam, 0.0, 1.2);

  vec3 deep = vec3(0.05, 0.21, 0.32);
  vec3 shallow = vec3(0.12, 0.48, 0.64);
  float depthMix = clamp(0.5 + height * 0.28 + flowMag * 0.35, 0.0, 1.0);
  vec3 color = mix(deep, shallow, depthMix);
  color += vec3(0.02, 0.04, 0.05) * height;
  color += vec3(0.08, 0.12, 0.15) * foam;

  vec3 normal = normalize(vec3(flowSample * 0.7, 1.1));
  float fresnel = pow(1.0 - clamp(normal.z, 0.0, 1.0), 2.4);
  color += vec3(0.05, 0.07, 0.09) * fresnel;
  color += vec3(0.03, 0.05, 0.07) * flowMag;

  gl_FragColor = vec4(color, 1.0);
}
`;

export class WaterPipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
  private time: number = 0;
  private windDir: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -1);
  private windStrength: number = 0.5;
  private boatSpeed: number = 0;
  private boatHeading: number = 0;
  private flowTexture: Phaser.Textures.Texture | null = null;
  private flowIntensity: number = 0;

  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader,
    });
  }

  onBind(): void {
    super.onBind();

    this.set1f('uTime', this.time);
    this.set2f('uWindDir', this.windDir.x, this.windDir.y);
    this.set1f('uWindStrength', this.windStrength);
    this.set1f('uBoatSpeed', this.boatSpeed);
    this.set1f('uBoatHeading', this.boatHeading);
    this.set1f('uFlowIntensity', this.flowIntensity);

    const glTexture = this.flowTexture?.source[0]?.glTexture;
    const unit = glTexture ? this.setTexture2D(glTexture as any) : this.setTexture2D(this.renderer.whiteTexture);
    this.set1i('uFlowMap', unit);
  }

  setWaveTime(value: number): this {
    this.time = value;
    return this;
  }

  setWind(angleDeg: number, speed: number, maxSpeed: number): this {
    const rad = Phaser.Math.DegToRad(angleDeg - 90);
    this.windDir.set(Math.cos(rad), Math.sin(rad));
    const normalized = maxSpeed > 0 ? Phaser.Math.Clamp(speed / maxSpeed, 0, 1.4) : speed;
    this.windStrength = normalized;
    return this;
  }

  setBoatState(headingDeg: number, speed: number, maxSpeed: number): this {
    this.boatHeading = Phaser.Math.DegToRad(headingDeg - 90);
    this.boatSpeed = maxSpeed > 0 ? Phaser.Math.Clamp(speed / maxSpeed, 0, 1.25) : speed;
    return this;
  }

  setFlowTexture(texture: Phaser.Textures.Texture | null): this {
    this.flowTexture = texture;
    return this;
  }

  setFlowIntensity(value: number): this {
    this.flowIntensity = Phaser.Math.Clamp(value, 0, 1);
    return this;
  }

  clearBoat(): this {
    this.boatSpeed = 0;
    return this;
  }
}
