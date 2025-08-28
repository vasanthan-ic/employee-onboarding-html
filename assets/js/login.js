import { api } from "./api.js?v=1";
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
    // Call login endpoint via api.js wrapper (adds client_id & client_secret)
    const data = await api.login(userIdEl.value.trim(), passwordEl.value.trim());

    if (!data || !data.Authorization_Token) {
      throw new Error("No authorization token received");
    }

    // Decode role from JWT payload or fallback to response
    const decoded = decodeJwtPayload(data.Authorization_Token);
    const role = (decoded && decoded.role) || data.role;

    if (!role) throw new Error("No role present in token or response");

    saveTokenByRole(data.Authorization_Token, role);
    showAlert("Login successful. Redirecting…", "success");

    setTimeout(() => routeByRole(role), 400);
  } catch (err) {
    const msg = err?.message || "Login failed";
    showAlert(`Login failed: ${msg}`, "error");
  } finally {
    setLoading(false);
  }
});
