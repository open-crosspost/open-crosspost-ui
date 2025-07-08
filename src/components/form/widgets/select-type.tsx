import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useWeb4Auth } from "@/hooks/use-web4-auth";
import { useGetTypes } from "@/lib/graph";
import { getTypes } from "@/lib/inventory";
import { useAccount } from "@/lib/providers/jazz";
import { ErrorSchema, WidgetProps } from "@rjsf/utils";

export function SelectTypeWidget(props: WidgetProps) {
  return <SelectType value={props.value} onChange={props.onChange} />;
}

export function SelectType({
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
  const { accountId } = useWeb4Auth();
  const { data: types = [], isLoading, isError } = useGetTypes();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>Failed to load types</p>;
  }

  const localTypes =
    getTypes(me)?.map((it) => {
      const typeData = JSON.parse(it.data);
      return {
        accountId,
        id: it.id,
        key: typeData.name
      };
    }) || [];

  const combinedTypes = [...types, ...localTypes];

  return (
    <>
      <Label htmlFor="type-select">Type</Label>
      <Select id="type-select" onValueChange={onChange} defaultValue={value}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a type" />
        </SelectTrigger>
        <SelectContent>
          {combinedTypes?.map((type: any) => (
            <SelectItem key={type.id} value={type.id}>
              {type.key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
