import { RJSFSchema } from "@rjsf/utils";
import { co, z, Group, CoListSchema } from "jazz-tools";

export const Inventory = co.map({
  name: z.string(),
  get things(): CoListSchema<typeof Thing> {
    return ThingList;
  },
});

export const Thing = co.map({
  data: z.string(),
  type: z.string(),
  metadata: z.string(),
  inventory: Inventory,
  deleted: z.boolean(),
});

export const ThingList = co.list(Thing);

export const InventoryList = co.list(Inventory);

export const UserAccountRoot = co.map({
  inventories: InventoryList,
});

// we could start with some things...
// they are all types
// Thing
// Type
// Inventory
// User
// Metadata

// On each update of the app, what if it grabbed the types and published the schema?
// posted it to Graph("root.allthethings.testnet").set("every.near/type/user")
// then, when you fork it, it will set to your account.
// it will pull from the bos.config.json
export const TypeSchema: RJSFSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Human-readable name for the type."
    },
    description: {
      type: "string",
      description: "Optional description of the type."
    },
    schema: {
      type: "string",
      description: "JSON schema that describes the data for this type."
    }
  },
  required: ["name", "description", "schema"],
  additionalProperties: false
};

export const ThingSchema: RJSFSchema = {
  type: "object",
  properties: {
    id: {
      type: "string",
      description: "Unique identifier for the Thing."
    },
    type: {
      type: "string",
      description:
        "Reference to the Type schema ID defining this Thing's structure."
    },
    data: {
      type: "string",
      description: "Structured JSON following the schema defined by Type.",
      additionalProperties: true
    }
  },
  required: ["id", "type", "data"],
  additionalProperties: false
};

export const UserAccount = co
  .account({
    profile: co.profile(),
    root: UserAccountRoot,
  })
  .withMigration((account, creationProps?: { name: string }) => {
    if (!account.root) {
      const group = Group.create({ owner: account });
      const firstInventory = Inventory.create(
        {
          name: "Types",
          things: ThingList.create([], { owner: group }),
        },
        { owner: group }
      );

      firstInventory.things?.push(
        Thing.create(
          {
            data: JSON.stringify(TypeSchema),
            type: "Type",
            metadata: JSON.stringify({}),
            inventory: firstInventory,
            deleted: false,
          },
          { owner: group }
        ),
        Thing.create(
          {
            data: JSON.stringify(ThingSchema),
            type: "Thing",
            metadata: JSON.stringify({}),
            inventory: firstInventory,
            deleted: false,
          },
          { owner: group }
        )
      );

      account.root = UserAccountRoot.create(
        {
          inventories: InventoryList.create([firstInventory], {
            owner: account,
          }),
        },
        { owner: account }
      );
    }
  });
