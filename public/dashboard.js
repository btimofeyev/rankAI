const state = {
  token: localStorage.getItem("rankai_token"),
  user: null,
  analyses: [],
  current: null,
  lastAnalysisId: localStorage.getItem("rankai_last_analysis"),
};

try {
  state.user = JSON.parse(localStorage.getItem("rankai_user")) || null;
} catch (err) {
  state.user = null;
}

if (!state.token) {
  window.location.href = "/";
}

const elements = {
  welcomeCopy: document.getElementById("welcome-copy"),
  subscriptionPill: document.getElementById("subscription-pill"),
  upgradeBtn: document.getElementById("upgrade-btn"),
  planHint: document.getElementById("plan-hint"),
  metricMentions: document.getElementById("metric-mentions"),
  metricMentionsDesc: document.getElementById("metric-mentions-desc"),
  metricShare: document.getElementById("metric-share"),
  metricShareDesc: document.getElementById("metric-share-desc"),
  metricGaps: document.getElementById("metric-gaps"),
  metricGapsDesc: document.getElementById("metric-gaps-desc"),
  metricPrompts: document.getElementById("metric-prompts"),
  metricPromptsDesc: document.getElementById("metric-prompts-desc"),
  analysisForm: document.getElementById("analysis-form"),
  analysisBrand: document.getElementById("analysis-brand"),
  analysisDate: document.getElementById("analysis-date"),
  analysisSummary: document.getElementById("analysis-summary"),
  analysisStats: document.getElementById("analysis-stats"),
  downloadReport: document.getElementById("download-report"),
  gatedHint: document.getElementById("gated-hint"),
  emptyState: document.getElementById("empty-state"),
  leaderboardBody: document.getElementById("leaderboard-body"),
  leaderboardHint: document.getElementById("leaderboard-hint"),
  gapsList: document.getElementById("gaps-list"),
  gapsHint: document.getElementById("gaps-hint"),
  promptList: document.getElementById("prompt-list"),
  promptHint: document.getElementById("prompt-hint"),
  historyList: document.getElementById("history-list"),
  sidebarLinks: document.querySelectorAll(".sidebar-link"),
  sidebarNewAnalysis: document.getElementById("sidebar-new-analysis"),
  sidebarLogout: document.getElementById("sidebar-logout"),
};

const parseListInput = (value, limit) => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
};

const smoothScrollTo = (id) => {
  if (!id) return;
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const clearSession = () => {
  localStorage.removeItem("rankai_token");
  localStorage.removeItem("rankai_user");
  localStorage.removeItem("rankai_last_analysis");
};

const requireAuth = () => {
  clearSession();
  window.location.href = "/";
};

const apiRequest = async (path, { method = "GET", body = null, raw = false } = {}) => {
  const headers = {};
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(path, {
    method,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  if (response.status === 401) {
    requireAuth();
    return null;
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch (err) {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (raw) {
    return response;
  }

  return response.json();
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

const formatShare = (value) => {
  if (value === null || value === undefined) return "--";
  return `${value}%`;
};

const persistUser = (user) => {
  state.user = user;
  localStorage.setItem("rankai_user", JSON.stringify(user));
  renderUserHeader();
};

const persistCurrentAnalysis = (analysisId) => {
  if (!analysisId) {
    localStorage.removeItem("rankai_last_analysis");
  } else {
    localStorage.setItem("rankai_last_analysis", analysisId);
  }
  state.lastAnalysisId = analysisId;
};

const renderUserHeader = () => {
  const email = state.user?.email || "";
  if (elements.welcomeCopy) {
    elements.welcomeCopy.textContent = email ? `Logged in as ${email}` : "Monitoring your brand performance in ChatGPT.";
  }
  const tier = state.user?.subscription_tier || "free";
  if (elements.subscriptionPill) {
    elements.subscriptionPill.textContent = tier === "pro" ? "Pro plan" : "Free plan";
    elements.subscriptionPill.classList.toggle("pro", tier === "pro");
  }
  if (elements.planHint) {
    elements.planHint.textContent = tier === "pro"
      ? "Pro plan: Weekly refresh, 5 competitors, full exports."
      : "Free plan: 1 analysis every 30 days, 3 competitors.";
  }
  if (elements.upgradeBtn) {
    if (tier === "pro") {
      elements.upgradeBtn.textContent = "Pro active";
      elements.upgradeBtn.disabled = true;
    } else {
      elements.upgradeBtn.textContent = "Upgrade to Pro";
      elements.upgradeBtn.disabled = false;
    }
  }
};

const renderMetrics = (analysis) => {
  if (!analysis) {
    elements.metricMentions.textContent = "--";
    elements.metricShare.textContent = "--";
    elements.metricGaps.textContent = "--";
    elements.metricPrompts.textContent = "--";
    elements.metricMentionsDesc.textContent = "Run an analysis to populate metrics.";
    elements.metricShareDesc.textContent = "Compared to tracked competitors.";
    elements.metricGapsDesc.textContent = "Prompts where competitors surface without you.";
    elements.metricPromptsDesc.textContent = "Insights generated across GPT-5 prompts.";
    return;
  }

  const { results } = analysis;
  const share = results?.comparison?.share_of_voice?.brand;
  const promptCount = results?.total_queries || results?.prompt_insights?.length || 0;

  elements.metricMentions.textContent = results?.brand?.mention_count ?? 0;
  elements.metricShare.textContent = share !== undefined ? `${share}%` : "--";
  elements.metricGaps.textContent = results?.gaps?.length ?? 0;
  elements.metricPrompts.textContent = promptCount;

  elements.metricMentionsDesc.textContent = "Mentions captured across GPT-5 prompts.";
  elements.metricShareDesc.textContent = "Share of voice across tracked competitors.";
  elements.metricGapsDesc.textContent = "Competitor-only prompt appearances.";
  elements.metricPromptsDesc.textContent = "Prompts analyzed in the latest run.";
};

const renderOverview = (analysis) => {
  const tier = state.user?.subscription_tier || "free";
  if (!analysis) {
    elements.analysisBrand.textContent = "No analyses yet";
    elements.analysisDate.textContent = "";
    elements.analysisSummary.textContent = "Run your first analysis to see visibility insights.";
    elements.analysisStats.innerHTML = "";
    elements.downloadReport.disabled = true;
    elements.gatedHint.style.display = "none";
    elements.emptyState.style.display = "block";
    return;
  }

  elements.emptyState.style.display = "none";
  elements.analysisBrand.textContent = `${analysis.brand_name}`;
  elements.analysisDate.textContent = `Generated ${formatDateTime(analysis.created_at)}`;

  const results = analysis.results;
  const leaderboard = results?.comparison?.leaderboard || [];
  const topCompetitor = leaderboard.find((item) => !item.is_brand);
  const brandEntry = leaderboard.find((item) => item.is_brand);

  if (brandEntry && topCompetitor) {
    const ahead = brandEntry.mention_count - topCompetitor.mention_count;
    const direction = ahead >= 0 ? "ahead of" : "behind";
    elements.analysisSummary.textContent = `Your brand recorded ${brandEntry.mention_count} mentions, ${Math.abs(ahead)} ${direction} ${topCompetitor.name}.`;
  } else if (brandEntry) {
    elements.analysisSummary.textContent = `Your brand recorded ${brandEntry.mention_count} mentions in the latest run.`;
  } else {
    elements.analysisSummary.textContent = "Latest analysis ready.";
  }

  const stats = [];
  if (results?.brand) {
    stats.push({ label: "Average position", value: results.brand.average_position || "--" });
    stats.push({ label: "Average sentiment", value: results.brand.average_sentiment || "--" });
  }
  stats.push({ label: "Competitors tracked", value: results?.competitors?.length ?? 0 });
  stats.push({ label: "Total prompts analyzed", value: results?.total_queries || results?.prompt_insights?.length || 0 });

  elements.analysisStats.innerHTML = stats
    .map((stat) => `<div class="stat-line"><span>${stat.label}</span><strong>${stat.value}</strong></div>`)
    .join("");

  const isGated = Boolean(results?.gated);
  const canDownload = tier === "pro" && !isGated;
  elements.downloadReport.disabled = !canDownload;
  elements.gatedHint.style.display = canDownload ? "none" : "inline";
  elements.gatedHint.textContent = tier === "pro"
    ? "Upgrade complete analyses to enable downloads."
    : "Upgrade to download full reports.";
};

const renderLeaderboard = (analysis) => {
  if (!analysis) {
    elements.leaderboardBody.innerHTML = "<p class=\"empty-state\">Run an analysis to see competitor standings.</p>";
    elements.leaderboardHint.textContent = "";
    return;
  }

  const leaderboard = analysis.results?.comparison?.leaderboard || [];
  if (!leaderboard.length) {
    elements.leaderboardBody.innerHTML = "<p class=\"empty-state\">No competitor data available.</p>";
    elements.leaderboardHint.textContent = "";
    return;
  }

  elements.leaderboardHint.textContent = `Total mentions: ${analysis.results.comparison.share_of_voice?.total_mentions ?? 0}`;

  const header = `<div class="leaderboard-row header"><span>Entity</span><span>Mentions</span><span>Avg position</span></div>`;
  const rows = leaderboard
    .map((entry) => {
      const badge = entry.is_brand ? '<span class="badge">You</span>' : "";
      return `<div class="leaderboard-row"><span>${entry.name} ${badge}</span><span>${entry.mention_count}</span><span>${entry.average_position}</span></div>`;
    })
    .join("");
  elements.leaderboardBody.innerHTML = header + rows;
};

const renderGaps = (analysis) => {
  if (!analysis) {
    elements.gapsList.innerHTML = "";
    elements.gapsHint.textContent = "";
    return;
  }
  const gaps = analysis.results?.gaps || [];
  if (!gaps.length) {
    elements.gapsList.innerHTML = "<li>No competitor-only prompts detected in this run.</li>";
    elements.gapsHint.textContent = "Great job! You're appearing wherever competitors are.";
    return;
  }
  elements.gapsHint.textContent = `${gaps.length} prompts where competitors show up without your brand.`;
  elements.gapsList.innerHTML = gaps
    .slice(0, 10)
    .map((gap) => `<li><strong>${gap.competitor}</strong> mentioned in “${gap.prompt}”</li>`)
    .join("");
};

const renderPrompts = (analysis) => {
  if (!analysis) {
    elements.promptList.innerHTML = "";
    elements.promptHint.textContent = "Run an analysis to unlock prompt-level insight.";
    return;
  }
  const prompts = analysis.results?.prompt_insights || [];
  if (!prompts.length) {
    elements.promptList.innerHTML = "<li>No prompt insights available yet.</li>";
    return;
  }
  elements.promptHint.textContent = `Showing top ${Math.min(8, prompts.length)} prompts by activity.`;
  elements.promptList.innerHTML = prompts
    .slice(0, 8)
    .map((prompt) => {
      const competitors = Object.entries(prompt.competitor_counts || {})
        .map(([name, count]) => `${name}: ${count}`)
        .join(", ");
      const competitorLine = competitors ? `<small>Competitors: ${competitors}</small>` : "";
      const brandLine = prompt.brand_count
        ? `<small>You: ${prompt.brand_count} (${prompt.brand_position || "--"})</small>`
        : "<small>You: 0 mentions</small>";
      return `<li><strong>${prompt.prompt}</strong>${brandLine}${competitorLine}</li>`;
    })
    .join("");
};

const renderHistory = () => {
  if (!state.analyses.length) {
    elements.historyList.innerHTML = "<p class=\"empty-state\">No analyses yet. Run one to start tracking visibility.</p>";
    return;
  }
  elements.historyList.innerHTML = state.analyses
    .map((analysis) => {
      const plan = analysis.results?.gated ? "Free" : "Full";
      return `<div class="history-item"><div><strong>${analysis.brand_name}</strong><div>${formatDateTime(analysis.created_at)} • ${plan}</div></div><button class="ghost" data-analysis="${analysis.id}">View</button></div>`;
    })
    .join("");

  elements.historyList.querySelectorAll("button[data-analysis]").forEach((button) => {
    button.addEventListener("click", () => {
      const analysis = state.analyses.find((item) => item.id === button.dataset.analysis);
      if (analysis) {
        selectAnalysis(analysis);
        smoothScrollTo("section-overview");
      }
    });
  });
};

const renderDashboard = () => {
  renderUserHeader();
  renderMetrics(state.current);
  renderOverview(state.current);
  renderLeaderboard(state.current);
  renderGaps(state.current);
  renderPrompts(state.current);
  renderHistory();
};

const selectAnalysis = (analysis) => {
  state.current = analysis;
  persistCurrentAnalysis(analysis?.id || null);
  renderDashboard();
};

const loadAnalyses = async () => {
  try {
    const analyses = await apiRequest("/analyses");
    if (!analyses) return;
    state.analyses = analyses;
    if (!analyses.length) {
      selectAnalysis(null);
      return;
    }
    const preferred = analyses.find((item) => item.id === state.lastAnalysisId);
    selectAnalysis(preferred || analyses[0]);
  } catch (err) {
    alert(err.message);
  }
};

const handleAnalysisSubmit = () => {
  if (!elements.analysisForm) return;
  elements.analysisForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Running...";

    const analysisPayload = {
      brand: form.brand.value.trim(),
      industry: form.industry.value.trim(),
      keywords: parseListInput(form.keywords.value, 5),
      competitors: parseListInput(form.competitors.value, 5),
    };

    try {
      const analysis = await apiRequest("/analyses", { method: "POST", body: analysisPayload });
      state.analyses = [analysis, ...state.analyses.filter((item) => item.id !== analysis.id)];
      selectAnalysis(analysis);
    } catch (err) {
      alert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Run analysis";
    }
  });
};

const handleDownloadReport = () => {
  if (!elements.downloadReport) return;
  elements.downloadReport.addEventListener("click", async () => {
    if (!state.current) {
      alert("Run an analysis first.");
      return;
    }
    try {
      const response = await apiRequest(`/reports/${state.current.id}`, { raw: true });
      if (!response) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${state.current.brand_name.replace(/\s+/g, "_")}_rankai_report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  });
};

const handleUpgrade = () => {
  if (!elements.upgradeBtn) return;
  elements.upgradeBtn.addEventListener("click", async () => {
    if (state.user?.subscription_tier === "pro") {
      alert("You are already on the Pro plan.");
      return;
    }
    try {
      const result = await apiRequest("/billing/checkout", { method: "POST" });
      alert(`Pro activated! Use this mock checkout link: ${result.checkout_url}`);
      const updatedUser = { ...state.user, subscription_tier: result.subscription };
      persistUser(updatedUser);
      await loadAnalyses();
    } catch (err) {
      alert(err.message);
    }
  });
};

const handleSidebarNavigation = () => {
  elements.sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      elements.sidebarLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
      const target = link.dataset.scroll;
      smoothScrollTo(target);
    });
  });

  if (elements.sidebarNewAnalysis) {
    elements.sidebarNewAnalysis.addEventListener("click", () => {
      smoothScrollTo("section-analysis");
    });
  }

  if (elements.sidebarLogout) {
    elements.sidebarLogout.addEventListener("click", () => {
      clearSession();
      window.location.href = "/";
    });
  }
};

const init = async () => {
  renderUserHeader();
  handleAnalysisSubmit();
  handleDownloadReport();
  handleUpgrade();
  handleSidebarNavigation();
  await loadAnalyses();
};

init();
