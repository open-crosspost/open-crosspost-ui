import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useType } from "@/lib/graph";
import { createItem, getInventories } from "@/lib/inventory";
import { useAccount } from "@/lib/providers/jazz";
import { Thing } from "@/lib/schema";
import { safeJsonParse } from "@/lib/utils";
import { RJSFSchema } from "@rjsf/utils";
import { CoMapInit } from "jazz-tools";
import { useState } from "react";
import { AIProcessor } from "../ai-processor";
import { FormGenerator } from "../form/generator";
import { SelectInventory } from "../form/widgets/select-inventory";
import { SelectType } from "../form/widgets/select-type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// Types
interface CreateThingProps {
  onCreateCallback: () => void;
}

interface FormProps {
  type: string;
  onSubmit: (data: any) => void;
}

// Constants
const TABS = {
  FORM: "form",
  JSON: "json",
  AI: "ai"
} as const;

const jsonEditorSchema: RJSFSchema = {
  type: "object",
  properties: {
    type: { type: "string" },
    data: { type: "string" }
  },
  required: ["type", "data"]
};

const LoadingState = () => (
  <div className="flex items-center justify-center p-4">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center p-4">
    <p className="text-destructive">{message}</p>
  </div>
);

// Validation Results Component
const ValidationResults = ({
  isOpen,
  onOpenChange,
  errors
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  errors: string;
}) => (
  <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
    <CollapsibleTrigger className="w-full">
      <div className="flex items-center justify-between rounded-lg border p-2">
        <span>Validation Results</span>
        <span>{isOpen ? "↑" : "↓"}</span>
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Textarea readOnly value={errors} rows={5} className="mt-2" />
    </CollapsibleContent>
  </Collapsible>
);

interface FormProps {
  type: string;
  onSubmit: (data: any) => void;
}

// Creation method tabs constant
const CREATION_METHODS = {
  AI: "ai",
  FORM: "form"
} as const;

type CreationMethod = (typeof CREATION_METHODS)[keyof typeof CREATION_METHODS];

const ThingForm = ({ type, onSubmit }: FormProps) => {
  const { data, isLoading, isError } = useType({ typeId: type });

  const [creationMethod, setCreationMethod] = useState<CreationMethod>(
    CREATION_METHODS.AI
  );

  // Loading and error states remain the same
  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState message="Failed to load form data" />;
  }

  if (!data) {
    return <ErrorState message="No form data available" />;
  }

  // Parse the data and handle potential errors
  let schema;
  try {
    const typeData = safeJsonParse(data.data);
    schema = safeJsonParse(typeData.schema);
    if (!schema) {
      return <ErrorState message="No schema available" />;
    }
  } catch (error) {
    return <ErrorState message="Invalid schema format" />;
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={creationMethod}
        onValueChange={(value: CreationMethod) => setCreationMethod(value)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={CREATION_METHODS.FORM}>Form</TabsTrigger>
          <TabsTrigger value={CREATION_METHODS.AI}>AI Assistant</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value={CREATION_METHODS.FORM} className="mt-0">
            <FormGenerator
              schema={schema}
              onSubmit={(data) => {
                onSubmit({ type, data: JSON.stringify(data) });
              }}
            />
          </TabsContent>

          <TabsContent value={CREATION_METHODS.AI} className="mt-0">
            <AIProcessor
              schema={schema}
              onCreate={(data) => onSubmit({ type, data })}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Main Component
export const CreateThing = ({ onCreateCallback }: CreateThingProps) => {
  const { me } = useAccount();
  const [selectedType, setSelectedType] = useState(
    "type-registry.testnet/type/Thing"
  );

  const [selectedInventory, setSelectedInventory] = useState(null);

  const inventories = getInventories(me);

  if (!inventories?.length) {
    return <ErrorState message="No inventories available" />;
  }

  const handleSubmit = async ({ data, type }: { data: any; type: string }) => {
    try {
      await createItem({
        inventory: selectedInventory ?? inventories[0],
        deleted: false,
        data: data,
        type: type
      } as CoMapInit<Thing>);

      onCreateCallback?.();
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  return (
    <div className="flex h-full flex-grow flex-col">
      <div className="flex h-full w-full flex-col space-y-4 overflow-y-auto p-4">
        <SelectInventory
          value={selectedInventory}
          onChange={(val) => setSelectedInventory(val)}
        />
        <SelectType
          value={selectedType}
          onChange={(val) => setSelectedType(val)}
        />
        <ThingForm type={selectedType} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};
