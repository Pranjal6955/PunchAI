export default function DotBackground() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10"
            style={{
                backgroundImage:
                    "radial-gradient(circle, oklch(1 0 0 / 0.12) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                maskImage:
                    "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
                WebkitMaskImage:
                    "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
            }}
        />
    )
}
