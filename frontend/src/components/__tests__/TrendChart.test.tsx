import { render } from '@testing-library/react';
import TrendChart from '../TrendChart.tsx';

describe('TrendChart', () => {
  it('renders fallback when no data', () => {
    const { getByText } = render(<TrendChart points={[]} />);
    expect(getByText('No trend data yet.')).toBeInTheDocument();
  });
});
