export default async function handler(req,res){
 const token=process.env.TMDB_READ_TOKEN;if(!token)return res.status(503).json({error:"TMDB_NOT_CONFIGURED"});
 const q=String(req.query.q||"").trim(),mode=String(req.query.mode||"").trim(),mood=String(req.query.mood||"").trim(),person=String(req.query.person||"").trim(),memory=String(req.query.memory||"").trim(),year=String(req.query.year||"").trim(),genre=String(req.query.genre||"").trim();
 try{
  let url,isPerson=false;
  if(memory){
   const genreMap={"アクション":"28","冒険":"12","アニメ":"16","コメディ":"35","犯罪":"80","ドキュメンタリー":"99","ドラマ":"18","ファミリー":"10751","ファンタジー":"14","歴史":"36","ホラー":"27","音楽":"10402","ミステリー":"9648","恋愛":"10749","SF":"878","サスペンス":"53","戦争":"10752","西部劇":"37"};
   let inferredYear=year,inferredGenre=genre;
   if(!inferredYear){let ym=memory.match(/(?:19|20)\d{2}/);if(ym)inferredYear=ym[0]}
   if(!inferredGenre){inferredGenre=Object.keys(genreMap).find(g=>memory.toUpperCase().includes(g.toUpperCase()))||""}
   let keywordIds="",terms=memory.replace(/(?:19|20)\d{2}年?/g,"").replace(new RegExp(inferredGenre,"gi"),"").replace(/映画|アカデミー賞|受賞|とった|獲った|くらい|頃|年代/g," ").trim().split(/[、,。\s]+/).filter(x=>x.length>=2).slice(0,3);
   for(const term of terms){let ku=new URL("https://api.themoviedb.org/3/search/keyword");ku.searchParams.set("query",term);ku.searchParams.set("page","1");let kr=await fetch(ku,{headers:{Authorization:"Bearer "+token,accept:"application/json"}});if(kr.ok){let kd=await kr.json();let ids=(kd.results||[]).slice(0,2).map(x=>x.id);if(ids.length){keywordIds=ids.join("|");break}}}
   url=new URL("https://api.themoviedb.org/3/discover/movie");url.searchParams.set("language","ja-JP");url.searchParams.set("region","JP");url.searchParams.set("include_adult","false");url.searchParams.set("sort_by","popularity.desc");url.searchParams.set("vote_count.gte","20");
   if(keywordIds)url.searchParams.set("with_keywords",keywordIds);if(genreMap[inferredGenre])url.searchParams.set("with_genres",genreMap[inferredGenre]);
   if(inferredYear){if(/^\d{4}$/.test(inferredYear)){let y=parseInt(inferredYear),approx=new RegExp(y+"年?(頃|ごろ|くらい|前後|あたり)").test(memory);if(approx){url.searchParams.set("primary_release_date.gte",(y-2)+"-01-01");url.searchParams.set("primary_release_date.lte",(y+2)+"-12-31")}else{url.searchParams.set("primary_release_year",String(y))}}else if(/^\d{4}s$/.test(inferredYear)){let y=parseInt(inferredYear);url.searchParams.set("primary_release_date.gte",y+"-01-01");url.searchParams.set("primary_release_date.lte",(y+9)+"-12-31")}}
   if(!keywordIds&&!genreMap[inferredGenre]&&!inferredYear){url.searchParams.set("primary_release_date.lte",new Date().toISOString().slice(0,10));url.searchParams.set("vote_count.gte","100")}
  }else if(person){isPerson=true;url=new URL("https://api.themoviedb.org/3/search/person");url.searchParams.set("query",person);url.searchParams.set("language","ja-JP");url.searchParams.set("include_adult","false");
  }else if(mood){
   const moods={
    cry:{genres:"18|10749",sort:"vote_average.desc",votes:"250",rating:"6.8",without:"27|35|10751",runtime:"165"},
    easy:{genres:"35|10751|16",sort:"popularity.desc",votes:"150",rating:"6.3",without:"27|53|80|10752",runtime:"125"},
    uplift:{genres:"35|12|10751|10402",sort:"popularity.desc",votes:"180",rating:"6.5",without:"27|53",runtime:"145"},
    deep:{genres:"18|9648|36|878",sort:"vote_average.desc",votes:"350",rating:"7.0",without:"27|10751",runtime:"210"},
    cozy:{genres:"35|10749|16|10751",sort:"vote_average.desc",votes:"180",rating:"6.6",without:"27|53|80|10752",runtime:"135"},
    group:{genres:"12|35|16|10751",sort:"popularity.desc",votes:"250",rating:"6.5",without:"27|53|80",runtime:"150"}
   };let m=moods[mood]||moods.cozy;url=new URL("https://api.themoviedb.org/3/discover/movie");url.searchParams.set("language","ja-JP");url.searchParams.set("region","JP");url.searchParams.set("include_adult","false");url.searchParams.set("with_genres",m.genres);url.searchParams.set("sort_by",m.sort);url.searchParams.set("vote_count.gte",m.votes);url.searchParams.set("vote_average.gte",m.rating);url.searchParams.set("without_genres",m.without);url.searchParams.set("with_runtime.lte",m.runtime);url.searchParams.set("primary_release_date.lte",new Date().toISOString().slice(0,10));
  }else if(mode){
   url=new URL(mode==="now_playing"?"https://api.themoviedb.org/3/movie/now_playing":"https://api.themoviedb.org/3/discover/movie");
   url.searchParams.set("language","ja-JP");url.searchParams.set("region","JP");url.searchParams.set("include_adult","false");
   if(mode==="latest"){url.searchParams.set("sort_by","primary_release_date.desc");url.searchParams.set("release_date.lte",new Date().toISOString().slice(0,10));url.searchParams.set("vote_count.gte","5")}
   if(mode==="streaming"){url.searchParams.set("sort_by","popularity.desc");url.searchParams.set("watch_region","JP");url.searchParams.set("with_watch_monetization_types","flatrate");url.searchParams.set("primary_release_date.gte","2024-01-01")}
  }else{
   if(!q)return res.status(400).json({error:"QUERY_REQUIRED"});url=new URL("https://api.themoviedb.org/3/search/multi");url.searchParams.set("query",q);url.searchParams.set("language","ja-JP");url.searchParams.set("include_adult","false")
  }
  const r=await fetch(url,{headers:{Authorization:"Bearer "+token,accept:"application/json"}});if(!r.ok)return res.status(r.status).json({error:"TMDB_ERROR"});
  const d=await r.json();if(isPerson){const people=(d.results||[]).slice(0,20).map(x=>({id:x.id,name:x.name||"",profile:x.profile_path?"https://image.tmdb.org/t/p/w185"+x.profile_path:"",knownFor:(x.known_for||[]).map(y=>y.title||y.name).filter(Boolean).slice(0,3)}));res.setHeader("Cache-Control","s-maxage=900, stale-while-revalidate=3600");return res.status(200).json({people})}const results=(d.results||[]).filter(x=>!x.media_type||x.media_type==="movie"||x.media_type==="tv").slice(0,20).map(x=>({id:x.id,type:x.media_type||"movie",title:x.title||x.name,originalTitle:x.original_title||x.original_name||"",date:x.release_date||x.first_air_date||"",overview:x.overview||"",poster:x.poster_path?"https://image.tmdb.org/t/p/w342"+x.poster_path:"",backdrop:x.backdrop_path?"https://image.tmdb.org/t/p/w780"+x.backdrop_path:"",rating:x.vote_average||0,popularity:x.popularity||0}));
  res.setHeader("Cache-Control","s-maxage=900, stale-while-revalidate=3600");return res.status(200).json({results,mode:mode||"search"})
 }catch(e){return res.status(500).json({error:"SEARCH_FAILED"})}
}