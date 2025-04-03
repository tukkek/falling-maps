# Falling maps
*Generator for dungeon and urban maps*.

Falling Maps uses a method that resembles the game-play of falling-block titles such as Tetris and Columns to generate lay-outs that can fit multiple scenarios like dungeon and city maps. It can create 20-room maps in 10 miliseconds and supports demonstration and extensibility.

See a show-case at https://tukkek.github.io/falling-maps/.

# Set-up

You can set-up the library in one of these ways:
* Down-load https://github.com/tukkek/falling-maps/archive/refs/heads/main.zip.
* `git clone https://github.com/tukkek/falling-maps/ libraries/falling-maps/`.
* `git submodule add https://github.com/tukkek/falling-maps/ libraries/falling-maps/`.

# Usage

The most basic use-case is to provide the generator with a set of rooms to place on a map:

```js
import * as generator from './libraries/falling-maps/code/generator.js'

let rooms=[new generator.Room(3,3),
            new generator.Room(4,4),
            new generator.Room(5,5),]
let map=new generator.MapGenerator(100,100,rooms)
map.make()

//each room will have an XY coordinate and their given dimensions:
for(let room of rooms) console.log('Room:',room.x,room.y,room.width,room.height)
//corridors will also be created connecting all rooms:
console.log('Walk-ways:',map.ways.map((point)=>`${point.x}:${point.y}`))
```

Ignore the ways and use only room data to create an out-door area such as a city or camp-site. Some of the way-points are located inside rooms, on their borders as they are meant to be doors.

Note that besides the rooms, the generator takes width and height parameters. This is the size of the over-all map and needs to be big enough to allow for all internal operations during the generation process. If you get errors creating your map, raise these values suitably.

## Fields and methods

```js
/* generator */
let map=new generator.MapGenerator(/*...*/)

map.margin=3//minimum distance between rooms
map.turns=[1,1]//turns to take after placing rooms, [0,3] would be 0; 90; 180; or 270 degrees

//any one of these can be used to create a map:
for(let step of map.watch()) continue //yields once for each generation-step taken
map.make() //returns after the map has been generated
map.clock() //same as Make but also returns the number of miliseconds elapsed

/* rooms */
let room=map.rooms[0]//the internal Rooms field does not preserve the original room order
room.enter(10,10,3)//true if point 10:10 is inside, 3 considers extra room margins (optional)
```

## Extensibility

The library classes can be extended to either change their generation or add custom behavior. For example: to add extra steps  to your liking after `MapGeneration` is over; or to add your own functionality for `Room`s to be used client-side for your own convenience.
