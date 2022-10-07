import * as THREE from './lib/three.module.js';
import * as GLOBAL from './variables.js';

/*-- CLASSES IMPORT --*/
import { World } from './Classes/World.class.js';
import { Loader } from './Classes/Loader.class.js';


let clock;
let scrollDirection;
let world;
let loader;
let time;
init();

function init() {
    loader = new Loader();
    clock = new THREE.Clock();

    window.progressBar = document.getElementById('progress-bar');
    window.allLoaded = allLoaded;
    loader.setup();
}

function allLoaded() {
    world = new World();
    world.setup();
    console.log("all loadeed")
    animate();
}

function animate() {
    console.log("nimated")
    const delta = clock.getDelta();

    requestAnimationFrame(animate);
    for ( const mixer of window.mixers ) mixer.update( delta );

    world.setAnimation(delta)
    world.render()
}

window.addEventListener( 'resize', onWindowResize );
window.addEventListener('scroll', onWindowScroll);

function onWindowScroll() {
    if (window.scrollY < GLOBAL.scrollY) {
        GLOBAL.setScrollDir(GLOBAL.UP);
    } else {
        GLOBAL.setScrollDir(GLOBAL.DOWN);
    }
    
    GLOBAL.setScrollY(window.scrollY)
}

function onWindowResize() {
    world.camera.aspect = window.innerWidth / window.innerHeight;
    world.camera.updateProjectionMatrix();
   
    // Update sizes
    GLOBAL.setSize( window.innerWidth, window.innerHeight );
    
    world.renderer.setSize( window.innerWidth, window.innerHeight );
    world.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}
