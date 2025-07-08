import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getInventories } from "@/lib/inventory";
import { useAccount } from "@/lib/providers/jazz";
import { Inventory } from "@/lib/schema";
import { ErrorSchema, WidgetProps } from "@rjsf/utils";

export function SelectInventoryWidget(props: WidgetProps) {
  return <SelectInventory value={props.value} onChange={props.onChange} />;
}

export function SelectInventory({
  value,
  onChange
}: {
  value: string;
  onChange: (
    value: any,
    es?: ErrorSchema<any> | undefined,
    id?: string | undefined
  ) => void;
}) {
  const { me } = useAccount();

  const inventories = getInventories(me);

  return (
    <>
      <Label htmlFor="inventory-select">Inventory</Label>
      <Select
        id="inventory-select"
        onValueChange={onChange}
        defaultValue={value}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select inventory" />
        </SelectTrigger>
        <SelectContent>
          {inventories?.map((inventory: Inventory) => (
            <SelectItem key={inventory.id} value={inventory}>
              {inventory.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
