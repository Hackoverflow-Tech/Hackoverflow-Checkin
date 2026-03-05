import { redirect } from "next/navigation";
import { getSessionAction } from "@/actions/auth";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

interface Props {
    children: React.ReactNode;
    params: Promise<{ participantId: string }>;
}

export default async function DashboardLayout({ children, params }: Props) {
    const { participantId } = await params;
    const session = await getSessionAction();

    // Double-check on server (middleware already handles this, but good to be safe)
    if (!session?.isLoggedIn || session.participantId !== participantId) {
        redirect(`/participant/${participantId}/login`);
    }

    return (
        <div className="flex min-h-screen bg-[#0A0A0A]">
            <DashboardSidebar
                participantId={participantId}
                participantName={session.name}
            />
            <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-auto h-screen relative">
                {/* Background Subtle Gradient */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#D91B57] rounded-full blur-[150px] opacity-[0.03] pointer-events-none" />

                <div className="relative z-10 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
