Filament.truncateNumber=n=>{
	if(n<=99999){ return n+''; }
	let truncs = 0;
	while (n>9999 && truncs<5){
		n/=1000;
		++truncs;
	}
	return Math.floor(n)+Filament.LARGE_NUMBER_ABBREVIATIONS[truncs];
};
Filament.LARGE_NUMBER_ABBREVIATIONS=[
	'','K','M','B','T','Q'
];
Filament.sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

Filament.minmax=(min,max,val)=>Math.max(min,Math.min(max,val));

Filament.round=(value,places=0,func='round')=>{
	const factor = Math.pow(10,places);
	return Math[func](value*factor)/factor
}
Filament.floor=(value,places)=>Filament.round(value,places,'floor');
Filament.ceil=(value,places)=>Filament.round(value,places,'ceil');

Filament.arrayAdd=(array,obj,index=array.length)=>{
	if(array.indexOf(obj)>=0){ return true; }
	array.splice(index,0,obj);
	return false;
}

Filament.arrayRemove=(array,obj)=>{
	const index=array.indexOf(obj);
	if(index>=0){
		array.splice(index,1);
		return true;
	}
	return false;
}

Filament.mixin_object=(target,mixin)=>{
	Object.assign(target,mixin);
	if(typeof mixin.implement === 'function'){ mixin.implement.call(target); }
}

Filament.mixin=(target,mixin)=>{
	if (!(target instanceof Function)){ return Filament.mixin_object(target,mixin); }
	if(!target._mixins){ target._mixins=[] }
	target._mixins.push(mixin);
	Object.assign(target.prototype,mixin);
	target.prototype.implement=Filament.implement.bind(this);
}
Filament.implement=function(instance,clazz){
	if (!instance || !clazz._mixins){ return; }
	for (const mixin of clazz._mixins){
		if(typeof mixin.implement === 'function'){ mixin.implement.call(instance); }
	}
}

Filament.untag=(s,...v)=>{
	if(!(s instanceof Array)){ return s; }
	let string = '';
	for (const i in s){ string+=s[i]+(v[i]||''); }
	return string;
}

Filament.html=(...args)=>{
	const string = untag(...args);
	const div = document.createElement('div');
	div.innerHTML=string;
	return new Filament.NodeList(...div.childNodes);
}

Filament.NodeList=class extends Array{
	mount(target){
		for (const node of this){
			target.append(node);
		}
		return this;
	}
	elements(){
		let array = [];
		for (const node of this){
			if(node instanceof Element){ array.push(node); }
		}
		return array;
	}
}

Filament.createElement=(string,child)=>{
	let match = string.match(/^[^\s.#[\]]+/);
	if(!match){throw `Couldn't find tagname in string ${string}`;}
	const element = document.createElement(match[0]);
	match=string.match(/#([^\s.#[\]]+)/);
	if(match){ element.id=match[1]; }
	let reg=/\.([^\s.#[\]]+)/g;
	while(match=reg.exec(string)){
		element.classList.add(match[1]);
	}
	reg=/\[([^\s.#[\]=]+)=([^\s.#[\]=]+)\]/g;
	while(match=reg.exec(string)){
		element.setAttribute(match[1],match[2]);
	}
	if(child){ element.append(child); }
	element.mount=Filament.mountElement;
	return element;
}

Filament.mountElement=function(target){
	if(!(this instanceof Element)){ return; }
	target.append(this);
	return this;
};