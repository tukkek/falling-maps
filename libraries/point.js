// An XY coordinate
export class Point{
  // Create a Point
  constructor(x=-1,y=-1){
    this.x=x
    this.y=y
  }
  
  // Return a new, identical Point
  clone(){return new Point(this.x,this.y)}
  
  // Return a String representation
  toString(){return `${this.x}:${this.y}`}
  
  // True if within [x,x[, [y,y[
  validate(xrange,yrange){
    let x=this.x
    let y=this.y
    return xrange[0]<=x&&x<xrange[1]&&yrange[0]<=y&&y<yrange[1]
  }
  
  // Return neighboring points
  expand(steps=1){
    let expansion=[]
    for(let p of iterate([-steps,+steps+1],[-steps,+steps+1]))
      if(p.x!=0||p.y!=0) expansion.push(new Point(this.x+p.x,this.y+p.y))
    return expansion
  }
  
  // Return Euclidean distance
  distance(point){
    let x=this.x-point.x
    let y=this.y-point.y
    return Math.sqrt(x*x+y*y)
  }
  
  // Return negative coordinates as new point
  get inverted(){return new Point(-this.x,-this.y)}
  
  // Return true if both coordinates are the same
  equals(point){return this.x==point.x&&this.y==point.y}
  
  // Moves one step
  move(diagonal=true){
    let xy=[0,0]
    while(xy[0]==0&&xy[1]==0){
      xy=Array.from(new Array(2),()=>Random.pick([-1,+0,+1]))
      if(!diagonal) xy[Random.roll(0,1)]=0
    }
    this.x+=xy[0]
    this.y+=xy[1]
  }
}

// Utility class
class Random{
  static generate=Math.random

  static roll(low,top){return Math.floor(Random.generate()*(top-low+1))+low}
  
  static pick(array){return array[Random.roll(0,array.length-1)]}
}

// Replace random-number-generator function
export function seed(rng){Random.generate=rng}

// Iterate over [x,x[, [y.y[ ranges
export function* iterate(xrange,yrange){
  for(let x=xrange[0];x<xrange[1];x+=1) 
    for(let y=yrange[0];y<yrange[1];y+=1)
      yield new Point(x,y)
}

// Return points within [x,x[, [y.y[ ranges
export function range(xrange,yrange){return Array.from(iterate(xrange,yrange))}

// Return a random point within ranges [x,x[, [y,y[
export function randomize(xrange,yrange){
  let xy=[xrange,yrange].map(range=>Random.roll(range[0],range[1]-1))
  return new Point(xy[0],xy[1])
}
