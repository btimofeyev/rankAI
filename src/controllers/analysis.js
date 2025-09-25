import crypto from "crypto";
import { authService } from "../services/auth.js";
import { gptQueryService } from "../services/gptQuery.js";
import { mentionParser } from "../utils/parser.js";
import { competitorService } from "../services/competitor.js";
import { reportService } from "../services/report.js";
import { config } from "../config/index.js";
import logger from "../utils/logger.js";
import { db } from "../utils/database.js";
import { getTokenFromHeaders } from "../utils/auth.js";
import { sendError, sendJson } from "../utils/http.js";

const sanitizeAnalysis = (analysis, { isPro }) => {
  const results = analysis.results_json;
  if (isPro) {
    return {
      id: analysis.id,
      brand_name: analysis.brand_name,
      keywords: analysis.keywords,
      created_at: analysis.created_at,
      results,
    };
  }

  return {
    id: analysis.id,
    brand_name: analysis.brand_name,
    keywords: analysis.keywords,
    created_at: analysis.created_at,
    results: {
      ...results,
      competitors: results.competitors.slice(0, 1),
      comparison: {
        ...results.comparison,
        leaderboard: results.comparison.leaderboard.slice(0, 2),
        outranked_by: results.comparison.outranked_by,
        outranking: results.comparison.outranking.slice(0, 1),
        gated: true,
      },
      prompt_insights: results.prompt_insights.slice(0, 5),
      gated: true,
    },
  };
};

const getPlanLimits = (tier) => (tier === "pro" ? config.plans.pro : config.plans.free);

const enforceFreeTierLimits = async (user) => {
  if (user.subscription_tier === "pro") return;
  const { analysisWindowDays, monthlyAnalyses } = config.plans.free;
  const analyses = await db.read("analyses");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - analysisWindowDays);
  const recentAnalyses = analyses.filter(
    (analysis) => analysis.user_id === user.id && new Date(analysis.created_at) > cutoff,
  );
  if (recentAnalyses.length >= monthlyAnalyses) {
    const error = new Error("Free plan allows one analysis every 30 days");
    error.statusCode = 403;
    throw error;
  }
};

const persistAnalysis = async ({ analysisRecord, queryResults, competitorSummaries }) => {
  const analyses = await db.read("analyses");
  analyses.push(analysisRecord);
  await db.write("analyses", analyses);

  const queries = await db.read("queries");
  queryResults.forEach((result) => {
    queries.push({
      id: crypto.randomUUID(),
      analysis_id: analysisRecord.id,
      query_text: result.prompt,
      mentions_found: result.mentions,
      brand_count: result.brand.count,
      competitor_counts: result.competitors,
      sentiment: result.brand.sentiment,
    });
  });
  await db.write("queries", queries);

  const competitors = await db.read("competitors");
  competitorSummaries.forEach((summary) => {
    competitors.push({
      id: crypto.randomUUID(),
      analysis_id: analysisRecord.id,
      competitor_name: summary.name,
      mention_count: summary.mention_count,
      avg_position: summary.average_position,
    });
  });
  await db.write("competitors", competitors);
};

const buildResultsPayload = ({ brandSummary, competitorSummaries, gaps, promptInsights }) => {
  const comparison = competitorService.compare({
    brandSummary,
    competitorSummaries,
    gaps,
  });

  return {
    brand: brandSummary,
    competitors: competitorSummaries,
    comparison,
    gaps,
    prompt_insights: promptInsights,
  };
};

export const analysisController = {
  async create({ req, res, body }) {
    try {
      const token = getTokenFromHeaders(req.headers);
      const user = await authService.requireUser(token);
      const { brand, keywords = [], competitors = [], industry = null } = body || {};
      if (!brand) {
        throw Object.assign(new Error("Brand name is required"), { statusCode: 400 });
      }
      if (!Array.isArray(keywords) || keywords.length === 0) {
        throw Object.assign(new Error("At least one keyword is required"), { statusCode: 400 });
      }
      if (!Array.isArray(competitors)) {
        throw Object.assign(new Error("Competitors must be an array"), { statusCode: 400 });
      }

      const planLimits = getPlanLimits(user.subscription_tier);
      if (competitors.length > planLimits.competitorLimit) {
        throw Object.assign(
          new Error(`Up to ${planLimits.competitorLimit} competitors supported on your plan`),
          { statusCode: 400 },
        );
      }

      await enforceFreeTierLimits(user);

      const queryResults = await gptQueryService.runPrompts({ brand, keywords, competitors, industry });
      const parsed = mentionParser.parse({ brand, competitors, queryResults });
      const resultsPayload = buildResultsPayload({
        brandSummary: parsed.brand,
        competitorSummaries: parsed.competitors,
        gaps: parsed.gaps,
        promptInsights: parsed.prompt_insights,
      });

      const analysisRecord = {
        id: crypto.randomUUID(),
        user_id: user.id,
        brand_name: brand,
        keywords,
        industry,
        created_at: new Date().toISOString(),
        results_json: resultsPayload,
        subscription_tier: user.subscription_tier,
      };

      await persistAnalysis({
        analysisRecord,
        queryResults,
        competitorSummaries: parsed.competitors,
      });

      const response = sanitizeAnalysis(analysisRecord, { isPro: user.subscription_tier === "pro" });
      sendJson(res, 201, response);
    } catch (err) {
      const status = err.statusCode || 400;
      logger.error({ err }, "Unable to run analysis");
      sendError(res, status, err.message || "Unable to run analysis");
    }
  },

  async list({ req, res }) {
    try {
      const token = getTokenFromHeaders(req.headers);
      const user = await authService.requireUser(token);
      const analyses = await db.read("analyses");
      const userAnalyses = analyses
        .filter((item) => item.user_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const sanitized = userAnalyses.map((analysis) => sanitizeAnalysis(analysis, { isPro: user.subscription_tier === "pro" }));
      sendJson(res, 200, sanitized);
    } catch (err) {
      const status = err.statusCode || 400;
      logger.error({ err }, "Unable to fetch analyses");
      sendError(res, status, err.message || "Unable to fetch analyses");
    }
  },

  async get({ req, res, params }) {
    try {
      const token = getTokenFromHeaders(req.headers);
      const user = await authService.requireUser(token);
      const analyses = await db.read("analyses");
      const analysis = analyses.find((item) => item.id === params.id && item.user_id === user.id);
      if (!analysis) {
        throw Object.assign(new Error("Analysis not found"), { statusCode: 404 });
      }
      const sanitized = sanitizeAnalysis(analysis, { isPro: user.subscription_tier === "pro" });
      sendJson(res, 200, sanitized);
    } catch (err) {
      const status = err.statusCode || 400;
      logger.error({ err, analysisId: params?.id }, "Unable to fetch analysis");
      sendError(res, status, err.message || "Unable to fetch analysis");
    }
  },

  async report({ req, res, params }) {
    try {
      const token = getTokenFromHeaders(req.headers);
      const user = await authService.requireUser(token);
      if (user.subscription_tier !== "pro") {
        throw Object.assign(new Error("PDF export is available for Pro subscribers"), { statusCode: 403 });
      }
      const analyses = await db.read("analyses");
      const analysis = analyses.find((item) => item.id === params.id && item.user_id === user.id);
      if (!analysis) {
        throw Object.assign(new Error("Analysis not found"), { statusCode: 404 });
      }
      const pdfBuffer = await reportService.generate(analysis);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${analysis.brand_name.replace(/\s+/g, "_")}_rankai_report.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (err) {
      const status = err.statusCode || 400;
      logger.error({ err, analysisId: params?.id }, "Unable to generate report");
      sendError(res, status, err.message || "Unable to generate report");
    }
  },
};
