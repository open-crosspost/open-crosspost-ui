import { useType } from "@/lib/graph";
import { ThingSchema } from "@/lib/schema";
import { FormGenerator } from "../form/generator";

interface InspectTypeProps {
  typeId: string;
}

export const InspectType: React.FC<InspectTypeProps> = ({ typeId }) => {
  const { data, isLoading, isError } = useType({ typeId });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Failed to load types</p>;
  }

  return (
    <>
      <FormGenerator data={data} schema={ThingSchema} readonly />
    </>
  );
};
