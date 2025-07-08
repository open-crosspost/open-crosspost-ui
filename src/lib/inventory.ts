import { createInviteLink, useCoState } from "jazz-tools/react";
import {
  Account,
  CoMapInit,
  CoValue,
  CoValueClass,
  Group,
  ID,
  subscribeToCoValue,
  Loaded,
  CoValueFromRaw,
  Resolved,
} from "jazz-tools";
import {
  Inventory,
  InventoryList,
  Thing,
  ThingList,
  UserAccount,
} from "./schema";

export const getThings = (me: Loaded<typeof UserAccount>) => {
  return (
    me.root?.inventories?.flatMap(
      (inventory) =>
        inventory?.things?.filter(
          (thing): thing is Exclude<typeof thing, null> => !!thing
        ) || []
    ) || []
  );
};

export const getTypes = (me: Loaded<typeof UserAccount>) => {
  const things = getThings(me);
  const types = things.filter((thing) => {
    return thing.type.startsWith("type-registry.testnet/type/Type");
  });
  return types;
};

export const getThing = (thingId: ID<typeof Thing>) => {
  return useCoState(Thing, thingId);
};

export const getThingsByInventory = (
  me: Loaded<typeof UserAccount>,
  inventory: Loaded<typeof Inventory>
) => {
  const things = getThings(me);
  return inventory
    ? things?.filter(
        (item) => item?.inventory?.id === inventory.id && !item.deleted
      )
    : things?.filter((item) => !item?.deleted);
};

export const getInventory = (inventoryId: ID<typeof Inventory>) => {
  return useCoState(Inventory, inventoryId, {
    resolve: { things: { $each: true } },
  });
};

export const createItem = (
  item: CoMapInit<typeof Thing>
): Loaded<typeof Thing> => {
  const thing = Thing.create(item, {
    owner: item.inventory!._owner,
  });
  thing.inventory?.things?.push(thing);
  return thing;
};

export const updateItem = (
  item: Loaded<typeof Thing>,
  values: Partial<CoMapInit<typeof Thing>>
): Loaded<typeof Thing> => {
  item.applyDiff(values);
  return item;
};

export const deleteItem = (item: Loaded<typeof Thing>) => {
  const found = item.inventory?.things?.findIndex((it) => {
    return it?.id === item.id;
  });
  if (found !== undefined && found > -1)
    item.inventory?.things?.splice(found, 1);
};

export const mintItem = (item: Loaded<typeof Thing>) => {};

export const getInventories = (me: Loaded<typeof UserAccount>) => {
  return useCoState(InventoryList, me.root?._refs.inventories?.id, {
    resolve: { $each: { things: { $each: true } } },
  });
};

export const createInventory = (
  inventoryName: string,
  me: Loaded<typeof UserAccount>
): Loaded<typeof Inventory> => {
  const group = Group.create({ owner: me });
  const inventory = Inventory.create(
    { name: inventoryName, things: ThingList.create([], { owner: group }) },
    { owner: group }
  );
  me.root?.inventories?.push(inventory);
  return inventory;
};

export const deleteInventory = (
  inventoryId: ID<typeof Inventory>,
  me: Loaded<typeof UserAccount>
): void => {
  const inventoryIndex = me.root?.inventories?.findIndex(
    (it) => it?.id === inventoryId
  );
  if (inventoryIndex !== undefined && inventoryIndex > -1)
    me.root?.inventories?.splice(inventoryIndex, 1);
};

export const shareInventory = (
  inventory: Loaded<typeof Inventory>,
  permission: "reader" | "writer" | "admin"
): string | undefined => {
  if (inventory._owner && inventory.id) {
    return createInviteLink(inventory, permission);
  }
  return undefined;
};

export async function addSharedInventory(
  sharedInventoryId: ID<typeof Inventory>,
  me: Loaded<typeof UserAccount>
) {
  const group = Group.create({ owner: me });
  const inventory = Inventory.create(
    { name: "Shared Inventory", things: ThingList.create([], { owner: group }) },
    { owner: group }
  );
  me.root?.inventories?.push(inventory);
}
