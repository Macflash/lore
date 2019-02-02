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