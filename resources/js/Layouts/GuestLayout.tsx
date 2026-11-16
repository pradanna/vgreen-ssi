import React, { PropsWithChildren } from 'react';
import { Link } from '@inertiajs/react';
import { Zap, Car, Bike } from 'lucide-react';

interface GuestLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function Guest({ children }: GuestLayoutProps) {
    return (
        <div className="relative min-h-screen w-full flex flex-col lg:flex-row items-center justify-between overflow-x-hidden font-sans antialiased text-slate-800 bg-slate-950 selection:bg-blue-600 selection:text-white">
            {/* BACKGROUND EV IMAGE & GLOW OVERLAY */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* High resolution EV charging & modern fleet backdrop */}
                <img
                    src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=2400&q=85"
                    alt="PT.SSI x VGREEN EV Network"
                    className="w-full h-full object-cover object-center scale-105"
                />

                {/* Deep cinematic gradient overlay tailored for text contrast */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/85 to-slate-950/60 lg:bg-linear-to-r lg:from-slate-950/95 lg:via-slate-950/80 lg:to-slate-950/50" />

                {/* Ambient Electric Blue & Emerald Accent Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* LEFT / HERO SECTION: PT.SSI x VGREEN EV BRANDING */}
            <div className="relative z-10 w-full lg:w-3/5 min-h-[380px] lg:min-h-screen p-6 sm:p-12 lg:p-20 flex flex-col justify-between">
                {/* Brand Header */}
                <div>
                    <Link href="/" className="inline-flex items-center gap-3.5 group">
                        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
                            <Zap className="w-6 h-6 fill-current text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black tracking-tight text-white leading-none">
                                PT.SSI <span className="text-brand-600">x</span> VGREEN
                            </span>
                            <span className="text-xs text-slate-300 font-medium tracking-wide mt-1">
                                Charging Station Management & GIS Platform
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Main Hero Showcase */}
                <div className="my-10 lg:my-auto max-w-2xl">
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
                        Akselerasi Infrastruktur <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-sky-300 to-emerald-400">
                            Kendaraan Listrik Nasional
                        </span>
                    </h1>

                    {/* EV Cars & Motorbikes Ecosystem Cards */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* EV Cars Feature */}
                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-blue-500/40 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <Car className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">Mobil Listrik (EV Cars)</h2>
                                    <p className="text-xs text-slate-400">VinFast VF Series & Ultra-Fast Charging</p>
                                </div>
                            </div>
                        </div>

                        {/* EV Motorbikes & Battery Swap Feature */}
                        <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Bike className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">Motor Listrik & Swap BSS</h2>
                                    <p className="text-xs text-slate-400">Jaringan Penukaran Baterai Roda Dua</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Copyright */}
                <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
                    <p>
                        &copy; {new Date().getFullYear()}{' '}
                        <a 
                            href="https://ss-indo.org/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-300 font-semibold hover:text-white hover:underline transition"
                        >
                            PT Sukma Setiawan Indonesia
                        </a>
                    </p>
                </div>
            </div>

            {/* RIGHT SECTION: FLOATING CARD CONTAINER */}
            <div className="relative z-10 w-full lg:w-2/5 p-4 sm:p-8 lg:p-12 flex items-center justify-center">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
