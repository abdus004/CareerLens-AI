import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
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
      <BarChart data={data} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
        <XAxis
          dataKey="year"
          tick={{ fill: "#9CA3AF", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis hide />

        {/*
          No <Tooltip> here on purpose - it previously rendered a small
          dark hover box over each bar. The per-year demand values are
          still fully visible (not just on hover) via the LabelList
          above each bar below, so no data is lost by removing it.
        */}

        <Bar
          dataKey="demand"
          radius={[8, 8, 0, 0]}
          barSize={24}
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={colors[index % colors.length]}
            />
          ))}
          <LabelList
            dataKey="demand"
            position="top"
            fill="#E5E7EB"
            fontSize={12}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}