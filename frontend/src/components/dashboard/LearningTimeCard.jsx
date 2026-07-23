import { Clock3 } from "lucide-react";

const LearningTimeCard = ({ time }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full flex flex-col justify-center items-center text-center">
      <Clock3 className="w-14 h-14 text-cyan-400 mb-5" />

      <h2 className="text-xl font-semibold text-white mb-3">
        Estimated Learning Time
      </h2>

      <p className="text-3xl font-bold text-cyan-400">
        {time || "Not Available"}
      </p>

      <p className="text-sm text-gray-400 mt-3">
        Estimated time to reach industry-ready level.
      </p>
    </div>
  );
};

export default LearningTimeCard;