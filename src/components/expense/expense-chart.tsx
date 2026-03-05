
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Expense } from '@/lib/trip';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(27, 87%, 67%)',
];

interface ExpenseChartProps {
  expenses: Expense[];
}

export default function ExpenseChart({ expenses }: ExpenseChartProps) {
  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    const dataByCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(dataByCategory).map(([name, value]) => ({ name, value }));
  }, [expenses]);
  
  const chartConfig = useMemo(() => {
    const config: any = {};
    chartData.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length],
        };
    });
    return config;
    }, [chartData]);


  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full min-h-[250px] text-muted-foreground">No data to display</div>;
  }

  const outerRadius = isMobile ? 80 : 120;
  const fontSize = isMobile ? '12px' : '14px';

  return (
    <div className="h-full w-full min-h-[300px] sm:min-h-[400px]">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                 const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                 const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                 const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                 return (
                   <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={fontSize}>
                     {`${(percent * 100).toFixed(0)}%`}
                   </text>
                 );
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend 
              verticalAlign="bottom" 
              iconSize={isMobile ? 8 : 10}
              wrapperStyle={{ fontSize, paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
