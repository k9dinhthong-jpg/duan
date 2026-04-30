import { createContext, useContext } from "react";

const API_BASE = "/api";

type LoginResult =
  | { ok: true; token: string; name: string }
  | { ok: false; requiresTwoFactor: true; message: string }
  | { ok: false; message: string };

type LoginApiResponse = {
  token?: string;
  access_token?: string;
  accessToken?: string;
  jwt?: string;
  name?: string;
  username?: string;
  message?: string;
  requiresTwoFactor?: boolean;
};

function pickLoginToken(data: LoginApiResponse): string {
  return data.token ?? data.access_token ?? data.accessToken ?? data.jwt ?? "";
}

function pickDisplayName(
  data: LoginApiResponse,
  fallbackUsername: string,
): string {
  return data.name ?? data.username ?? fallbackUsername;
}

async function loginWithApi(
  username: string,
  password: string,
  twoFactorCode?: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, twoFactorCode }),
    });

    const data = (await res.json()) as LoginApiResponse;

    if (data.requiresTwoFactor === true) {
      return {
        ok: false,
        requiresTwoFactor: true,
        message: data.message ?? "Vui lòng nhập mã xác thực 2FA.",
      };
    }

    if (!res.ok) {
      return { ok: false, message: data.message ?? "Đăng nhập thất bại." };
    }

    const token = pickLoginToken(data);
    if (!token.trim()) {
      return {
        ok: false,
        message: "Đăng nhập thành công nhưng không nhận được token hợp lệ.",
      };
    }

    return {
      ok: true,
      token: token.trim(),
      name: pickDisplayName(data, username),
    };
  } catch {
    return { ok: false, message: "Không kết nối được đến máy chủ." };
  }
}

type AccountContextValue = {
  login: (
    username: string,
    password: string,
    twoFactorCode?: string,
  ) => Promise<LoginResult>;
};

const AccountContext = createContext<AccountContextValue>({
  login: loginWithApi,
});

export function useAccount() {
  return useContext(AccountContext);
}

export { loginWithApi };
export default AccountContext;
