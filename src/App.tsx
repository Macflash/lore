import React, { Component } from 'react';
import './App.css';
import SimplexNoise from 'simplex-noise';
import { terrain, ResourceSpawnRates, resourceLocation, Resource } from './terrain';
import { water, gradient, resourceTile, direction } from './water';
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


  private testTrade(map: terrain[][], resources: resourceLocation[]) {
    // generate a ... pressure map? Based on travel speed and distance?
    // generate the PROXIMITY for each resource separately and build 

    // Create a resource gradient
    const resourceGradient: resourceTile[][] = [];
    for(let i = 0; i < map.length; i++){
      resourceGradient[i] = [];
    }

    const allResourceGradientTiles: resourceTile[] = [];

    for(const resource of resources){
      // add these to the resource gradient
      var defaultValue = 1000; // this could vary later based on stuff.
      resourceGradient[resource.x][resource.y] = {x: resource.x, y: resource.y, resources: []};
      resourceGradient[resource.x][resource.y].resources[resource.resource] = defaultValue;
      allResourceGradientTiles.push(resourceGradient[resource.x][resource.y]);
    }

    // now we want to iterate through the resource gradient tiles and expand them based on their neighboring values
    for(let i = 0; i < 1000; i++){
      let hasChanged = false;

      //let newTiles: resourceTile[] = [];
      for(const rgrad of allResourceGradientTiles){
        // for each tile, get the maximum value from the neighbors!
        var dirs: direction[] = ["north", "south", "east", "west"];
        var neighbors = dirs.map(dir => this.getTile(resourceGradient, rgrad.x, rgrad.y, dir)).filter(v => v != undefined);
        var max: number[] = [];
        for(const neighbor of neighbors){
          if(neighbor && neighbor.resources){
            // do the calculation for EACH resource!
            for(const r of [Resource.Gold]){

            }
          }
        }
      }

      //allResourceGradientTiles.push(newTiles);

      if(!hasChanged){break;}
    }

    // how to path find between cities and resources?
    /*
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
      for (let i = 0; i < resources.length; i++) {
        // draw lines to the 5 closest items.
        const distances = pairwiseDistance[i].slice(0).sort((a, b) => { if (a.crow > b.crow) { return 1; } if (a.crow == b.crow) { return 0; } return -1; });
        const closest = distances.slice(1, 10);

        this.tradeCtx.strokeStyle = "tan";
        for (const close of closest) {
          this.tradeCtx.beginPath();
          this.tradeCtx.strokeStyle = "rgba(160,140,100," + (255 / close.crow) + ")";
          this.tradeCtx.lineWidth = 100 / close.crow;
          this.tradeCtx.moveTo(resources[i].x, resources[i].y);
          this.tradeCtx.lineTo(resources[close.index].x, resources[close.index].y);
          this.tradeCtx.stroke();
          console.log("connecting " + i + " to " + close.index);
          this.tradeCtx.closePath();
        }

        // spread out and try to find other resources to trade for?
        // find the 
      }
    }
    */
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

        this.testTrade(map, resources);

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
