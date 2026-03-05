"use client"
import React from 'react';

interface Event {
    startTime: string;
    endTime: string;
    title: string;
    description: string;
    isMeal: boolean;
}

interface ScheduleDay {
    day: number;
    date: string;
    color: string;
    icon: string;
    events: Event[];
}

interface TimeRange {
    hours: number;
    minutes: number;
}

const SCHEDULE_DATA: ScheduleDay[] = [
    {
        day: 1,
        date: '11th March, 2026',
        color: '#FCB216',
        icon: '📅',
        events: [
            { startTime: '10:30 AM', endTime: '12:00 PM', title: 'Check-in', description: 'Check-in to the event.', isMeal: false },
            { startTime: '12:00 PM', endTime: '01:00 PM', title: 'Breakfast', description: 'Grab your meal and refuel.', isMeal: true },
            { startTime: '01:00 PM', endTime: '02:00 PM', title: 'Banner Revel', description: 'Welcome to Hackoverflow 4.0!', isMeal: false },
            { startTime: '02:00 PM', endTime: '04:00 PM', title: 'Orientation & Opening Ceremony', description: 'Official kickoff at the main auditorium.', isMeal: false },
            { startTime: '04:00 PM', endTime: '05:00 PM', title: 'Lab Allotment', description: 'Get assigned to your lab workspace.', isMeal: false },
            { startTime: '05:00 PM', endTime: '09:00 PM', title: 'Hackathon Begins', description: 'The clock starts now!', isMeal: false },
            { startTime: '09:00 PM', endTime: '10:00 PM', title: 'Dinner', description: 'Grab your meal and refuel.', isMeal: true },
            { startTime: '10:00 PM', endTime: '11:59 PM', title: 'Coding', description: 'Continue hacking through the night.', isMeal: false }
        ]
    },
    {
        day: 2,
        date: '3rd March, 2026',
        color: '#D91B57',
        icon: '🚀',
        events: [
            { startTime: '08:00 AM', endTime: '09:00 AM', title: 'Breakfast', description: 'Energy up before the day begins.', isMeal: true },
            { startTime: '09:00 AM', endTime: '01:00 PM', title: 'Coding [Judging round 1]', description: 'First assessment round begins.', isMeal: false },
            { startTime: '01:00 PM', endTime: '02:00 PM', title: 'Lunch', description: 'Take a break and enjoy your meal.', isMeal: true },
            { startTime: '02:00 PM', endTime: '07:00 PM', title: 'Coding [Judging round 2]', description: 'Second assessment round.', isMeal: false },
            { startTime: '07:00 PM', endTime: '09:00 PM', title: 'Dinner', description: 'Evening meal break.', isMeal: true },
            { startTime: '09:00 PM', endTime: '11:00 PM', title: 'Networking & Jamming Session', description: 'Connect with fellow hackers.', isMeal: false },
            { startTime: '11:00 PM', endTime: '07:00 AM', title: 'Coding', description: 'Burning midnight oil.', isMeal: false }
        ]
    },
    {
        day: 3,
        date: '13th March, 2026',
        color: '#00D4FF',
        icon: '🏆',
        events: [
            { startTime: '07:00 AM', endTime: '08:00 AM', title: 'Project & Code Submission', description: 'Final deadline for submissions.', isMeal: false },
            { startTime: '08:00 AM', endTime: '09:00 AM', title: 'Breakfast', description: 'Last breakfast of the hackathon.', isMeal: true },
            { startTime: '09:00 AM', endTime: '12:00 AM', title: 'Judging round 3', description: 'Final judging round.', isMeal: false },
            { startTime: '12:00 AM', endTime: '01:00 PM', title: 'Lunch', description: 'Meal break during judging.', isMeal: true },
            { startTime: '01:00 PM', endTime: '03:30 PM', title: 'Final Evaluation (Conclave)', description: 'Final evaluation of winners.', isMeal: false },
            { startTime: '03:30 PM', endTime: '05:00 PM', title: 'Closing Ceremony', description: 'Celebration of achievements.', isMeal: false },
            { startTime: '05:00 PM', endTime: '05:30 PM', title: 'Certificate Distribution', description: 'Collect your certificate.', isMeal: false }
        ]
    }
];

const parseTime = (timeStr: string): TimeRange => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let h = hours;
    if (period === 'PM' && hours !== 12) h += 12;
    if (period === 'AM' && hours === 12) h = 0;
    return { hours: h, minutes };
};

const isEventActive = (startTime: string, endTime: string, dateStr: string, now: Date): boolean => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    // Normalize date string (remove st, nd, rd, th) to make it parseable
    const normalizedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const eventDay = new Date(normalizedDate);
    eventDay.setHours(0, 0, 0, 0);

    const currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);

    // Calculate day difference
    const timeDiff = currentDay.getTime() - eventDay.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    const nowTotal = now.getHours() * 60 + now.getMinutes();
    const startTotal = start.hours * 60 + start.minutes;
    const endTotal = end.hours * 60 + end.minutes;

    const isCrossMidnight = endTotal < startTotal;

    if (dayDiff === 0) {
        if (isCrossMidnight) return nowTotal >= startTotal;
        return nowTotal >= startTotal && nowTotal < endTotal;
    } else if (dayDiff === 1) {
        if (isCrossMidnight) return nowTotal < endTotal;
    }

    return false;
};

const SchedulePage: React.FC = () => {

    const [currentTime, setCurrentTime] = React.useState<Date>(new Date());

    React.useEffect(() => {
        // Update every 30 seconds for better performance
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.8; }
                }
                @keyframes glow-ring {
                    0% { box-shadow: 0 0 0 0 currentColor; }
                    70% { box-shadow: 0 0 0 10px rgba(0, 0, 0, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
                }
                .dot-active { 
                    animation: pulse-glow 0.6s ease-in-out infinite, glow-ring 2s ease-out infinite !important; 
                }
                .timeline-line {
                    position: absolute;
                    left: 23px; /* Exactly center of the 48px gutter */
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                }
                .timeline-box {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .timeline-box.active {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: currentColor;
                    box-shadow: 0 0 15px -5px currentColor;
                }
            `}</style>

            <header>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Event Schedule</h1>
                <p className="text-gray-400 mt-1 text-sm">Hackoverflow 4.0 Timeline</p>
            </header>

            <div className="space-y-8">
                {SCHEDULE_DATA.map((day, dayIndex) => (
                    <div key={dayIndex} className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-7 overflow-hidden relative">

                        <h2 className="font-bold text-lg md:text-xl mb-7 flex items-center gap-3" style={{ color: day.color }}>
                            <span className="text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{day.icon}</span>
                            <span className="tracking-tight">Day {day.day}: {day.date}</span>
                        </h2>

                        <div className="relative pl-12">
                            {/* Vertical Line */}
                            <div className="timeline-line" />

                            <div className="space-y-6">
                                {day.events.map((event, eventIndex) => {
                                    const isActive = isEventActive(event.startTime, event.endTime, day.date, currentTime);

                                    return (
                                        <div key={eventIndex} className="relative group flex items-center">
                                            {/* Dot on the Line - perfectly centered horizontally at 24px and vertically at 50% */}
                                            <div
                                                className={`absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-10 transition-all duration-500 ${isActive ? 'dot-active scale-110' : 'scale-100'}`}
                                                style={{
                                                    backgroundColor: isActive ? day.color : (event.isMeal ? day.color : '#2A2A2A'),
                                                    boxShadow: isActive ? `0 0 15px ${day.color}` : 'none',
                                                    border: `2px solid ${isActive ? '#FFF' : 'rgba(255,255,255,0.1)'}`,
                                                }}
                                            />

                                            {/* Compact Content Box */}
                                            <div className={`timeline-box p-3 md:p-4 rounded-xl md:rounded-2xl relative w-full ${isActive ? 'active' : ''}`}
                                                style={{ color: isActive ? day.color : undefined }}>

                                                {/* Active Indicator Bar - Moved slightly inside with glow */}
                                                {isActive && (
                                                    <div className="absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full shadow-[0_0_12px] shadow-current"
                                                        style={{ backgroundColor: day.color }} />
                                                )}

                                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 ${isActive ? 'pl-4' : ''}`}>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500"
                                                                style={{ color: isActive ? day.color : undefined }}>
                                                                {event.startTime} – {event.endTime}
                                                            </p>
                                                            {isActive && (
                                                                <span className="flex h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                                                            )}
                                                        </div>
                                                        <h3 className="font-bold text-sm md:text-base text-white ">
                                                            {event.title}
                                                        </h3>
                                                        <p className="text-gray-400 text-[10px] md:text-xs leading-relaxed max-w-2xl">
                                                            {event.description}
                                                        </p>
                                                    </div>

                                                    {event.isMeal && (
                                                        <div className="flex-shrink-0 self-start sm:self-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border transition-all duration-300"
                                                            style={{
                                                                backgroundColor: isActive ? day.color : `${day.color}15`,
                                                                color: isActive ? '#000' : day.color,
                                                                borderColor: isActive ? '#FFF' : `${day.color}40`
                                                            }}>
                                                            🍽️ Meal
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {dayIndex < SCHEDULE_DATA.length - 1 && <div className="mt-8" />}
                    </div>
                ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md">
                <div className="flex gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0 border border-white/10 shadow-inner">
                        ℹ️
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-2">Live Timeline Insights</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 text-gray-400 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                <span>Currently active events pulse and glow automatically.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                <span>The vertical line provides a continuous path through the hackathon.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                <span>Meal breaks are color-coded for quick identification.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                                <span>Animations are optimized for a smooth 60fps experience.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulePage;
