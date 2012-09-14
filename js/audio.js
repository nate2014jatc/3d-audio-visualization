/**
* ----------------------------------------------------------------------------
* "THE BEER-WARE LICENSE" (Revision 42):
* <christian@orange-coding.net> wrote this file. As long as you retain this notice you
* can do whatever you want with this stuff. If we meet some day, and you think
* this stuff is worth it, you can buy me a beer in return.
* ----------------------------------------------------------------------------
**/
!(function(){
var audioVisualization = new function(){
	
	//html nodes
	var stats, container;
	
	//Scene vars
	var camera, scene, renderer;
	
	var colors = [];
	
	//Screen details
	var screenWidth = window.innerWidth,
		screenHeight = window.innerHeight;
	
	//Half screen details
	var halfWidth = screenWidth / 2,
		halfHeight = screenHeight / 2;
	
	//Mouse position
	var mouseX = 0,
		mouseY = 0;
	
	//Particles
	var particleCount = 63;
	var particle, particles, material;
	
	//Audio
	var channels, rate, frameBufferLength, fft, audiomultiplier;
	var audio = document.getElementById('player');
	var geometry = null;
	
	var a = 0,b = 0;
	return {
		init: function(){
			container = document.createElement('div');
			container.setAttribute("id", "visframe");
			
			document.body.appendChild(container);


			//Create a new scene
			scene = new THREE.Scene();

			//Create the camera
			//(Field of vision, Aspect ratio, nearest point, farest point) 
			camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2500 );
			//Set the cameras z-axis position
			camera.position.y = 150;
			camera.position.z = 800;
			
					
			scene.add( camera );
			//Create a new renderer
			renderer = new THREE.WebGLRenderer( { clearAlpha: 1 } );
			//Set the render size to size of the browser
			renderer.setSize( window.innerWidth, window.innerHeight );
			
			//Init particle array 
			particles = [];
			
			//Used to draw the circle
			var circleBot = 0;
			var circleTop = 0;
			geometry = new THREE.Geometry();
			sprite = THREE.ImageUtils.loadTexture( "gfx/particle.png" );
			
			var createVertex = function(circleBot,counter){
				var vertex = new THREE.Vector3();
					
				vertex.x = Math.sin(circleBot) * 80*x;
				vertex.y = 0;
				vertex.z = Math.cos(circleBot) * 80*x;
				
				return vertex;
			}
			
			
			//create the inner rings
			var counter = 0;
			for(var x = 1;x<5;x++){
				for ( i = 0; i < particleCount; i ++ ) {
					var vertex = createVertex(circleBot,counter);
					
					geometry.vertices.push( vertex );

					colors[ counter ] = new THREE.Color( 0xffffff );
					colors[ counter ].setHSV( ( vertex.x + 1000 ) / 2000, 1, 1 );			
					circleBot += 0.1;
					counter++;
				}
			}
		
			//create the 2 outer rings
			for(var x = 0;x<2;x++){
				for ( i = 0; i < particleCount; i ++ ) {
					var vertex = createVertex(circleBot,counter);
					geometry.vertices.push( vertex );

					colors[ counter ] = new THREE.Color( 0xffffff );
					colors[ counter ].setHSV( ( vertex.x + 1000 ) / 2000, 1, 1 );			
					circleBot += 0.1;
					counter++;
				}
			}
		
		
			geometry.colors = colors;
				
			material = new THREE.ParticleBasicMaterial( { size: 30, map: sprite, vertexColors: true } );

			particles = new THREE.ParticleSystem( geometry, material );
			particles.sortParticles = true;

			scene.add( particles );

			//Add the rendered view to the body
			container.appendChild(renderer.domElement);
			
			//Hook up the mouse-wheel events
			
			document.addEventListener('mousemove', this.mousemove, false);
			document.addEventListener('DOMMouseScroll', this.wheel, false);
			document.addEventListener('mousewheel', this.wheel, false);
			
			//Hook up the audio events
			//---This currently is Firefox specific ---//
			audio.addEventListener('MozAudioAvailable', this.audiowritten, false);
			//called once if audio stream is ready for playback, get the meta information about this stream
			//e.g. frameBufferLength/channels 
			audio.addEventListener('loadedmetadata', this.audiometa, false);
			
			//Log the stats
			stats = new Stats();
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.top = '0';
			stats.domElement.style.right = '0';
			container.appendChild(stats.domElement);
		},
		//if the mouse is moved, change the camera view (will be done within the animate function )
		mousemove: function(e){
			//X position = current mouse - half width
			mouseX = e.clientX - halfWidth;
			//Y position = current mouse - half height
			mouseY = e.clientY - halfHeight;
		},
		
		wheel: function(e){
			//Wheel change to 0
			var delta = 0;
			if(!e){
				var e = window.event;
			}
			//Look for wheel data
			if(e.wheelDelta){
				delta = e.wheelDelta/120; 
				if(window.opera){
					delta = -delta;
				}
			} else if(e.detail){
				delta = -e.detail/3;
			}
			//Now we have wheel data do something with it
			if (delta){
                audioVisualization.wheelzoom(delta);
			}
		},
		//zoom in/out the animation
		wheelzoom: function(delta){
			//Change the zoom value depending on delta
			camera.position.z -= (delta * 60);
		},
		//called once to get meta informations
		audiometa: function(){
			channels = audio.mozChannels;
			rate = audio.mozSampleRate;
			frameBufferLength = audio.mozFrameBufferLength;
			
			fft = new FFT(frameBufferLength / channels, rate);
		},
		//calculates the signal-spectrum.
		//therefore the dsp.js will be used (Whoop Whoop for open source)
		audiowritten: function(event){
			var fb = event.frameBuffer;
            var signal = new Float32Array(fb.length / channels);
			
			for (var i = 0, fbl = frameBufferLength / 2; i < fbl; i++ ) {
				// Assuming interlaced stereo channels,
				// need to split and merge into a stero-mix mono signal
				signal[i] = (fb[2*i] + fb[2*i+1]) / 2;
			}
			
			fft.forward(signal);
			audioVisualization.animate(fft.spectrum);
		},
		//animates the 3d visualization
		//will be called every single time, the (audio)signal has been processed
		animate: function(data){
			//fft.spectrum.length contains an array of audio data
			camera.position.x += (mouseX - camera.position.x) * 0.05;
			camera.position.y += (-mouseY - camera.position.y) * 0.05;
			camera.position.x += ( mouseX - camera.position.x ) * 0.5;
			camera.lookAt( scene.position );
			audiomultiplier = 60;
			
			
			for(var i in geometry.vertices){
				var particle = geometry.vertices[i];
				
				if(i < geometry.vertices.length - (2*particleCount)){
					//innner ring
					particle.y = (data[i] * audiomultiplier) * 10 + 5;

				}else{
					//outer ring
					if(i > geometry.vertices.length - (particleCount+1)){
						particle.z = 0;
						particle.y = Math.sin(a) * 80*5;
						particle.x = Math.cos(a) * 80*5;
						a += 0.1;	
					}else{
						particle.z = Math.cos(b) * 80*5;
						particle.y = Math.sin(b) * 80*5;
						particle.x = Math.sin(b) * 80*5;
						b -= 0.1;						
					}
				}
				
			}

			renderer.render(scene, camera);
			stats.update();
		}
	}
}();
audioVisualization.init();
}());