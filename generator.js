import * as rpg from './libraries/rpg.js'
import * as point from './libraries/point.js'

const INCREMENT=3
const CELL=document.querySelector('template#cell').content.children[0]

//can be extended or its duck-typed
export class Room{
  constructor(width,height){
    this.width=width
    this.height=height
    this.point=new point.Point()
  }

  place(point){this.point=point.clone()}

  center(){
    let p=this.point
    let x=p.x+Math.round(this.width/2)
    let y=p.y+Math.round(this.height/2)
    return new point.Point(x,y)
  }

  enter(x,y,margin=0){
    let p=this.point
    let roomx=p.x
    let roomy=p.y
    return roomx-margin<=x&&x<roomx+this.width+margin
            &&roomy-margin<=y&&y<roomy+this.height+margin
  }

  bump(room){
    let b=room.point
    let bx=b.x
    let by=b.y
    for(let x=bx;x<bx+room.width;x+=1) for(let y=by;y<by+room.height;y+=1)
      if(this.enter(x,y,3)) return true
    return false
  }
}

class MapGenerator{
  constructor(width,height,rooms=[]){
    this.rooms=rpg.shuffle(rooms)
    this.width=width
    this.height=height
    this.placed=[]
    this.center=new point.Point(Math.round(width/2),Math.round(height/2))
    this.joined=[]
    this.ways=[]//ways that over-lap with rooms are meant to be doors
  }

  turn(){
    for(let room of this.placed){
      let p=room.point
      let x=p.x
      let y=p.y
      room.point=new point.Point(y,x)
      let w=room.width
      let h=room.height
      room.width=h
      room.height=w
    }
  }

  fall(){
    let placed=this.placed
    let i=placed.length
    let rooms=this.rooms
    let r=rooms[i]
    if(i==rooms.length) return false
    if(i==0){
      let x=this.center.x-Math.round(r.width/2)
      let y=this.center.y-Math.round(r.height/2)
      r.place(new point.Point(x,y))
      this.placed.push(r)
      return true
    }
    if(r.point.x==-1){
      let turns=rpg.roll(1,4)-1
      for(let i=0;i<turns;i+=1) this.turn()
      let p=rpg.pick(this.placed)
      let x=p.point.x
      x=rpg.roll(x-r.width+1,x+p.width-1)
      r.place(new point.Point(x,this.height-r.height))
      if(placed.find((room)=>room.bump(r))) throw "can't place new room"
      return true
    }
    let p=r.point
    p.y-=1
    if(!placed.find((room)=>room.bump(r))) return true
    // p.y+=3
    placed.push(r)
    return true
  }

  join(){
    let joined=this.joined
    let rooms=this.rooms
    let njoined=joined.length
    if(joined.length==0) joined.push(rooms[0])
    else if(njoined==rooms.length) return false
    let rooma=joined[joined.length-1]
    let a=rooma.center()
    let roomb=rooms.filter((r)=>!joined.includes(r))
                    .sort((rooma,roomb)=>rooma.center().distance(a)
                                          -roomb.center().distance(a))[0]
    let b=roomb.center()
    let ways=this.ways
    while(!a.equals(b)){
      if(a.x<b.x) a.x+=1
      else if(a.x>b.x) a.x-=1
      if(a.y<b.y) a.y+=1
      else if(a.y>b.y) a.y-=1
      if(!ways.find((point)=>point.equals(a)))
        ways.push(a.clone())
    }
    joined.push(roomb)
    return true
  }
1
  clean(){
    let ways=this.ways
    for(let point of Array.from(ways)){
      let x=point.x
      let y=point.y
      let r=this.rooms.find((r)=>r.enter(x,y))
      if(!r) continue
      let p=r.point
      let roomx=p.x
      let roomy=p.y
      if(x==roomx||x==roomx+r.width-1||y==roomy||y==roomy+r.height-1) continue
      ways.splice(ways.indexOf(point),1)
    }
  }

  *make(){
    while(this.fall()) yield
    while(this.join()) yield
    this.clean()
  }
}

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
  let nrooms=20
  while(!generator){
    let rooms=[]
    while(rooms.length<nrooms) rooms.push(new Room(size(),size()))
    generator=new MapGenerator(200,200,rooms)
  }
  place(generator)
  for(let step of generator.make()) await draw(generator)
  draw(generator,false)
}
