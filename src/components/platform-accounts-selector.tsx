import React from 'react';
import { useConnectedAccounts, usePlatformAccountsStore } from '../store/platformAccountsStore';
import { Button } from './ui/button';
import { Twitter } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export function PlatformAccountsSelector() {
  const navigate = useNavigate();
  const { data: accounts = [], isLoading, error } = useConnectedAccounts();
  const { selectedAccountIds, selectAccount, unselectAccount } = usePlatformAccountsStore();
  
  // Handle connect accounts button click
  const handleConnectAccounts = () => {
    navigate({ to: '/manage' });
  };
  
  // Handle account selection toggle
  const handleAccountToggle = (userId: string) => {
    if (selectedAccountIds.includes(userId)) {
      unselectAccount(userId);
    } else {
      selectAccount(userId);
    }
  };
  
  if (isLoading) {
    return (
      <div className="border-2 border-gray-200 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Connected Accounts</h3>
          <Button variant="outline" size="sm" onClick={handleConnectAccounts}>
            Manage
          </Button>
        </div>
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="border-2 border-red-200 bg-red-50 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-red-700">Error Loading Accounts</h3>
          <Button variant="outline" size="sm" onClick={handleConnectAccounts}>
            Manage
          </Button>
        </div>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to load connected accounts'}
        </p>
      </div>
    );
  }
  
  if (accounts.length === 0) {
    return (
      <div className="border-2 border-gray-200 rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Connected Accounts</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500 mb-4">No accounts connected yet</p>
          <Button onClick={handleConnectAccounts}>
            Connect Accounts
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border-2 border-gray-200 rounded-md p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Post to</h3>
        <Button variant="outline" size="sm" onClick={handleConnectAccounts}>
          Manage
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {accounts.map((account) => (
          <div
            key={account.userId}
            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
              selectedAccountIds.includes(account.userId)
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'border-2 border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => handleAccountToggle(account.userId)}
          >
            <div className="flex-shrink-0 mr-3">
              {account.platform === 'twitter' && (
                <Twitter size={20} className="text-blue-400" />
              )}
            </div>
            
            <div className="flex-grow">
              <div className="font-medium">@{account.username}</div>
              <div className="text-xs text-gray-500">{account.platform}</div>
            </div>
            
            <div className="flex-shrink-0 ml-2">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAccountIds.includes(account.userId)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedAccountIds.includes(account.userId) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3 text-white"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
