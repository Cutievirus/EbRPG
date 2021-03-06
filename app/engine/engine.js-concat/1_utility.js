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

Filament.roundFactor=(value,factor=1,func='round')=>Math[func](value/factor)*factor;
Filament.floorFactor=(value,factor)=>Filament.roundFactor(value,factor,'floor');
Filament.ceilFactor=(value,factor)=>Filament.roundFactor(value,factor,'ceil');

Filament.arrayAdd=(array,obj,index=array.length)=>{
	if(array.indexOf(obj)>=0){ return false; }
	array.splice(index,0,obj);
	return true;
}

Filament.arrayRemove=(array,obj)=>{
	const index=array.indexOf(obj);
	if(index>=0){
		array.splice(index,1);
		return true;
	}
	return false;
}

Filament.arrayShuffle=a=>{
	for (let i=a.length-1; i>0; --i){
		const j = Math.floor(Math.random()*(i+1));
		const t=a[i];
		a[i] = a[j];
		a[j] = t;
	}
	return a;
}

Filament.modulo=(n,m)=>(n%m+m)%m;

/**
 * Like Object.assign, except doesn't overwrite fields
 * that already exist.
 */ 
Filament.assign=(target,...mixins)=>{
	for (const mixin of mixins) for (const field in mixin){
		if(!(field in target)){
			target[field] = mixin[field];
		}
	}
}

Filament.mixin_object=(target,mixin)=>{
	Filament.assign(target,mixin);
	if(typeof mixin.implement === 'function'){ mixin.implement.call(target); }
}

Filament.mixin=(target,mixin)=>{
	if (!(target instanceof Function)){ return Filament.mixin_object(target,mixin); }
	if(!target._mixins){ target._mixins=[] }
	target._mixins.push(mixin);
	Filament.assign(target.prototype,mixin);
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
	const string = Filament.untag(...args);
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

{
	const handler = {construct(){return handler;}};
	Filament.isConstructor=f=>{
		try{
			return Boolean(new (new Proxy(f,handler)));
		}catch(err){
			return false;
		}
	}
}

Filament.CoordMap = class{
	constructor(dimensions=2,dfault=null,...defaultArgs){
		this.dimensions=dimensions;
		this.dfault=dfault;
		this.defaultArgs=defaultArgs;
		this.data={};
		this.root=this;
	}
	get(x,...yz){
		this.coords=[x,...yz];
		return this._get(x,...yz);
	}
	_get(x,...yz){
		if(this.dimensions<=1){
			return this._getValue(x);
		}
		return this._getSubDimension(x).get(...yz);
	}
	_getValue(x){
		if(x in this.data){
			return this.data[x];
		}
		if(typeof this.dfault==='function'){
			let value;
			if(Filament.isConstructor(this.dfault)){
				value = new this.dfault(...this.defaultArgs,...this.root.coords);
			}else{
				value = this.dfault(...this.defaultArgs,...this.root.coords);
			}
			return this.data[x]=value;
		}else{
			return this.dfault;
		}
	}
	_getSubDimension(x){
		if( !(this.data[x] instanceof Filament.CoordMap) ){
			this.data[x]=new Filament.CoordMap(this.dimensions-1,this.dfault,...this.defaultArgs);
			this.data[x].root=this.root;
		}
		return this.data[x];
	}
	set(x,...yz){
		if(this.dimensions<=1){
			this.data[x]=yz[0];
			return;
		}
		this._getSubDimension(x).set(...yz);
	}
	unset(x,...yz){
		if(this.dimensions<=1){
			delete this.data[x];
			return;
		}
		const subdimension = this._getSubDimension(x);
		subdimension.unset(...yz);
		if(Object.keys(subdimension.data).length===0){
			delete this.data[x];
		}
	}
	has(x,...yz){
		if(this.dimensions<=1){
			return x in this.data;
		}
		if( !(x in this.data) ){ return false;}
		return this._getSubDimension(x).has(...yz);
	}
}


Filament.log=(message)=>{
	console.log(message);
};
Object.assign(Filament.log,{
	error(message){
		console.error(message);
	},
	warn(message){
		console.warn(message);
	}
});