export default function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  className = "",
}) {
  return (
    <div
      className={`
        h-full
        rounded-2xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-xl
        p-5
        flex
        flex-col
        transition-all
        duration-300
        hover:border-violet-500/50
        hover:bg-white/[0.07]
        ${className}
      `}
    >
      {(title || subtitle || icon) && (
        <div className="flex items-center justify-between mb-5">

          <div>

            {title && (
              <h2 className="text-lg font-semibold text-white">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">
                {subtitle}
              </p>
            )}

          </div>

          {icon && (
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-violet-500/15
                border
                border-violet-500/20
                flex
                items-center
                justify-center
                text-violet-400
                flex-shrink-0
              "
            >
              {icon}
            </div>
          )}

        </div>
      )}

      <div className="flex-1">

        {children}

      </div>

    </div>
  );
}