import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell
} from 'recharts';
import { Project } from '../types/api.ts';

type ProjectsQueryBarChartProps = {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
};

const COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#f97316', '#ec4899', '#10b981'];

const ProjectsQueryBarChart = ({ projects, onSelectProject }: ProjectsQueryBarChartProps) => {
  const data = useMemo(() => {
    return projects
      .map((project) => ({
        id: project.id,
        name: project.brandName,
        queries: project.trackedQueries.length
      }))
      .sort((a, b) => b.queries - a.queries)
      .slice(0, 6);
  }, [projects]);

  if (data.length === 0) {
    return (
      <div className="chart-empty-state">
        Add tracked queries to your projects to unlock coverage insights.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 24, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={12} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={36} />
        <Tooltip formatter={(value: number) => [`${value} tracked`, 'Tracked prompts']} />
        <Bar dataKey="queries" radius={[8, 8, 0, 0]} onClick={(entry) => onSelectProject(entry.id)}>
          {data.map((entry, index) => (
            <Cell key={entry.id} cursor="pointer" fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectsQueryBarChart;
