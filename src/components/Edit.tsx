import React, { useState } from "react";
import { Thing } from "../types/Thing";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { call, isSignedIn, login, getAccountId } from "web4-api-js";

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractCallResult, setContractCallResult] = useState<string | null>(null);
  const [contractCallError, setContractCallError] = useState<string | null>(null);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(() => {
    if (isSignedIn()) {
      const accountId = getAccountId();
      return accountId || null;
    }
    return null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First save the data locally
      onSave(data);
      
      // Then attempt to save to NEAR via web4 contract call
      setIsSubmitting(true);
      setContractCallResult(null);
      setContractCallError(null);
      
      // Check if user is signed in
      if (!isSignedIn()) {
        // If not signed in, redirect to login
        login();
        return;
      }
      
      // User is signed in, proceed with contract call
      const accountId = getAccountId();
      if (!accountId) {
        throw new Error("Failed to get account ID after login");
      }
      
      // Update the current account ID in the UI
      setCurrentAccountId(accountId);
      
      // Use the signed-in account as both signer and receiver
      const receiverId = accountId;
      
      // Convert the Thing object to a JSON string and then to a Uint8Array
      // This creates the binary blob that the contract expects
      const jsonData = JSON.stringify(data);
      const encoder = new TextEncoder();
      const binaryData = encoder.encode(jsonData);
      
      // Create an object with the binary data that matches the contract's expected format
      const args = {
        data: Array.from(binaryData) // Convert Uint8Array to regular array for serialization
      };
      
      // Make the contract call with the properly formatted args
      const response = await call(
        receiverId,
        "__fastdata_fastfs",
        args,
        { 
          gas: "1000000000000", // 0.001 Tgas
          deposit: "0" 
        }
      );
      
      setContractCallResult(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error("Contract call error:", err);
      setContractCallError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
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

      {currentAccountId ? (
        <div className="text-sm text-gray-600 text-center mb-2">
          Signed in as: <span className="font-medium">{currentAccountId}</span>
        </div>
      ) : (
        <div className="text-sm text-gray-600 text-center mb-2">
          Not signed in. You will be prompted to sign in when submitting.
        </div>
      )}
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] transition-all bg-white"
      >
        {isSubmitting ? "Submitting..." : "Save & Submit to NEAR"}
      </Button>
      
      {contractCallError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-medium text-red-800">Contract Call Error</h3>
          <p className="text-red-700 whitespace-pre-wrap">{contractCallError}</p>
        </div>
      )}
      
      {contractCallResult && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800">Contract Call Success</h3>
          <pre className="text-green-700 whitespace-pre-wrap overflow-auto max-h-60">
            {contractCallResult}
          </pre>
        </div>
      )}
    </form>
  );
};
