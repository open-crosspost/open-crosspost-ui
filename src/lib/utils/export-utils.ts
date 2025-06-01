export interface ExportField<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, item: T) => string;
}

export type ExportFormat = "csv" | "json";

export const downloadFile = (
  content: string,
  filename: string,
  contentType: string,
) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const convertToCSV = <T>(
  data: T[],
  fields: ExportField<T>[],
): string => {
  if (data.length === 0) return "";

  const headers = fields.map((field) => field.header);

  const csvContent = [
    headers.join(","),
    ...data.map((item) =>
      fields
        .map((field) => {
          let value: any;

          if (typeof field.key === "string" && field.key.includes(".")) {
            // Handle nested properties like 'user.name'
            value = field.key
              .split(".")
              .reduce((obj, key) => obj?.[key], item as any);
          } else {
            value = (item as any)[field.key];
          }

          if (field.formatter) {
            value = field.formatter(value, item);
          }

          // Handle null/undefined values
          if (value === null || value === undefined) {
            value = "N/A";
          }

          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const stringValue = String(value);
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }

          return stringValue;
        })
        .join(","),
    ),
  ].join("\n");

  return csvContent;
};

export const convertToJSON = <T>(
  data: T[],
  fields?: ExportField<T>[],
): string => {
  if (!fields) {
    return JSON.stringify(data, null, 2);
  }

  const transformedData = data.map((item) => {
    const transformed: any = {};

    fields.forEach((field) => {
      let value: any;

      if (typeof field.key === "string" && field.key.includes(".")) {
        value = field.key
          .split(".")
          .reduce((obj, key) => obj?.[key], item as any);
      } else {
        value = (item as any)[field.key];
      }

      if (field.formatter) {
        value = field.formatter(value, item);
      }

      transformed[field.header] = value;
    });

    return transformed;
  });

  return JSON.stringify(transformedData, null, 2);
};

export const exportData = <T>(
  data: T[],
  fields: ExportField<T>[],
  filename: string,
  format: ExportFormat,
) => {
  let content: string;
  let contentType: string;
  let fileExtension: string;

  switch (format) {
    case "csv":
      content = convertToCSV(data, fields);
      contentType = "text/csv;charset=utf-8;";
      fileExtension = "csv";
      break;
    case "json":
      content = convertToJSON(data, fields);
      contentType = "application/json;charset=utf-8;";
      fileExtension = "json";
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const fullFilename = `${filename}_${timestamp}.${fileExtension}`;

  downloadFile(content, fullFilename, contentType);
};
