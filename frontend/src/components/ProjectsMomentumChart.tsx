import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import type { AnalysisRun, ProjectSnapshot } from '../types/api.ts';

type ProjectsMomentumChartProps = {
  snapshotsByProject: Record<string, ProjectSnapshot[]>;
  runsByProject: Record<string, AnalysisRun[]>;
  projectsOrder: string[];
};

const palette = ['#2563eb', '#7c3aed', '#0ea5e9', '#f97316', '#ec4899', '#10b981'];

const ProjectsMomentumChart = ({ snapshotsByProject, runsByProject, projectsOrder }: ProjectsMomentumChartProps) => {
  const data = useMemo(() => {
    const points: Array<Record<string, string | number>> = [];
    const labels = new Set<string>();

    projectsOrder.forEach((projectId) => {
      const snapshots = snapshotsByProject[projectId] ?? [];
      snapshots.forEach((snapshot, index) => {
        const parsed = new Date(snapshot.snapshotDate);
        const label = Number.isNaN(parsed.getTime())
          ? snapshot.snapshotDate
          : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        labels.add(label);
        const existing = points.find((point) => point.label === label);
        const runsCount = runsByProject[projectId]?.length ?? 0;
        const normalized = runsCount === 0 ? 0 : Math.round((snapshot.brandMentions / runsCount) * 100) / 100;
        if (existing) {
          existing[projectId] = normalized;
        } else {
          points.push({ label, [projectId]: normalized });
        }
      });
    });

    return points.sort((a, b) => {
      const dateA = Date.parse(a.label as string);
      const dateB = Date.parse(b.label as string);
      if (Number.isNaN(dateA) || Number.isNaN(dateB)) return 0;
      return dateA - dateB;
    });
  }, [projectsOrder, snapshotsByProject, runsByProject]);

  if (data.length === 0) {
    return (
      <div className="chart-empty-state">
        Run analyses to unlock trendlines of brand appearances.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickMargin={12} />
        <YAxis tick={{ fontSize: 12 }} width={40} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(2)} avg mentions/run`, '']} />
        <Legend />
        {projectsOrder.map((projectId, index) => (
          <Area
            key={projectId}
            type="monotone"
            dataKey={projectId}
            stroke={palette[index % palette.length]}
            fillOpacity={0.15}
            fill={palette[index % palette.length]}
            strokeWidth={2}
            connectNulls
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ProjectsMomentumChart;
