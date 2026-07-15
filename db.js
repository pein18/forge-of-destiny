// Capa de datos Supabase REST. Si config.js no existe, la app usa localStorage.
window.ForgeDB={
  config(){return window.FORGE_CONFIG||{}},
  ready(){const c=this.config();return Boolean(c.supabaseUrl&&c.supabaseAnonKey)},
  headers(){const c=this.config(),k=c.supabaseAnonKey;return {'Content-Type':'application/json',apikey:k,Authorization:`Bearer ${c.accessToken||k}`,Prefer:'return=representation'}},
  async signUp(email,password,username){if(!this.ready())return{demo:true,user:{email,username}};try{const r=await fetch(`${this.config().supabaseUrl}/auth/v1/signup`,{method:'POST',headers:this.headers(),body:JSON.stringify({email,password,data:{username}})}),data=await r.json();if(!r.ok)throw new Error(data.msg||data.error_description||'No se pudo crear la cuenta');if(data.access_token){this.config().accessToken=data.access_token;this.config().userId=data.user.id}return data}catch(e){return{error:e.message}}},
  async signIn(email,password){if(!this.ready())return{demo:true,user:{email}};try{const r=await fetch(`${this.config().supabaseUrl}/auth/v1/token?grant_type=password`,{method:'POST',headers:this.headers(),body:JSON.stringify({email,password})}),data=await r.json();if(!r.ok)throw new Error(data.error_description||'Credenciales incorrectas');this.config().accessToken=data.access_token;this.config().userId=data.user.id;return data}catch(e){return{error:e.message}}},
  async saveBuild(build){
    if(!this.ready()||!this.config().userId)return null;
    const body={owner_id:this.config().userId,name:build.name,vocation:build.vocation,level:build.level,skill:build.skill,magic_level:build.magic_level,is_public:build.is_public,equipment:build.equipment,wheel:build.domains,weapon_proficiency:{family:build.family,weapon:build.weapon},rotation:build.rotation,updated_at:new Date().toISOString()};
    try{const r=await fetch(`${this.config().supabaseUrl}/rest/v1/builds`,{method:'POST',headers:this.headers(),body:JSON.stringify(body)});return r.ok?(await r.json())[0]:null}catch{return null}
  },
  async publicBuilds(){if(!this.ready())return[];try{const r=await fetch(`${this.config().supabaseUrl}/rest/v1/builds?is_public=eq.true&select=*&order=created_at.desc`,{headers:this.headers()});return r.ok?await r.json():[]}catch{return[]}}
};
