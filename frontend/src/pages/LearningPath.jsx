import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  Target,
  Route,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function LearningPath() {

  const [roadmap, setRoadmap] = useState([]);
const [role, setRole] = useState("");
const [loading, setLoading] = useState(true);

useEffect(() => {

  const fetchLearningPath = async () => {

    try {

      const storedUser =
  JSON.parse(localStorage.getItem("user")) ||
  JSON.parse(sessionStorage.getItem("user"));

if (!storedUser) return;

const email = storedUser.email;

      const response = await fetch(
        `http://127.0.0.1:8000/learning-path/${email}`
      );

      const data = await response.json();
      console.log("Learning Path API Response:", data);
      console.log("Roadmap:", data.learning_path);

      setRole(data.role);
      setRoadmap(data.learning_path);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }

  };

  fetchLearningPath();

}, []);

if (loading) {
  return (
    <DashboardLayout>
      <h1 className="text-white">Loading...</h1>
    </DashboardLayout>
  );
}
 
  return (
    <DashboardLayout>

      <h1 className="text-4xl font-bold text-white mb-2">
    {role}
</h1>

<p className="text-gray-400 mb-10">
    Personalized Learning Path
</p>

      
            {/* Career Roadmap Timeline */}

      <div
        className="
          rounded-3xl
          border
          border-white/10
          bg-white/5
          p-8
          mb-8
        "
      >

        <div className="flex items-center gap-3 mb-10">

          <Route
            size={30}
            className="text-cyan-400"
          />

          <h2 className="text-2xl font-bold text-white">
            Learning Path
          </h2>

        </div>

        <div className="space-y-2">

          {Array.isArray(roadmap) &&
  roadmap.map((step, index) => (

            <div
              key={index}
              className="flex gap-6"
            >

              {/* Timeline */}

              <div className="flex flex-col items-center">

                {step.status === "completed" ? (

  <CheckCircle2
    size={28}
    className="text-green-400"
  />

) : step.status === "in_progress" ? (

  <Circle
    size={28}
    className="text-cyan-400 fill-cyan-400"
  />

) : (

  <Circle
    size={28}
    className="text-gray-500"
  />

)}

              </div>

              {/* Card */}

              <div
                className={`
                  flex-1
                  rounded-2xl
                  border
                  p-6
                  transition-all
                  duration-300

                  ${
  step.status === "completed"
    ? "border-green-500/30 bg-green-500/10"
    : step.status === "in_progress"
    ? "border-cyan-500/30 bg-cyan-500/10"
    : "border-white/10 bg-white/5"
}
                `}
              >

                <div className="flex justify-between items-start">

  <div>

    <h3 className="text-xl font-semibold text-white">
      {step.skill}
    </h3>

    <div className="flex gap-6 mt-2">

      <p className="text-sm text-gray-400">
        <span className="text-white font-medium">Level:</span> {step.level}
      </p>

      <p className="text-sm text-gray-400">
        <span className="text-white font-medium">Duration:</span> {step.duration}
      </p>

    </div>

  </div>

  <span
    className={`px-4 py-2 rounded-full text-sm font-semibold ${
      step.status === "completed"
        ? "bg-green-500/20 text-green-400"
        : step.status === "in_progress"
        ? "bg-cyan-500/20 text-cyan-400"
        : "bg-gray-500/20 text-gray-300"
    }`}
  >
    {step.status === "completed"
      ? "Completed"
      : step.status === "in_progress"
      ? "In Progress"
      : "Pending"}
  </span>

</div>

<div className="mt-5">

  <div className="flex justify-between text-sm text-gray-400 mb-2">

    <span>Progress</span>

    <span>{step.progress}%</span>

  </div>

  <div className="w-full h-2 rounded-full bg-gray-700">

    <div
      className="h-2 rounded-full bg-cyan-400 transition-all duration-500"
      style={{ width: `${step.progress}%` }}
    />

  </div>

</div>
              </div>

            </div>

          ))}

        </div>

      </div>

    </DashboardLayout>
  );
}