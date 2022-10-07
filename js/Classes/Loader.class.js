import * as THREE from '../lib/three.module.js';

import { GLTFLoader } from '../lib/GLTFLoader.js';
import * as GLOBAL from '../variables.js';
import * as SkeletonUtils from '../lib/SkeletonUtils.js';

export class Loader {
    constructor(props){
    	this.loadManager = new THREE.LoadingManager();
		this.frameID = null;
		this.percentComplete = 0;
		this.updateAmount = 5;
    }

    setup() {
    	const thisObj = this;
		this.loadManager.onStart = () => {
		  // onStart may be called multiple times
		  // don't run the animation more than once
		  if ( thisObj.frameID !== null ) return;
		  console.log("aca se llama!");
		  thisObj.animateBar(thisObj);
		};


		this.loadManager.onLoad = ( ) => {
            window.progressBar.classList.add( 'hidden' );

		  // reset the bar in case we need to use it again
		  thisObj.percentComplete = 0;
		  window.progressBar.style.width = 0;
		  console.log("cancela la animacion?");
		  cancelAnimationFrame( this.frameID );
	 	  window.allLoaded()
		  // do any other on load things
		};

    	this.gltfloader = new GLTFLoader(this.loadManager);

		window.meshes = {}
/* 		
        this.loadModel('models/runningman.gltf', GLOBAL.STATIC_MANNEQUIN, (object) => {	
            let mesh = object.scene;	

            mesh.traverse(( child ) => {
                if ( child.isMesh ) {
                    window.meshes[GLOBAL.STATIC_MANNEQUIN] = child;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: 0xff64ba,
                        metalness: 0,
                        roughness: 0,
                        clearcoat: 1.0 ,
                        clearcoatRoughness: 0 ,
                        reflectivity: 0,
                    });
                }
            });

			const model = SkeletonUtils.clone(mesh);
			model.position.x = - 2;
			model.position.z = - 50;

			const mixer = new THREE.AnimationMixer( model );
			mixer.clipAction( object.animations[ 0 ] ).play(); // idle
			window.mixer = mixer;
/* 
			let skeleton = new THREE.SkeletonHelper( mesh );
			skeleton.visible = true;
			window.skeletons[GLOBAL.STATIC_MANNEQUIN] = skeleton;
 
			const animations = object.animations;

			window.mixer = new THREE.AnimationMixer( mesh );
			window.meshes[GLOBAL.STATIC_MANNEQUIN].animation = mixer.clipAction( animations[ 0 ] );
        });

 */

		this.loadModel('models/runningman.glb', GLOBAL.STATIC_MANNEQUIN,  function ( gltf ) {

			gltf.scene.traverse( function ( object ) {

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
					window.meshes[GLOBAL.STATIC_MANNEQUIN] = object;
				}
			} );

			const model1 = SkeletonUtils.clone( gltf.scene );
			const mixer1 = new THREE.AnimationMixer( model1 );

			mixer1.clipAction( gltf.animations[ 0 ] ).play(); // idle
		
			window.models = { runningMan : model1 }
			window.mixers = [mixer1]
		} );


    }

	animateBar(objBar) {
	  	objBar.percentComplete += objBar.updateAmount;

	    // if the bar fills up, just reset it.
	    // you could also change the color here
	    if ( objBar.percentComplete >= 100 ) {
	    	objBar.percentComplete = 5;
	    }
	    if (window.progressBar) { 
	    	window.progressBar.style.width = objBar.percentComplete + '%' 
	    };
		objBar.frameID = requestAnimationFrame( () => objBar.animateBar(objBar) )
	}

	loadModel(model, index, callback = false) {
		this.gltfloader.load(model, 
			(object) => {
				if (callback) { 
					callback(object) 
				} else {
					object.traverse( function ( child ) {
		    	        if ( child.isMesh ) {
		    	            window.meshes[index] = child;
							child.castShadow = true;
							child.receiveShadow = true;
		    	        }
		    	    });
				}
			},
			this.loadManager.onProgress,
			this.loadManager.onError			
		);

	}
}