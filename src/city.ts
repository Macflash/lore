import { tile } from "./water";
import { Resource, resourceLocation } from "./terrain";

export interface iCity extends tile {
    resources: number[];
    population: number;
}

export class city implements iCity{
    public x: number;
    public y: number;
    public hasChanged = false;
    public resources: number[];
    public population: number;
    public production: Resource;

    constructor(t: resourceLocation){
        this.production = t.resource;
        this.hasChanged = false;
        this.x = t.x;
        this.y = t.y;
        this.resources = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        this.resources[Resource.Crops] = 100;
        this.resources[Resource.Wood] = 100;
        this.resources[Resource.Salt] = 10;
        this.resources[Resource.Iron] = 10;
        this.population = 100;
    }
}