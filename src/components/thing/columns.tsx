import { ConfirmationModal } from "@/components/confirmation-modal";
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
import { useModalStack } from "@/hooks/use-modal-stack";
import { useSheetStack } from "@/hooks/use-sheet-stack";
import { deleteItem } from "@/lib/inventory";
import { Thing } from "@/lib/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Group } from "jazz-tools";
import { MoreHorizontal } from "lucide-react";
import { InspectThing } from "../thing/inspect";

export const columns: ColumnDef<unknown>[] = [
  {
    accessorKey: "id",
    header: "ID"
  },
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "data",
    header: "Data",
    cell: ({ getValue }) => (
      <div className="truncate" title={String(getValue())}>
        {getValue()}
      </div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const thing = row.original as Thing;
      const { openSheet } = useSheetStack();
      const { openModal } = useModalStack();

      const handleEditClick = () => {
        openSheet(
          EditThing,
          { thing },
          {
            title: "Edit Thing",
            description: "Select confirm when you're done"
          }
        );
      };

      const handleInspectClick = () => {
        openSheet(
          InspectThing,
          { thing },
          {
            title: "Inspect Thing",
            description: "Select confirm when you're done"
          }
        );
      };

      const handleDeleteClick = () => {
        console.log("deleting...");
        openModal(
          ConfirmationModal,
          {
            onConfirm: () => {
              deleteItem(thing);
            },
            onCancel: () => {}
          },
          {
            title: "Are you sure you want to delete this?",
            description: "Please confirm your selection."
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
              onClick={() => navigator.clipboard.writeText(thing.id)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleInspectClick}>
              Inspect
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleEditClick}
              disabled={
                thing._owner.castAs(Group).myRole() !== "admin" &&
                thing._owner.castAs(Group).myRole() !== "writer"
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDeleteClick}
              disabled={
                thing._owner.castAs(Group).myRole() !== "admin" &&
                thing._owner.castAs(Group).myRole() !== "writer"
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
