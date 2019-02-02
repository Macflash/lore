export enum Resource {
    Gold,
    Iron,
    Copper,
    Wood,
    Salt,
    Spice,
    Fish,
    Crops,
}

export interface terrain {
    height: number;
    resource?: Resource;

    // hmmm
    //water: number;
    //soil: number;
}

export interface ResourceSpawn {
    resource: Resource;
    number: number;
    min: number;
    max: number;
}

export const ResourceSpawnRates: ResourceSpawn[] = [
    {
        resource: Resource.Gold,
        number: 3,
        min: 120,
        max: 250,
    },

];