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

export interface resourceLocation {
    resource: Resource;
    x: number;
    y: number;
}

export interface ResourceSpawnCriterion {
    resource: Resource;
    number: number;
    min: number;
    max: number;
}

export const ResourceSpawnRates: ResourceSpawnCriterion[] = [
    {
        resource: Resource.Gold,
        number: 3,
        min: 120,
        max: 250,
    },
    {
        resource: Resource.Iron,
        number: 7,
        min: 60,
        max: 250,
    },
    {
        resource: Resource.Copper,
        number: 5,
        min: 100,
        max: 250,
    },
    {
        resource: Resource.Crops,
        number: 15,
        min: 20,
        max: 100,
    },
    {
        resource: Resource.Wood,
        number: 15,
        min: 100,
        max: 190,
    },
    {
        resource: Resource.Fish,
        number: 5,
        min: 10,
        max: 20,
    },
    {
        resource: Resource.Salt,
        number: 5,
        min: 20,
        max: 35,
    },
    {
        resource: Resource.Spice,
        number: 5,
        min: 20,
        max: 80,
    },
];