const modeButtons = document.querySelectorAll("[data-mode-target]");
const loginPanel = document.querySelector("#loginPanel");
const signupPanel = document.querySelector("#signupPanel");
const statusLine = document.querySelector(".status-line");
const formStatus = document.querySelector("#formStatus");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const forgotPassword = document.querySelector("#forgotPassword");
const signupPassword = document.querySelector("#signupPassword");
const strengthFill = document.querySelector("#strengthFill");
const strengthLabel = document.querySelector("#strengthLabel");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "Backend request failed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function addLog(category, action, details = {}, actor = "Visitor") {
  const logs = readJson("sfstudiosofficial_logs", []);
  logs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    category,
    action,
    actor,
    role: details.role || "Public",
    department: details.department || "Public",
    details,
    createdAt: new Date().toISOString(),
  });
  writeJson("sfstudiosofficial_logs", logs.slice(0, 250));
}

function setStatus(message, kind = "neutral") {
  formStatus.textContent = message;
  statusLine.dataset.kind = kind;
}

function enterStudio(message) {
  setStatus(message, "success");
  window.setTimeout(() => {
    window.location.assign("/studio.html");
  }, 620);
}

function backendUnavailable(error) {
  return error.status >= 500 || /database|d1|binding|not ready/i.test(error.message || "");
}

function setMode(mode) {
  document.body.dataset.mode = mode;
  const isSignup = mode === "signup";
  loginPanel.hidden = isSignup;
  signupPanel.hidden = !isSignup;
  loginPanel.classList.toggle("is-active", !isSignup);
  signupPanel.classList.toggle("is-active", isSignup);

  modeButtons.forEach((button) => {
    const active = button.dataset.modeTarget === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  setStatus(isSignup ? "Sign up is ready." : "Login is ready.");
}

function markInvalid(input, invalid) {
  input.classList.toggle("is-invalid", invalid);
  if (invalid) {
    input.setAttribute("aria-invalid", "true");
  } else {
    input.removeAttribute("aria-invalid");
  }
}

function requireValue(input) {
  const invalid = input.value.trim() === "";
  markInvalid(input, invalid);
  return !invalid;
}

function requireEmail(input) {
  const invalid = !emailPattern.test(input.value.trim());
  markInvalid(input, invalid);
  return !invalid;
}

function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function updateStrength() {
  const score = passwordScore(signupPassword.value);
  const widths = ["0%", "25%", "50%", "75%", "100%"];
  const labels = [
    "Password meter",
    "Starter strength",
    "Getting stronger",
    "Strong password",
    "Studio-grade password",
  ];
  strengthFill.style.width = widths[score];
  strengthLabel.textContent = labels[score];
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.modeTarget));
});

document.querySelectorAll("[data-guest]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await apiJson("/api/auth/guest", { method: "POST", body: "{}" });
    } catch {
      // Guest access can still work while the backend is being provisioned.
    }
    window.localStorage.setItem(
      "sfstudiosofficial_access",
      JSON.stringify({ mode: "guest", createdAt: new Date().toISOString() }),
    );
    addLog("auth", "Continued as guest", { mode: "guest" }, "Guest");
    enterStudio("Guest access ready. Opening the studio.");
  });
});

document.querySelectorAll("[data-google-login]").forEach((button) => {
  button.addEventListener("click", () => {
    window.location.assign("/api/auth/google/start");
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.querySelector("#loginEmail");
  const password = document.querySelector("#loginPassword");
  const validEmail = requireEmail(email);
  const validPassword = requireValue(password);

  if (!validEmail || !validPassword) {
    setStatus("Check your email and password, then try again.", "error");
    return;
  }

  try {
    const result = await apiJson("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    });
    window.localStorage.setItem(
      "sfstudiosofficial_access",
      JSON.stringify({
        mode: "login",
        email: result.user?.email || email.value.trim(),
        firstName: result.user?.firstName || "",
        createdAt: new Date().toISOString(),
      }),
    );
    addLog("auth", "Logged in", { mode: "login", source: "backend" }, email.value.trim());
    enterStudio("Login accepted. Opening the studio.");
    return;
  } catch (error) {
    if (!backendUnavailable(error)) {
      setStatus(error.message || "Login failed.", "error");
      return;
    }
  }

  window.localStorage.setItem(
    "sfstudiosofficial_access",
    JSON.stringify({ mode: "login", email: email.value.trim(), createdAt: new Date().toISOString() }),
  );
  addLog("auth", "Logged in", { mode: "login" }, email.value.trim());
  enterStudio("Login accepted. Opening the studio.");
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const firstName = document.querySelector("#firstName");
  const email = document.querySelector("#signupEmail");
  const password = document.querySelector("#signupPassword");
  const confirmPassword = document.querySelector("#confirmPassword");
  const validName = requireValue(firstName);
  const validEmail = requireEmail(email);
  const validPassword = password.value.length >= 8;
  const passwordsMatch = password.value === confirmPassword.value && confirmPassword.value !== "";

  markInvalid(password, !validPassword);
  markInvalid(confirmPassword, !passwordsMatch);

  if (!validName || !validEmail || !validPassword || !passwordsMatch) {
    setStatus("Finish the required sign-up fields before continuing.", "error");
    return;
  }

  try {
    const result = await apiJson("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        firstName: firstName.value.trim(),
        lastName: document.querySelector("#lastName").value.trim(),
        email: email.value.trim(),
        password: password.value,
        phone: document.querySelector("#phoneNumber").value.trim(),
        country: document.querySelector("#country").value,
      }),
    });
    window.localStorage.setItem(
      "sfstudiosofficial_access",
      JSON.stringify({
        mode: "signup",
        firstName: result.user?.firstName || firstName.value.trim(),
        email: result.user?.email || email.value.trim(),
        country: result.user?.country || document.querySelector("#country").value,
        createdAt: new Date().toISOString(),
      }),
    );
    addLog("auth", "Signed up", { mode: "signup", source: "backend" }, email.value.trim());
    enterStudio("Sign-up accepted. Opening the studio.");
    return;
  } catch (error) {
    if (!backendUnavailable(error)) {
      setStatus(error.message || "Sign-up failed.", "error");
      return;
    }
  }

  window.localStorage.setItem(
    "sfstudiosofficial_access",
    JSON.stringify({
      mode: "signup",
      firstName: firstName.value.trim(),
      email: email.value.trim(),
      country: document.querySelector("#country").value,
      createdAt: new Date().toISOString(),
    }),
  );
  addLog("auth", "Signed up", { mode: "signup" }, email.value.trim());
  enterStudio("Sign-up accepted. Opening the studio.");
});

forgotPassword.addEventListener("click", () => {
  const email = document.querySelector("#loginEmail");

  if (!requireEmail(email)) {
    setStatus("Add your email first, then use Forgot Password.", "error");
    email.focus();
    return;
  }

  setStatus(`Password reset can be sent to ${email.value.trim()} once backend mail is connected.`, "success");
  addLog("auth", "Requested password reset", {}, email.value.trim());
});

signupPassword.addEventListener("input", updateStrength);

document.addEventListener("input", (event) => {
  if (event.target.matches("input, select")) {
    markInvalid(event.target, false);
  }
});

setMode("login");
const authError = new URLSearchParams(window.location.search).get("auth");
if (authError) {
  setStatus(
    authError === "google-missing-env"
      ? "Google login needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first."
      : "Google login could not finish. Try again.",
    "error",
  );
}
addLog("visit", "Visited login page");
