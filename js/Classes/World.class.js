import * as THREE from '../lib/three.module.js';
import * as GLOBAL from '../variables.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';
import { RenderPass } from '../lib/RenderPass.js';
import { UnrealBloomPass } from '../lib/UnrealBloomPass.js';
import { EffectComposer } from '../lib/EffectComposer.js';
import { ShaderPass } from '../lib/ShaderPass.js';

class World {
    constructor() {
        this.hemiLight;
        this.dirLight;
        this.scene;
        this.camera;
        this.loader;
        this.cubemap;
        this.staticMannequin;
        this.circleMesh;
        this.circleMeshDistorted;
        this.finalComposer;
        this.renderer; 
        this.startingCamX;
        this.circleStartZ;
        this.mannStartY;

    }

    setup() {
        this.setupScene()
        this.setupCamera()
        this.setupLights();
        this.setupMeshes();
        this.setupRenderer()
        this.setupBloom();
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupLights() {
        // Natural light
        this.hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
        this.hemiLight.position.set( 4, 10, 0 );
        this.scene.add( this.hemiLight );
        
        // Directional Light
        this.dirLight = new THREE.DirectionalLight( 0xffffff );
        this.dirLight.position.set( 0, 3, 0 );
        this.scene.add( this.dirLight );
    }

    setupCamera() {
        // Camera setup
        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
        this.camera.position.set( -4  , 1, 0 );
        this.camera.lookAt( 0, 1, 0 );
        this.startingCamX = this.camera.position.x;
    }

    onMeshLoad( gltf ) {
        this.scene.add( this.staticMannequin );
        this.staticMannequin.traverse( function ( object ) {    
            if ( object.isMesh ) {
                object.castShadow = true;
                object.material = new THREE.MeshPhysicalMaterial({
                    color: 0xff64ba,
                    metalness: 0,
                    roughness: 0,
                    clearcoat: 1.0 ,
                    clearcoatRoughness: 0 ,
                    reflectivity: 0,
                });
            }
        });
    }

    setupMeshes() {
        this.cubeMap = this.createCubeMap();
        //for ( const model of window.models ) this.scene.add( model );
        if (window.models.runningMan) this.scene.add( window.models.runningMan );
        if (window.models.runningMan) {
            this.staticMannequin = window.models.runningMan;
        } 

        //add sphere
        const geometry = new THREE.SphereGeometry( 1.6, 30, 30 );
        const material = new THREE.MeshBasicMaterial( { color: 0x000000 });
        this.circleMesh = new THREE.Mesh( geometry, material );
        this.scene.add( this.circleMesh );
        this.circleMesh.position.set(2,0.7, 0 );
    
        //add sphere2
        const geometrydistort = new THREE.SphereGeometry( 1, 15, 15 );
        const shadedMaterial = new THREE.MeshStandardMaterial({
            roughness: 0.125,
            metalness: 0.875,
            envMap: this.cubeMap,
            onBeforeCompile: this.sphereShader,
        });
        this.circleMeshDistorted  = new THREE.Mesh( geometrydistort, shadedMaterial );
        this.scene.add( this.circleMeshDistorted );
        this.circleMeshDistorted.position.set(10, 0.7,0 );
    }
    
    createCubeMap(){
        let images = [];
    
        let c = document.createElement("canvas");
        c.width = 4;
        c.height = c.width;
        let ctx = c.getContext("2d");
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
    
          for (let j = 0; j < (c.width * c.height) / 2; j++) {
            ctx.fillStyle = Math.random() < 0.5 ? "#a8a9ad" : "#646464";
            ctx.fillRect(
              Math.floor(Math.random() * c.width),
              Math.floor(Math.random() * c.height),
              2,
              1
            );
          }
    
          images.push(c.toDataURL());
        }
        return new THREE.CubeTextureLoader().load(images);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

   
    setAnimation(t) {
            if (this.staticMannequin && GLOBAL.scrollY <= 640) {
                this.circleMeshDistorted.rotation.y = GLOBAL.scrollY * 0.005;
                console.log(this.staticMannequin.rotation.y)
                this.staticMannequin.rotation.y = GLOBAL.scrollY * 0.01;
            }

            if (this.camera && GLOBAL.scrollY >= 640 && GLOBAL.scrollY < 1000) {
                if (!this.circleStartZ) {
                    this.circleStartZ = this.circleMeshDistorted.rotation.z;
                }

                if (!this.mannStartY) {
                    this.mannStartY = this.staticMannequin.rotation.y;
                }

                let camOffset = (GLOBAL.scrollY  - 640) * 0.005
                this.camera.position.x = this.startingCamX + camOffset;
                
                this.circleMeshDistorted.rotation.z = this.circleStartZ + camOffset;
                if ( this.staticMannequin.rotation.y > 4.6875) {
                    this.staticMannequin.rotation.y = this.mannStartY - camOffset;

                }
            }

            GLOBAL.globalUniforms.time.value = t * 0.1;
            GLOBAL.globalUniforms.bloom.value = 1;
    }
    
    setupBloom() {
        const renderScene = new RenderPass( this.scene, this.camera );
        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
    
        bloomPass.threshold = GLOBAL.bloomParams.bloomThreshold;
        bloomPass.strength = GLOBAL.bloomParams.bloomStrength;
        bloomPass.radius = GLOBAL.bloomParams.bloomRadius;
        
        let bloomComposer = new EffectComposer( this.renderer );
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass( renderScene );
        bloomComposer.addPass( bloomPass );
        const finalPass = new ShaderPass(
            new THREE.ShaderMaterial( {
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader: document.getElementById( 'vertexshader' ).textContent,
            fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            defines: {}
            } ), 'baseTexture'
        );
    
        finalPass.needsSwap = true;
        this.finalComposer = new EffectComposer( this.renderer );
        this.finalComposer.addPass( renderScene );
        this.finalComposer.addPass( finalPass );
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = true;
        GLOBAL.container.appendChild( this.renderer.domElement );
    }

    sphereShader(shader) {
        shader.uniforms.bloom = GLOBAL.globalUniforms.bloom;
        shader.uniforms.time = GLOBAL.globalUniforms.time;
        shader.uniforms.color1 = GLOBAL.localUniforms.color1;
        shader.uniforms.color2 = GLOBAL.localUniforms.color2;
        shader.vertexShader = GLOBAL.vertexShader(shader.vertexShader);
        shader.fragmentShader = GLOBAL.fragmentShader(shader.fragmentShader);
    }
}

export { World };