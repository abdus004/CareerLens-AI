import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";


const colors = [
  "#60A5FA",
  "#4F8CF7",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
];

export default function IndustryDemandChart({
  data = [],
  growth = 0,
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis
          dataKey="year"
          tick={{ fill: "#9CA3AF", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis hide />

        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            background: "#1F2937",
            border: "none",
            borderRadius: "10px",
          }}
        />

        <Bar
  dataKey="demand"
          radius={[8, 8, 0, 0]}
          barSize={24}
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={colors[index]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}