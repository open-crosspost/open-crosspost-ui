import { Button, ButtonProps } from "./ui/button";
import { Shield } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { AuthorizationModal } from "./authorization-modal";
import { useAuthorizationStatus } from "../hooks/use-authorization-status";

interface AuthButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export function AuthButton({
  children,
  ...props
}: AuthButtonProps): React.ReactElement {
  const isAuthorized = useAuthorizationStatus();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = () => {
    if (!isAuthorized) {
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  if (isAuthorized === null) {
    return (
      <Button disabled {...props}>
        <Shield size={18} className="mr-2" />
        Checking...
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleClick} {...props}>
        <Shield size={18} className="mr-2" />
        {children || (isAuthorized ? "Authorized" : "Authorize App")}
      </Button>

      <AuthorizationModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
