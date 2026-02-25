export default function DotBackground() {
    return (
        <div className="fixed inset-0 -z-10 h-full w-full bg-black">
            <div
                className="absolute h-full w-full bg-[radial-gradient(#333_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px]"
                style={{ maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 70%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 70%, transparent 100%)' }}
            />
        </div>
    );
}
