import { Button } from "@/components/ui/button";
import {
  ErrorListProps,
  FormContextType,
  getSubmitButtonOptions,
  RJSFSchema,
  StrictRJSFSchema,
  SubmitButtonProps
} from "@rjsf/utils";

// For reference, see https://github.com/m6io/rjsf-tailwind/blob/main/src/components/rjsf/Templates/Templates.ts

export const templates = {
  ButtonTemplates: {
    SubmitButton: SubmitButton
  },
  ErrorListTemplate
};

function SubmitButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: SubmitButtonProps<T, S, F>) {
  const {
    submitText,
    norender,
    props: submitButtonProps
  } = getSubmitButtonOptions<T, S, F>(props.uiSchema);

  if (norender) {
    return null;
  }

  return (
    <div>
      <Button type="submit" {...submitButtonProps}>
        {submitText}
      </Button>
    </div>
  );
}

function ErrorListTemplate(props: ErrorListProps) {
  const { errors } = props;
  return (
    <div>
      <ul>
        {errors.map((error) => (
          <li key={error.stack} className="text-red-500">
            {error.stack}
          </li>
        ))}
      </ul>
    </div>
  );
}
