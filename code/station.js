import * as generator from './generator.js'
import * as pointm from '../libraries/point.js'

export class Station extends generator.MapGenerator{
  constructor(width,height,rooms){
    super(width,height,rooms)
    this.hub=false
    this.floors=[]
    this.graph=Array.from(new Array(width),()=>new Array(height).fill(0))
    this.border=10
  }

  close(point,rooms){
    return rooms.reduce((a,b)=>(Math.abs(a.point.x-point.x)+Math.abs(a.point.y-point.y))
                                <(Math.abs(b.point.x-point.x)+Math.abs(b.point.y-point.y))
                                ?a:b)
  }

  connect(rooma,roomb){
    let pointa=rooma.center()
    let pointb=roomb.center()
    let path=[pointa.clone()]
    while(!pointa.equals(pointb)){
      let ax=pointa.x
      let ay=pointa.y
      let bx=pointb.x
      let by=pointb.y
      let distances=[ax-bx,ay-by].map((distance)=>Math.abs(distance))
      if(distances[0]<=distances[1]||distances[1]==0){
        if(ax<bx) pointa.x+=1
        else if(ax>bx)pointa.x-=1
      }
      if(distances[1]<distances[0]||distances[0]==0){
        if(ay<by) pointa.y+=1
        else if(ay>by) pointa.y-=1
      }
      path.push(pointa.clone())
    }
    let ways=this.ways
    for(let point of this.path.clean(path))
      if(!ways.find((waypoint)=>waypoint.equals(point))) ways.push(point)
  }

  join(){
    let rooms=Array.from(this.rooms)
    let hub=this.close(this.center,rooms)
    this.hub=hub
    let c=hub.center()
    rooms.sort((rooma,roomb)=>rooma.point.distance(c)-roomb.point.distance(c))
    for(let i=1;i<rooms.length;i+=1){
      let rooma=rooms[i]
      let roomb=this.close(rooma.point,rooms.slice(0,i))
      this.connect(rooma,roomb)
    }
    this.floor()
  }

  done(){
    let hub=this.hub
    for(let point of this.floors) this.graph[point.x][point.y]=1
    for(let r of this.rooms) if(r!=hub){
      let p=this.path.find(hub.center(),r.center(),new Graph(this.graph),false)
      if(p.length==0) return false
    }
    return true
  }

  floor(){
    let floors=this.floors
    floors.push(...this.rooms.map((room)=>room.center()))
    while(!this.done()){
      for(let point of Array.from(floors)){
        let expand=[new pointm.Point(point.x+1,point.y),
                    new pointm.Point(point.x,point.y+1),
                    new pointm.Point(point.x-1,point.y),
                    new pointm.Point(point.x,point.y-1)]
        for(let e of expand)
          if(e.validate([0,this.width],[0,this.height]))
            if(!floors.find((f)=>f.equals(e)))
              floors.push(e)
      }
    }
  }
}
