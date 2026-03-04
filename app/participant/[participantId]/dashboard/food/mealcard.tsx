"use client";

import { useState, useEffect } from "react";
import { markMealConsumedAction } from "@/actions/participants";

interface MealCardProps {
  participantId: string;
  mealKey: string;
  label: string;
  initialIsAvailed: boolean;
  initialAvailedAt: string | null;
  startTime: Date;
  endTime: Date;
}

export default function MealCard({
  participantId,
  mealKey,
  label,
  initialIsAvailed,
  initialAvailedAt,
  startTime,
  endTime,
}: MealCardProps) {
  const [isAvailed, setIsAvailed] = useState(initialIsAvailed);
  const [availedAt, setAvailedAt] = useState<string | null>(initialAvailedAt);
  const [isRedeemable, setIsRedeemable] = useState(false);
  const [isTokenActive, setIsTokenActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Generate a consistent unique code based on the user and meal
  const shortMealCode = mealKey.split('_').map(w => w[0].toUpperCase()).join('');
  const uniqueCode = `${participantId}-${shortMealCode}`;

  // Live timer check: updates every minute
  useEffect(() => {
    const checkTimes = () => {
      const now = new Date();
      
      // 1. Check if the serving window is open
      setIsRedeemable(now >= startTime && now <= endTime);

      // 2. Check if the 1-hour token window is still active
      if (isAvailed && availedAt) {
        const redeemedTime = new Date(availedAt);
        const oneHourLater = new Date(redeemedTime.getTime() + 60 * 60 * 1000); // Add 1 hour
        setIsTokenActive(now < oneHourLater);
      } else {
        setIsTokenActive(false);
      }
    };
    
    checkTimes(); // Check immediately on mount
    const interval = setInterval(checkTimes, 60000); // Check every 60 seconds
    
    return () => clearInterval(interval);
  }, [startTime, endTime, isAvailed, availedAt]);

  const handleRedeem = async () => {
    if (!confirm(`Are you sure you want to redeem ${label} now? The token will only be visible for 1 hour!`)) {
      return;
    }

    setIsLoading(true);
    const result = await markMealConsumedAction(participantId, mealKey);

    if (result.success) {
      setIsAvailed(true);
      const nowIso = new Date().toISOString();
      setAvailedAt(nowIso);
      setIsTokenActive(true);
      setShowModal(true); // Open modal immediately upon successful redemption
    } else {
      // Safely extract the error message without TypeScript complaining
      const errorObj = result as any;
      const errorMsg = errorObj.error?.message || errorObj.error || "Failed to redeem meal. Please try again.";
      alert(String(errorMsg));
    }
    
    setIsLoading(false);
  };

  const displayTime = availedAt 
    ? new Date(availedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) 
    : "";

  return (
    <>
      <div
        className={`relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full ${
          isAvailed
            ? "bg-[#1A1A1A] border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
            : "bg-[#111111] border-white/10 hover:border-white/20"
        }`}
      >
        {isAvailed && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isAvailed ? "bg-green-500/10 text-green-500" : "bg-white/5 text-gray-400"}`}>
              🍔
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{label.split("-")[0].trim()}</h3>
              <p className="text-sm text-gray-400">{label.split("-")[1]?.trim() || "Meal"}</p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isAvailed
                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                : "bg-white/5 text-gray-400 border border-white/10"
            }`}
          >
            {isAvailed ? "Consumed" : "Available"}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Window: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Action Area */}
          {!isAvailed && (
            <button
              onClick={handleRedeem}
              disabled={!isRedeemable || isLoading}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all mt-2 ${
                isLoading 
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : isRedeemable
                  ? "bg-[#FCB216] text-black hover:bg-[#ffc64a] shadow-[0_0_15px_rgba(252,178,22,0.3)]"
                  : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
              }`}
            >
              {isLoading ? "Processing..." : isRedeemable ? "Redeem Now" : "Not Currently Active"}
            </button>
          )}

          {/* If Availed AND within 1 hour: Show the Token Button */}
          {isAvailed && isTokenActive && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 mt-2 bg-green-500 text-black rounded-lg text-sm font-bold hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
            >
              Show Token (Active)
            </button>
          )}

          {/* If Availed AND past 1 hour: Show expired message */}
          {isAvailed && !isTokenActive && (
             <div className="w-full py-2 text-center text-xs font-medium text-gray-400 bg-white/5 rounded-lg mt-2 border border-white/5">
               Redeemed at {displayTime.split(', ')[1] || "Counter"}
             </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL FOR TOKEN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111111] border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_30px_rgba(34,197,94,0.15)] animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✅
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Meal Token</h2>
            <p className="text-gray-400 text-sm mb-6">Show this screen to the counter staff immediately.</p>
            
            <div className="bg-black/50 p-4 rounded-xl border border-white/10 mb-6 space-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-2">Unique Code</p>
              <p className="text-3xl font-mono font-bold text-[#FCB216] tracking-widest">{uniqueCode}</p>
              
              <div className="pt-2 mt-2 border-t border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Redeemed At</p>
                <p className="text-sm font-medium text-white">{displayTime}</p>
              </div>
            </div>

            <button 
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
            >
              Close
            </button>
            <p className="text-[10px] text-gray-600 mt-4">Token will automatically expire 1 hour after redemption.</p>
          </div>
        </div>
      )}
    </>
  );
}