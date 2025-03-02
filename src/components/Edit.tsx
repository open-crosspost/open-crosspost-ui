import React, { useState } from "react";
import { Thing } from "../types/Thing";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface EditProps {
  initialData?: Thing;
  onSave: (data: Thing) => void;
}

export const Edit: React.FC<EditProps> = ({ initialData, onSave }) => {
  const [data, setData] = useState<Thing>(
    initialData || { name: "", description: "", image: "", properties: {} }
  );
  const [newPropertyKey, setNewPropertyKey] = useState("");
  const [newPropertyValue, setNewPropertyValue] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleAddProperty = () => {
    if (!newPropertyKey.trim()) return;
    
    setData({
      ...data,
      properties: {
        ...data.properties,
        [newPropertyKey]: newPropertyValue,
      },
    });
    
    setNewPropertyKey("");
    setNewPropertyValue("");
  };

  const handleRemoveProperty = (key: string) => {
    const newProperties = { ...data.properties };
    delete newProperties[key];
    
    setData({
      ...data,
      properties: newProperties,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block font-medium">
          Name (required)
        </label>
        <Input
          id="name"
          name="name"
          value={data.name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={data.description || ""}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="block font-medium">
          Image URL
        </label>
        <Input
          id="image"
          name="image"
          value={data.image || ""}
          onChange={handleChange}
          className="w-full px-4 py-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Properties</h2>
        
        {data.properties && Object.keys(data.properties).length > 0 && (
          <div className="space-y-2">
            {Object.entries(data.properties).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1 p-3 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] bg-white">
                  <strong className="font-bold">{key}:</strong>{" "}
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveProperty(key)}
                  className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Property name"
            value={newPropertyKey}
            onChange={(e) => setNewPropertyKey(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all"
          />
          <Input
            placeholder="Property value"
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:ring-0 focus:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all"
          />
          <Button
            type="button"
            onClick={handleAddProperty}
            className="border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
          >
            Add
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
      >
        Save
      </Button>
    </form>
  );
};
