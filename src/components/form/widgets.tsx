import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RegistryWidgetsType, WidgetProps } from "@rjsf/utils";
import { LucideImage, LucideX } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { SelectType } from "./widgets/select-type";

// for reference, see https://github.com/m6io/rjsf-tailwind/blob/main/src/components/rjsf/Widgets/Widgets.ts
// usage:  "ui:widget": "VALUE" where value is the key (e.g JsonEditorWidget)

/* ImagePreview Component */
interface ImagePreviewProps {
  files: File[];
  onDelete: (index: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ files, onDelete }) => {
  return (
    <div className="mt-2 grid grid-cols-3 gap-2">
      {files.map((file, index) => {
        const imageUrl = URL.createObjectURL(file);
        return (
          <div key={index} className="group relative">
            <img
              src={imageUrl}
              alt={`Preview ${index}`}
              className="h-20 w-full rounded-md object-cover"
            />
            <button
              onClick={() => onDelete(index)}
              className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-500 opacity-100 transition-opacity"
            >
              <LucideX className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const widgets: RegistryWidgetsType = {
  CheckboxWidget: function (props: WidgetProps) {
    return <Checkbox checked={props.value} onChange={props.onChange} />;
  },
  TextWidget: function (props: WidgetProps) {
    return (
      <Input
        onChange={(e) => props.onChange(e.target.value)}
        value={props.value}
      />
    );
  },
  TextareaWidget: function (props: WidgetProps) {
    return (
      <Textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  },
  JsonEditorWidget: function (props: WidgetProps) {
    const [error, setError] = useState<string | null>(null);
    const formatJsonKeys = (value: string): string => {
      try {
        // Attempt to parse the JSON to check for validity
        const parsed = JSON.parse(value);
        return JSON.stringify(parsed, null, 2); // Format valid JSON
      } catch (e) {
        // If parsing fails, handle it below
        return value; // Return original value to avoid errors
      }
    };

    const addQuotesToKeys = (input: string): string => {
      return input.replace(/(\w+)(?=\s*:)/g, '"$1"'); // Add quotes to keys
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const rawValue = e.target.value;
      const formattedValue = addQuotesToKeys(rawValue); // Add quotes to keys as user types
      props.onChange(formattedValue); // Update the value in the form
      setError(null); // Reset error state on change
    };

    const handleBlur = () => {
      try {
        const formattedValue = formatJsonKeys(props.value); // Format and validate JSON
        props.onChange(formattedValue); // Update the formatted value
      } catch (e) {
        setError("Invalid JSON"); // Set error message if JSON parsing fails
      }
    };

    return (
      <div className="flex flex-col">
        <Textarea
          value={props.value}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
  ImageUploadWidget: function (props: WidgetProps) {
    const { onChange, value } = props;
    const [isExpanded, setIsExpanded] = useState(false);
    const files = value ?? [];

    const onDrop = useCallback(
      (acceptedFiles: File[]) => {
        if (files.length + acceptedFiles.length <= 6) {
          const updatedFiles = [...files, ...acceptedFiles];
          onChange(updatedFiles); // Call onChange when files are updated
        }
      },
      [files, onChange]
    );

    const { getRootProps, getInputProps } = useDropzone({
      onDrop,
      accept: {
        "image/*": []
      }
    });

    const handleDeleteImage = (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      onChange(updatedFiles); // Call onChange after deleting an image
    };

    return (
      <div className="flex flex-grow flex-col">
        <div
          {...getRootProps({
            className: `w-full h-20 border-2 border-dashed rounded-md flex justify-center items-center cursor-pointer ${files.length >= 6 ? "pointer-events-none opacity-50" : ""}`
          })}
        >
          <input {...getInputProps()} />
          <LucideImage className="mr-2 h-6 w-6" />
          <span>
            {files.length < 6
              ? "Drag and drop images, or click to select"
              : "Maximum of 6 images"}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span>{files.length} / 6 images added</span>
          {files.length > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Hide Images" : "View Images"}
            </Button>
          )}
        </div>

        {isExpanded && (
          <ImagePreview files={files} onDelete={handleDeleteImage} />
        )}
      </div>
    );
  },
  SelectTypeWidget: SelectType
  // add the rest of your desired components here
};
