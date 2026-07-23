import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const RadarSkillChart = ({ technicalSkills = [] }) => {
  const data = technicalSkills.slice(0, 6).map((skill) => ({
    subject: skill.skill,
    score: skill.score,
  }));

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-6">
        Skill Intelligence
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#d1d5db", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#6b7280", fontSize: 10 }}
            />
            <Radar
              dataKey="score"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RadarSkillChart;