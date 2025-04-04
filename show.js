import * as generatorm from './code/generator.js'
import * as rpg from './libraries/rpg.js'

const INCREMENT=3
const CELL=document.querySelector('template#cell').content.children[0]
const DEBUG=new URLSearchParams(document.location.search).has('debug')

var cells=[]
var filled=new Set()
var steps=0

function size(){
  let dimension=INCREMENT+2
  while(rpg.chance(3)) dimension+=INCREMENT
  return dimension
}

function place(generator){
  let m=document.querySelector('#map')
  m.innerHTML=''
  let w=generator.width
  let h=generator.height
  let px=rpg.round(window.innerHeight/(Math.max(w,h)))
  if(px<1) px=1
  px=`${px}px`
  cells=Array.from(new Array(w),()=>new Array(h))
  for(let y=h-1;y>=0;y-=1) for(let x=0;x<w;x+=1){
    let c=CELL.cloneNode(true)
    let s=c.style
    s['width']=px
    s['height']=px
    m.appendChild(c)
    cells[x][y]=c
  }
  m.style['grid-template-columns']=`repeat(${w},auto)`
}

async function draw(generator,skip=true){
  steps+=1
  if(skip&&steps%5!=0) return Promise.resolve()
  for(let cell of filled) cell.style['background-color']=''
  filled.clear()
  for(let room of generator.rooms.filter((r)=>r.point.x!=-1)){
    let p=room.point
    for(let x=p.x;x<p.x+room.width;x+=1) for(let y=p.y;y<p.y+room.height;y+=1){
      let c=cells[x][y]
      filled.add(c)
      c.style['background-color']='black'
    }
  }
  for(let point of generator.ways){
    let c=cells[point.x][point.y]
    filled.add(c)
    c.style['background-color']='grey'
  }
  await delay()
  return Promise.resolve()
}

function delay(){return new Promise((done)=>setTimeout(done,100))}

export async function ready(){
  let generator=false
  let nrooms=rpg.dice(5,6)
  while(!generator){
    let rooms=[]
    while(rooms.length<nrooms) rooms.push(new generatorm.Room(size(),size()))
    generator=new generatorm.MapGenerator(200,200,rooms)
  }
  if(DEBUG){
    generator.make()
    place(generator)
  }else{
    place(generator)
    for(let step of generator.watch()){
      if(step==generator.pack) place(generator)
      await draw(generator,step==generator.fall)
    }
  }
  draw(generator,false)
}
