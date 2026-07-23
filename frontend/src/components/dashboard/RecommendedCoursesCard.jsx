import { BookOpen } from "lucide-react";

const RecommendedCoursesCard = ({ courses = [] }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full">
      <h2 className="text-xl font-semibold text-white mb-6">
        Recommended Courses
      </h2>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:bg-white/10"
            >
              <BookOpen className="w-5 h-5 text-cyan-400 flex-shrink-0" />

              <span className="text-gray-200 font-medium">
                {course}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">
            No course recommendations available.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecommendedCoursesCard;