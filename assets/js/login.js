import { saveTokenByRole, decodeJwtPayload, routeByRole } from "./auth.js?v=1";

const form = document.getElementById("loginForm");
const userIdEl = document.getElementById("userId");
const passwordEl = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const alertEl = document.getElementById("formAlert");
const submitBtn = document.getElementById("submitBtn");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.querySelector(".btn-spinner").style.display = isLoading ? "inline-block" : "none";
}

function showAlert(message, type = "error") {
  alertEl.textContent = message;
  alertEl.className = `alert alert--${type}`;
}

function clearFieldErrors() {
  document.getElementById("userIdError").textContent = "";
  document.getElementById("passwordError").textContent = "";
}

function validate() {
  let valid = true;
  clearFieldErrors();

  if (!userIdEl.value.trim()) {
    document.getElementById("userIdError").textContent = "Enter your User ID";
    valid = false;
  }
  if (!passwordEl.value.trim()) {
    document.getElementById("passwordError").textContent = "Enter your password";
    valid = false;
  } else if (passwordEl.value.length < 8) {
    document.getElementById("passwordError").textContent = "Password must be at least 8 characters";
    valid = false;
  }
  return valid;
}

togglePasswordBtn.addEventListener("click", () => {
  const isPwd = passwordEl.type === "password";
  passwordEl.type = isPwd ? "text" : "password";
  togglePasswordBtn.textContent = isPwd ? "Hide" : "Show";
  togglePasswordBtn.setAttribute("aria-label", isPwd ? "Hide password" : "Show password");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setLoading(true);
  showAlert("");

  try {
    const payload = {
      userId: userIdEl.value.trim(),
      password: passwordEl.value.trim(),
    };

    // POST to your login endpoint
    const data = await apiPost("/api/loginProcessLogic", payload);

    // Expect Authorization_Token from backend
    if (!data || !data.Authorization_Token) {
      throw new Error("No authorization token received");
    }

    // Prefer role from payload if backend includes it. Fallback to JWT payload
    const decoded = decodeJwtPayload(data.Authorization_Token);
    const role = (decoded && decoded.role) || data.role;

    if (!role) throw new Error("No role present in token or response");

    saveTokenByRole(data.Authorization_Token, role);
    showAlert("Login successful. Redirecting…", "success");

    // Minimal delay for UI feedback
    setTimeout(() => routeByRole(role), 400);
  } catch (err) {
    const msg = err?.message || "Login failed";
    showAlert(`Login failed: ${msg}`, "error");
  } finally {
    setLoading(false);
  }
});
