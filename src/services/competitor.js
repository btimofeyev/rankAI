const positionWeights = {
  top: 3,
  middle: 2,
  bottom: 1,
};

const share = (count, total) => {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
};

const positionDelta = (brandPosition, competitorPosition) => {
  const brandScore = positionWeights[brandPosition] ?? 0;
  const competitorScore = positionWeights[competitorPosition] ?? 0;
  return competitorScore - brandScore;
};

export const competitorService = {
  compare({ brandSummary, competitorSummaries, gaps }) {
    const totalMentions = competitorSummaries.reduce((sum, item) => sum + item.mention_count, brandSummary.mention_count);
    const leaderboard = [
      {
        name: brandSummary.name,
        mention_count: brandSummary.mention_count,
        share_of_voice: share(brandSummary.mention_count, totalMentions),
        average_position: brandSummary.average_position,
        average_sentiment: brandSummary.average_sentiment,
        is_brand: true,
      },
      ...competitorSummaries.map((competitor) => ({
        name: competitor.name,
        mention_count: competitor.mention_count,
        share_of_voice: share(competitor.mention_count, totalMentions),
        average_position: competitor.average_position,
        average_sentiment: competitor.average_sentiment,
        is_brand: false,
      })),
    ].sort((a, b) => b.mention_count - a.mention_count);

    const outrankedBy = competitorSummaries
      .filter((competitor) => competitor.mention_count > brandSummary.mention_count)
      .map((competitor) => ({
        name: competitor.name,
        mention_gap: competitor.mention_count - brandSummary.mention_count,
        position_delta: positionDelta(brandSummary.average_position, competitor.average_position),
      }));

    const outranking = competitorSummaries
      .filter((competitor) => competitor.mention_count <= brandSummary.mention_count)
      .map((competitor) => ({
        name: competitor.name,
        mention_gap: brandSummary.mention_count - competitor.mention_count,
        position_delta: positionDelta(competitor.average_position, brandSummary.average_position),
      }));

    return {
      leaderboard,
      share_of_voice: {
        brand: share(brandSummary.mention_count, totalMentions),
        total_mentions: totalMentions,
      },
      outranked_by: outrankedBy,
      outranking,
      gaps,
    };
  },
};
