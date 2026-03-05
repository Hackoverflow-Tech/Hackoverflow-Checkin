"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getParticipantByIdAction } from "@/actions";
import type { ClientParticipant } from "@/lib/types";

export default function OverviewPage() {
    const { participantId } = useParams() as { participantId: string };
    const [participant, setParticipant] = useState<ClientParticipant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const result = await getParticipantByIdAction(participantId);
            if (result.success) {
                setParticipant(result.data);
            }
            setLoading(false);
        }
        loadData();
    }, [participantId]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-8">
                <div className="h-10 bg-white/5 rounded-lg w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 bg-white/5 rounded-2xl"></div>
                    <div className="h-32 bg-white/5 rounded-2xl"></div>
                    <div className="h-32 bg-white/5 rounded-2xl"></div>
                </div>
                <div className="h-64 bg-white/5 rounded-2xl"></div>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Could not load participant data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                    Welcome, <span className="bg-gradient-to-r from-[#FCB216] to-[#E85D24] bg-clip-text text-transparent">{participant.name}</span>!
                </h1>
                <p className="text-gray-400 mt-1">Ready for Hackoverflow 4.0?</p>
            </header>

            {/* Stats/Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${participant.collegeCheckIn?.status ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <p className="text-lg font-semibold text-white">
                            {participant.collegeCheckIn?.status ? "Checked In" : "Pending Check-in"}
                        </p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Team</p>
                    <p className="text-lg font-semibold text-white">{participant.teamName || "No Team Assigned"}</p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Lab</p>
                    <p className="text-lg font-semibold text-white">{participant.labAllotted || "Assigning Soon..."}</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <section className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl">
                    <h2 className="text-xl font-bold text-white mb-6">Your Details</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Participant ID</span>
                            <span className="text-white font-mono text-sm">{participant.participantId}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Email</span>
                            <span className="text-white text-sm truncate max-w-[150px] md:max-w-none">{participant.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Phone</span>
                            <span className="text-white text-sm">{participant.phone || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Institute</span>
                            <span className="text-white truncate max-w-[150px] md:max-w-[200px] text-right text-sm">{participant.institute || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Role</span>
                            <span className="text-white font-semibold text-sm">{participant.role || "Hacker"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-3">
                            <span className="text-gray-500">Accommodation Room</span>
                            <span className="text-white font-semibold text-[#FCB216] text-sm">{participant.roomNo || "Not Yet Assigned"}</span>
                        </div>
                    </div>
                </section>

                <section className="bg-gradient-to-br from-[#FCB216]/5 to-[#D91B57]/5 border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-8xl">🚀</span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-4 italic">Next Steps</h2>
                    <ul className="space-y-4 text-gray-400">
                        <li className="flex gap-3">
                            <span className="text-[#FCB216]">1.</span>
                            <span>Confirm your check-in at the registration desk.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-[#E85D24]">2.</span>
                            <span>Check your allotted lab and set up your station.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-[#D91B57]">3.</span>
                            <span>Connect to the event WiFi (details in Resources).</span>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
