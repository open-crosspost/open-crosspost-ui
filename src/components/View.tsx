import React from "react";
import { Thing } from "../types/Thing";
import { Template } from "./Template";

interface ViewProps {
  data: Thing;
}

export const View: React.FC<ViewProps> = ({ data }) => {
  return <Template data={data} />;
};
