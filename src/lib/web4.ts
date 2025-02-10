import Cookies from "js-cookie";

interface Args {
  [key: string]: any;
}

interface CallOptions {
  gas?: string;
  deposit?: string;
  callbackUrl?: string;
}

interface LoginOptions {
  contractId?: string;
  callbackPath?: string;
}

function constructCallbackUrl(path: string): string {
  const url = new URL(path, window.location.origin);
  // Preserve any existing query parameters
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
}

async function sendJson<T>(method: string, url: string, data?: any): Promise<T> {
  // For GET requests, append data as query parameters
  if (method === 'GET' && data) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      params.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
    url = `${url}?${params.toString()}`;
  }

  const response = await fetch(url, {
    method,
    ...(method !== 'GET' && data ? { body: JSON.stringify(data) } : {}),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`HTTP ${response.status}: ${error}`);
    throw new Error(error);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export function isSignedIn() {
  console.log("isSignedIn", Cookies.get("web4_account_id"));
  return !!Cookies.get("web4_account_id");
}

export function getAccountId() {
  console.log("getAccountId", Cookies.get("web4_account_id"));
  return Cookies.get("web4_account_id");
}

export function login(options: LoginOptions = {}) {
  const { contractId, callbackPath = window.location.pathname } = options;

  const params = new URLSearchParams();

  if (contractId) params.append("web4_contract_id", contractId);
  params.append("web4_callback_url", constructCallbackUrl(callbackPath));

  window.location.href = `/web4/login?${params.toString()}`;
}

export function logout() {
  window.location.href = "/web4/logout";
}

export async function view<T = any>(
  contractId: string,
  methodName: string,
  args?: Args,
): Promise<T> {
  try {
    // Convert args into params where each key gets .json appended
    const params = args
      ? Object.entries(args).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [`${key}.json`]: JSON.stringify(value),
          }),
          {}
        )
      : {};

    return await sendJson<T>(
      'GET',
      `/web4/contract/${contractId}/${methodName}`,
      params
    );
  } catch (error) {
    console.error("Error in view method:", error);
    throw error;
  }
}

export async function call<T = any>(
  contractId: string,
  methodName: string,
  args: Args,
  options: CallOptions = {},
): Promise<T> {
  try {
    const callbackUrl = options.callbackUrl 
      ? constructCallbackUrl(options.callbackUrl)
      : undefined;

    const payload = {
      ...args,
      web4_gas: options.gas,
      web4_deposit: options.deposit,
      web4_callback_url: callbackUrl,
    };

    return await sendJson<T>(
      'POST',
      `/web4/contract/${contractId}/${methodName}`,
      payload
    );
  } catch (error) {
    console.error("Error in call method:", error);
    throw error;
  }
}
