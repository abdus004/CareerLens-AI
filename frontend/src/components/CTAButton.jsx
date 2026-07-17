export default function CTAButton({
    children,
    primary = true
}){

    if(primary){

        return(

            <button
            className="
            px-8
            py-4
            rounded-2xl
            font-semibold
            text-white
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-600
            hover:scale-105
            hover:shadow-[0_0_40px_rgba(139,92,246,.6)]
            transition-all
            duration-300
            ">
                {children}
            </button>

        )

    }

    return(

        <button
        className="
        px-8
        py-4
        rounded-2xl
        border
        border-violet-400/40
        text-white
        backdrop-blur-xl
        hover:bg-white/10
        transition
        ">
            {children}
        </button>

    )

}