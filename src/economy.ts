import { Resource } from "./terrain";

export interface good {
    resource: Resource;
    elasticity: number; // 1 is normal, < 1 is inelastic, > 1 is elastic
    substitutes: Resource[];
    complements: Resource[];
};

export const goods: good[] = [];
// Necessities
goods[Resource.Crops] = {
    resource: Resource.Crops,
    elasticity: .5,
    substitutes: [Resource.Fish],
    complements: [Resource.Spice, Resource.Spice]
};
goods[Resource.Fish] = {
    resource: Resource.Fish,
    elasticity: .6,
    substitutes: [Resource.Crops],
    complements: [Resource.Spice, Resource.Spice]
};

// Staples
goods[Resource.Salt] = {
    resource: Resource.Salt,
    elasticity: .75,
    substitutes: [],
    complements: [Resource.Fish, Resource.Crops]
};
goods[Resource.Wood] = {
    resource: Resource.Wood,
    elasticity: .85,
    substitutes: [],
    complements: [Resource.Iron]
};
goods[Resource.Iron] = {
    resource: Resource.Iron,
    elasticity: .95,
    substitutes: [Resource.Copper],
    complements: [Resource.Wood]
};

// Luxuries
goods[Resource.Spice] = {
    resource: Resource.Spice,
    elasticity: 1.05,
    substitutes: [Resource.Salt],
    complements: [],
};
goods[Resource.Copper] = {
    resource: Resource.Copper,
    elasticity: 1.1,
    substitutes: [Resource.Gold],
    complements: [],
};
goods[Resource.Gold] = {
    resource: Resource.Gold,
    elasticity: 1.5,
    substitutes: [],
    complements: [],
};