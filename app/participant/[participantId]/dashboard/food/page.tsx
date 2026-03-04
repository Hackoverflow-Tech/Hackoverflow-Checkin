import { getParticipantByIdAction } from "@/actions/participants";
import { MEAL_LABELS } from "@/lib/constants"; 
import MealCard from "./mealcard";

// === HACKATHON MEAL TIMINGS ===
// IMPORTANT: day2_lunch spans across today's date so you can test the glowing active button!
const MEAL_SCHEDULE: Record<string, { start: Date; end: Date }> = {
  day1_dinner: { 
    start: new Date("2026-03-12T19:00:00"), 
    end: new Date("2026-03-12T22:30:00") 
  },
  day2_breakfast: { 
    start: new Date("2026-03-13T08:00:00"), 
    end: new Date("2026-03-13T10:30:00") 
  },
  // TEST ACTIVE WINDOW: This is set to span across March 4th, 2026 (Today)
  day2_lunch: { 
    start: new Date("2026-03-04T10:00:00"), 
    end: new Date("2026-03-04T16:00:00") 
  },
  day2_dinner: { 
    start: new Date("2026-03-13T20:00:00"), 
    end: new Date("2026-03-13T23:00:00") 
  },
  day3_breakfast: { 
    start: new Date("2026-03-14T08:00:00"), 
    end: new Date("2026-03-14T10:30:00") 
  },
  day3_lunch: { 
    start: new Date("2026-03-14T13:00:00"), 
    end: new Date("2026-03-14T15:00:00") 
  },
};

interface PageProps {
  params: Promise<{ participantId: string }> | { participantId: string };
}

export default async function FoodPage({ params }: PageProps) {
  const resolvedParams = await params;
  const participantId = resolvedParams.participantId;

  const result = await getParticipantByIdAction(participantId);

  // Error Handling without TypeScript complaints
  if (!result.success) {
    const errorObj = result as any;
    const errorMsg = errorObj.error?.message || errorObj.error || "Unknown database error";
    return (
      <div className="p-8 text-white">
        <h1 className="text-red-500 text-2xl font-bold mb-4">Error Loading Data</h1>
        <p>Participant ID: {participantId}</p>
        <p className="bg-red-500/10 p-4 rounded mt-4 font-mono text-sm border border-red-500/20">
          {String(errorMsg)}
        </p>
      </div>
    );
  }

  if (!result.data) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-red-500 text-2xl font-bold mb-4">Participant Not Found</h1>
        <p>No data exists for ID: {participantId}</p>
      </div>
    );
  }

  const participant = result.data;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Food & <span className="text-[#FCB216]">Meals</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Track your meal passes. Redemptions are only active during specific serving hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(MEAL_LABELS).map(([mealKey, label]) => {
          const typedMealKey = mealKey as keyof typeof MEAL_LABELS;
          
          // Safely grab data, ignoring strict type bindings to avoid red squigglies
          const mealSlot = (participant.mealStatus as any)?.[typedMealKey];
          const isAvailed = mealSlot?.status || false;
          const availedAt = mealSlot?.time || null;
          
          const schedule = MEAL_SCHEDULE[mealKey] || { 
            start: new Date(Date.now() + 86400000), 
            end: new Date(Date.now() + 172800000) 
          };

          return (
            <MealCard
              key={mealKey}
              participantId={participantId}
              mealKey={mealKey}
              label={label}
              initialIsAvailed={isAvailed}
              initialAvailedAt={availedAt}
              startTime={schedule.start}
              endTime={schedule.end}
            />
          );
        })}
      </div>
    </div>
  );
}