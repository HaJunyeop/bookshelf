"use client";

import { useEffect, useRef } from "react";

type MapKey="genre"|"author"|"publisher"|"year"|"language"|"shelf";
type MapBook={id:number;title:string;author:string;publisher:string;year:number|null;genre:string;language:string;shelf:string;color:string};
type Group={value:string;books:MapBook[];family:string;x:number;y:number;radius:number};
type BookNode={book:MapBook;group:Group;x:number;y:number;angle:number};
type FamilyBox={name:string;x:number;y:number;width:number;height:number};
type Layout={width:number;height:number;groups:Group[];nodes:BookNode[];families:FamilyBox[]};

const authorRegions:Record<string,string[]>= {
  "동아시아 작가":["마루야마 무쿠","히가시노 게이고"],
  "남아시아·티베트 작가":["Ajay Jain","Dalai Lama","Dhondup Tsering","Samyukta Koshal"],
  "유럽 작가":["Charles Dickens","단테 알리기에리","베르나르 베르베르","리처드 도킨스","알랭 드 보통","에리히 프롬","올더스 헉슬리","요나스 요나손"],
  "북미 작가":["Jared Diamond","M. 스콧 펙","Michael J. Sandel","Noam Chomsky","Rebecca Stead","Richard A. Spears","W. Phillips Shively","로버트 그린","맥스 브룩스","브라이언 헤어, 버네사 우즈","에리카 바우마이스터","칼 세이건","테드 창","토머스 새비지"],
  "중남미 작가":["J. M. 바스콘셀로스"]
};

function genreFamily(genre:string){
  if(/SF|과학/.test(genre))return "과학·SF";
  if(/소설|문예지|시|고전/.test(genre))return "문학";
  if(/철학|사회|정치|역사|심리|교양|교육/.test(genre))return "인문·사회";
  if(/여행|언어|사진|글쓰기/.test(genre))return "여행·실용";
  return "기타";
}

function mostCommon(values:string[]){
  const counts=new Map<string,number>();
  values.forEach(value=>counts.set(value,(counts.get(value)||0)+1));
  return [...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"ko"))[0]?.[0]||"기타";
}

function authorRegion(author:string){
  if(/Unknown|미확인|편집부/.test(author))return "작가 미확인";
  for(const [region,names] of Object.entries(authorRegions))if(names.includes(author))return region;
  if(/[A-Za-z]/.test(author))return "해외 작가";
  return "한국 작가";
}

function relatedFamily(value:string,books:MapBook[],key:MapKey){
  const dominantGenre=genreFamily(mostCommon(books.map(book=>book.genre)));
  if(key==="author")return `${authorRegion(value)} · ${dominantGenre}`;
  if(key==="publisher"){
    const region=/미확인|Unknown/.test(value)?"출판사 미확인":/[가-힣]/.test(value)?"국내 출판사":"해외 출판사";
    return `${region} · ${dominantGenre}`;
  }
  if(key==="genre")return genreFamily(value);
  if(key==="year")return /^\d{4}$/.test(value)?`${Math.floor(Number(value)/10)*10}년대`:"연도 미확인";
  if(key==="language")return value;
  if(key==="shelf")return value.split(" ")[0]||"위치 미확인";
  return "기타";
}

function ringPosition(index:number,total:number,value:string){
  let remaining=index,ring=0,capacity=8;
  while(remaining>=capacity){remaining-=capacity;ring++;capacity=8+ring*6}
  const seed=[...value].reduce((sum,ch)=>sum+ch.charCodeAt(0),0)%360;
  const angle=(remaining/capacity)*Math.PI*2-Math.PI/2+(seed*Math.PI/180)*.08;
  return {angle,radius:total===1?82:82+ring*50};
}

function groupRadius(count:number){
  let remaining=Math.max(0,count-1),ring=0,capacity=8;
  while(remaining>=capacity){remaining-=capacity;ring++;capacity=8+ring*6}
  return 105+ring*50;
}

function createLayout(books:MapBook[],key:MapKey):Layout{
  const byValue=new Map<string,MapBook[]>();
  books.forEach(book=>{const value=String(book[key]??"미확인");byValue.set(value,[...(byValue.get(value)||[]),book])});
  const groups:Group[]=[...byValue].map(([value,items])=>({value,books:items,family:relatedFamily(value,items,key),x:0,y:0,radius:groupRadius(items.length)}));
  groups.sort((a,b)=>a.family.localeCompare(b.family,"ko")||a.value.localeCompare(b.value,"ko"));
  const byFamily=new Map<string,Group[]>();
  groups.forEach(group=>byFamily.set(group.family,[...(byFamily.get(group.family)||[]),group]));
  const blocks=[...byFamily].map(([name,items])=>{
    const maxRadius=Math.max(...items.map(item=>item.radius));
    const cell=Math.max(285,maxRadius*2+90),columns=Math.min(4,Math.ceil(Math.sqrt(items.length*1.35))),rows=Math.ceil(items.length/columns);
    return {name,items,cell,columns,width:columns*cell+80,height:rows*cell+105,x:0,y:0};
  });
  const targetWidth=Math.max(1900,Math.sqrt(blocks.reduce((sum,block)=>sum+block.width*block.height,0))*1.45);
  let cursorX=55,cursorY=55,rowHeight=0,maxX=0;
  for(const block of blocks){
    if(cursorX>55&&cursorX+block.width>targetWidth){cursorX=55;cursorY+=rowHeight+55;rowHeight=0}
    block.x=cursorX;block.y=cursorY;cursorX+=block.width+55;rowHeight=Math.max(rowHeight,block.height);maxX=Math.max(maxX,cursorX);
    block.items.forEach((group,index)=>{const column=index%block.columns,row=Math.floor(index/block.columns);group.x=block.x+40+column*block.cell+block.cell/2;group.y=block.y+72+row*block.cell+block.cell/2});
  }
  const families:FamilyBox[]=blocks.map(block=>({name:block.name,x:block.x,y:block.y,width:block.width,height:block.height}));
  const nodes:BookNode[]=[];
  groups.forEach(group=>group.books.forEach((book,index)=>{const pos=ringPosition(index,group.books.length,group.value);nodes.push({book,group,x:group.x+Math.cos(pos.angle)*pos.radius,y:group.y+Math.sin(pos.angle)*pos.radius,angle:pos.angle})}));
  return {width:Math.max(maxX+20,targetWidth),height:cursorY+rowHeight+75,groups,nodes,families};
}

export default function MapView({books,mapKey}:{books:MapBook[];mapKey:MapKey}){
  const canvasRef=useRef<HTMLCanvasElement>(null),zoomRef=useRef<(factor:number)=>void>(()=>{}),fitRef=useRef<()=>void>(()=>{});

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const context=canvas.getContext("2d");if(!context)return;
    const layout=createLayout(books,mapKey),view={x:0,y:0,scale:1,minScale:.56,maxScale:2.8};
    const pointers=new Map<number,{x:number;y:number}>();
    let initialized=false,pinch:null|{distance:number;center:{x:number;y:number};x:number;y:number;scale:number}=null;

    const draw=()=>{
      const box=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,s=view.scale;
      context.setTransform(dpr,0,0,dpr,0,0);context.clearRect(0,0,box.width,box.height);
      context.setTransform(dpr*s,0,0,dpr*s,dpr*view.x,dpr*view.y);
      for(const family of layout.families){
        context.fillStyle="#776f64";context.font=`600 ${13/s}px Arial`;context.textAlign="left";context.textBaseline="middle";context.fillText(family.name,family.x+22/s,family.y+29/s);
      }
      context.strokeStyle="#cfc4b5";context.lineWidth=1.1/s;
      layout.nodes.forEach(node=>{context.beginPath();context.moveTo(node.group.x,node.group.y);context.lineTo(node.x,node.y);context.stroke()});
      layout.groups.forEach(group=>{
        context.fillStyle="#213e36";context.beginPath();context.arc(group.x,group.y,22/s,0,Math.PI*2);context.fill();
        context.fillStyle="#273f37";context.font=`600 ${12/s}px Arial`;context.textAlign="center";context.textBaseline="middle";
        const label=group.value.length>18?group.value.slice(0,18)+"…":group.value;context.fillText(label,group.x,group.y+36/s);
        context.fillStyle="#fff";context.font=`600 ${10/s}px Arial`;context.fillText(String(group.books.length),group.x,group.y+.5/s);
      });
      layout.nodes.forEach(node=>{
        context.fillStyle=node.book.color||"#d1c7b8";context.beginPath();context.arc(node.x,node.y,9/s,0,Math.PI*2);context.fill();
        context.strokeStyle="#fff";context.lineWidth=2/s;context.stroke();
        if(s>=.82){
          const dx=Math.cos(node.angle)*15/s,dy=Math.sin(node.angle)*15/s;
          context.fillStyle="#4b4238";context.font=`${11/s}px Arial`;context.textBaseline="middle";context.textAlign=Math.cos(node.angle)>.25?"left":Math.cos(node.angle)<-.25?"right":"center";
          const title=node.book.title.length>17?node.book.title.slice(0,17)+"…":node.book.title;context.fillText(title,node.x+dx,node.y+dy);
        }
      });
    };

    const sizeCanvas=()=>{
      const box=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      canvas.width=Math.max(1,Math.round(box.width*dpr));canvas.height=Math.max(1,Math.round(box.height*dpr));
      if(!initialized){const fit=Math.min(box.width/layout.width,box.height/layout.height)*.92;view.minScale=box.width<600?.62:.56;view.scale=Math.max(view.minScale,Math.min(.74,Math.max(view.minScale*1.08,fit*1.7)));view.x=(box.width-layout.width*view.scale)/2;view.y=(box.height-layout.height*view.scale)/2;initialized=true}
      draw();
    };
    const zoomAt=(factor:number,cx:number,cy:number)=>{const next=Math.min(view.maxScale,Math.max(view.minScale,view.scale*factor)),worldX=(cx-view.x)/view.scale,worldY=(cy-view.y)/view.scale;view.x=cx-worldX*next;view.y=cy-worldY*next;view.scale=next;draw()};
    zoomRef.current=factor=>{const box=canvas.getBoundingClientRect();zoomAt(factor,box.width/2,box.height/2)};
    fitRef.current=()=>{const box=canvas.getBoundingClientRect(),fit=Math.min(box.width/layout.width,box.height/layout.height)*.92;view.scale=Math.max(view.minScale,fit);view.x=(box.width-layout.width*view.scale)/2;view.y=(box.height-layout.height*view.scale)/2;draw()};
    const point=(event:PointerEvent)=>{const box=canvas.getBoundingClientRect();return{x:event.clientX-box.left,y:event.clientY-box.top}};
    const wheel=(event:WheelEvent)=>{event.preventDefault();const box=canvas.getBoundingClientRect();zoomAt(Math.exp(-event.deltaY*.0015),event.clientX-box.left,event.clientY-box.top)};
    const down=(event:PointerEvent)=>{canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,point(event));pinch=null;canvas.classList.add("dragging")};
    const move=(event:PointerEvent)=>{
      if(!pointers.has(event.pointerId))return;const previous=pointers.get(event.pointerId)!,current=point(event);pointers.set(event.pointerId,current);
      if(pointers.size===1){view.x+=current.x-previous.x;view.y+=current.y-previous.y;draw();return}
      const pts=[...pointers.values()],center={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2},distance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      if(!pinch){pinch={distance,center,x:view.x,y:view.y,scale:view.scale};return}
      const next=Math.min(view.maxScale,Math.max(view.minScale,pinch.scale*(distance/pinch.distance))),worldX=(pinch.center.x-pinch.x)/pinch.scale,worldY=(pinch.center.y-pinch.y)/pinch.scale;
      view.scale=next;view.x=center.x-worldX*next;view.y=center.y-worldY*next;draw();
    };
    const up=(event:PointerEvent)=>{pointers.delete(event.pointerId);pinch=null;if(!pointers.size)canvas.classList.remove("dragging")};
    const observer=new ResizeObserver(sizeCanvas);observer.observe(canvas);canvas.addEventListener("wheel",wheel,{passive:false});canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);sizeCanvas();
    return()=>{observer.disconnect();canvas.removeEventListener("wheel",wheel);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up)};
  },[books,mapKey]);

  return <div className="map-wrap">
    <canvas ref={canvasRef} role="img" aria-label={`${mapKey} 기준 책 관계 지도. 확대하거나 이동해서 각 묶음을 확인할 수 있습니다.`}/>
    <div className="map-tools" aria-label="지도 확대와 축소"><button onClick={()=>zoomRef.current(1.28)} aria-label="확대">＋</button><button onClick={()=>zoomRef.current(.78)} aria-label="축소">－</button><button onClick={()=>fitRef.current()}>초기화</button></div>
    <div className="map-help">드래그 이동 · 휠/두 손가락 확대 · 확대하면 제목 표시</div>
    <div className="legend"><i/>책 <b/>연결 기준</div>
  </div>;
}
