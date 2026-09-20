export default async function handler(req,res){
 const title=String(req.query.title||"").trim();if(!title)return res.status(400).json({error:"TITLE_REQUIRED"});
 try{
  const q=encodeURIComponent(title+" filming locations movie");
  const u="https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch="+q+"&gsrlimit=5&prop=extracts&exintro=1&explaintext=1&format=json&origin=*";
  const r=await fetch(u);if(!r.ok)throw new Error("SOURCE_ERROR");const d=await r.json();
  const pages=Object.values(d.query?.pages||{}).sort((a,b)=>(a.index||99)-(b.index||99));
  const terms=["filmed","filming","location","shot","撮影","ロケ","舞台"];
  const findings=pages.map(p=>{let text=String(p.extract||"").replace(/\s+/g," ").trim();let lower=text.toLowerCase(),pos=-1;for(const k of terms){let x=lower.indexOf(k);if(x>=0&&(pos<0||x<pos))pos=x}if(pos<0)return null;let start=Math.max(0,pos-100),snippet=text.slice(start,start+330);if(start>0)snippet="…"+snippet;return {name:p.title,summary:snippet+(text.length>start+330?"…":"")}}).filter(Boolean).slice(0,4);
  res.setHeader("Cache-Control","s-maxage=86400, stale-while-revalidate=604800");return res.status(200).json({findings});
 }catch(e){return res.status(200).json({findings:[]})}
}