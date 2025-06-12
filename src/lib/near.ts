import * as FastNear from "fastintear";

if (typeof window.near === "undefined") {
  console.error("need to install fastintear");
}

export const near = FastNear;

near.config({ networkId: "mainnet" });
