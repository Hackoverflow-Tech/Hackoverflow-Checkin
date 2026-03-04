"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getParticipantByIdAction, getTeamMembersAction } from "@/actions/participants";
import type { ClientParticipant } from "@/lib/types";

export default function TeamPage() {
    const { participantId } = useParams() as { participantId: string };
    const [participant, setParticipant] = useState<ClientParticipant | null>(null);
    const [teamMembers, setTeamMembers] = useState<ClientParticipant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const result = await getParticipantByIdAction(participantId);
                
                if (result.success && result.data) {
                    setParticipant(result.data);
                    
                    if (result.data.teamId) {
                        const teamResult = await getTeamMembersAction(result.data.teamId);
                        if (teamResult.success && teamResult.data) {
                            setTeamMembers(teamResult.data);
                        } else {
                            // @ts-ignore
                            setError(typeof teamResult.error === 'string' ? teamResult.error : "Failed to load team data");
                        }
                    }
                } else {
                    // @ts-ignore
                    setError(typeof result.error === 'string' ? result.error : "Failed to load user data");
                }
            } catch (err) {
                setError("An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        }
        
        loadData();
    }, [participantId]);

    if (loading) {
        return <div className="animate-pulse h-64 bg-white/5 rounded-3xl border border-white/10" />;
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
                <p>Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">Team Details</h1>
                <p className="text-gray-400 mt-1">Your squad for Hackoverflow 4.0</p>
            </header>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#FCB216] to-[#D91B57] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(231,88,41,0.2)]">
                    <span className="text-white text-4xl font-bold">
                        {participant?.teamName?.charAt(0).toUpperCase() || "T"}
                    </span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{participant?.teamName || "Not in a Team"}</h2>
                {participant?.teamId && (
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-gray-300 border border-white/10">
                        ID: {participant.teamId}
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white pl-2 border-l-4 border-[#FCB216]">Team Members ({teamMembers.length})</h3>
                
                {teamMembers.length === 0 ? (
                    <div className="p-8 bg-white/5 rounded-2xl border border-white/5 text-center text-gray-400">
                        <p>No other team members found. Check back shortly!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {teamMembers.map((member) => {
                            const isMe = member.participantId === participantId;
                            
                            return (
                                <div 
                                    key={member.participantId} 
                                    className={`p-6 rounded-2xl border transition-all ${
                                        isMe 
                                            ? "bg-gradient-to-br from-[#FCB216]/10 to-[#D91B57]/10 border-[#FCB216]/30" 
                                            : "bg-[#111111] border-white/10"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                                {member.name}
                                                {isMe && <span className="px-2 py-0.5 bg-[#FCB216] text-black text-[10px] font-bold rounded-full uppercase tracking-wider">You</span>}
                                            </h4>
                                            <p className="text-[#FCB216] text-sm font-medium">{member.role || "Hacker"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase">Participant ID</p>
                                            <p className="font-mono text-sm text-gray-300">{member.participantId}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Email</span>
                                            <span className="text-gray-300 truncate max-w-[200px]" title={member.email}>{member.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phone</span>
                                            <span className="text-gray-300">{member.phone || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Institute</span>
                                            <span className="text-gray-300 truncate max-w-[200px]" title={member.institute}>{member.institute || "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}