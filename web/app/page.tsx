"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import catalog from "../public/data/books.json";

type Book = { id:number; title:string; author:string; publisher:string; year:number|null; genre:string; language:string; shelf:string; confidence:"확인"|"검토 필요"; color:string; rating:number; hidden:boolean; sourcePhoto?:string };
const PASSWORD_HASH="b5ac8ff9fde613ff3122ffcab1cb500a6a18aa1464ca10d69a0b2e7c690a79d2";

async function hashPassword(value:string){
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,"0")).join("");
}

function PasswordGate({onUnlock}:{onUnlock:()=>void}){
  const [password,setPassword]=useState(""),[error,setError]=useState(false),[busy,setBusy]=useState(false);
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(password.length!==4)return;
    setBusy(true);
    const valid=await hashPassword(password)===PASSWORD_HASH;
    if(valid){sessionStorage.setItem("bookshelf-access",PASSWORD_HASH);onUnlock()}
    else{setError(true);setPassword("");setBusy(false)}
  };
  return <main className="gate-shell"><form className="gate-card" onSubmit={submit}>
    <div className="gate-mark">책</div>
    <p>PRIVATE LIBRARY</p>
    <h1>책장</h1>
    <span>비밀번호 4자리를 입력해 주세요.</span>
    <input autoFocus aria-label="책장 비밀번호" inputMode="numeric" pattern="[0-9]*" autoComplete="current-password" maxLength={4} value={password} onChange={e=>{setPassword(e.target.value.replace(/\D/g,"").slice(0,4));setError(false)}} placeholder="••••" />
    <button disabled={password.length!==4||busy}>{busy?"확인 중…":"책장 열기"}</button>
    <small aria-live="polite">{error?"비밀번호가 맞지 않습니다.":"등록된 사용자만 열람할 수 있습니다."}</small>
  </form></main>
}

const sampleSeed: Book[] = [
  {id:1,title:"회사를 믿고 떠난 한 달 살기",author:"조혜원 외",publisher:"글로벌미디어",year:2022,genre:"여행",language:"한국어",shelf:"서재 A-1",confidence:"확인",color:"#e7bd67",rating:4,hidden:false},
  {id:2,title:"여행이 아니면 알 수 없는 것들",author:"손미나",publisher:"씨네21북스",year:2016,genre:"여행",language:"한국어",shelf:"서재 A-1",confidence:"확인",color:"#dfe7de",rating:5,hidden:false},
  {id:3,title:"여행은 최고의 공부다",author:"안시준",publisher:"알에이치코리아",year:2016,genre:"여행",language:"한국어",shelf:"서재 A-1",confidence:"확인",color:"#dcc8a4",rating:3,hidden:false},
  {id:4,title:"제 마음대로 살아보겠습니다",author:"이원지",publisher:"상상출판",year:2019,genre:"에세이",language:"한국어",shelf:"서재 A-1",confidence:"확인",color:"#2e91b8",rating:4,hidden:false},
  {id:5,title:"Speak Tibetan",author:"Dhondup Tsering",publisher:"Paljor",year:2012,genre:"언어",language:"영어",shelf:"서재 A-1",confidence:"검토 필요",color:"#d46678",rating:0,hidden:false},
  {id:6,title:"Guide to Learn Ladakhi Language",author:"Samyukta Koshal",publisher:"Manish & Co.",year:2015,genre:"언어",language:"영어",shelf:"서재 A-1",confidence:"확인",color:"#7fa7b5",rating:4,hidden:false},
  {id:7,title:"Peep Peep Don't Sleep",author:"Ajay Jain",publisher:"Kunzum",year:2019,genre:"여행",language:"영어",shelf:"서재 A-1",confidence:"확인",color:"#dfa73d",rating:3,hidden:false},
  {id:8,title:"Beyond Religion",author:"Dalai Lama",publisher:"Element",year:2011,genre:"철학",language:"영어",shelf:"서재 A-1",confidence:"확인",color:"#85424d",rating:5,hidden:false},
  {id:9,title:"괜찮아, 사랑이야",author:"노희경",publisher:"북로그컴퍼니",year:2014,genre:"문학",language:"한국어",shelf:"서재 B-2",confidence:"확인",color:"#d7d1c1",rating:4,hidden:false},
  {id:10,title:"프렌즈 타이완",author:"조영권",publisher:"중앙북스",year:2020,genre:"여행",language:"한국어",shelf:"서재 C-1",confidence:"확인",color:"#edc632",rating:2,hidden:false},
  {id:11,title:"영감의 글쓰기",author:"김다은",publisher:"무블출판사",year:2022,genre:"글쓰기",language:"한국어",shelf:"서재 C-1",confidence:"확인",color:"#dbe2d9",rating:0,hidden:false},
  {id:12,title:"내정자의 열정 사이",author:"Rosso",publisher:"지식과감성",year:2021,genre:"에세이",language:"한국어",shelf:"서재 C-1",confidence:"검토 필요",color:"#d6a7b1",rating:0,hidden:false},
  {id:13,title:"대중을 사로잡는 장르별 플롯",author:"마루야마 무쿠",publisher:"지상사",year:2020,genre:"글쓰기",language:"한국어",shelf:"서재 C-1",confidence:"확인",color:"#293a67",rating:4,hidden:false},
  {id:14,title:"변호인 일기",author:"김중배",publisher:"메디치",year:2015,genre:"사회",language:"한국어",shelf:"서재 C-1",confidence:"검토 필요",color:"#e2d3c3",rating:0,hidden:false},
];
const seed = catalog as Book[];
void sampleSeed;

const mapKeys = ["genre","author","publisher","year","language","shelf"] as const;
const keyLabel:Record<string,string>={genre:"장르",author:"저자",publisher:"출판사",year:"출판 연도",language:"언어",shelf:"책장 위치"};

function Stars({value,onChange}:{value:number,onChange:(v:number)=>void}) { return <div className="stars" aria-label={`별점 ${value}점`}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>onChange(n===value?0:n)} aria-label={`${n}점`} className={n<=value?"on":""}>★</button>)}</div> }

function MapView({books,mapKey}:{books:Book[],mapKey:typeof mapKeys[number]}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return; const box=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    canvas.width=box.width*dpr;canvas.height=box.height*dpr;const c=canvas.getContext("2d")!;c.scale(dpr,dpr);c.clearRect(0,0,box.width,box.height);
    const values=[...new Set(books.map(b=>String(b[mapKey])))]; const center={x:box.width/2,y:box.height/2};
    const groups=values.map((v,i)=>({v,x:center.x+Math.cos((i/values.length)*Math.PI*2)*Math.min(box.width*.31,270),y:center.y+Math.sin((i/values.length)*Math.PI*2)*Math.min(box.height*.32,180)}));
    const nodes=books.map((b,i)=>{const g=groups.find(g=>g.v===String(b[mapKey]))!;const same=books.filter(x=>String(x[mapKey])===g.v);const j=same.indexOf(b);const angle=(j/same.length)*Math.PI*2;return{b,x:g.x+Math.cos(angle)*Math.min(82,35+same.length*7),y:g.y+Math.sin(angle)*Math.min(65,30+same.length*5),g}});
    c.lineWidth=1;c.strokeStyle="#d7ccbb";nodes.forEach(n=>{c.beginPath();c.moveTo(n.x,n.y);c.lineTo(n.g.x,n.g.y);c.stroke()});
    groups.forEach(g=>{c.fillStyle="#213e36";c.beginPath();c.arc(g.x,g.y,25,0,Math.PI*2);c.fill();c.fillStyle="#fff";c.font="600 11px Arial";c.textAlign="center";c.fillText(g.v.length>8?g.v.slice(0,8)+"…":g.v,g.x,g.y+4)});
    nodes.forEach(n=>{c.fillStyle=n.b.color;c.beginPath();c.arc(n.x,n.y,10,0,Math.PI*2);c.fill();c.strokeStyle="#fff";c.lineWidth=2;c.stroke();c.fillStyle="#4b4238";c.font="11px Arial";c.textAlign="center";c.fillText(n.b.title.length>10?n.b.title.slice(0,10)+"…":n.b.title,n.x,n.y+24)});
  },[books,mapKey]);
  return <div className="map-wrap"><canvas ref={ref}/><div className="legend"><i/>책 <b/>연결 기준</div></div>
}

const newBooks = [
  {title:"혼모노",author:"성해나",publisher:"창비",year:2025,genre:"소설",why:"한국소설과 문예지를 높게 평가한 경우"},
  {title:"나의 미래에게",author:"장아미",publisher:"창비",year:2025,genre:"SF",why:"김초엽·천선란과 한국 SF를 좋아한 경우"},
  {title:"대온실 수리 보고서",author:"김금희",publisher:"창비",year:2024,genre:"소설",why:"김금희와 현대 한국소설을 좋아한 경우"},
  {title:"넥서스",author:"유발 하라리",publisher:"김영사",year:2024,genre:"교양",why:"과학·역사·사회 교양을 좋아한 경우"},
  {title:"몸, 내 안의 우주",author:"남궁인",publisher:"문학동네",year:2025,genre:"과학",why:"과학 교양과 인간 이야기를 좋아한 경우"},
];

function saveFile(name:string,content:string,type="text/plain;charset=utf-8"){
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);
}

export default function Home(){
  const [unlocked,setUnlocked]=useState(false),[accessChecked,setAccessChecked]=useState(false);
  const [books,setBooks]=useState<Book[]>(seed),[view,setView]=useState<"list"|"map"|"recommend">("list"),[query,setQuery]=useState(""),[genre,setGenre]=useState("전체"),[mapKey,setMapKey]=useState<typeof mapKeys[number]>("genre"),[showHidden,setShowHidden]=useState(false);
  useEffect(()=>{setUnlocked(sessionStorage.getItem("bookshelf-access")===PASSWORD_HASH);setAccessChecked(true)},[]);
  useEffect(()=>{const saved=localStorage.getItem("damso-books");if(saved)try{const old:Book[]=JSON.parse(saved);setBooks(seed.map(b=>({...b,...(old.find(o=>o.id===b.id||o.title===b.title)||{})}))) }catch{}},[]);
  useEffect(()=>{localStorage.setItem("damso-books",JSON.stringify(books))},[books]);
  const update=(id:number,patch:Partial<Book>)=>setBooks(bs=>bs.map(b=>b.id===id?{...b,...patch}:b));
  const reviewBook=(b:Book)=>{const title=prompt("책 제목",b.title);if(!title)return;const author=prompt("저자",b.author)??b.author;const publisher=prompt("출판사",b.publisher)??b.publisher;const year=prompt("출판 연도",b.year?String(b.year):"");const nextGenre=prompt("장르",b.genre)??b.genre;update(b.id,{title,author,publisher,year:year?Number(year):null,genre:nextGenre,confidence:"확인"})};
  const exportCsv=()=>{const cols=["title","author","publisher","year","genre","language","shelf","rating","hidden","confidence","sourcePhoto"] as const;const q=(v:unknown)=>`"${String(v??"").replaceAll('"','""')}"`;saveFile("bookshelf.csv",[cols.join(","),...books.map(b=>cols.map(c=>q(b[c])).join(","))].join("\n"),"text/csv;charset=utf-8")};
  const exportObsidian=()=>{const text=books.map(b=>`---\ntitle: "${b.title.replaceAll('"','\\"')}"\nauthor: "${b.author}"\npublisher: "${b.publisher}"\nyear: ${b.year??""}\ngenre: "${b.genre}"\nlanguage: "${b.language}"\nshelf: "${b.shelf}"\nrating: ${b.rating}\nhidden: ${b.hidden}\nstatus: "${b.confidence}"\nsource_photo: "${b.sourcePhoto??""}"\n---\n\n# ${b.title}\n`).join("\n---book---\n\n");saveFile("Bookshelf-Obsidian.md",text)};
  const genres=["전체",...new Set(books.map(b=>b.genre))];
  const visible=useMemo(()=>books.filter(b=>(showHidden||!b.hidden)&&(genre==="전체"||b.genre===genre)&&(`${b.title} ${b.author} ${b.publisher}`.toLowerCase().includes(query.toLowerCase()))),[books,showHidden,genre,query]);
  const active=books.filter(b=>!b.hidden),rated=active.filter(b=>b.rating),reviews=books.filter(b=>b.confidence==="검토 필요"&&!b.hidden).length;
  const favoriteGenres=new Set(rated.filter(b=>b.rating>=4).map(b=>b.genre));
  const recommended=[...newBooks].sort((a,b)=>Number(favoriteGenres.has(b.genre))-Number(favoriteGenres.has(a.genre)));
  const title=view==="list"?"내 책장":view==="map"?"책들의 관계 지도":"취향을 닮은 새 책";
  if(!accessChecked)return <main className="gate-shell"/>;
  if(!unlocked)return <PasswordGate onUnlock={()=>setUnlocked(true)}/>;
  return <main>
    <aside><div className="brand"><span>책</span><div>책장<small>책과 취향이 머무는 곳</small></div></div><nav><button className={view==="list"?"active":""} onClick={()=>setView("list")}>▤ <span>내 책장</span><em>{active.length}</em></button><button className={view==="map"?"active":""} onClick={()=>setView("map")}>✣ <span>관계 지도</span></button><button className={view==="recommend"?"active":""} onClick={()=>setView("recommend")}>✦ <span>추천 책</span><small>취향 기반</small></button></nav><div className="sync"><b>사진 자동 수집</b><span><i/>Photos 폴더 연결됨</span><p>23장 인식 완료</p></div></aside>
    <section className="content"><header><div><p>2026년 7월 21일</p><h1>{title}</h1><span>{view==="list"?"사진에서 발견한 책을 한곳에서 살펴보세요.":view==="map"?"같은 취향의 책들이 어떻게 이어지는지 살펴보세요.":"별점이 쌓일수록 추천 순서가 더 내 취향에 가까워집니다."}</span></div><button className="scan" onClick={()=>alert("로컬 폴더에서 '책장 업데이트'를 실행하면 새 사진만 자동으로 반영됩니다.")}>↻ 새 사진 확인</button></header>
      <div className="stats"><article><span>보유 도서</span><strong>{active.length}<small>권</small></strong><p>사진 23장 기준</p></article><article><span>별점 등록</span><strong>{rated.length}<small>권</small></strong><p>평균 {rated.length?(rated.reduce((s,b)=>s+b.rating,0)/rated.length).toFixed(1):"-"}점</p></article><article className={reviews?"notice":""}><span>확인할 책</span><strong>{reviews}<small>권</small></strong><p>제목·정보 검토 필요</p></article></div>
      <div className="toolbar"><div className="tabs"><button className={view==="list"?"active":""} onClick={()=>setView("list")}>목록</button><button className={view==="map"?"active":""} onClick={()=>setView("map")}>관계 지도</button><button className={view==="recommend"?"active":""} onClick={()=>setView("recommend")}>추천</button></div>{view==="list"?<><label className="search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="제목, 저자, 출판사 검색"/></label><select value={genre} onChange={e=>setGenre(e.target.value)}>{genres.map(g=><option key={g}>{g}</option>)}</select><button className="export" onClick={exportCsv}>CSV</button><button className="export" onClick={exportObsidian}>Obsidian</button></>:view==="map"?<label className="map-select">연결 기준<select value={mapKey} onChange={e=>setMapKey(e.target.value as typeof mapKey)}>{mapKeys.map(k=><option value={k} key={k}>{keyLabel[k]}</option>)}</select></label>:null}</div>
      {view==="list"?<div className="table-card"><div className="table-title"><b>책 {visible.length}권</b><span>별을 눌러 내 취향을 기록하고, 검토 표시를 눌러 정보를 고치세요.</span></div><div className="book-table"><div className="tr head"><span>도서</span><span>분류</span><span>출판 정보</span><span>내 별점</span><span/></div>{visible.map(b=><div className={`tr ${b.hidden?"hidden-row":""}`} key={b.id}><div className="book"><i style={{background:b.color}}/><div><b>{b.title}</b><span>{b.author}</span>{b.confidence==="검토 필요"&&<button className="review" onClick={()=>reviewBook(b)}>검토 필요</button>}</div></div><div><mark>{b.genre}</mark><small>{b.language} · {b.shelf}</small></div><div className="pub"><b>{b.publisher}</b><span>{b.year??"연도 미확인"}</span></div><Stars value={b.rating} onChange={rating=>update(b.id,{rating})}/><button className="hide" onClick={()=>update(b.id,{hidden:!b.hidden})} title={b.hidden?"숨김 해제":"숨기기"}>{b.hidden?"보기":"숨김"}</button></div>)}</div><button className="hidden-toggle" onClick={()=>setShowHidden(v=>!v)}>{showHidden?"▴ 숨긴 책 닫기":"▾ 숨긴 책 보기"} <span>{books.filter(b=>b.hidden).length}</span></button></div>:view==="map"?<><div className="map-note"><span>{keyLabel[mapKey]}</span>이 같은 책끼리 연결했습니다. 숨긴 책은 지도에 표시되지 않습니다.</div><MapView books={visible} mapKey={mapKey}/></>:<div className="recommend-grid">{recommended.map((b,i)=><article key={b.title} className={favoriteGenres.has(b.genre)?"matched":""}><div className="rank">0{i+1}</div><mark>{b.genre} · {b.year}</mark><h2>{b.title}</h2><p>{b.author} · {b.publisher}</p><small>{favoriteGenres.has(b.genre)?"내 별점에서 발견한 취향":"취향 탐색 추천"} — {b.why}</small></article>)}</div>}
    </section>
  </main>
}
