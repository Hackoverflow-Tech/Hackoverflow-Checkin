"use client";

export default function ResourcesPage() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-3xl font-bold text-white tracking-tight">WiFi & Resources</h1>
                <p className="text-gray-400 mt-1">Essentials for your hackathon stay</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WiFi Credentials */}
                <section className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-[#FCB216]">📡</span> Network Access
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">SSID</p>
                            <p className="text-white font-mono font-bold text-sm md:text-base">Hackoverflow_Guest</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Password</p>
                            <p className="text-white font-mono font-bold text-sm md:text-base">hacktheoverflow@2024</p>
                        </div>
                    </div>
                    <div className="p-4 bg-[#FCB216]/5 border border-[#FCB216]/10 rounded-2xl">
                        <p className="text-[11px] text-[#FCB216] leading-relaxed">
                            Note: This is a dedicated high-speed line for participants. Please avoid streaming heavy 4K content to ensure stability for everyone.
                        </p>
                    </div>
                </section>

                {/* Lab Info */}
                <section className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-[#E85D24]">🏫</span> Lab Guidelines
                    </h2>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="w-6 h-6 bg-white/5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white">1</div>
                            <p className="text-gray-400 text-xs md:text-sm">Food and open beverages are not allowed inside the labs.</p>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-6 h-6 bg-white/5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white">2</div>
                            <p className="text-gray-400 text-xs md:text-sm">Please keep your work area clean and use dustbins.</p>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-6 h-6 bg-white/5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] text-white">3</div>
                            <p className="text-gray-400 text-xs md:text-sm">In case of power issues, contact the nearest volunteer.</p>
                        </li>
                    </ul>
                </section>

                {/* API & Docs */}
                <section className="md:col-span-2 bg-gradient-to-r from-white/5 to-transparent border border-white/10 p-8 rounded-3xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Developer Resources</h2>
                            <p className="text-gray-400 text-sm mt-1">API keys and documentation will be shared here during the event.</p>
                        </div>
                        <button className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors border border-white/10">
                            Coming Soon...
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
