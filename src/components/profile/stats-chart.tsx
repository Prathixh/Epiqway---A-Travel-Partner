
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { format, subMonths, getMonth, getYear } from "date-fns"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Trip } from "@/lib/trip"

interface StatsChartProps {
    trips: Trip[];
}

export default function StatsChart({ trips }: StatsChartProps) {
    const chartData = React.useMemo(() => {
        const data: { month: string; trips: number }[] = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(now, i);
            const monthName = format(date, "MMM");
            data.push({ month: monthName, trips: 0 });
        }

        trips.forEach(trip => {
            const tripDate = new Date(trip.startDate);
            const monthIndex = getMonth(tripDate);
            const year = getYear(tripDate);
            const currentYear = getYear(now);

            // Only consider trips from the last 12 months
            const monthDiff = (currentYear - year) * 12 + (getMonth(now) - monthIndex);
            if (monthDiff >= 0 && monthDiff < 12) {
                const monthName = format(tripDate, "MMM");
                const dataEntry = data.find(d => d.month.startsWith(monthName));
                if (dataEntry) {
                    dataEntry.trips += 1;
                }
            }
        });
        
        return data;
    }, [trips]);

  const chartConfig = {
    trips: {
      label: "Trips",
      color: "hsl(var(--primary))",
    },
  }

  return (
    <div className="h-64 w-full">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="trips" fill="var(--color-trips)" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
