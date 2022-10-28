import * as THREE from './lib/three.module.js';
import * as GLOBAL from './variables.js';

/*-- CLASSES IMPORT --*/
import { World } from './Classes/World.class.js';
import { Loader } from './Classes/Loader.class.js';

let clock;
let world;
let loader;
let time = 0;
const header = document.getElementsByClassName('header')[0];
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
    const delta = clock.getDelta();
    GLOBAL.globalUniforms.time.value = time * 0.1;

    for ( const mixer of window.mixers ) mixer.update( delta * - 1 );

    animate(delta);
}

function animate(charRotation) {
    world.setAnimation(charRotation)
    world.render()
}

window.addEventListener( 'resize', onWindowResize );
window.addEventListener('scroll', onWindowScroll);

function onWindowScroll() {
    if (window.scrollY == 0) {
        header.classList.add('full');
    } else {
        header.classList.remove('full');
    }
    if (window.scrollY < GLOBAL.scrollY) {
        for ( const mixer of window.mixers ) mixer.update( -0.01 );
        animate()
        GLOBAL.setScrollDir(GLOBAL.UP);
    } else {

        for ( const mixer of window.mixers ) mixer.update( 0.01 );
        animate()
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


window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  }