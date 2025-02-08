import axios from "axios";
import Cookies from "js-cookie";

interface Args {
  [key: string]: any;
}

interface CallOptions {
  gas?: string;
  deposit?: string;
  callbackUrl?: string;
}

export function isSignedIn() {
  console.log("isSignedIn", Cookies.get("web4_account_id"));
  return !!Cookies.get("web4_account_id");
}

export function getAccountId() {
  console.log("getAccountId", Cookies.get("web4_account_id"));
  return Cookies.get("web4_account_id");
}

interface LoginOptions {
  contractId?: string;
  callbackPath?: string;
}

export function login(options: LoginOptions = {}) {
  const { contractId, callbackPath = "" } = options;

  const params = new URLSearchParams();

  // Optional parameters
  if (contractId) params.append("contract_id", contractId);

  // Assuming base callback URL is always the current origin
  const hostOrigin = encodeURIComponent(window.origin);
  params.append("web4_callback_url", `${hostOrigin}${callbackPath}`);

  window.location.href = `/web4/login?${params.toString()}`;
}

export function logout() {
  window.location.href = "/web4/logout";
}

export async function view(
  contractId: string,
  methodName: string,
  args?: Args,
) {
  try {
    const res = await axios.get(`/web4/contract/${contractId}/${methodName}`, {
      params: {
        "request.json": JSON.stringify(args),
      },
    });
    return res.data;
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
    const payload = {
      ...args,
      web4_gas: options.gas,
      web4_deposit: options.deposit,
      web4_callback_url: options.callbackUrl,
    };

    const res = await axios.post<T>(
      `/web4/contract/${contractId}/${methodName}`,
      payload,
    );
    return res.data;
  } catch (error) {
    console.error("Error in call method:", error);
    throw error;
  }
}
