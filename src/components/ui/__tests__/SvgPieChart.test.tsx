import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SvgPieChart } from '../SvgCharts';

describe('Full-share pie charts', () => {
  it('renders a visible full ring when every card belongs to one category', () => {
    render(<SvgPieChart data={[{ name: 'Yangi', value: 50, color: '#ef4444' }]} />);
    const chart = screen.getByRole('img', { name: 'Yangi: 50' });
    const ring = chart.querySelector('circle');
    expect(ring).not.toBeNull();
    expect(Number(ring?.getAttribute('r'))).toBeGreaterThan(0);
    expect(Number(ring?.getAttribute('stroke-width'))).toBeGreaterThan(0);
    expect(ring).toHaveAttribute('stroke', '#ef4444');
    expect(screen.getByText('50 (100%)')).toBeInTheDocument();
  });
  it('keeps the full pie visible when the center hole is disabled', () => {
    render(<SvgPieChart innerRadius={0} data={[{ name: 'Yangi', value: 1, color: '#ef4444' }]} />);
    expect(screen.getByRole('img').querySelector('circle')).toHaveAttribute('fill', '#ef4444');
  });
});
