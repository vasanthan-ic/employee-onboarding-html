// assets/js/api.js

// ---- Base URL ----
export const API_BASE = "https://onboarding-process-api-pbk20j.5sc6y6-3.usa-e2.cloudhub.io";

// ---- Endpoints (mapped from Postman collection) ----
export const ENDPOINTS = {
  // Login + setup
  login: "/api/loginProcessLogic",                          // POST login
  setupPassword: "/api/loginProcessLogic/setup-password",   // POST onboarding setup password

  // HR APIs
  hrInsert: "/api/hrProcessLogic",                          // POST insert onboarding record
  hrGetAll: "/api/hrProcessLogic",                          // GET all onboard records
  hrUpdateStatus: (id) => `/api/hrProcessLogic/${id}`,      // PATCH update status by onboardingId

  // Onboarding APIs
  onboardInsertDocs: "/api/onboardingProcessLogic",         // POST upload documents (form-data)
  onboardGetDocs: (id) => `/api/onboardingProcessLogic/${id}`, // GET inserted records
};

// ---- Client credentials (MuleSoft Anypoint) ----
const CLIENT_ID = "b66fec09f54f48ad9e69a1a62750adf5";
const CLIENT_SECRET = "6251Ee768856495982d756b282321c77";

// ---- Token helpers ----
export function getAuthToken(role) {
  if (role === "HR") return localStorage.getItem("HR_AUTH_TOKEN");
  if (role === "ONBOARD") return localStorage.getItem("ONBOARD_AUTH_TOKEN");
  return null;
}

export function saveAuthToken(role, token) {
  if (role === "HR") localStorage.setItem("HR_AUTH_TOKEN", token);
  if (role === "ONBOARD") localStorage.setItem("ONBOARD_AUTH_TOKEN", token);
}

// ---- Request Wrapper ----
export async function apiRequest(
  path,
  {
    method = "GET",
    body = null,
    headers = {},
    authRole = null,
    isForm = false,
    timeoutMs = 60000,
  } = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const hdrs = new Headers(headers);

  // Add content-type unless it's FormData
  if (!isForm && !hdrs.has("Content-Type")) {
    hdrs.set("Content-Type", "application/json");
  }

  // Attach MuleSoft credentials
  hdrs.set("client_id", CLIENT_ID);
  hdrs.set("client_secret", CLIENT_SECRET);

  // Attach JWT if role specified
  if (authRole) {
    const token = getAuthToken(authRole);
    if (!token) throw new Error(`Missing token for role ${authRole}`);
    hdrs.set("Authorization", `${token}`);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: hdrs,
      body: isForm ? body : body ? JSON.stringify(body) : null,
      signal: controller.signal,
      credentials: "omit",
      cache: "no-store",
    });

    clearTimeout(timeout);

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const msg = isJson && data?.message ? data.message : `HTTP ${res.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
