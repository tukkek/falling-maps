import * as rpg from '../libraries/rpg.js'
import * as point from '../libraries/point.js'
import '../libraries/astar.js'

class Path{
  constructor(generator){
    let w=generator.width
    let h=generator.height
    let graph=Array.from(new Array(w),()=>new Array(h))
    for(let x=0;x<w;x+=1) for(let y=0;y<h;y+=1) graph[x][y]=1
    this.graph=new Graph(graph)
    this.generator=generator
  }

  enter(point){return this.generator.rooms.find((r)=>r.enter(point.x,point.y))}

  clean(points){//allows in-door paths only when going from in- to out-side or vice-versa
    let clean=[]
    for(let i=0;i<points.length;i++){
      if((i<points.length-1&&this.enter(points[i])&&!this.enter(points[i+1]))
          ||(!this.enter(points[i]))
          ||(i>0&&!this.enter(points[i-1])&&this.enter(points[i])))
        clean.push(points[i])
    }
    return clean
  }

  find(pointa,pointb){
    let graph=this.graph
    let grid=graph.grid
    pointa=grid[pointa.x][pointa.y]
    pointb=grid[pointb.x][pointb.y]
    let path=astar.search(graph,pointa,pointb).map((o)=>new point.Point(o.x,o.y))
    return this.clean(path)
  }
}

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

  bump(room,margin=0){
    let b=room.point
    let bx=b.x
    let by=b.y
    for(let x=bx;x<bx+room.width;x+=1) for(let y=by;y<by+room.height;y+=1)
      if(this.enter(x,y,margin)) return true
    return false
  }

  get x(){return this.point.x}

  get y(){return this.point.y}

  turn(mapwidth,mapheight){
    let w=this.width
    let h=this.height
    let x=this.y
    let y=mapheight-this.x-w
    this.point=new point.Point(x,y)
    this.width=h
    this.height=w
  }
}

export class MapGenerator{
  constructor(width,height,rooms=[]){
    this.rooms=rpg.shuffle(rooms,true)
    this.width=width
    this.height=height
    this.placed=[]
    this.center=new point.Point(Math.round(width/2),Math.round(height/2))
    this.joined=[]
    this.ways=[]//ways that over-lap with rooms are meant to be doors
    this.path=new Path(this)
    this.margin=3
    this.turns=[1,1]
    this.targets=3
    this.border=1
  }

  seek(x){
    for(let y=this.height-1;y>=0;y-=1)
      if(this.placed.find((room)=>room.enter(x,y))) return y
    return 0
  }

  //mostly random regardless of targets as can't distinguish between a gap that fits or not
  aim(room){
    let range=this.placed.map((room)=>[room.x,room.x+room.width])
                .flat().sort((a,b)=>a<b?-1:+1)
    let m=this.margin
    let w=room.width
    range=[Math.max(range[0]-w-m+1,0),
            Math.min(range[range.length-1]+m-1,this.width-w)]
    let targets=[]
    for(let x=range[0];x<range[1];x+=1) targets.push(x)
    targets=rpg.shuffle(targets).slice(0,this.targets)
    return targets.reduce((x1,x2)=>this.seek(x1)<this.seek(x2)?x1:x2)
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
    let m=this.margin+1
    if(r.point.x==-1){
      let turns=this.turns
      turns=rpg.roll(turns[0],turns[1])
      for(let i=0;i<turns;i+=1) for(let room of this.placed) room.turn(this.width,this.height)
      r.place(new point.Point(this.aim(r),this.height-r.height))
      if(placed.find((room)=>room.bump(r,m))) throw "can't place new room"
      return true
    }
    let p=r.point
    p.y-=1
    if(!placed.find((room)=>room.bump(r,m))) return true
    placed.push(r)
    return true
  }

  connect(rooma,roomb){
    let centers=[rooma,roomb].map((r)=>r.center())
    let ways=this.ways
    for(let point of this.path.find(centers[0],centers[1]))
      if(!ways.find((waypoint)=>waypoint.equals(point))) ways.push(point)
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
    this.connect(rooma,roomb)
    joined.push(roomb)
    return true
  }

  *watch(){
    while(this.fall()) yield this.fall
    this.pack(this.border)
    yield this.pack
    while(this.join()) yield this.join
  }

  make(){for(let step of this.watch()) continue}

  time(){return new Date().getTime()}

  clock(){
    let t=this.time()
    this.make()
    return this.time()-t
  }

  pack(border){
    let rooms=this.rooms
    let left=rooms.map((r)=>r.x).reduce((x1,x2)=>x1<x2?x1:x2)
    let bottom=rooms.map((r)=>r.y).reduce((y1,y2)=>y1<y2?y1:y2)
    for(let p of [rooms.map((r)=>r.point),this.ways].flat()){
      p.x=p.x-left+border
      p.y=p.y-bottom+border
    }
    this.width=rooms.map((r)=>r.x+r.width).reduce((x1,x2)=>x1>x2?x1:x2)+border
    this.height=rooms.map((r)=>r.y+r.height).reduce((y1,y2)=>y1>y2?y1:y2)+border
  }
}
