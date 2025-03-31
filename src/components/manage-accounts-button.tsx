import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import * as React from "react";
import { useCallback } from "react";
import { Button } from "./ui/button";
import { useRequireAuth } from "@/lib/auth/require-auth";

export function ManageAccountsButton(): React.ReactElement {
  const navigate = useNavigate();
  const { requireAuth, AuthModal } = useRequireAuth();
  
  const handleClick = useCallback(() => {
    requireAuth(() => {
      navigate({ to: "/manage" });
    });
  }, [navigate, requireAuth]);

  return (
    <>
      <Button onClick={handleClick}>
        <Users size={18} className="mr-2" />
        Manage Accounts
      </Button>
      
      {/* Auth Modal - will only show when needed */}
      {AuthModal}
    </>
  );
}
