const escapePdfText = (text) =>
  text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");

const createPdfFromLines = (lines) => {
  const textLines = [
    "BT",
    "/F1 16 Tf",
    "1 0 0 1 72 770 Tm",
    "20 TL",
  ];

  lines.forEach((line, index) => {
    if (index === 0) {
      textLines.push(`(${escapePdfText(line)}) Tj`);
    } else {
      textLines.push("T*");
      textLines.push(`(${escapePdfText(line)}) Tj`);
    }
  });

  textLines.push("ET");

  const streamContent = textLines.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf-8");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, "utf-8"));
    pdf += object;
  });

  const xrefStart = Buffer.byteLength(pdf, "utf-8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i += 1) {
    const offset = offsets[i];
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf-8");
};

const formatShare = (value) => `${value}%`;

export const reportService = {
  async generate(analysisRecord) {
    const { brand_name: brandName, created_at: createdAt, results_json: results } = analysisRecord;
    const headerLines = [
      "RankAI Visibility Report",
      `Brand: ${brandName}`,
      `Generated: ${new Date(createdAt).toLocaleString("en-US")}`,
      "",
      "Brand Summary",
      `Mentions: ${results.brand.mention_count}`,
      `Average Position: ${results.brand.average_position}`,
      `Average Sentiment: ${results.brand.average_sentiment}`,
      "",
      "Competitor Leaderboard",
    ];

    const leaderboardLines = results.comparison.leaderboard.map((entry, index) =>
      `${index + 1}. ${entry.name} - Mentions ${entry.mention_count}, Share ${formatShare(entry.share_of_voice)}, Position ${entry.average_position}`,
    );

    const gapLines = ["", "Gaps Detected"];
    if (!results.gaps.length) {
      gapLines.push("No competitor-only mentions detected in this run.");
    } else {
      results.gaps.slice(0, 10).forEach((gap, index) => {
        gapLines.push(`${index + 1}. ${gap.competitor} mentioned in prompt: ${gap.prompt}`);
      });
    }

    const lines = [...headerLines, ...leaderboardLines, ...gapLines];
    return createPdfFromLines(lines);
  },
};
