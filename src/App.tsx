import React, { Component } from 'react';
import './App.css';
import SimplexNoise from 'simplex-noise';
import { terrain, ResourceSpawnRates, resourceLocation, Resource } from './terrain';

class App extends Component<{}, { terrainCanvas?: HTMLCanvasElement }> {
  private ctx: CanvasRenderingContext2D | null = null;
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

    
  }

  private regen() {
    const { terrainCanvas } = this.state;
    if (terrainCanvas) {
      var ctx = this.ctx || terrainCanvas.getContext("2d");
      if (ctx) {
        this.ctx = ctx;
        const map = this.createEmptyMap(this.size);
        this.generateTerrain(map);
        const resources = this.generateResources(map);

        this.testTrade(map, resources);

        // Draw basic terrain colors
        for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
            let value = map[x][y].height;
            if (value > this.waterLevel) {
              ctx.fillStyle = "rgb(" + value + "," + value + "," + value + ")";

              if (value < this.waterLevel + 15) {
                ctx.fillStyle = "rgb(" + (value + 40) + "," + (value + 10) + "," + (value - 50) + ")";
              }
              else if (value < this.waterLevel + 200) {
                value /= 1.5;
                ctx.fillStyle = "rgb(" + (value - 20) + "," + (value + 40) + "," + (value - 20) + ")";
              }
              else if (value < this.mountainLevel) {
                value /= 1.5;
                value -= 60;
                ctx.fillStyle = "rgb(" + (value + 20) + "," + (value + 20) + "," + (value) + ")";
              }
              else if(value > this.mountainLevel){
                value /= 1.35;
                ctx.fillStyle = "rgb(" + value + "," + value + "," + value + ")";
              }
            }
            else {
              // water
              ctx.fillStyle = "rgb(5, 10, " + Math.max((value + 40) * 10, 50) + ")";
            }

            // draw the tile
            ctx.fillRect(x, y, 1, 1);
          }
        }

        // Draw resource markers
        for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
            if (map[x][y].resource != undefined) {
              ctx.fillStyle = "rgb(0, 0, 0)";
              ctx.fillRect(x - 5, y - 5, 10, 10);

              switch (map[x][y].resource) {
                case Resource.Gold:
                  ctx.fillStyle = "rgb(230, 230, 0)";
                  break;
                case Resource.Crops:
                  ctx.fillStyle = "rgb(0, 200, 0)";
                  break;
                case Resource.Wood:
                  ctx.fillStyle = "rgb(0, 150, 0)";
                  break;
                case Resource.Iron:
                  ctx.fillStyle = "rgb(100, 100, 100)";
                  break;
                case Resource.Copper:
                  ctx.fillStyle = "rgb(180, 140, 70)";
                  break;
                case Resource.Fish:
                  ctx.fillStyle = "rgb(200, 0, 200)";
                  break;
                case Resource.Salt:
                  ctx.fillStyle = "rgb(250, 250, 250)";
                  break;
                case Resource.Spice:
                  ctx.fillStyle = "rgb(200, 0, 0)";
                  break;

              }

              ctx.fillRect(x - 4, y - 4, 8, 8);
            }
          }
        }
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
          height={this.size}
          width={this.size}
          id="terrainCanvas"
          ref={terrainCanvas => { if (terrainCanvas && !this.state.terrainCanvas) { this.setState({ terrainCanvas }); } }}
        />
        <button onClick={() => { this.regen() }}>Regen</button>
      </div>
    );
  }
}

export default App;
