const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),broken=[];
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 for(const m of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)){
  const ref=m[1];if(/^(https?:|data:|mailto:|tel:)/.test(ref))continue;
  if(ref.startsWith('#')){if(!html.includes('id="'+ref.slice(1)+'"'))broken.push(file+': '+ref);}
  else if(!fs.existsSync(path.resolve(root,ref.split(/[?#]/)[0])))broken.push(file+': '+ref);
 }
}
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.json')))JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
if(broken.length)throw Error('Unresolved references: '+broken.join(', '));
console.log('HTML references, assets, JavaScript syntax and JSON passed.');
