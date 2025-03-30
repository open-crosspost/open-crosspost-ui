import { toast } from "@/hooks/use-toast";
import { useNearAuth } from "@/store/nearAuthStore";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import * as React from "react";
import { useCallback, useState } from "react";
import { AppAuthorization } from "./app-authorization";
import { Button } from "./ui/button";

export function ManageAccountsButton(): React.ReactElement {
  const navigate = useNavigate();
  const { isAuthorized } = useNearAuth();
  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  
  const handleClick = useCallback(() => {
    if (isAuthorized) {
      navigate({ to: "/manage" });
    } else {
      // Show auth dialog if not authenticated
      setShowAuthDialog(true);
    }
  }, [isAuthorized, navigate]);

  return (
    <>
      <Button onClick={handleClick}>
        <Users size={18} className="mr-2" />
        Manage Accounts
      </Button>
      
      {/* App Authorization Dialog */}
      <AppAuthorization 
        isOpen={showAuthDialog} 
        onClose={() => setShowAuthDialog(false)} 
      />
    </>
  );
}
