"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import {
    getParticipantByIdAction,
    collegeCheckInAction,
    labCheckInAction,
    labCheckOutAction,
    tempLabCheckOutAction,
    collegeCheckOutAction
} from "@/actions";
import type { ClientParticipant } from "@/lib/types";

export default function CheckInDashboardPage() {
    const { participantId } = useParams() as { participantId: string };
    const [participant, setParticipant] = useState<ClientParticipant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

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

    const handleAction = (actionFn: (id: string) => Promise<any>) => {
        startTransition(async () => {
            const result = await actionFn(participantId);
            if (result.success) {
                setParticipant(result.data.participant);
                setError(null);
            } else {
                setError(result.error);
            }
        });
    };

    const handlePermanentAction = (actionFn: (id: string) => Promise<any>, message: string) => {
        if (window.confirm(message)) {
            handleAction(actionFn);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-10 bg-white/5 rounded-lg w-1/4"></div>
                <div className="h-64 bg-white/5 rounded-3xl"></div>
            </div>
        );
    }

    const collegeIn = participant?.collegeCheckIn?.status;
    const labIn = participant?.labCheckIn?.status;
    const collegeOut = participant?.collegeCheckOut?.status;
    const labOut = participant?.labCheckOut?.status;
    const tempOut = participant?.tempLabCheckOut?.status;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">Check-in Status</h1>
                <p className="text-gray-400 mt-1">Track your movement and attendance</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* College Check-in Card */}
                <div className={`rounded-3xl p-8 border transition-all duration-300 ${collegeIn ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Event Attendance</h2>
                            <p className="text-gray-400 text-sm mt-1">College-wide tracking</p>
                        </div>
                        {collegeIn && <span className="text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Checked In</span>}
                    </div>

                    {!collegeIn ? (
                        <button
                            onClick={() => handleAction(collegeCheckInAction)}
                            disabled={isPending}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {isPending ? "Processing..." : "Confirm Arrival ✓"}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-400 text-xs font-mono">
                                In: {new Date(participant.collegeCheckIn!.time!).toLocaleString()}
                            </p>
                            {!collegeOut ? (
                                <button
                                    onClick={() => handlePermanentAction(collegeCheckOutAction, "Are you sure you want to permanently check-out from the event? This action is final.")}
                                    disabled={isPending || !labOut}
                                    className={`w-full font-bold py-2 rounded-xl text-sm transition-all disabled:opacity-50 ${labOut ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-gray-500 cursor-not-allowed opacity-50'}`}
                                >
                                    {labOut ? "Final Event Check-out" : "Checkout Locked (finish Lab Exit first)"}
                                </button>
                            ) : (
                                <p className="text-red-400 text-xs font-bold uppercase tracking-widest text-center py-2 bg-red-500/5 rounded-lg border border-red-500/10">Permanently Checked Out</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Lab Check-in Card */}
                <div className={`rounded-3xl p-8 border transition-all duration-300 ${labIn && !labOut ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/10'} ${!collegeIn && 'opacity-50 pointer-events-none'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Lab Workspace</h2>
                            <p className="text-gray-400 text-sm mt-1">Area: {participant?.labAllotted || "Assigned Lab"}</p>
                        </div>
                        {labIn && !labOut && <span className="text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">In Lab</span>}
                        {labOut && <span className="text-gray-400 bg-white/5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Session Ended</span>}
                    </div>

                    {!labIn ? (
                        <button
                            onClick={() => handleAction(labCheckInAction)}
                            disabled={isPending || !collegeIn}
                            className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {isPending ? "Processing..." : "Lab Check-in →"}
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-gray-400 text-xs font-mono">
                                    {tempOut
                                        ? `Out since: ${new Date(participant.tempLabCheckOut!.time!).toLocaleString()}`
                                        : `Last In: ${new Date(participant.labCheckIn!.time!).toLocaleString()}`
                                    }
                                </p>
                                {labOut && participant.labCheckOut?.time && (
                                    <p className="text-gray-400 text-xs font-mono">
                                        Last Out: {new Date(participant.labCheckOut.time).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            {!labOut && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleAction(tempLabCheckOutAction)}
                                        disabled={isPending}
                                        className={`font-bold py-2 rounded-xl text-sm transition-all disabled:opacity-50 ${tempOut ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                    >
                                        {tempOut ? "Mark: I'm Back →" : "Temporary Exit"}
                                    </button>
                                    <button
                                        onClick={() => handlePermanentAction(labCheckOutAction, "Are you sure you want to end your lab session permanently? You cannot re-enter the lab system after this.")}
                                        disabled={isPending}
                                        className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                                    >
                                        Lab Exit
                                    </button>
                                </div>
                            )}

                            {labOut && (
                                <div className="pt-2 border-t border-white/5">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center">Lab Checkout Complete</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Info Summary */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex flex-wrap gap-8">
                    <div className="flex-1 min-w-[200px] border-r border-white/10 pr-8">
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-widest mb-1">Participant</p>
                        <h3 className="text-lg font-bold text-white">{participant?.name}</h3>
                        <p className="text-gray-400 font-mono text-xs">{participant?.participantId}</p>
                    </div>
                    <div className="flex-1 min-w-[200px] border-r border-white/10 pr-8">
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-widest mb-1">Team</p>
                        <h3 className="text-lg font-bold text-white">{participant?.teamName || "Individual"}</h3>
                        <p className="text-gray-400 text-xs">{participant?.role || "Developer"}</p>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <p className="text-gray-500 uppercase text-[10px] font-bold tracking-widest mb-1">Assigned Venue</p>
                        <h3 className="text-lg font-bold text-white">{participant?.labAllotted || "To be assigned"}</h3>
                        <p className="text-gray-400 text-xs">{participant?.roomNo ? `Room: ${participant.roomNo}` : "Check venue map"}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm animate-shake">
                    {error}
                </div>
            )}
        </div>
    );
}
