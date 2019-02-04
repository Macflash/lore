// there will end up being gradients PER resource?
// and trade routes are basically "water" flow between towns?
export type direction = "north" | "south" | "east" | "west";
export const allDirections: direction[] = ["north" , "south" , "east" , "west"];

export interface tile {
    x: number;
    y: number;
    hasChanged?: boolean;
    height: number;
}

export interface resourceTile extends tile {
    distance: number; // indexed by resource!
}

export interface gradient {
    // want to point the best way down for each direction
    // water flow COULD be better going over small bumps
    // instead of greedily going only down because of flow and momentum
    north?: number;
    south?: number;
    east?: number;
    west?: number;

    lowest: direction;
}

// there should probably be some "MAX" water that will be used to determine the width of rivers and etc.
export interface water {
    x: number;
    y: number;
    height: number;
    volume: number; // Available water should be AVERAGED based on what is around, this is effectively the "ground" water
}