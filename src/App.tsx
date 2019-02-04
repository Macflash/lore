import React, { Component } from 'react';
import './App.css';
import SimplexNoise from 'simplex-noise';
import { terrain, ResourceSpawnRates, resourceLocation, Resource, trail } from './terrain';
import { water, gradient, resourceTile, direction, tile, allDirections } from './water';
import { number } from 'prop-types';

interface IAppState {
  terrainCanvas?: HTMLCanvasElement;
  tradeCanvas?: HTMLCanvasElement;
  markerCanvas?: HTMLCanvasElement;
}

class App extends Component<{}, IAppState> {
  private terrainCtx: CanvasRenderingContext2D | null = null;
  private tradeCtx: CanvasRenderingContext2D | null = null;
  private markerCtx: CanvasRenderingContext2D | null = null;
  private size = 800;
  private waterLevel = 10;
  private mountainLevel = 250;

  constructor(props: any) {
    super(props);
    this.state = {};
  }

  private createEmptyMap(size: number): terrain[][] {
    let map: terrain[][] = [];
    for (let x = 0; x < size; x++) {
      map[x] = [];
      for (let y = 0; y < size; y++) {
        map[x][y] = { height: 0 };
      }
    }

    return map;
  }

  private generateTerrain(map: terrain[][]) {
    let heights: number[] = [];
    const simplex = new SimplexNoise();
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[x].length; y++) {
        // VERY BASIC terrain. No guarantees about being balanced
        var scaleHuge = .001;
        var scaleBig = .005;
        var scaleSmall = .01;
        var scaleTiny = .03;
        var valueHuge = Math.log(simplex.noise2D(x * scaleHuge, y * scaleHuge) + 1) * 255;
        var valueBig = (Math.log(simplex.noise2D(x * scaleBig, y * scaleBig) + 1) + .5) * 100;
        var valueSmall = (simplex.noise2D(x * scaleSmall, y * scaleSmall) + 1) * 50;
        var valueTiny = (simplex.noise2D(x * scaleTiny, y * scaleTiny)) * 12;
        var height = valueHuge + valueBig + valueSmall + valueTiny;

        map[x][y].height = height;
        heights.push(height);
      }
    }

    heights = heights.sort((a: number, b: number) => { if (a > b) { return 1; } if (a == b) { return 0; } return -1; });

    // sea floor should always be... this.waterLevel
    // tallest mountains should always be... this.mountainLevel
    // SCALE the map to get some mountains, and to get some decent range of heights
    const seaLevel = heights[Math.floor(heights.length / 2)];
    const mountainLevel = heights[Math.floor(heights.length * .95)];
    const range = mountainLevel - seaLevel;
    const scale = (this.mountainLevel - this.waterLevel) / range;

    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[x].length; y++) {
        const h = map[x][y].height;
        map[x][y].height = ((h - seaLevel) * scale) + this.waterLevel;
      }
    }
  }

  private generateResources(map: terrain[][]): resourceLocation[] {
    let resources: resourceLocation[] = [];
    for (let resourceSpawn of ResourceSpawnRates) {
      let probabilities: { value: number, x: number, y: number }[] = [];
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          let tile = map[x][y];
          if (tile.resource == undefined && tile.height >= resourceSpawn.min && tile.height <= resourceSpawn.max) {
            probabilities.push({ value: Math.random(), x, y });
          }
        }
      }

      probabilities = probabilities.sort((a, b) => { if (a.value > b.value) { return 1; } if (a.value == b.value) { return 0; } return -1; });
      for (let i = 0; i < resourceSpawn.number; i++) {
        let p = probabilities[i];
        map[p.x][p.y].resource = resourceSpawn.resource;
        resources.push({ resource: resourceSpawn.resource, x: p.x, y: p.y });
      }
    }

    return resources;
  }

  private getResource(item: number | undefined, min: number): number {
    if (item == undefined || isNaN(item)) {
      return min;
    }

    return item;
  }
  /*
  private iterateGradient(defaultValue:number, map: terrain[][], resources: resourceLocation[], ctx: CanvasRenderingContext2D, resourceGradient: resourceTile[][], allResourceGradientTiles: resourceTile[]){
    var defaultMin = -1 * defaultValue; // this could vary later based on stuff.
    console.log("gradient length", allResourceGradientTiles.length);
    ctx.clearRect(0,0,this.size, this.size);
  
    let newTiles: resourceTile[] = [];
    for (const rgrad of allResourceGradientTiles) {
      if(!rgrad.hasChanged){continue;}
      // for each tile, get the maximum value from the neighbors!
      var dirs: direction[] = ["north", "south", "east", "west"];
      var neighbors = dirs.map(dir => this.getOrCreateTile(resourceGradient, rgrad.x, rgrad.y, dir)).filter(v => v != undefined);
      var max: number[] = rgrad.resources.slice(0);
  
      for (const neighbor of neighbors) {
        if (neighbor) {
          if (neighbor.resources) {
            // do the calculation for EACH resource!
            for (const r in neighbor.resources) {
              max[r] = Math.max(this.getResource(neighbor.resources[r], defaultMin), this.getResource(max[r], defaultMin));
            }
          }
          else {
            neighbor.resources = [];
            newTiles.push(neighbor);
          }
        }
      }
  
      // for each value we should subtract our tiles intrisinc 
      var tileCost = map[rgrad.x][rgrad.y].height;
      var newResources = max.map((v, i) => {
        return Math.max(v - tileCost, this.getResource(rgrad.resources[i], defaultMin));
      });
      rgrad.hasChanged = false;
  
      for(var i = 0; i < newResources.length; i++){
        if(newResources[i] != rgrad.resources[i]){
          rgrad.hasChanged = true;
          break;
        }
      }
  
      if(rgrad.hasChanged){
        for(var n of neighbors){
          if(n){
            n.hasChanged = true;
          }
        }
  
        rgrad.hasChanged = false;
      }
  
      
      var m = defaultMin;
      for (const r in rgrad.resources) {
        m = Math.max(m, this.getResource(newResources[r], defaultMin));
      }
  
      if(isNaN(m)){ debugger;}
  
      rgrad.resources = newResources;
  
      var value = (255 * m / defaultValue);
      //if(value < 0){ debugger;}
      //console.log(value);
      ctx.fillStyle = "rgba(255,0,0, " + value + ")"
      ctx.fillRect(rgrad.x, rgrad.y, 1, 1);
    }
  
    allResourceGradientTiles = allResourceGradientTiles.concat(newTiles);
    setTimeout(() => {
      this.iterateGradient(defaultValue, map, resources, ctx,resourceGradient, allResourceGradientTiles);
    }, 100);
  }
  */
  private testTrade(map: terrain[][], resources: resourceLocation[], ctx: CanvasRenderingContext2D) {
    // generate a ... pressure map? Based on travel speed and distance?
    // generate the PROXIMITY for each resource separately and build 

    // Create a resource gradient
    const resourceGradient: resourceTile[][] = [];
    for (let i = 0; i < map.length; i++) {
      resourceGradient[i] = [];
    }

    let allResourceGradientTiles: resourceTile[] = [];

    var defaultValue = 0; // this could vary later based on stuff.
    for (const resource of resources) {
      // add these to the resource gradient
      resourceGradient[resource.x][resource.y] = { x: resource.x, y: resource.y, distance: 0, height: map[resource.x][resource.y].height };
      break; // only do the first for now
      //allResourceGradientTiles.push(resourceGradient[resource.x][resource.y]);
    }

    //this.iterateGradient(defaultValue, map, resources, ctx, resourceGradient, allResourceGradientTiles);

    // how to path find between cities and resources?

    if (this.tradeCtx) {
      // co-ordered with the resource list
      var pairwiseDistance: { index: number, crow: number, sell: Resource, buy: Resource }[][] = [];
      console.log("total resources", resources.length);

      // Always i SELLING to j
      for (let i = 0; i < resources.length; i++) {
        pairwiseDistance[i] = [];
        for (let j = 0; j < resources.length; j++) {
          pairwiseDistance[i][j] = {
            crow: Math.sqrt(Math.pow(resources[i].x - resources[j].x, 2) + Math.pow(resources[i].y - resources[j].y, 2)),
            sell: resources[i].resource,
            buy: resources[j].resource,
            index: j,
          };
        }
      }

      this.tradeCtx.clearRect(0, 0, this.size, this.size);
      const trails: tile[] = [];
      for (let i = 0; i < resources.length; i++) {
        const currentStartingResource = resources[i];
        // draw lines to the 5 closest items.
        const distances = pairwiseDistance[i].slice(0).sort((a, b) => { if (a.crow > b.crow) { return 1; } if (a.crow == b.crow) { return 0; } return -1; });
        const closest = distances.slice(1, 5);

        this.tradeCtx.strokeStyle = "tan";
        for (const close of closest) {
          this.tradeCtx.beginPath();
          this.tradeCtx.strokeStyle = "rgba(160,140,100," + (255 / close.crow) + ")";
          this.tradeCtx.lineWidth = 100 / close.crow;
          this.tradeCtx.moveTo(resources[i].x, resources[i].y);
          this.tradeCtx.lineTo(resources[close.index].x, resources[close.index].y);
          this.tradeCtx.stroke();
          //console.log("connecting " + i + " to " + close.index);
          this.tradeCtx.closePath();
        }

        // spread out and try to find other resources to trade for

        // spread out! and when you hit a resource you just follow the gradient
        let activeTiles: resourceTile[] = [{ x: resources[i].x, y: resources[i].y, distance: 0, height: map[resources[i].x][resources[i].y].height }];
        while (activeTiles && activeTiles.length) {
          const cur = activeTiles.shift();


          if (!cur) { break; }
          this.tradeCtx.fillStyle = "red";
          this.tradeCtx.fillRect(cur.x, cur.y, 1, 1);

          const neighbors = allDirections.map(dir => this.getNewTilesOnly(resourceGradient, cur.x, cur.y, dir));
          for (const n of neighbors) {
            if (n) {
              // make a new tile and add it to the active tiles
              // total height = more difficulty
              // variation in height = more difficulty
              var maptile = map[n.x][n.y];
              n.height = Math.max(maptile.height, 10);

              // if n is a city with resources we should follow these and CONNECT stuff.
              if (maptile.resource != undefined) {
                console.log("hit a city!!");

                // try to go BACKWARDS creating a cool tile thing
                var curTrail = n;
                trails.push(curTrail);
                  console.log("destination x: " + currentStartingResource.x + " y: " + currentStartingResource.y);
                  while (curTrail.x != currentStartingResource.x
                  && curTrail.y != currentStartingResource.y) {
                    console.log("current x: " + curTrail.x + " y: " + curTrail.y);
                    var lowestNeighbor = this.getLowestNeighbor(resourceGradient, curTrail);
                    curTrail = lowestNeighbor;
                    trails.push(curTrail);
                  }

                  console.log("connected a city fully!");
                break;
              }
              else {
                //debugger;
                n.distance = cur.distance + Math.abs(cur.height - n.height) + Math.log(n.height);

                if (isNaN(n.distance)) {
                  debugger;
                  console.error("nan distance!");
                }


                if (n.distance > 1000) {
                  console.log("traveled too far");
                  break;
                }
                else {
                  activeTiles.push(n);
                  console.log("distance", n.distance);
                }
              }


            }
          }

        }


        break;
      }

      // draw all the trails!
      this.tradeCtx.clearRect(0, 0, this.size, this.size);
      for(var trail of trails){
        this.tradeCtx.fillRect(trail.x, trail.y, 1,1);
      }
    }
  }


  private getNewTilesOnly<T extends tile>(map: T[][], x: number, y: number, direction?: "north" | "south" | "east" | "west"): T | undefined {
    switch (direction) {
      case "north":
        x -= 1;
        break;
      case "south":
        x += 1;
        break;
      case "east":
        y += 1;
        break;
      case "west":
        y -= 1;
        break;
    }

    // ASSUMES SQUARE MAP!
    if (x > 0 && x < map.length && y > 0 && y < map.length) {
      if (!map[x][y]) {
        return map[x][y] = { x, y, hasChanged: true } as T;
      }
    }

    return undefined;
  }

  private getOrCreateTile<T extends tile>(map: T[][], x: number, y: number, direction?: "north" | "south" | "east" | "west"): T | undefined {
    switch (direction) {
      case "north":
        x -= 1;
        break;
      case "south":
        x += 1;
        break;
      case "east":
        y += 1;
        break;
      case "west":
        y -= 1;
        break;
    }

    // ASSUMES SQUARE MAP!
    if (x > 0 && x < map.length && y > 0 && y < map.length) {
      if (!map[x][y]) {
        map[x][y] = { x, y, hasChanged: true } as T;
      }

      return map[x][y];
    }

    return undefined;
  }

  private getTile<T>(map: T[][], x: number, y: number, direction?: "north" | "south" | "east" | "west"): T | undefined {
    switch (direction) {
      case "north":
        x -= 1;
        break;
      case "south":
        x += 1;
        break;
      case "east":
        y += 1;
        break;
      case "west":
        y -= 1;
        break;
    }

    // ASSUMES SQUARE MAP!
    if (x > 0 && x < map.length && y > 0 && y < map.length) {
      return map[x][y];
    }

    return undefined;
  }

  private getLowestNeighbor(map: resourceTile[][], currentTile: resourceTile):  resourceTile {
    var neighbors = allDirections.map(dir => this.getTile(map, currentTile.x, currentTile.y, dir));
    var lowest: resourceTile | undefined;
    for(var n of neighbors){
      if(!lowest){
        lowest = n;
      }

      if(n && lowest && n.distance < lowest.distance){
        lowest = n;
      }
    }

    return lowest!;
  }

  private getHeight(map: terrain[][], x: number, y: number, offset = 0): number | undefined {
    // ASSUMES SQUARE MAP!
    if (x > 0 && x < map.length && y > 0 && y < map.length) {
      return map[x][y].height - offset;
    }

    return undefined;
  }

  private createGradient(map: terrain[][]): gradient[][] {
    let gradient: gradient[][] = [];

    for (let x = 0; x < map.length; x++) {
      gradient[x] = [];
      for (let y = 0; y < map.length; y++) {
        let t = map[x][y].height;
        let g: gradient = {
          north: this.getHeight(map, x - 1, y, t),
          south: this.getHeight(map, x + 1, y, t),
          east: this.getHeight(map, x, y + 1, t),
          west: this.getHeight(map, x, y - 1, t),
          lowest: "north",
        };

        if (!g.lowest || (g.south && g.south < g[g.lowest]!)) { g.lowest = "south"; }
        if (!g.lowest || (g.east && g.east < g[g.lowest]!)) { g.lowest = "east"; }
        if (!g.lowest || (g.west && g.west < g[g.lowest]!)) { g.lowest = "west"; }

        gradient[x][y] = g;
      }
    }

    return gradient;
  }

  private testWater(map: terrain[][]): water[][] {
    // calculate the gradient on each tile?
    // then decide how much water each area gets?
    // and build rivers and lakes and stuff based on that?


    const waterTable: water[][] = [];
    let allWater: water[] = [];
    for (let x = 0; x < map.length; x++) {
      waterTable[x] = [];
      for (let y = 0; y < map.length; y++) {
        if (map[x][y].height > this.waterLevel) {
          const tile = waterTable[x][y] = { x, y, volume: 1, height: map[x][y].height };
          allWater.push(tile);
        }
      }
    }

    // sort the map and starting from the HIGHEST point sum downwards until WATER LEVEL

    // set the min water value to display river (basically muddy, slightly slower to pass)
    // set the max water value that can fit in a tile (massive river, almost impossible to pass without a bridge)
    const minWater = 500;
    const maxWater = 900;

    allWater = allWater.sort((a, b) => { if (a.height < b.height) { return 1; } if (a.height == b.height) { return 0; } return -1; });
    console.log("all water", allWater);

    const gradient = this.createGradient(map);

    // go through all of the tiles and add up the water downstream
    for (const w of allWater) {
      const g = gradient[w.x][w.y];

      let dest = this.getTile(waterTable, w.x, w.y, g.lowest);

      if (dest) {
        dest.volume += w.volume;
        /*
                  // can't flow more than maxWater, so if more than that you need to flow multiple places!
                if (dest.volume >= maxWater || w.volume >= maxWater) {
                  console.log("reached max water!");
                  // flow based on the gradient, divided based on the slope?
        
                  //debugger;
                  var dirs: ("north" | "south" | "east" | "west")[] = ["north", "south", "east", "west"];
                  dirs = dirs.sort((a, b) => {
                    if (g[a] == g[b]) { return 0; }
                    if (g[a] == undefined) { return -1; }
                    if (g[b] == undefined) { return 1; }
                    if (g[a] != undefined && g[b] != undefined) {
                      if (g[a]! < g[b]!) { return 1; }
                    }
        
                    return -1;
                  });
        
                  let waterToFlow = w.volume;
        
                  for(const dir of dirs){
                    if(waterToFlow > 0){
                      const t = this.getTile(waterTable, w.x,w.y, dir);
                      if(t && t.volume < maxWater){
                        let flow = Math.min(maxWater - t.volume, waterToFlow);
                        t.volume += flow;
                        waterToFlow -= flow;
                      }
                    }
                  }
        
                  if(waterToFlow > 0){
                    // very big flow!!
                    console.error("very big flow!!", waterToFlow);
                    dest.volume += waterToFlow;
                  }
                }
                else {
                  // simple case
                  dest.volume += w.volume;
                }
        
                */
      }
    }

    return waterTable;
  }

  private regen() {
    const { terrainCanvas, tradeCanvas, markerCanvas } = this.state;
    if (terrainCanvas && tradeCanvas && markerCanvas) {
      var terrainCtx = this.terrainCtx || terrainCanvas.getContext("2d");
      var tradeCtx = this.tradeCtx || tradeCanvas.getContext("2d");
      var markerCtx = this.markerCtx || markerCanvas.getContext("2d");
      if (terrainCtx && tradeCtx && markerCtx) {
        this.terrainCtx = terrainCtx;
        this.tradeCtx = tradeCtx;
        this.markerCtx = markerCtx;

        const map = this.createEmptyMap(this.size);
        this.generateTerrain(map);
        const resources = this.generateResources(map);

        // Draw basic terrain colors
        for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
            let value = map[x][y].height;
            if (value > this.waterLevel) {
              terrainCtx.fillStyle = "rgb(" + value + "," + value + "," + value + ")";

              if (value < this.waterLevel + 15) {
                terrainCtx.fillStyle = "rgb(" + (value + 40) + "," + (value + 10) + "," + (value - 50) + ")";
              }
              else if (value < this.waterLevel + 200) {
                value /= 1.5;
                terrainCtx.fillStyle = "rgb(" + (value - 20) + "," + (value + 40) + "," + (value - 20) + ")";
              }
              else if (value < this.mountainLevel) {
                value /= 1.5;
                value -= 60;
                terrainCtx.fillStyle = "rgb(" + (value + 20) + "," + (value + 20) + "," + (value) + ")";
              }
              else if (value > this.mountainLevel) {
                value /= 1.35;
                terrainCtx.fillStyle = "rgb(" + value + "," + value + "," + value + ")";
              }
            }
            else {
              // water
              terrainCtx.fillStyle = "rgb(5, 10, " + Math.max((value + 40) * 10, 50) + ")";
            }

            // draw the tile
            terrainCtx.fillRect(x, y, 1, 1);
          }
        }

        // Draw resource markers
        for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
            if (map[x][y].resource != undefined) {
              markerCtx.fillStyle = "rgb(0, 0, 0)";
              markerCtx.fillRect(x - 5, y - 5, 10, 10);

              switch (map[x][y].resource) {
                case Resource.Gold:
                  markerCtx.fillStyle = "rgb(230, 230, 0)";
                  break;
                case Resource.Crops:
                  markerCtx.fillStyle = "rgb(0, 200, 0)";
                  break;
                case Resource.Wood:
                  markerCtx.fillStyle = "rgb(0, 150, 0)";
                  break;
                case Resource.Iron:
                  markerCtx.fillStyle = "rgb(100, 100, 100)";
                  break;
                case Resource.Copper:
                  markerCtx.fillStyle = "rgb(180, 140, 70)";
                  break;
                case Resource.Fish:
                  markerCtx.fillStyle = "rgb(200, 0, 200)";
                  break;
                case Resource.Salt:
                  markerCtx.fillStyle = "rgb(250, 250, 250)";
                  break;
                case Resource.Spice:
                  markerCtx.fillStyle = "rgb(200, 0, 0)";
                  break;

              }

              markerCtx.fillRect(x - 4, y - 4, 8, 8);
            }
          }
        }

        setTimeout(() => {
          this.testTrade(map, resources, tradeCtx!);
        }, 100);

        /*
        const waterTable = this.testWater(map);
        this.tradeCtx.clearRect(0, 0, this.size, this.size);
        for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
            if (waterTable[x][y] && waterTable[x][y].volume > 500) {
              this.tradeCtx.fillStyle = "blue";
              if (waterTable[x][y].volume >= 880) {
                this.tradeCtx.fillStyle = "blue";
              }

              this.tradeCtx.fillRect(x, y, 1, 1);
            }
          }
        }*/

      }
    }
  }

  componentDidUpdate() {
    this.regen();
  }

  render() {
    return (
      <div>
        <canvas
          style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          height={this.size}
          width={this.size}
          id="terrainCanvas"
          ref={terrainCanvas => { if (terrainCanvas && !this.state.terrainCanvas) { this.setState({ terrainCanvas }); } }}
        />
        <canvas
          style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
          height={this.size}
          width={this.size}
          id="tradeCanvas"
          ref={tradeCanvas => { if (tradeCanvas && !this.state.tradeCanvas) { this.setState({ tradeCanvas }); } }}
        />
        <canvas
          style={{ position: "absolute", top: 0, left: 0, zIndex: 3 }}
          height={this.size}
          width={this.size}
          id="markerCanvas"
          ref={markerCanvas => { if (markerCanvas && !this.state.markerCanvas) { this.setState({ markerCanvas }); } }}
        />
        <button onClick={() => { this.regen() }}>Regen</button>
      </div>
    );
  }
}

export default App;
