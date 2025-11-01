import { createNearClient } from "fastintear";
import { NETWORK_ID } from "../config";

export const nearClient = createNearClient({
  networkId: NETWORK_ID,
});

export { nearClient as near };
