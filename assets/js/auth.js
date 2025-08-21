function saveTokenByRole(token, role) {
  if (role === "HR") localStorage.setItem("HR_AUTH_TOKEN", token);
  else if (role === "ONBOARD") localStorage.setItem("ONBOARD_AUTH_TOKEN", token);
  else throw new Error("Unknown role");
}

function decodeJwtPayload(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function routeByRole(role) {
  if (role === "HR") window.location.assign("hr-dashboard.html");
  else if (role === "ONBOARD") window.location.assign("onboard-documents-dashboard.html");
  else throw new Error("Unknown role");
}

export { saveTokenByRole, decodeJwtPayload, routeByRole };
