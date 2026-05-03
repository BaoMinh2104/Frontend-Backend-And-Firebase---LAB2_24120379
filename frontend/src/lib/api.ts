import type {
  AuthResponse,
  AuthUser,
  CaptionRecord,
  CaptionUploadResponse,
  Conversation
} from "@/lib/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export const googleLoginUrl = `${API_BASE_URL}/auth/google/start`;

type RequestOptions = RequestInit & {
  token?: string;
  isFormData?: boolean;
};

type ErrorDetails = {
  message: string;
  code?: string;
};

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function translateKnownError(message: string) {
  const normalized = message.replace(/_/g, " ").toLowerCase();

  const knownMessages: Record<string, string> = {
    "auth/email-already-in-use": "Email này đã tồn tại. Vui lòng đăng nhập.",
    "auth/weak-password": "Mật khẩu quá yếu. Vui lòng dùng ít nhất 6 ký tự.",
    "auth/wrong-password": "Mật khẩu không đúng.",
    "auth/invalid-credential": "Thông tin đăng nhập không hợp lệ.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/operation-not-allowed": "Firebase chưa bật phương thức đăng nhập này.",
    "auth/provider-already-linked": "Phương thức đăng nhập này đã được liên kết.",
    "auth/too-many-requests": "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.",
    "auth/requires-recent-login": "Vui lòng đăng nhập lại trước khi liên kết phương thức mới.",
    "auth/user-disabled": "Tài khoản này đã bị vô hiệu hóa.",
    "auth/google-account-without-password":
      "Email này đang dùng Google. Hãy đăng nhập bằng Google, sau đó thêm mật khẩu trong bảng tài khoản.",
    "invalid token": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
    "file tải lên phải là ảnh hợp lệ.": "File tải lên phải là ảnh hợp lệ.",
    "file ảnh rỗng.": "File ảnh rỗng."
  };

  return knownMessages[normalized] ?? knownMessages[message] ?? message;
}

function getErrorDetails(payload: unknown, fallback: string): ErrorDetails {
  if (!payload || typeof payload !== "object") {
    return { message: fallback };
  }

  const data = payload as Record<string, unknown>;
  const detail = data.detail;

  if (typeof detail === "string") {
    return {
      code: detail.startsWith("auth/") ? detail : undefined,
      message: translateKnownError(detail)
    };
  }

  const message = data.message ?? data.error;

  return typeof message === "string"
    ? {
        code: message.startsWith("auth/") ? message : undefined,
        message: translateKnownError(message)
      }
    : { message: fallback };
}

export function toFriendlyError(error: unknown, fallback = "Đã xảy ra lỗi.") {
  return error instanceof Error ? error.message : fallback;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const { token, headers, isFormData = false, ...init } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const details = getErrorDetails(payload, `Yêu cầu thất bại với mã ${response.status}.`);
    throw new ApiError(details.message, response.status, details.code);
  }

  return payload as T;
}

export function me(token: string) {
  return request<AuthUser>("/auth/me", {
    method: "GET",
    token
  });
}

export function signUpWithEmail(email: string, password: string) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function signInWithEmail(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function refreshAuthSession(refreshToken: string) {
  return request<AuthResponse>("/auth/session/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken })
  });
}

export function linkPasswordToSession(token: string, password: string) {
  return request<AuthResponse>("/auth/session/link-password", {
    method: "POST",
    token,
    body: JSON.stringify({ password })
  });
}

export function createGoogleLoginUrl() {
  const frontendUrl = typeof window === "undefined" ? "" : window.location.origin;
  return `${googleLoginUrl}?frontend_url=${encodeURIComponent(frontendUrl)}`;
}

export function consumeGoogleSession(sessionId: string) {
  return request<AuthResponse>(`/auth/google/session/${sessionId}`, {
    method: "GET"
  });
}

export function getConversations(token: string) {
  return request<Conversation[]>("/conversations", {
    method: "GET",
    token
  });
}

export function createConversation(token: string) {
  return request<Conversation>("/conversations", {
    method: "POST",
    token,
    body: JSON.stringify({})
  });
}

export function renameConversation(token: string, conversationId: string, title: string) {
  return request<Conversation>(`/conversations/${conversationId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ title })
  });
}

export function deleteConversation(token: string, conversationId: string) {
  return request<void>(`/conversations/${conversationId}`, {
    method: "DELETE",
    token
  });
}

export function getConversationMessages(token: string, conversationId: string) {
  return request<CaptionRecord[]>(`/conversations/${conversationId}/messages`, {
    method: "GET",
    token
  });
}

export function uploadCaption(
  token: string,
  conversationId: string,
  file: File,
  prompt: string
) {
  const form = new FormData();
  form.append("file", file);
  form.append("prompt", prompt);

  return request<CaptionUploadResponse>(`/conversations/${conversationId}/caption`, {
    method: "POST",
    token,
    body: form,
    isFormData: true
  });
}
