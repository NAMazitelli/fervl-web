import * as THREE from '../lib/three.module.js';
import * as GLOBAL from '../variables.js';
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
        this.manMaterial = GLOBAL.PINK;
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
        this.scene.fog = new THREE.FogExp2( 0xff64ba, 0.1 );
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
        if (window.models.runningMan) {
            this.scene.add( window.models.runningMan );
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
            roughness: 1,
            metalness: 1,
            envMap: this.cubeMap,
            onBeforeCompile: this.sphereShader,
        });
        this.circleMeshDistorted = new THREE.Mesh( geometrydistort, shadedMaterial );
        this.scene.add( this.circleMeshDistorted );
        this.circleMeshDistorted.position.set( 9, 0.7,0 );
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

    setAnimation() {
        if (this.staticMannequin && GLOBAL.scrollY <= GLOBAL.sizes.height) {
            this.firstAnimation();
        }

        if (this.camera && GLOBAL.scrollY >= GLOBAL.sizes.height && GLOBAL.scrollY < GLOBAL.sizes.height * 2) {
            this.secondAnimation();
        }
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

    firstAnimation() {
        let frame = (GLOBAL.scrollY * 6.5) / GLOBAL.sizes.height
        this.circleMeshDistorted.rotation.y = frame;
        this.staticMannequin.rotation.y =  frame;
        
        if (frame >= 3.25 && this.manMaterial == GLOBAL.PINK) {
            this.changeAtmo(GLOBAL.BLUE);
        } else if (frame < 3.25 && this.manMaterial == GLOBAL.BLUE) {
            this.changeAtmo(GLOBAL.PINK);
        }
    }

    secondAnimation() {
        let frame = (((GLOBAL.scrollY - GLOBAL.sizes.height) * 5) / (GLOBAL.sizes.height * 2));
        let characterframe = 6.5 - frame;
        let cameraframe = - 4 - frame;
        this.circleMeshDistorted.rotation.z = frame;
        this.staticMannequin.rotation.y = characterframe;
        if (this.camera.position.x < -2 && GLOBAL.scrollDirection == GLOBAL.DOWN) {
           this.changeAtmo(GLOBAL.BLACK);
            this.circleMesh.material = GLOBAL.whiteMaterial;
            this.camera.fov = 45 - frame *10
            this.camera.updateProjectionMatrix();
            this.camera.position.x = cameraframe;
        }
        
        if (this.camera.position.x > -10 && GLOBAL.scrollDirection == GLOBAL.UP && 1000) {
            this.changeAtmo(GLOBAL.BLUE);
            this.circleMesh.material = GLOBAL.blackMaterial;

            this.camera.fov = 45 - frame *10
            this.camera.updateProjectionMatrix();
            this.camera.position.x = cameraframe;
        }
    }

    changeAtmo(color){
        document.body.classList.remove(this.manMaterial);
        document.body.classList.add(color);
        this.scene.fog = new THREE.FogExp2( GLOBAL.COLORS[color], 0.1 );
        this.manMaterial = color
        this.staticMannequin.traverse( function ( object ) {
            if ( object.isMesh ) {
                object.material = GLOBAL.MATERIALS[color];
            }
        });
    }
}

export { World };
