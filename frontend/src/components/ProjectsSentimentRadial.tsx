import { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Legend
} from 'recharts'
import type { ProjectSnapshot } from '../types/api.ts'

type ProjectsSentimentRadialProps = {
  snapshotsByProject: Record<string, ProjectSnapshot[]>;
  projectNames: Record<string, string>;
};

const ProjectsSentimentRadial = ({ snapshotsByProject, projectNames }: ProjectsSentimentRadialProps) => {
  const data = useMemo(() => {
    return Object.entries(snapshotsByProject)
      .map(([projectId, snapshots]) => {
        const latest = snapshots.at(-1);
        return {
          name: projectNames[projectId] ?? 'Project',
          value: latest ? Math.round(latest.brandSharePct) : 0,
          fill: latest && latest.brandSharePct >= 50 ? '#2563eb' : '#7c3aed'
        };
      })
      .filter((entry) => entry.value > 0);
  }, [snapshotsByProject, projectNames]);

  if (data.length === 0) {
    return (
      <div className="chart-empty-state">
        Share of voice metrics appear once projects have recorded runs.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        cx="50%"
        cy="50%"
        innerRadius="30%"
        outerRadius="90%"
        barSize={18}
        data={data}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          angleAxisId={0}
        />
        <RadialBar
          background
          cornerRadius={12}
          dataKey="value"
          label={{ position: 'inside', fill: '#fff', fontSize: 12, formatter: (val: number) => `${val}%` }}
        />
        <Legend
          iconSize={12}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value: string, entry) => `${value} — ${entry.payload.value}%`}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default ProjectsSentimentRadial;
