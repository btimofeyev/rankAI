import crypto from "crypto";

const promptTemplates = [
  "best {industry} tools 2025",
  "top {industry} platforms",
  "leading {industry} software",
  "most popular {industry} brands",
  "{keyword} solutions comparison",
  "who is talking about {keyword}",
  "{keyword} SaaS platforms",
  "{keyword} case studies",
  "emerging {industry} innovators",
  "{keyword} customer success stories",
  "top rated {keyword} vendors",
  "best value {keyword} platforms",
  "experts recommend {keyword}",
  "{keyword} vs competitors",
  "{keyword} buying guide",
  "fastest growing {industry} companies",
  "{keyword} review roundup",
  "{keyword} alternatives",
  "who uses {keyword}",
  "{keyword} leader board",
];

const seededRandom = (seed, offset = "") => {
  const hash = crypto.createHash("sha256").update(`${seed}:${offset}`).digest("hex");
  const fragment = hash.slice(0, 8);
  const intVal = parseInt(fragment, 16);
  return intVal / 0xffffffff;
};

const scoreToPosition = (score) => {
  if (score > 0.66) return "top";
  if (score > 0.33) return "middle";
  return "bottom";
};

const scoreToSentiment = (score) => {
  if (score > 0.7) return "positive";
  if (score < 0.3) return "negative";
  return "neutral";
};

const buildPromptText = (template, keyword, industry) => {
  const replacements = {
    industry: industry || keyword || "industry",
    keyword: keyword || industry || "brand visibility",
  };
  return template.replace(/\{(industry|keyword)\}/g, (_, token) => replacements[token] || "brand");
};

export const gptQueryService = {
  buildPrompts(keywords = [], industry) {
    const activeKeywords = keywords.length ? keywords : [industry || "brand visibility"];
    const prompts = [];
    for (const keyword of activeKeywords.slice(0, 5)) {
      for (const template of promptTemplates) {
        prompts.push(buildPromptText(template, keyword, industry));
      }
    }
    return prompts.slice(0, 20);
  },

  async runPrompts({ brand, keywords = [], competitors = [], industry }) {
    const prompts = this.buildPrompts(keywords, industry);
    return prompts.map((prompt, index) => {
      const baseSeed = `${brand}:${prompt}:${index}`;
      const brandScore = seededRandom(baseSeed, "brand");
      const brandMentions = Math.round(brandScore * 6);
      const sentiment = scoreToSentiment(seededRandom(baseSeed, "sentiment"));
      const mentions = [];
      if (brandMentions > 0) {
        mentions.push({
          entity: brand,
          count: brandMentions,
          position: scoreToPosition(brandScore),
          sentiment,
        });
      }
      const competitorSummaries = {};
      competitors.forEach((competitor, competitorIndex) => {
        const competitorSeed = `${baseSeed}:${competitorIndex}`;
        const competitorScore = seededRandom(competitorSeed, "competitor");
        const competitorMentions = Math.round(competitorScore * 8);
        if (competitorMentions > 0) {
          const competitorSentiment = scoreToSentiment(seededRandom(competitorSeed, "sentiment"));
          mentions.push({
            entity: competitor,
            count: competitorMentions,
            position: scoreToPosition(competitorScore),
            sentiment: competitorSentiment,
          });
        }
        competitorSummaries[competitor] = {
          count: competitorMentions,
          score: competitorScore,
        };
      });

      return {
        prompt,
        mentions,
        brand: {
          count: brandMentions,
          score: brandScore,
          sentiment,
        },
        competitors: competitorSummaries,
      };
    });
  },
};
