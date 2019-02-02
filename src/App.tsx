import React, { Component } from 'react';
import './App.css';
import SimplexNoise from 'simplex-noise';
import { terrain, ResourceSpawnRates } from './terrain';

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

    heights = heights.sort((a:number,b:number) => { if(a > b){ return 1;} if(a == b){ return 0;} return -1;});
    
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

  private generateResources(map: terrain[][]){
    for(let resourceSpawn of ResourceSpawnRates){
      let probabilities: number[] = [];
      for (var x = 0; x < this.size; x++) {
        for (var y = 0; y < this.size; y++) {
          let tile = map[x][y];
          if(tile.resource == undefined && tile.height >= resourceSpawn.min && tile.height <= resourceSpawn.max){
            
          }
        }
      }
    }

  }

  private regen() {
    const { terrainCanvas } = this.state;
    if (terrainCanvas) {
      var ctx = this.ctx || terrainCanvas.getContext("2d");
      if (ctx) {
        this.ctx = ctx;
        const map = this.createEmptyMap(this.size);
        this.generateTerrain(map);

        console.log("generating");

        // generate some noise!
        var simplex = new SimplexNoise();

        // should instead BALANCE the water after each stage.
        // ideally want something like 50-75% covered by water?
        var resources = [];

        for (var x = 0; x < this.size; x++) {
          for (var y = 0; y < this.size; y++) {
            let value = map[x][y].height;
            if (value > this.waterLevel) {
              ctx.fillStyle = "rgb(" + value + "," + value + "," + value + ")";

              // VERY basic resources
              // GOLD, GREEN, etc
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


            }
            else {
              // water
              ctx.fillStyle = "rgb(5, 10, " + Math.max((value + 40) * 10, 50) + ")";
            }

            // do resources!!
            if (value > 120 && Math.random() > .9999) {
              // GOLD!
              ctx.fillStyle = "rgb(230, 230, 0)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            // TODO: add the QUALITY of the land as well, since it depends on water
            if (value > this.waterLevel + 10 && value < 100 && Math.random() > .9999) {
              // Farmland!!
              ctx.fillStyle = "rgb(0, 200, 0)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            // TODO: add the QUALITY of the land as well, since it depends on water
            if (value > 100 && value < 190 && Math.random() > .9997) {
              // Forest!!
              ctx.fillStyle = "rgb(0, 150, 0)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            if (value > this.waterLevel && value < this.waterLevel + 10 && Math.random() > .9995) {
              // Fish!!
              ctx.fillStyle = "rgb(200, 0, 200)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }


            if (((value > this.waterLevel && value < this.waterLevel + 15) || (value < 230 && value > 200)) && Math.random() > .9999) {
              // Salt!!
              ctx.fillStyle = "rgb(250, 250, 250)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            if (value > this.waterLevel + 20 && value < this.waterLevel + 40 && Math.random() > .9999) {
              // Spice!!
              ctx.fillStyle = "rgb(200, 0, 0)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            if (value > 60 && Math.random() > .9999) {
              // iron!!
              ctx.fillStyle = "rgb(100, 100, 100)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            if (value > 100 && Math.random() > .9999) {
              // copper!!
              ctx.fillStyle = "rgb(180, 140, 70)";
              ctx.fillRect(x - 5, y - 5, 10, 10);
            }

            ctx.fillRect(x, y, 1, 1);
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
