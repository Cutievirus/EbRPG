Filament.pixiCanvas = document.querySelector("#screen-game canvas");
Filament.parent = Filament.pixiCanvas.parentElement;
Filament.ui_container = document.getElementById("ui-container");
Filament.pixi = new PIXI.Application({
	view: Filament.pixiCanvas,
	width: Filament.settings.width,
	height: Filament.settings.height,
	backgroundColor:0x000088
});

Filament.start=async function(){
	await Filament.loadSettings();
	Filament.pixiContext = Filament.pixiCanvas.getContext("2d");
	if( Filament.settings.scaleMode === Filament.SCALE_MODE.HYBRID ){
		Filament.hybridCanvas = document.createElement('canvas');
		Filament.hybridContext = Filament.hybridCanvas.getContext("2d");
		Filament.hybridCanvas.id="hybrid-canvas";
		Filament.pixiCanvas.parentElement.appendChild(Filament.hybridCanvas);
		Filament.pixiCanvas.style.opacity=0;
	}
	document.body.style.setProperty('--uiRes',Filament.settings.uiRes);
	document.body.style.setProperty('--screen-width',Filament.settings.width);
	document.body.style.setProperty('--screen-height',Filament.settings.height);

	Filament.ui_container.style.width = Filament.settings.width*Filament.settings.uiRes+"px";
	Filament.ui_container.style.height = Filament.settings.height*Filament.settings.uiRes+"px";

	window.addEventListener('resize',Filament.resize);
	Filament.resize();
	Filament.ticker = Filament.pixi.ticker.add(Filament.update,Filament);

	for (const scene of Object.values(Filament.scenes)){
		scene.start();
	}
};

Filament.update=()=>{
	const delta = Filament.ticker.elapsedMS/1000;

	if(Filament.scene){
		Filament.scene.update(delta);
		Filament.scene.updateUI(delta);
	}

	if(Filament.hybridCanvas){
		Filament.pixi.render();
		Filament.hybridContext.drawImage(
			Filament.pixiCanvas,
			0,0, Filament.settings.width, Filament.settings.height,
			0,0, Filament.hybridCanvas.width, Filament.hybridCanvas.height
		);
	}
};

Filament.roundScale=n=>Math.round(n)||1;

Filament.resize=()=>{
	let scaleX = Filament.parent.offsetWidth / Filament.settings.width;
	let scaleY = Filament.parent.offsetHeight / Filament.settings.height;
	let scale = Math.min(scaleX,scaleY);
	if(Filament.settings.maintainAspectRatio){
		scaleX = scaleY = scale;
	}else{
		let ratio1 = Filament.parent.offsetWidth/Filament.parent.offsetHeight;
		let ratio2 = Filament.settings.width/Filament.settings.height;
		if(ratio1>ratio2){//wide
			Filament.pixi.renderer.resize(
				Filament.settings.height*ratio1,
				Filament.settings.height
			);
		}else{ //tall
			Filament.pixi.renderer.resize(
				Filament.settings.width,
				Filament.settings.width/ratio1
			);
		}
		
	}
	Filament.scaleX=scaleX;
	Filament.scaleY=scaleY;
	Filament.scale=scale;
	
	Filament.pixiCanvas.style.width = Filament.settings.width*scaleX+"px";
	Filament.pixiCanvas.style.height = Filament.settings.height*scaleY+"px";
	if(Filament.hybridCanvas){
		Filament.hybridCanvas.width = Filament.settings.width*Filament.roundScale(scaleX);
		Filament.hybridCanvas.height = Filament.settings.height*Filament.roundScale(scaleY);
		Filament.hybridCanvas.style.width = Filament.pixiCanvas.style.width;
		Filament.hybridCanvas.style.height = Filament.pixiCanvas.style.height;
		Filament.hybridContext.imageSmoothingEnabled=false;
	}
	Filament.ui_container.style.transform="scale("+scale/Filament.settings.uiRes+")";
	Filament.ui_container.style.left=
		Filament.parent.offsetWidth/2 - Filament.ui_container.offsetWidth/2+"px";
	Filament.ui_container.style.top=
		Filament.parent.offsetHeight/2 - Filament.ui_container.offsetHeight/2+"px";
};