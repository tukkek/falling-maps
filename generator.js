import * as rpg from './libraries/rpg.js'
import * as point from './libraries/point.js'
import './libraries/astar.js'

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
    this.turns=[0,3]
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

  seek(x){
    for(let y=this.height-1;y>=0;y-=1)
      if(this.placed.find((room)=>room.enter(x,y))) return y
    return 0
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
      for(let i=0;i<turns;i+=1) this.turn()
      let p=rpg.pick(this.placed)
      let x=p.point.x
      let xs=Array.from(new Array(3),()=>rpg.roll(x-r.width+1,x+p.width-1))
      x=xs.reduce((x1,x2)=>this.seek(x1)<this.seek(x2)?x1:x2)
      r.place(new point.Point(x,this.height-r.height))
      if(placed.find((room)=>room.bump(r,m))) throw "can't place new room"
      return true
    }
    let p=r.point
    p.y-=1
    if(!placed.find((room)=>room.bump(r,m))) return true
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
    ways.push(...this.path.find(a,b).filter((point)=>!ways.includes(point)))
    joined.push(roomb)
    return true
  }

  *watch(){
    while(this.fall()) yield
    while(this.join()) yield
  }

  make(){for(let step of this.watch()) continue}

  time(){return new Date().getTime()}

  clock(){
    let t=this.time()
    this.make()
    return this.time()-t
  }
}
