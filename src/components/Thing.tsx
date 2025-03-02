import React, { useEffect, useState } from "react";
import { Thing } from "../types/Thing";
import { Template } from "./Template";

interface ThingProps {
  path?: string; // Path to the thing.json file
  data?: Thing; // Direct data object
  typePath?: string; // Path to the type.json file (JSON schema)
}

export const ThingComponent: React.FC<ThingProps> = ({ 
  path, 
  data: initialData,
  typePath = "/schema.json" 
}) => {
  const [data, setData] = useState<Thing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // If direct data is provided, use it
        if (initialData) {
          setData(initialData);
          setLoading(false);
          return;
        }

        // If path is provided, fetch data from that path
        if (path) {
          const response = await fetch(path);
          if (!response.ok) {
            throw new Error(`Failed to fetch data from ${path}: ${response.statusText}`);
          }
          const jsonData = await response.json();
          setData(jsonData);
        } else {
          // If no path or data is provided, try to load from localStorage
          const savedData = localStorage.getItem("thing-data");
          if (savedData) {
            setData(JSON.parse(savedData));
          } else {
            // Default data if nothing else is available
            setData({
              name: "Example Thing",
              description: "This is an example thing to demonstrate the template.",
              image: "https://placehold.co/400",
              properties: {
                category: "example",
                tags: "template, demo, thing",
                version: "1.0.0",
              }
            });
          }
        }
      } catch (err) {
        console.error("Error loading thing data:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [path, initialData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return <Template data={data} />;
};
