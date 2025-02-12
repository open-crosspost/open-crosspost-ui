import Cookies from "js-cookie";

/**
 * Valid JSON values that can be passed as arguments to web4 methods.
 */
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Arguments for view method calls that don't modify state.
 * These are converted to URL parameters with .json suffix.
 */
interface ViewMethodArgs {
  [key: string]: JsonValue;
}

/**
 * Arguments for contract calls that can modify state.
 * These are sent as form data with web4_ parameters.
 */
interface ContractCallArgs {
  [key: string]: JsonValue;
}

/**
 * Options for contract calls.
 * @property gas - Gas limit for the transaction
 * @property deposit - Amount of NEAR to attach to the call
 * @property callbackUrl - URL to return to after transaction completion
 */
interface ContractCallOptions {
  gas?: string;
  deposit?: string;
  callbackUrl?: string;
}

/**
 * Options for the login process.
 * @property contractId - Contract requiring access
 * @property callbackPath - Path to return to after login
 */
interface LoginOptions {
  contractId?: string;
  callbackPath?: string;
}

/**
 * Constructs a callback URL for web4 operations.
 * Preserves query parameters and ensures proper URL formatting.
 * 
 * @param path - The path to return to after the web4 operation
 * @returns A fully qualified URL string
 */
function constructCallbackUrl(path: string): string {
  // Use current origin to ensure we stay on the same web4 domain
  const origin = window.location.origin;
  const url = new URL(path.startsWith('/') ? path : `/${path}`, origin);

  // Preserve existing query parameters
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.forEach((value, key) => {
    if (!key.startsWith('web4_')) {  // Don't carry over web4_ params
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Checks if a user is currently signed in to web4.
 * @returns true if user is signed in, false otherwise
 */
export function isSignedIn(): boolean {
  return !!Cookies.get("web4_account_id");
}

/**
 * Gets the currently signed in account ID.
 * @returns The account ID if signed in, undefined otherwise
 */
export function getAccountId(): string | undefined {
  return Cookies.get("web4_account_id");
}

/**
 * Initiates the web4 login process.
 * Redirects to the login page and returns to the specified callback path.
 * 
 * @param options - Login configuration options
 */
export function login(options: LoginOptions = {}): void {
  const { contractId, callbackPath = '/' } = options;
  const params = new URLSearchParams();
  
  if (contractId) {
    params.append("web4_contract_id", contractId);
  }
  params.append("web4_callback_url", constructCallbackUrl(callbackPath));
  
  window.location.href = `/web4/login?${params.toString()}`;
}

/**
 * Logs out the current user and clears web4 session data.
 * Redirects to the web4 logout page which will clear cookies.
 */
export function logout(): void {
  window.location.href = "/web4/logout";
}

/**
 * Internal function to execute view method calls.
 * These calls don't modify state and don't require signing.
 * 
 * @param contractId - The contract to call
 * @param methodName - The view method to call
 * @param args - Arguments to pass to the method
 * @returns The method's return value
 */
async function fetchViewMethod<T>(
  contractId: string, 
  methodName: string, 
  args?: ViewMethodArgs
): Promise<T> {
  // Convert args to .json format
  const params = new URLSearchParams();
  if (args) {
    Object.entries(args).forEach(([key, value]) => {
      params.append(`${key}.json`, JSON.stringify(value));
    });
  }

  const url = `/web4/contract/${contractId}/${methodName}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

/**
 * Internal function to execute contract calls that can modify state.
 * These calls may require signing and handle deposits.
 * 
 * @param contractId - The contract to call
 * @param methodName - The method to call
 * @param args - Arguments to pass to the method
 * @param options - Call configuration options
 * @returns The method's return value, or null if redirected for signing
 */
async function fetchContractCall<T>(
  contractId: string,
  methodName: string,
  args: ContractCallArgs,
  options: ContractCallOptions = {}
): Promise<T> {
  const callbackUrl = options.callbackUrl 
    ? constructCallbackUrl(options.callbackUrl)
    : constructCallbackUrl('/');  // Defaults to app root

  // Construct form data with web4_ parameters at top level
  const formData = new URLSearchParams();
  
  // Add contract call arguments
  Object.entries(args).forEach(([key, value]) => {
    formData.append(key, JSON.stringify(value));
  });

  // Add web4 parameters
  if (options.gas) formData.append('web4_gas', options.gas);
  if (options.deposit) formData.append('web4_deposit', options.deposit);
  formData.append('web4_callback_url', callbackUrl);

  const response = await fetch(`/web4/contract/${contractId}/${methodName}`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // Handle redirects (e.g., deposit requires a signature)
  if (response.redirected) {
    window.location.href = response.url;
    return null as T;
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

/**
 * Calls a view method on a web4 contract.
 * These calls don't modify state and don't require signing.
 * 
 * @param contractId - The contract to call
 * @param methodName - The view method to call
 * @param args - Arguments to pass to the method
 * @returns A promise that resolves to the method's return value
 * @throws Error if the call fails
 */
export async function view<T = any>(
  contractId: string,
  methodName: string,
  args?: ViewMethodArgs,
): Promise<T> {
  try {
    return await fetchViewMethod<T>(contractId, methodName, args);
  } catch (error) {
    console.error("Error in view method:", error);
    throw error;
  }
}

/**
 * Calls a method on a web4 contract that can modify state.
 * These calls may require signing and can include deposits.
 * 
 * @param contractId - The contract to call
 * @param methodName - The method to call
 * @param args - Arguments to pass to the method
 * @param options - Call configuration options
 * @returns A promise that resolves to the method's return value, or null if redirected for signing
 * @throws Error if the call fails
 */
export async function call<T = any>(
  contractId: string,
  methodName: string,
  args: ContractCallArgs,
  options: ContractCallOptions = {},
): Promise<T> {
  try {
    return await fetchContractCall<T>(contractId, methodName, args, options);
  } catch (error) {
    console.error("Error in call method:", error);
    throw error;
  }
}
