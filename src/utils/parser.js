const positionWeights = {
  top: 3,
  middle: 2,
  bottom: 1,
};

const sentimentValues = {
  positive: 1,
  neutral: 0,
  negative: -1,
};

const resolveAveragePosition = (score) => {
  if (score >= 2.5) return "top";
  if (score >= 1.75) return "middle";
  return "bottom";
};

const resolveSentiment = (score) => {
  if (score > 0.2) return "positive";
  if (score < -0.2) return "negative";
  return "neutral";
};

const initCompetitorSummary = (name) => ({
  name,
  mention_count: 0,
  position_score: 0,
  sentiment_score: 0,
  prompts: [],
});

export const mentionParser = {
  parse({ brand, competitors = [], queryResults = [] }) {
    const brandSummary = {
      name: brand,
      mention_count: 0,
      position_score: 0,
      sentiment_score: 0,
      prompts: [],
    };

    const competitorMap = new Map();
    competitors.forEach((name) => {
      competitorMap.set(name, initCompetitorSummary(name));
    });

    const gaps = [];
    const promptInsights = [];

    queryResults.forEach((result) => {
      const detail = {
        prompt: result.prompt,
        brand_count: 0,
        brand_position: null,
        competitor_counts: {},
      };

      result.mentions.forEach((mention) => {
        const posWeight = positionWeights[mention.position] ?? 1;
        const sentimentValue = sentimentValues[mention.sentiment] ?? 0;
        if (mention.entity === brand) {
          brandSummary.mention_count += mention.count;
          brandSummary.position_score += posWeight * mention.count;
          brandSummary.sentiment_score += sentimentValue * mention.count;
          brandSummary.prompts.push({
            prompt: result.prompt,
            count: mention.count,
            position: mention.position,
          });
          detail.brand_count = mention.count;
          detail.brand_position = mention.position;
        } else if (competitorMap.has(mention.entity)) {
          const competitorSummary = competitorMap.get(mention.entity);
          competitorSummary.mention_count += mention.count;
          competitorSummary.position_score += posWeight * mention.count;
          competitorSummary.sentiment_score += sentimentValue * mention.count;
          competitorSummary.prompts.push({
            prompt: result.prompt,
            count: mention.count,
            position: mention.position,
          });
          detail.competitor_counts[mention.entity] = mention.count;
        }
      });

      if (!detail.brand_count) {
        Object.entries(detail.competitor_counts).forEach(([competitor, count]) => {
          if (count > 0) {
            gaps.push({ prompt: result.prompt, competitor });
          }
        });
      }

      promptInsights.push(detail);
    });

    const totalBrandMentions = brandSummary.mention_count || 1;
    const brandAvgPosition = resolveAveragePosition(brandSummary.position_score / totalBrandMentions);
    const brandAvgSentiment = resolveSentiment(brandSummary.sentiment_score / totalBrandMentions);

    const competitorSummaries = Array.from(competitorMap.values()).map((summary) => {
      const total = summary.mention_count || 1;
      return {
        name: summary.name,
        mention_count: summary.mention_count,
        average_position: resolveAveragePosition(summary.position_score / total),
        average_sentiment: resolveSentiment(summary.sentiment_score / total),
        prompts: summary.prompts,
      };
    });

    return {
      brand: {
        name: brand,
        mention_count: brandSummary.mention_count,
        average_position: brandAvgPosition,
        average_sentiment: brandAvgSentiment,
        prompts: brandSummary.prompts,
      },
      competitors: competitorSummaries,
      gaps,
      prompt_insights: promptInsights,
      total_queries: queryResults.length,
    };
  },
};
