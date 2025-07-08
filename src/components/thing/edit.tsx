import { ConfirmationModal } from "@/components/confirmation-modal";
import { Button } from "@/components/ui/button";
import { useModalStack } from "@/hooks/use-modal-stack";
import { Thing, ThingSchema, TypeSchema } from "@/lib/schema";
import { FormGenerator } from "../form/generator";

interface EditThingProps {
  thing: Thing;
  inventory: string;
}

export const EditThing: React.FC<EditThingProps> = ({ thing }) => {
  const { openModal, closeModal } = useModalStack();

  const handleConfirmClick = () => {
    openModal(
      ConfirmationModal,
      {
        // could be pulled out to "openConfirmationModal"
        onConfirm: () => {
          console.log("Confirmsed!");
        },
        onCancel: () => {}
      },
      {
        title: "Are you sure?",
        description: "Please confirm your selection."
      }
    );
  };

  const handleSubmit = () => {
    // Handle the update logic here
    console.log("Updating thing:", formData);
  };

  // console.log("data", data);

  return (
    <div>
      <FormGenerator data={thing} schema={ThingSchema} />
      <Button onClick={handleConfirmClick}>Open Confirmation</Button>
    </div>
  );
};
