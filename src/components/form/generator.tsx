import Form from "@rjsf/core";
import { RJSFSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { templates } from "./templates";
import { widgets } from "./widgets";

const uiSchema = {
  // globals for determining what to render
  schema: {
    // ("schema" property will resolve to a JsonEditorWidget)
    "ui:widget": "JsonEditorWidget"
  },
  media: {
    "ui:widget": "ImageUploadWidget"
  },
  type: {
    "ui:widget": "SelectTypeWidget"
  },
  data: {
    "ui:widget": "JsonEditorWidget"
  }
};

export const FormGenerator = ({
  data,
  schema,
  readonly = false,
  onChange,
  onSubmit,
  onError
}: {
  data?: any;
  schema: RJSFSchema;
  readonly?: boolean;
  onChange?: () => void;
  onSubmit?: () => void;
  onError?: () => void;
}) => {
  return (
    <Form
      schema={schema}
      formData={data && JSON.parse(JSON.stringify(data))}
      validator={validator}
      uiSchema={uiSchema}
      widgets={widgets}
      templates={templates}
      readonly={readonly}
      onChange={() => onChange?.()}
      onSubmit={(e) => onSubmit?.(e.formData)}
      onError={() => onError?.()}
      showErrorList="top"
    />
  );
};
