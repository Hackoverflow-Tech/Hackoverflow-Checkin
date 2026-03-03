"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { getParticipantByIdAction, collegeCheckInAction } from "@/actions";
import type { ClientParticipant } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export default function ParticipantCheckInClient() {
    const { participantId } = useParams() as { participantId: string };
    const [participant, setParticipant] = useState<ClientParticipant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        async function loadData() {
            const result = await getParticipantByIdAction(participantId);
            if (result.success) {
                setParticipant(result.data);
            } else {
                setError(result.error);
            }
            setLoading(false);
        }
        loadData();
    }, [participantId]);

    const handleCheckIn = () => {
        startTransition(async () => {
            const result = await collegeCheckInAction(participantId);
            if (result.success) {
                setParticipant(result.data.participant);
                setIsSuccess(true);
            } else {
                setError(result.error);
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#FCB216] to-[#E85D24] rounded-full blur-[120px] opacity-[0.1] animate-pulse" />
                <div className="text-center relative z-10">
                    <div className="w-16 h-16 border-4 border-[#FCB216] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Loading details...</p>
                </div>
            </div>
        );
    }

    if (error || !participant) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-red-500 text-3xl">!</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Participant Not Found</h1>
                    <p className="text-gray-400">{error || "The participant ID provided is invalid or does not exist."}</p>
                    <Link href="/manual-checkin" className="inline-block px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 font-semibold">
                        Try Manual Check-in
                    </Link>
                </div>
            </div>
        );
    }

    if (isSuccess || participant.collegeCheckIn?.status) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FCB216]/5 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-xl w-full bg-white/5 backdrop-blur-2xl border border-white/10 p-10 md:p-16 rounded-[3rem] text-center space-y-8 animate-fade-in-up relative z-10">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                        <span className="text-white text-5xl font-bold">✓</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-white tracking-tight">Access Granted</h2>
                        <p className="text-[#FCB216] font-bold uppercase tracking-[0.3em] text-sm">Welcome to Hackoverflow 4.0</p>
                    </div>
                    <div className="bg-black/40 rounded-3xl p-8 text-left border border-white/5">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Checked-in At</p>
                        <p className="text-white text-xl font-medium">
                            {participant.collegeCheckIn?.time ? new Date(participant.collegeCheckIn.time).toLocaleString() : new Date().toLocaleString()}
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link
                            href={`/participant/${participantId}/dashboard/overview`}
                            className="w-full inline-block bg-white text-black font-black py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-lg shadow-xl"
                        >
                            Enter Dashboard →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E85D24]/10 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D91B57]/10 rounded-full blur-[120px] -ml-64 -mb-64" />

            <div className="max-w-2xl w-full relative z-10 space-y-12 animate-fade-in-up">
                {/* Logo & Header */}
                <div className="text-center space-y-6">
                    <div className="relative w-32 h-32 mx-auto">
                        <Image src="/images/Logo.png" alt="Hackoverflow 4.0" fill className="object-contain" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">REGISTRATION</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-sm mt-2">Participant Arrival Verification</p>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
                    <div className="text-center space-y-8">
                        <div className="space-y-2">
                            <p className="text-[#FCB216] text-xs font-bold uppercase tracking-[0.4em] mb-4">Identity Verified</p>
                            <h2 className="text-3xl font-black text-white truncate px-4">{participant.name}</h2>
                            <p className="text-white/40 font-mono text-sm border border-white/10 rounded-full px-4 py-1 inline-block uppercase tracking-widest">{participant.participantId}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Team</span>
                                <span className="text-white font-bold">{participant.teamName || "Individual"}</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Role</span>
                                <span className="text-white font-bold">{participant.role || "Hacker"}</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Institute</span>
                                <span className="text-white font-bold truncate block">{participant.institute || "N/A"}</span>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest block mb-1">Phone</span>
                                <span className="text-white font-bold">{participant.phone || "N/A"}</span>
                            </div>
                        </div>

                        {/* Check-in CTA */}
                        <div className="pt-6 relative">
                            <button
                                onClick={handleCheckIn}
                                disabled={isPending}
                                className="w-full bg-gradient-to-r from-[#FCB216] via-[#E85D24] to-[#D91B57] text-white font-black py-6 rounded-3xl transition-all duration-300 hover:shadow-[0_20px_40px_rgba(231,88,41,0.4)] hover:-translate-y-1 disabled:opacity-50 text-xl shadow-lg uppercase italic tracking-widest group"
                            >
                                <span className="relative z-10">
                                    {isPending ? "VERIFYING..." : "CONFIRM ARRIVAL ✓"}
                                </span>
                            </button>
                            <p className="text-[#FCB216] text-[10px] font-bold mt-4 uppercase tracking-widest opacity-60">
                                Strictly for on-site registration verification
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Fallback */}
                <div className="text-center space-y-6">
                    <p className="text-gray-600 text-sm font-medium italic">
                        Facing issues with the QR check-in?
                    </p>
                    <Link
                        href="/manual-checkin"
                        className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest border border-white/10 px-6 py-3 rounded-full hover:bg-white/5"
                    >
                        <span>Manual Registration Desk</span>
                        <span className="text-[#FCB216]">→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
