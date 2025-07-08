import { ColumnDef } from "@tanstack/react-table";
import { useModalStack } from "@/hooks/use-modal-stack";
import { deleteItem } from "@/lib/inventory";
import { Thing } from "@/lib/schema";
import { Group } from "jazz-tools";
import { MoreHorizontal } from "lucide-react";
import { EditThing } from "@/components/thing/edit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useSheetStack } from "@/hooks/use-sheet-stack";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { InspectThing } from "../thing/inspect";
import { useAccount } from "@/lib/providers/jazz";
import { useType } from "@/lib/graph";
import { InspectType } from "./inspect";

export const typesColumns: ColumnDef<unknown>[] = [
  {
    accessorKey: "id",
    header: "ID"
  },
  {
    accessorKey: "accountId",
    header: "AccountId"
  },
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "key",
    header: "Key"
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const type = row.original;
      console.log("type", type);

      const { openSheet } = useSheetStack();
      const { openModal } = useModalStack();

      const handleInspectClick = () => {
        openSheet(
          InspectType,
          { typeId: type.id },
          {
            title: "Inspect Type",
            description: "Select confirm when you're done"
          }
        );
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(type.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleInspectClick}>
              Inspect
            </DropdownMenuItem>
            {/* These could be enabled if id is equal */}

            {/* <DropdownMenuItem
              onClick={handleEditClick}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteClick}
            >
              Delete
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
