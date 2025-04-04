import * as generator from './generator.js'

export class Station extends generator.MapGenerator{
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
    let c=this.close(this.center,rooms).point
    rooms.sort((rooma,roomb)=>rooma.point.distance(c)-roomb.point.distance(c))
    for(let i=1;i<rooms.length;i+=1){
      let rooma=rooms[i]
      let roomb=this.close(rooma.point,rooms.slice(0,i))
      this.connect(roomb,rooma)
    }
  }
}
