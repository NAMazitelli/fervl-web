/* global variables */ 
import * as THREE from './lib/three.module.js';
const STATIC_MANNEQUIN = 'static_mannequin';
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

let globalUniforms = {
    bloom: {value: 0},
    time: {value: 0},
    aspect: {value: innerWidth / innerHeight}
}

let localUniforms = {
    color1: {value: new THREE.Color(0xff3232)},
    color2: {value: new THREE.Color(0x0032ff)}
}

const bloomParams = {
    exposure: 1,
    bloomStrength: 1,
    bloomThreshold: 0,
    bloomRadius: 0
};
  
const container = document.getElementById( 'container' );
let scrollY = window.scrollY
const UP = "up";
const DOWN = "down";

/* end global variables */
/* shaders */
const vertexShader = (vShader) => `
uniform float time;
varying vec3 rPos;
${document.getElementById( 'noiseFS' ).textContent}
float noise(vec3 p){
  return cnoise(vec4(p, time));
}
vec3 getPos(vec3 p){
  return p * (4. + noise(p * 3.) * 2.);
}
${vShader}
`.replace(
`#include <beginnormal_vertex>`,
`#include <beginnormal_vertex>

  vec3 p0 = getPos(position);
  
  // https://stackoverflow.com/a/39296939/4045502
  
  float theta = .1; 
  vec3 vecTangent = normalize(cross(p0, vec3(1.0, 0.0, 0.0)) + cross(p0, vec3(0.0, 1.0, 0.0)));
  vec3 vecBitangent = normalize(cross(vecTangent, p0));
  vec3 ptTangentSample = getPos(normalize(p0 + theta * normalize(vecTangent)));
  vec3 ptBitangentSample = getPos(normalize(p0 + theta * normalize(vecBitangent)));
  
  objectNormal = normalize(cross(ptBitangentSample - p0, ptTangentSample - p0));
  
  ///////////////////////////////////////////////
`
)
.replace(
`#include <begin_vertex>`,
`#include <begin_vertex>
  transformed = p0;
  rPos = transformed;
`);

const fragmentShader = (fShader) => `
#define ss(a, b, c) smoothstep(a, b, c)
uniform float bloom;
uniform vec3 color1;
uniform vec3 color2;
varying vec3 rPos;
${fShader}
`.replace(
`vec4 diffuseColor = vec4( diffuse, opacity );`,
`
vec3 col = mix(color1, color2, ss(2., 6., length(rPos)));
vec4 diffuseColor = vec4( col, opacity );
`
)
.replace(
`#include <dithering_fragment>`,
`#include <dithering_fragment>
  
  //https://madebyevan.com/shaders/grid/
  float coord = length(rPos) * 4.;
  float line = abs(fract(coord - 0.5) - 0.5) / fwidth(coord) / 1.25;
  float grid = 1.0 - min(line, 1.0);
  //////////////////////////////////////
  
  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0), bloom);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, col * 2., grid);
`);

let scrollDirection;
/* end shaders */
const setScrollY = (sy) => scrollY = sy
const setSize = (w,h) => sizes = { width: w, height: h};
const setScrollDir = (dir) => scrollDirection = dir;

export { 
    sizes,
    globalUniforms,
    localUniforms,
    bloomParams,
    container,
    scrollY,
    scrollDirection,
    UP,
    DOWN,
    STATIC_MANNEQUIN,
    vertexShader,
    fragmentShader,
    setScrollY,
    setSize,
    setScrollDir,
};

