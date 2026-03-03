"use client";

import { useState, useTransition } from "react";
import { manualCheckInAction } from "@/actions";
import { type ClientParticipant } from "@/lib/validation";
import Image from "next/image";
import Link from "next/link";

export default function ManualCheckInClient() {
    const [participantId, setParticipantId] = useState("");
    const [teamId, setTeamId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [participant, setParticipant] = useState<ClientParticipant | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!participantId || !teamId) {
            setError("Please enter both Participant ID and Team ID.");
            return;
        }

        startTransition(async () => {
            const result = await manualCheckInAction(participantId, teamId);
            if (result.success) {
                setSuccess(true);
                setParticipant(result.data.participant);
            } else {
                setError(result.error);
            }
        });
    };

    if (success && participant) {
        return (
            <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#FCB216] to-[#E85D24] rounded-full blur-[120px] opacity-[0.1]" />

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2rem] max-w-2xl w-full text-center relative z-10 animate-fade-in-up">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]">
                        <span className="text-white text-5xl">✓</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-2">Check-in Verified</h1>
                    <p className="text-gray-400 mb-8 lowercase tracking-wide">Manual registration complete</p>

                    <div className="bg-black/40 rounded-2xl p-6 text-left space-y-4 border border-white/5 mb-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <span className="text-gray-500 text-sm uppercase tracking-widest">Name</span>
                            <span className="text-white font-bold text-xl">{participant.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-gray-500 text-xs uppercase block mb-1">Team</span>
                                <span className="text-white font-semibold">{participant.teamName || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 text-xs uppercase block mb-1">Participant ID</span>
                                <span className="text-white font-mono">{participant.participantId}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setSuccess(false);
                            setParticipantId("");
                            setTeamId("");
                        }}
                        className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-semibold"
                    >
                        Check-in Another
                    </button>

                    <div className="mt-8">
                        <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#FCB216]/10 via-[#E85D24]/10 to-[#D91B57]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <Image
                            src="/images/Logo.png"
                            alt="Hackoverflow Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight italic">Manual Check-in</h1>
                    <p className="text-gray-500 mt-2 font-medium">Entrance Desk Verification</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Participant ID
                            </label>
                            <input
                                type="text"
                                value={participantId}
                                onChange={(e) => setParticipantId(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#FCB216]/50 focus:ring-1 focus:ring-[#FCB216]/50 transition-all font-mono placeholder:text-gray-600"
                                placeholder="E.G. PID-1234"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Team ID
                            </label>
                            <input
                                type="text"
                                value={teamId}
                                onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#E85D24]/50 focus:ring-1 focus:ring-[#E85D24]/50 transition-all font-mono placeholder:text-gray-600"
                                placeholder="E.G. TEAM-5678"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-gradient-to-r from-[#FCB216] via-[#E85D24] to-[#D91B57] text-white font-bold py-5 rounded-2xl transition-all duration-300 hover:shadow-[0_10px_30px_rgba(231,88,41,0.3)] hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 relative overflow-hidden group"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isPending ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Check-in ✓"
                                )}
                            </span>
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <Link href="/" className="text-gray-500 hover:text-white transition-colors text-sm font-medium">
                        ← Back to Registration Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
