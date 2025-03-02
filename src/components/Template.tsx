import React from "react";
import { Thing } from "../types/Thing";

interface TemplateProps {
  data: Thing;
}

export const Template: React.FC<TemplateProps> = ({ data }) => {
  return (
    <div className="thing-template space-y-8">
      {data.image && (
        <div className="mx-auto w-20 h-20 bg-white border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center transform hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all rounded-md">
          <img
            src={data.image}
            alt={data.name}
            className="w-full h-full object-fit"
          />
        </div>
      )}

      <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-black">
        {data.name}
      </h1>

      {data.description && (
        <div className="markdown">
          <p>{data.description}</p>
        </div>
      )}

      {data.properties && Object.keys(data.properties).length > 0 && (
        <div className="properties space-y-4">
          <h2 className="text-2xl font-bold">Properties</h2>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(data.properties).map(([key, value]) => (
              <div
                key={key}
                className="property p-3 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white"
              >
                <strong className="font-bold">{key}:</strong>{" "}
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
