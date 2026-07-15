const access = JSON.parse(
  window.localStorage.getItem("sfstudiosofficial_access") || "null",
);

const defaultJobs = [
  {
    id: "launch-reel-editor",
    title: "Launch Reel Video Editor",
    category: "Video Editor",
    pay: "$300 flat",
    payType: "usd",
    contact: "jobs@sfstudiosofficial.com",
    imageUrl: "/sf-studios-logo.png",
    timeline: "10 days",
    level: "Intermediate",
    description:
      "Cut a fast studio reel with captions, timing, and polished transitions.",
  },
  {
    id: "obby-environment-builder",
    title: "Roblox Environment Builder",
    category: "Builder",
    pay: "$450 milestone",
    payType: "usd",
    contact: "@sfstudiosofficial",
    imageUrl: "/sf-studios-logo.png",
    timeline: "3 weeks",
    level: "Senior / lead",
    description:
      "Build a cinematic lobby, stage area, and creator showcase environment.",
  },
  {
    id: "ugc-shortform-pack",
    title: "UGC Shortform Creator Pack",
    category: "UGC Creator",
    pay: "15,000 Robux",
    payType: "robux",
    contact: "Discord: sfstudios",
    imageUrl: "/sf-studios-logo.png",
    timeline: "1 week",
    level: "Beginner friendly",
    description:
      "Record three energetic clips showing a new experience, with hooks, captions, and creator voiceover.",
  },
  {
    id: "luau-systems-scripter",
    title: "Luau Gameplay Systems Scripter",
    category: "Scripter",
    pay: "20% revenue share",
    payType: "percent",
    contact: "talent@sfstudiosofficial.com",
    imageUrl: "/sf-studios-logo.png",
    timeline: "Ongoing",
    level: "Senior / lead",
    description:
      "Prototype round flow, data saving, shop logic, and admin commands for a Roblox launch build.",
  },
  {
    id: "uiux-roblox-menu",
    title: "Roblox UI/UX Menu Designer",
    category: "UI/UX Designer",
    pay: "$180 contract",
    payType: "contract",
    contact: "@sfstudiosofficial",
    imageUrl: "/sf-studios-logo.png",
    timeline: "5 days",
    level: "Intermediate",
    description:
      "Design a clean play menu, inventory, settings, and popups with mobile-first Roblox usability.",
  },
  {
    id: "vfx-combat-artist",
    title: "Combat VFX Artist",
    category: "VFX Artist",
    pay: "$75 per effect",
    payType: "usd",
    contact: "Discord: sf-vfx",
    imageUrl: "/sf-studios-logo.png",
    timeline: "Per asset",
    level: "Intermediate",
    description:
      "Create punch, dash, impact, and aura effects with clear timing and optimized particles.",
  },
];

const featuredCreators = [
  {
    name: "AriBuilds",
    role: "Builder",
    status: "Open to contracts",
    bio: "Environment builder focused on lobbies, tycoons, and stylized hangout spaces.",
  },
  {
    name: "NovaFX",
    role: "VFX Artist",
    status: "Available this week",
    bio: "Makes combat, reveal, and trailer VFX with clean timing and low particle waste.",
  },
  {
    name: "ByteForge",
    role: "Scripter",
    status: "Selective",
    bio: "Luau systems developer for data, round loops, shops, and admin tools.",
  },
];

const founderCredentials = {
  email: "za01302025@gmail.com",
  password: "password",
};

const tabButtons = document.querySelectorAll("[data-tab-target]");
const tabJumpButtons = document.querySelectorAll("[data-tab-jump]");
const panels = document.querySelectorAll(".portal-panel");
const welcomeLine = document.querySelector("#welcomeLine");
const logoutButton = document.querySelector("#logoutButton");
const logoOrbit = document.querySelector("#logoOrbit");
const contactForm = document.querySelector("#contactForm");
const contactStatus = document.querySelector("#contactStatus");
const jobForm = document.querySelector("#jobForm");
const jobList = document.querySelector("#jobList");
const jobStatus = document.querySelector("#jobStatus");
const applicationPanel = document.querySelector("#applicationPanel");
const creatorBoard = document.querySelector("#creatorBoard");
const jobSearch = document.querySelector("#jobSearch");
const jobCategoryFilter = document.querySelector("#jobCategoryFilter");
const jobPayFilter = document.querySelector("#jobPayFilter");
const profileForm = document.querySelector("#profileForm");
const securityForm = document.querySelector("#securityForm");
const profileStatus = document.querySelector("#profileStatus");
const securityStatus = document.querySelector("#securityStatus");
const profilePreview = document.querySelector("#profilePreview");
const profilePreviewName = document.querySelector("#profilePreviewName");
const profilePreviewBio = document.querySelector("#profilePreviewBio");
const staffLoginForm = document.querySelector("#staffLoginForm");
const staffLoginStatus = document.querySelector("#staffLoginStatus");
const staffDashboard = document.querySelector("#staffDashboard");
const staffLogoutButton = document.querySelector("#staffLogoutButton");
const departmentForm = document.querySelector("#departmentForm");
const roleForm = document.querySelector("#roleForm");
const roleDepartment = document.querySelector("#roleDepartment");
const departmentList = document.querySelector("#departmentList");
const logList = document.querySelector("#logList");
const logCategoryFilter = document.querySelector("#logCategoryFilter");
const logActorFilter = document.querySelector("#logActorFilter");
const clearLogsButton = document.querySelector("#clearLogsButton");
const openJobCount = document.querySelector("#openJobCount");
const creatorCount = document.querySelector("#creatorCount");
const applicationCount = document.querySelector("#applicationCount");

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

function actorLabel() {
  const profile = getProfile();
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  if (name) return name;
  if (access?.mode === "guest") return "Guest";
  if (access?.email) return access.email;
  return "Visitor";
}

function addLog(category, action, details = {}, actor = actorLabel()) {
  const logs = readJson("sfstudiosofficial_logs", []);
  logs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    category,
    action,
    actor,
    role: details.role || (readJson("sfstudiosofficial_staff_session", null) ? "Founder" : "Member"),
    department: details.department || (readJson("sfstudiosofficial_staff_session", null) ? "Executives" : "Public"),
    details,
    createdAt: new Date().toISOString(),
  });
  writeJson("sfstudiosofficial_logs", logs.slice(0, 250));
  renderLogs();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function writeWelcome() {
  if (!access) {
    welcomeLine.textContent = "Preview access active.";
    return;
  }

  if (access.mode === "guest") {
    welcomeLine.textContent = "Guest access active.";
    return;
  }

  welcomeLine.textContent = access.firstName
    ? `Welcome back, ${access.firstName}.`
    : "Studio access active.";
}

function updateScrollMeter() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
  document.documentElement.style.setProperty("--scroll", `${progress}%`);
}

function setActiveTab(tabId, shouldScroll = true) {
  const nextTab = Array.from(panels).some((panel) => panel.id === tabId) ? tabId : "home";

  panels.forEach((panel) => {
    const active = panel.id === nextTab;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  tabButtons.forEach((button) => {
    const active = button.dataset.tabTarget === nextTab;
    button.classList.toggle("is-active", active);
    if (button.getAttribute("role") === "tab") {
      button.setAttribute("aria-selected", String(active));
    }
  });

  if (shouldScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.history.replaceState(null, "", `#${nextTab}`);
  updateScrollMeter();
}

function getProfile() {
  return readJson("sfstudiosofficial_profile", {
    firstName: access?.firstName || "",
    lastName: "",
    icon: "/sf-studios-logo.png",
    bio: "",
    portfolio: [],
  });
}

function normalizePortfolio(value) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderProfile() {
  const profile = getProfile();
  document.querySelector("#profileFirstName").value = profile.firstName || "";
  document.querySelector("#profileLastName").value = profile.lastName || "";
  document.querySelector("#profileIcon").value =
    profile.icon === "/sf-studios-logo.png" ? "" : profile.icon || "";
  document.querySelector("#profileBio").value = profile.bio || "";
  document.querySelector("#profilePortfolio").value = (profile.portfolio || []).join("\n");

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  profilePreview.src = profile.icon || "/sf-studios-logo.png";
  profilePreviewName.textContent = displayName || "Studio Member";
  profilePreviewBio.textContent = profile.bio || "No bio saved yet.";
}

function getCustomJobs() {
  return readJson("sfstudiosofficial_jobs", []);
}

function getAllJobs() {
  return [...getCustomJobs(), ...defaultJobs];
}

function filteredJobs() {
  const query = jobSearch.value.trim().toLowerCase();
  const category = jobCategoryFilter.value;
  const payType = jobPayFilter.value;

  return getAllJobs().filter((job) => {
    const haystack = `${job.title} ${job.category} ${job.contact} ${job.description} ${job.pay}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesCategory = !category || job.category === category;
    const matchesPay = !payType || job.payType === payType;
    return matchesQuery && matchesCategory && matchesPay;
  });
}

function renderTalentStats() {
  openJobCount.textContent = String(getAllJobs().length);
  creatorCount.textContent = String(featuredCreators.length + 1);
  const applications = readJson("sfstudiosofficial_applications", []);
  applicationCount.textContent = String(applications.length);
}

function renderJobs() {
  jobList.innerHTML = "";

  const jobs = filteredJobs();
  if (!jobs.length) {
    jobList.innerHTML = `<article class="job-card empty-state"><div><h3>No jobs found</h3><p>Try a different search, category, or pay filter.</p></div></article>`;
    renderTalentStats();
    return;
  }

  jobs.forEach((job) => {
    const card = document.createElement("article");
    card.className = "job-card";
    card.innerHTML = `
      <img src="${escapeHtml(job.imageUrl || "/sf-studios-logo.png")}" alt="" />
      <div>
        <span>${escapeHtml(job.category)}</span>
        <h3>${escapeHtml(job.title)}</h3>
        <p>${escapeHtml(job.description)}</p>
        <div class="job-meta">
          <strong>${escapeHtml(job.pay)}</strong>
          <strong>${escapeHtml(job.timeline || "Flexible")}</strong>
          <strong>${escapeHtml(job.level || "Any level")}</strong>
          <strong>${escapeHtml(job.contact)}</strong>
        </div>
        <button class="button button-secondary" type="button" data-apply-job="${escapeHtml(job.id)}">
          Apply
        </button>
      </div>
    `;
    jobList.append(card);
  });
  renderTalentStats();
}

function renderCreators() {
  const profile = getProfile();
  const ownName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your Profile";
  const creators = [
    {
      name: ownName,
      role: "Applicant profile",
      status: "Editable in Profile tab",
      bio: profile.bio || "Add a bio and portfolio links so job posters can review your work.",
    },
    ...featuredCreators,
  ];

  creatorBoard.innerHTML = `
    <h3>Creator Profiles</h3>
    <div class="creator-grid">
      ${creators
        .map(
          (creator) => `
            <article>
              <span>${escapeHtml(creator.status)}</span>
              <h4>${escapeHtml(creator.name)}</h4>
              <strong>${escapeHtml(creator.role)}</strong>
              <p>${escapeHtml(creator.bio)}</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function applyToJob(jobId) {
  const job = getAllJobs().find((item) => item.id === jobId);
  if (!job) return;

  const profile = getProfile();
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const portfolio = profile.portfolio?.length
    ? profile.portfolio.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No portfolio links saved yet.</li>";

  applicationPanel.innerHTML = `
    <h3>Application Preview</h3>
    <p><strong>${escapeHtml(displayName || "Studio Member")}</strong> applied for <strong>${escapeHtml(job.title)}</strong>.</p>
    <p>${escapeHtml(profile.bio || "No bio saved yet.")}</p>
    <ul>${portfolio}</ul>
  `;

  writeJson("sfstudiosofficial_last_application", {
    jobId,
    profile,
    createdAt: new Date().toISOString(),
  });
  const applications = readJson("sfstudiosofficial_applications", []);
  applications.unshift({
    jobId,
    jobTitle: job.title,
    applicant: displayName || "Studio Member",
    createdAt: new Date().toISOString(),
  });
  writeJson("sfstudiosofficial_applications", applications.slice(0, 100));
  addLog("application", `Applied to ${job.title}`, { jobId, jobTitle: job.title });
  renderTalentStats();
}

function getStaffData() {
  return readJson("sfstudiosofficial_staff", {
    departments: [
      {
        id: "executives",
        name: "Executives",
        roles: [
          {
            id: "founder",
            name: "Founder",
            permissions: [
              "manage_departments",
              "manage_roles",
              "manage_showcase",
              "manage_services",
              "manage_jobs",
              "review_applications",
              "manage_announcements",
              "manage_socials",
              "view_logs",
              "security",
            ],
          },
        ],
      },
    ],
  });
}

function saveStaffData(data) {
  writeJson("sfstudiosofficial_staff", data);
}

function isFounderSession() {
  return Boolean(readJson("sfstudiosofficial_staff_session", null));
}

function renderStaffPanel() {
  const unlocked = isFounderSession();
  staffLoginForm.hidden = unlocked;
  staffDashboard.hidden = !unlocked;
  if (!unlocked) return;

  const staff = getStaffData();
  roleDepartment.innerHTML = staff.departments
    .map((department) => `<option value="${escapeHtml(department.id)}">${escapeHtml(department.name)}</option>`)
    .join("");

  departmentList.innerHTML = staff.departments
    .map(
      (department) => `
        <article class="department-row">
          <h4>${escapeHtml(department.name)}</h4>
          <div class="role-list">
            ${department.roles
              .map(
                (role) => `
                  <div>
                    <strong>${escapeHtml(role.name)}</strong>
                    <span>${role.permissions.map(escapeHtml).join(", ") || "No permissions"}</span>
                  </div>
                `,
              )
              .join("")}
          </div>
        </article>
      `,
    )
    .join("");

  renderLogs();
}

function renderLogs() {
  if (!logList) return;
  const category = logCategoryFilter?.value || "";
  const actorQuery = (logActorFilter?.value || "").trim().toLowerCase();
  const logs = readJson("sfstudiosofficial_logs", []).filter((log) => {
    const matchesCategory = !category || log.category === category;
    const actorFields = `${log.actor} ${log.role} ${log.department}`.toLowerCase();
    const matchesActor = !actorQuery || actorFields.includes(actorQuery);
    return matchesCategory && matchesActor;
  });

  logList.innerHTML = logs.length
    ? logs
        .map(
          (log) => `
            <article>
              <span>${escapeHtml(log.category)} / ${escapeHtml(log.department)} / ${escapeHtml(log.role)}</span>
              <strong>${escapeHtml(log.action)}</strong>
              <p>${escapeHtml(log.actor)} - ${new Date(log.createdAt).toLocaleString()}</p>
            </article>
          `,
        )
        .join("")
    : "<p>No logs match the current filters.</p>";
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tabTarget));
});

tabJumpButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tabJump));
});

if (logoOrbit) {
  logoOrbit.addEventListener("pointermove", (event) => {
    const bounds = logoOrbit.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
    logoOrbit.style.setProperty("--tilt-x", `${x}deg`);
    logoOrbit.style.setProperty("--tilt-y", `${y}deg`);
  });

  logoOrbit.addEventListener("pointerleave", () => {
    logoOrbit.style.setProperty("--tilt-x", "0deg");
    logoOrbit.style.setProperty("--tilt-y", "0deg");
  });
}

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  contactStatus.textContent = "Request saved for backend delivery.";
  addLog("contact", "Submitted service request");
  contactForm.reset();
});

jobForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(jobForm);
  const customJobs = getCustomJobs();
  const title = data.get("title").toString().trim();

  customJobs.unshift({
    id: `job-${Date.now()}`,
    title,
    category: data.get("category").toString(),
    pay: data.get("pay").toString().trim(),
    contact: data.get("contact").toString().trim(),
    imageUrl: data.get("imageUrl").toString().trim() || "/sf-studios-logo.png",
    timeline: data.get("timeline").toString().trim() || "Flexible",
    level: data.get("level").toString(),
    payType: data.get("pay").toString().toLowerCase().includes("robux")
      ? "robux"
      : data.get("pay").toString().includes("%")
        ? "percent"
        : data.get("pay").toString().toLowerCase().includes("contract")
          ? "contract"
          : "usd",
    description: data.get("description").toString().trim(),
  });

  writeJson("sfstudiosofficial_jobs", customJobs);
  jobStatus.textContent = `${title} is now listed.`;
  addLog("job", `Posted job: ${title}`, { title, category: data.get("category").toString() });
  jobForm.reset();
  renderJobs();
});

jobList.addEventListener("click", (event) => {
  const applyButton = event.target.closest("[data-apply-job]");
  if (applyButton) {
    applyToJob(applyButton.dataset.applyJob);
  }
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(profileForm);
  const profile = {
    firstName: data.get("firstName").toString().trim(),
    lastName: data.get("lastName").toString().trim(),
    icon: data.get("icon").toString().trim() || "/sf-studios-logo.png",
    bio: data.get("bio").toString().trim(),
    portfolio: normalizePortfolio(data.get("portfolio").toString()),
  };

  writeJson("sfstudiosofficial_profile", profile);
  profileStatus.textContent = "Profile saved.";
  addLog("profile", "Updated profile", { name: [profile.firstName, profile.lastName].filter(Boolean).join(" ") });
  renderProfile();
  renderCreators();
});

securityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(securityForm);
  const next = data.get("newPassword").toString();
  const confirm = data.get("confirmPassword").toString();

  if (next && next !== confirm) {
    securityStatus.textContent = "New password and confirmation do not match.";
    return;
  }

  securityStatus.textContent = "Security preferences saved for backend connection.";
  addLog("security", "Updated security preferences");
  securityForm.reset();
});

staffLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(staffLoginForm);
  const email = data.get("email").toString().trim().toLowerCase();
  const password = data.get("password").toString();

  if (email !== founderCredentials.email || password !== founderCredentials.password) {
    staffLoginStatus.textContent = "Founder login failed.";
    addLog("staff", "Failed founder login", { role: "Founder", department: "Executives" }, email || "Unknown");
    return;
  }

  writeJson("sfstudiosofficial_staff_session", {
    email,
    role: "Founder",
    department: "Executives",
    createdAt: new Date().toISOString(),
  });
  staffLoginStatus.textContent = "";
  staffLoginForm.reset();
  addLog("staff", "Founder logged into staff panel", { role: "Founder", department: "Executives" }, email);
  renderStaffPanel();
});

staffLogoutButton.addEventListener("click", () => {
  window.localStorage.removeItem("sfstudiosofficial_staff_session");
  addLog("staff", "Founder locked staff panel", { role: "Founder", department: "Executives" });
  renderStaffPanel();
});

departmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(departmentForm);
  const name = data.get("departmentName").toString().trim();
  const staff = getStaffData();
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `department-${Date.now()}`;

  if (!staff.departments.some((department) => department.id === id)) {
    staff.departments.push({ id, name, roles: [] });
    saveStaffData(staff);
    addLog("staff", `Added department: ${name}`, { department: name, role: "Founder" });
  }

  departmentForm.reset();
  renderStaffPanel();
});

roleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(roleForm);
  const staff = getStaffData();
  const department = staff.departments.find((item) => item.id === data.get("department"));
  const name = data.get("roleName").toString().trim();
  const permissions = data.getAll("permissions").map((permission) => permission.toString());

  if (department && name) {
    department.roles.push({
      id: `role-${Date.now()}`,
      name,
      permissions,
    });
    saveStaffData(staff);
    addLog("staff", `Created role: ${name}`, {
      role: "Founder",
      department: department.name,
      permissions: permissions.join(", "),
    });
  }

  roleForm.reset();
  renderStaffPanel();
});

logCategoryFilter.addEventListener("change", renderLogs);
logActorFilter.addEventListener("input", renderLogs);
clearLogsButton.addEventListener("click", () => {
  writeJson("sfstudiosofficial_logs", []);
  renderLogs();
});

logoutButton.addEventListener("click", () => {
  window.localStorage.removeItem("sfstudiosofficial_access");
  addLog("auth", "Logged out");
  window.location.assign("/login.html");
});

window.addEventListener("scroll", updateScrollMeter, { passive: true });
window.addEventListener("resize", updateScrollMeter);
jobSearch.addEventListener("input", renderJobs);
jobCategoryFilter.addEventListener("change", renderJobs);
jobPayFilter.addEventListener("change", renderJobs);

addLog("visit", "Visited portal");
writeWelcome();
renderProfile();
renderJobs();
renderCreators();
renderStaffPanel();
setActiveTab(window.location.hash.replace("#", "") || "home", false);
updateScrollMeter();
