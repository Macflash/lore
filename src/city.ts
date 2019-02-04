import { tile } from "./water";
import { Resource, resourceLocation } from "./terrain";
import { good } from "./economy";

export interface iCity {
    x: number;
    y: number;
    resources: number[];
    population: number;
}

export class city implements iCity {
    public x: number;
    public y: number;
    public hasChanged = false;
    public resources: number[];
    public population: number;
    public production: Resource;

    constructor(t: resourceLocation) {
        this.production = t.resource;
        this.hasChanged = false;
        this.x = t.x;
        this.y = t.y;
        this.resources = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.resources[Resource.Crops] = 100;
        this.resources[Resource.Wood] = 100;
        this.resources[Resource.Salt] = 50;
        this.resources[Resource.Iron] = 50;
        this.population = 100;
    }

    private updateResources() {
        // wood can be used to increase shelter
        // wood can be used to build tools
        // iron can be used to drastically improve tools

        // salt can be used to preserve food
        // spice can be used to improve food

        // etc
    }

    public findEquilibrium(goods: good[], income: number) {
        var price = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
        var volume = [];

        var demand = this.calculateDemand(goods, price, income);
        var supply = this.calculateSupply(goods, price, this.resources);

        var hasChanged = true;
        var loops = 0;
        while (hasChanged && loops < 200) {
            hasChanged = false;
            console.log("loop");
            demand = this.calculateDemand(goods, price, income);
            supply = this.calculateSupply(goods, price, this.resources);
            loops++;
            for (var i = 0; i < demand.length; i++) {
                // check if demand == supply if not adjust price
                if (demand[i] < supply[i] - 10) {
                    price[i]--;
                    hasChanged = true;
                }
                else if (demand[i] > supply[i] + 10) {
                    price[i]++;
                    hasChanged = true;
                }
            }
        }

        for (var i = 0; i < demand.length; i++) {
            console.log(Resource[i] + " $" + price[i] + " d:" + demand[i] + " s:" + supply[i]);
        }
    }

    private calculateDemand(goods: good[], price: number[], income: number): number[] {
        var demand: number[] = [];
        for (let i = 0; i < goods.length; i++) {
            var baseDemand = this.population;
            var Qd = baseDemand;

            // Elasticity of the good vs price
            Qd -= (goods[i].elasticity * price[i]);

            // substitues
            for (const substitute of goods[i].substitutes) {
                Qd -= goods[substitute].elasticity * price[substitute];
            }

            // complements
            for (const complement of goods[i].complements) {
                Qd += goods[complement].elasticity * price[complement];
            }

            // income
            Qd += income;
            demand[i] = Qd;
        }

        return demand;
    }

    private calculateSupply(goods: good[], price: number[], stock: number[]): number[] {
        var supply: number[] = [];
        for (let i = 0; i < goods.length; i++) {
            var baseSupply = .5 * stock[i];
            var Qs = baseSupply;

            // Elasticity of the good vs price?
            Qs += (goods[i].elasticity * price[i]);

            supply[i] = Qs;
        }

        return supply;
    }
}


