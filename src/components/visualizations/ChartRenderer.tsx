import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ChartRendererProps {
  chartType: string;
  data: any[];
  config: Record<string, any>;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ChartRenderer({ chartType, data, config }: ChartRendererProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No data to display</p>
      </div>
    );
  }

  const { xAxis, yAxis, labelField, valueField } = config;

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xAxis} stroke="hsl(var(--foreground))" />
          <YAxis stroke="hsl(var(--foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Legend />
          <Bar dataKey={yAxis} fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xAxis} stroke="hsl(var(--foreground))" />
          <YAxis stroke="hsl(var(--foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Legend />
          <Line type="monotone" dataKey={yAxis} stroke="hsl(var(--primary))" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xAxis} stroke="hsl(var(--foreground))" />
          <YAxis stroke="hsl(var(--foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Legend />
          <Area type="monotone" dataKey={yAxis} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie') {
    const pieData = data.map(item => ({
      name: item[labelField],
      value: Number(item[valueField]) || 0,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={80}
            fill="hsl(var(--primary))"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xAxis} stroke="hsl(var(--foreground))" />
          <YAxis dataKey={yAxis} stroke="hsl(var(--foreground))" />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Scatter data={data} fill="hsl(var(--primary))" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'table') {
    const columns = Object.keys(data[0] || {});
    return (
      <div className="rounded-md border max-h-[400px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 100).map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col}>{String(row[col] ?? '')}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return null;
}
