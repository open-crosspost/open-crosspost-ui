import { useType } from "@/lib/graph";
import { Thing, ThingSchema } from "@/lib/schema";
import { FormGenerator } from "../form/generator";

interface ViewThingProps {
  thing: Thing;
}

// We assume that we already have the data available and being passed to it
export const ViewThing: React.FC<ViewThingProps> = ({ thing }) => {
  const { data, isLoading, isError } = useType({
    typeId: thing.type
  });

  if (isLoading) return <p>Loading...</p>;

  if (isError) return <p>Error...</p>;

  return <FormGenerator data={data} schema={ThingSchema} readonly />;
};
