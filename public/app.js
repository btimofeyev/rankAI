const elements = {
  authSection: document.getElementById("auth-section"),
  loginForm: document.getElementById("login-form"),
  signupForm: document.getElementById("signup-form"),
  tabs: document.querySelectorAll(".tab"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  ctaLogin: document.getElementById("cta-login"),
  ctaSignup: document.getElementById("cta-signup"),
  ctaRun: document.getElementById("cta-run"),
  ctaDemo: document.getElementById("cta-demo"),
  ctaStart: document.getElementById("cta-start"),
  ctaFree: document.getElementById("cta-free"),
  ctaPro: document.getElementById("cta-pro"),
};

const smoothScrollTo = (element) => {
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
};

const activateTab = (tabName) => {
  if (!elements.tabs || !elements.tabPanels) return;
  elements.tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("active", isActive);
  });
  elements.tabPanels.forEach((panel) => {
    const isVisible = panel.dataset.tabPanel === tabName;
    panel.classList.toggle("hidden", !isVisible);
  });
};

const focusAuth = (tabName = "signup") => {
  activateTab(tabName);
  smoothScrollTo(elements.authSection);
};

const token = localStorage.getItem("rankai_token");
if (token) {
  window.location.href = "/dashboard.html";
}

const apiPost = async (path, payload) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error || "Request failed";
    throw new Error(message);
  }
  return data;
};

const handleAuthSuccess = (data) => {
  localStorage.setItem("rankai_token", data.token);
  localStorage.setItem("rankai_user", JSON.stringify(data.user));
  window.location.href = "/dashboard.html";
};

if (elements.loginForm) {
  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    try {
      const result = await apiPost("/auth/login", { email, password });
      handleAuthSuccess(result);
    } catch (err) {
      alert(err.message);
    }
  });
}

if (elements.signupForm) {
  elements.signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    try {
      const result = await apiPost("/auth/signup", { email, password });
      handleAuthSuccess(result);
    } catch (err) {
      alert(err.message);
    }
  });
}

if (elements.tabs) {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });
}

if (elements.ctaLogin) {
  elements.ctaLogin.addEventListener("click", () => focusAuth("login"));
}
if (elements.ctaSignup) {
  elements.ctaSignup.addEventListener("click", () => focusAuth("signup"));
}
if (elements.ctaRun) {
  elements.ctaRun.addEventListener("click", () => focusAuth("signup"));
}
if (elements.ctaStart) {
  elements.ctaStart.addEventListener("click", () => focusAuth("signup"));
}
if (elements.ctaFree) {
  elements.ctaFree.addEventListener("click", () => focusAuth("signup"));
}
if (elements.ctaPro) {
  elements.ctaPro.addEventListener("click", () => focusAuth("signup"));
}
if (elements.ctaDemo) {
  elements.ctaDemo.addEventListener("click", () => {
    alert("Sample report coming soon. Sign up to generate your own insights in minutes.");
  });
}

activateTab("login");
