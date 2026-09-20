export default async function handler(req,res){
 const token=process.env.TMDB_READ_TOKEN;if(!token)return res.status(503).json({error:"TMDB_NOT_CONFIGURED"});
 const q=String(req.query.q||"").trim(),mode=String(req.query.mode||"").trim(),mood=String(req.query.mood||"").trim();
 try{
  let url;
  if(mood){
   const moods={cry:{genres:"18|10749",sort:"vote_average.desc",votes:"150"},easy:{genres:"35|10751|16",sort:"popularity.desc",votes:"80"},uplift:{genres:"35|12|10751",sort:"popularity.desc",votes:"100"},deep:{genres:"18|9648|36",sort:"vote_average.desc",votes:"200"},cozy:{genres:"18|35|10749",sort:"vote_average.desc",votes:"120"},group:{genres:"12|35|16|10751",sort:"popularity.desc",votes:"100"}};let m=moods[mood]||moods.cozy;url=new URL("https://api.themoviedb.org/3/discover/movie");url.searchParams.set("language","ja-JP");url.searchParams.set("region","JP");url.searchParams.set("include_adult","false");url.searchParams.set("with_genres",m.genres);url.searchParams.set("sort_by",m.sort);url.searchParams.set("vote_count.gte",m.votes);url.searchParams.set("vote_average.gte","6.2");url.searchParams.set("without_genres","27");
  }else if(mode){
   url=new URL(mode==="now_playing"?"https://api.themoviedb.org/3/movie/now_playing":"https://api.themoviedb.org/3/discover/movie");
   url.searchParams.set("language","ja-JP");url.searchParams.set("region","JP");url.searchParams.set("include_adult","false");
   if(mode==="latest"){url.searchParams.set("sort_by","primary_release_date.desc");url.searchParams.set("release_date.lte",new Date().toISOString().slice(0,10));url.searchParams.set("vote_count.gte","5")}
   if(mode==="streaming"){url.searchParams.set("sort_by","popularity.desc");url.searchParams.set("watch_region","JP");url.searchParams.set("with_watch_monetization_types","flatrate");url.searchParams.set("primary_release_date.gte","2024-01-01")}
  }else{
   if(!q)return res.status(400).json({error:"QUERY_REQUIRED"});url=new URL("https://api.themoviedb.org/3/search/multi");url.searchParams.set("query",q);url.searchParams.set("language","ja-JP");url.searchParams.set("include_adult","false")
  }
  const r=await fetch(url,{headers:{Authorization:"Bearer "+token,accept:"application/json"}});if(!r.ok)return res.status(r.status).json({error:"TMDB_ERROR"});
  const d=await r.json();const results=(d.results||[]).filter(x=>!x.media_type||x.media_type==="movie"||x.media_type==="tv").slice(0,20).map(x=>({id:x.id,type:x.media_type||"movie",title:x.title||x.name,originalTitle:x.original_title||x.original_name||"",date:x.release_date||x.first_air_date||"",overview:x.overview||"",poster:x.poster_path?"https://image.tmdb.org/t/p/w342"+x.poster_path:"",backdrop:x.backdrop_path?"https://image.tmdb.org/t/p/w780"+x.backdrop_path:"",rating:x.vote_average||0,popularity:x.popularity||0}));
  res.setHeader("Cache-Control","s-maxage=900, stale-while-revalidate=3600");return res.status(200).json({results,mode:mode||"search"})
 }catch(e){return res.status(500).json({error:"SEARCH_FAILED"})}
}