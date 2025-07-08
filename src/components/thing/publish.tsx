import { useModalStack } from "@/hooks/use-modal-stack";
import { Thing, ThingSchema } from "@/lib/schema";
import { ConfirmationModal } from "../confirmation-modal";
import { FormGenerator } from "../form/generator";
import { useWallet } from "@/lib/providers/near";
import { social } from "@/lib/social";
import { transformActions } from "@builddao/near-social-js";
import { NETWORK_ID, SOCIAL_CONTRACT } from "@/config";

interface PublishThingProps {
  thing: Thing;
}

export const PublishThing: React.FC<PublishThingProps> = ({ thing }) => {
  const { openModal } = useModalStack();
  const { wallet } = useWallet();

  const handleSubmit = ({ data }) => {
    console.log(data.formData);
    openModal(
      ConfirmationModal,
      {
        // could be pulled out to "openConfirmationModal"
        onConfirm: async () => {
          const account = await wallet.getAccount();
          const { publicKey, accountId } = account;

          const data: any = {
            type: {}
          };

          const transaction = await social.set({
            account: { accountID: accountId, publicKey: publicKey },
            data: { [accountId]: data }
          });

          const transformedActions = transformActions(transaction.actions);

          await wallet!.signAndSendTransaction({
            contractId: SOCIAL_CONTRACT[NETWORK_ID],
            actions: transformedActions
          });
        },
        onCancel: () => {}
      },
      {
        title: "Are you sure?",
        description: "Please confirm your selection."
      }
    );
  };

  return (
    <div>
      <FormGenerator
        data={thing}
        schema={ThingSchema}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
