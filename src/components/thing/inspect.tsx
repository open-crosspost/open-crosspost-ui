import { NETWORK_ID, SOCIAL_CONTRACT } from "@/config";
import { useModalStack } from "@/hooks/use-modal-stack";
import { useWallet } from "@/lib/providers/near";
import { Thing } from "@/lib/schema";
import { social } from "@/lib/social";
import { transformActions } from "@builddao/near-social-js";
import { ConfirmationModal } from "../confirmation-modal";
import { Button } from "../ui/button";
import { ViewThing } from "./view";

interface InspectThingProps {
  thing: Thing;
  inventory: string;
}

export const InspectThing: React.FC<InspectThingProps> = ({ thing }) => {
  const { openModal } = useModalStack();
  const { wallet } = useWallet();

  const handlePublishClick = () => {
    console.log(thing);
    openModal(
      ConfirmationModal,
      {
        // could be pulled out to "openConfirmationModal"
        onConfirm: async () => {
          const account = await wallet!.getAccount();
          const { publicKey, accountId } = account;

          const data: any = {
            type: {
              [thing.id]: {
                "": thing.data,
                type: thing.type
              }
            }
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
    <>
      <Button onClick={handlePublishClick}>publish</Button>
      <ViewThing thing={thing} />
    </>
  );
};
