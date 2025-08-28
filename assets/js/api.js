const API_BASE = "https://onboarding-process-api-pbk20j.5sc6y6-3.usa-e2.cloudhub.io";
const CLIENT_ID = "b66fec09f54f48ad9e69a1a62750adf5";
const CLIENT_SECRET = "6251Ee768856495982d756b282321c77";

function getAuthToken(role) {
  if (role === "HR") return localStorage.getItem("HR_AUTH_TOKEN");
  if (role === "ONBOARD") return localStorage.getItem("ONBOARD_AUTH_TOKEN");
  return null;
}

async function apiRequest(
  path,
  {
    method = "GET",
    body = null,
    headers = {},
    authRole = null,
    isForm = false,
    timeoutMs = 20000,
  } = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const hdrs = new Headers(headers);

  // Set content type for non-form requests
  if (!isForm && !hdrs.has("Content-Type")) {
    hdrs.set("Content-Type", "application/json");
  }

  // Inject client credentials
  hdrs.set("client_id", CLIENT_ID);
  hdrs.set("client_secret", CLIENT_SECRET);

  // Add role-based token if available
  if (authRole) {
    const token = getAuthToken(authRole);
    if (!token) throw new Error(`Missing token for role ${authRole}`);
    hdrs.set("Authorization", token);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: hdrs,
    body: isForm ? body : body ? JSON.stringify(body) : null,
    signal: controller.signal,
    credentials: "omit",
    cache: "no-store",
  }).catch((e) => {
    clearTimeout(timeout);
    throw e;
  });

  clearTimeout(timeout);

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg = isJson && data?.message ? data.message : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

const api = {
  // Auth
  login: (userId, password) =>
    apiRequest("/api/loginProcessLogic", {
      method: "POST",
      body: { userId, password },
    }),

  setupPassword: (onboardingId, password, confirmPassword) =>
    apiRequest("/api/loginProcessLogic/setup-password", {
      method: "POST",
      body: { onboardingId, password, confirmPassword },
    }),

  // HR endpoints
  hrCreateOnboard: (payload) =>
    apiRequest("/api/hrProcessLogic", {
      method: "POST",
      body: payload,
      authRole: "HR",
    }),

  hrGetAll: () =>
    apiRequest("/api/hrProcessLogic", {
      method: "GET",
      authRole: "HR",
    }),

  hrUpdateStatusById: (onboardingId, status) =>
    apiRequest(`/api/hrProcessLogic/${encodeURIComponent(onboardingId)}`, {
      method: "PATCH",
      body: { status },
      authRole: "HR",
    }),

  // Onboard endpoints
  onboardUploadDocuments: (formData) =>
    apiRequest("/api/onboardingProcessLogic", {
      method: "POST",
      body: formData,
      authRole: "ONBOARD",
      isForm: true,
    }),

  onboardGetRecords: (onboardingId) =>
    apiRequest(`/api/onboardingProcessLogic/${encodeURIComponent(onboardingId)}`, {
      method: "GET",
      authRole: "ONBOARD",
    }),
};

export { api, getAuthToken };