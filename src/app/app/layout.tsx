import BottomNav from "@/components/BottomNav";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-background-light dark:bg-black">
            {children}
            <BottomNav />
        </div>
    );
}
