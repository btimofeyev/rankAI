import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line
} from 'recharts';
import type { AnalysisRun } from '../types/api.ts';

type ProjectsActivityTimelineProps = {
  runsByProject: Record<string, AnalysisRun[]>;
};

type TimelinePoint = {
  label: string;
  runs: number;
  projectsActive: number;
};

const ProjectsActivityTimeline = ({ runsByProject }: ProjectsActivityTimelineProps) => {
  const data = useMemo(() => {
    const runs = Object.values(runsByProject).flat();
    if (runs.length === 0) return [];

    const grouped = runs.reduce<Record<string, TimelinePoint>>((acc, run) => {
      const rawDate = new Date(run.runAt);
      const label = Number.isNaN(rawDate.getTime())
        ? run.runAt
        : rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!acc[label]) {
        acc[label] = { label, runs: 0, projectsActive: 0 };
      }
      acc[label].runs += 1;
      return acc;
    }, {});

    Object.values(runsByProject).forEach((projectRuns) => {
      const activeDates = new Set(
        projectRuns.map((run) => {
          const rawDate = new Date(run.runAt);
          return Number.isNaN(rawDate.getTime())
            ? run.runAt
            : rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        })
      );
      activeDates.forEach((date) => {
        if (!grouped[date]) grouped[date] = { label: date, runs: 0, projectsActive: 0 };
        grouped[date].projectsActive += 1;
      });
    });

    return Object.values(grouped).sort((a, b) => {
      const timeA = Date.parse(a.label);
      const timeB = Date.parse(b.label);
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
      return timeA - timeB;
    });
  }, [runsByProject]);

  if (data.length === 0) {
    return (
      <div className="chart-empty-state">
        No analysis runs yet. Launch a project run to populate activity.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} tickMargin={12} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} width={36} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} width={36} />
        <Tooltip />
        <Bar yAxisId="left" dataKey="runs" barSize={20} fill="#2563eb" radius={[8, 8, 0, 0]} />
        <Line yAxisId="right" dataKey="projectsActive" type="monotone" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ProjectsActivityTimeline;
