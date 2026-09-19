export default async function handler(req,res){
  const token=process.env.TMDB_READ_TOKEN;
  if(!token)return res.status(503).json({error:"TMDB_NOT_CONFIGURED"});
  const q=String(req.query.q||"").trim();
  if(!q)return res.status(400).json({error:"QUERY_REQUIRED"});
  try{
    const url=new URL("https://api.themoviedb.org/3/search/multi");
    url.searchParams.set("query",q);
    url.searchParams.set("language","ja-JP");
    url.searchParams.set("include_adult","false");
    const r=await fetch(url,{headers:{Authorization:"Bearer "+token,accept:"application/json"}});
    if(!r.ok)return res.status(r.status).json({error:"TMDB_ERROR"});
    const d=await r.json();
    const results=(d.results||[]).filter(x=>x.media_type==="movie"||x.media_type==="tv").slice(0,12).map(x=>({
      id:x.id,type:x.media_type,title:x.title||x.name,originalTitle:x.original_title||x.original_name||"",
      date:x.release_date||x.first_air_date||"",overview:x.overview||"",
      poster:x.poster_path?"https://image.tmdb.org/t/p/w342"+x.poster_path:"",
      backdrop:x.backdrop_path?"https://image.tmdb.org/t/p/w780"+x.backdrop_path:"",
      rating:x.vote_average||0
    }));
    res.setHeader("Cache-Control","s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({results});
  }catch(e){return res.status(500).json({error:"SEARCH_FAILED"})}
}