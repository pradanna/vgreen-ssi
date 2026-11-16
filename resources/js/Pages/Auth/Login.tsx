import React, { useState, FormEventHandler } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    User as UserIcon, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    Zap
} from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

export default function Login({
    status,
    canResetPassword = true,
}: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
        remember: true as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handleSelectDemoRole = (roleKey: string, usernameOrEmail: string) => {
        setActiveDemoRole(roleKey);
        clearErrors();
        setData({
            email: usernameOrEmail,
            password: 'password123',
            remember: true,
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk - PT.SSI x VGREEN" />

            <div className="bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl rounded-3xl p-6 sm:p-9 text-slate-800 transition-all duration-300">
                {/* CARD HEADER (CLEAN: TANPA LOGO & BADGE PORTAL RESMI) */}
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Masuk ke Akun Anda
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                        Masukkan username dan kata sandi Anda untuk mengakses dashboard.
                    </p>
                </div>

                {/* STATUS ALERT NOTIFICATION */}
                {status && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                {/* GENERAL VALIDATION / AUTH FAILED ALERT */}
                {errors.email && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block">Autentikasi Gagal</span>
                            <span className="text-[11px] text-red-700">{errors.email}</span>
                        </div>
                    </div>
                )}

                {/* LOGIN FORM */}
                <form onSubmit={submit} className="space-y-4">
                    {/* USERNAME INPUT */}
                    <div>
                        <InputLabel htmlFor="email" value="Username" className="text-xs font-bold text-slate-700 mb-1.5" />
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <input
                                id="email"
                                type="text"
                                name="email"
                                value={data.email}
                                placeholder="Masukkan username"
                                className={`w-full rounded-2xl border bg-[#F8FAFC] pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:bg-white focus:outline-hidden focus:ring-4 transition ${
                                    errors.email
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                        : 'border-[#E2E8F0] focus:border-brand-600 focus:ring-blue-500/10'
                                }`}
                                autoComplete="username"
                                autoFocus
                                required
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* PASSWORD INPUT */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <InputLabel htmlFor="password" value="Kata Sandi (Password)" className="text-xs font-bold text-slate-700" />
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs font-semibold text-brand-600 hover:text-[#204FDE] transition hover:underline"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                placeholder="••••••••••••"
                                className={`w-full rounded-2xl border bg-[#F8FAFC] pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:bg-white focus:outline-hidden focus:ring-4 transition ${
                                    errors.password
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                                        : 'border-[#E2E8F0] focus:border-brand-600 focus:ring-blue-500/10'
                                }`}
                                autoComplete="current-password"
                                required
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition focus:outline-hidden"
                                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1.5" />
                    </div>

                    {/* REMEMBER ME CHECKBOX */}
                    <div className="pt-1 flex items-center justify-between">
                        <label className="flex items-center cursor-pointer select-none">
                            <Checkbox
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                            <span className="ms-2.5 text-xs font-medium text-slate-600 hover:text-slate-900">
                                Ingat sesi login saya
                            </span>
                        </label>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-6 rounded-2xl bg-brand-600 hover:bg-[#204FDE] text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memverifikasi Kredensial...</span>
                                </>
                            ) : (
                                <>
                                    <span>Masuk ke Dashboard</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* QUICK DEMO ACCOUNT SELECTOR */}
                <div className="mt-6 pt-5 border-t border-[#EDF1F7]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            Akses Cepat Demo Akun:
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">1-Klik Isi Form</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* 1. DIREKTUR PT SSI */}
                        <button
                            type="button"
                            onClick={() => handleSelectDemoRole('direktur', 'direktur')}
                            className={`p-2.5 rounded-2xl text-left border transition-all duration-150 ${
                                activeDemoRole === 'direktur'
                                    ? 'bg-emerald-100/80 border-emerald-400 text-emerald-950 ring-2 ring-emerald-400/30 font-semibold'
                                    : 'bg-emerald-50/70 hover:bg-emerald-100/50 border-emerald-200/80 text-emerald-900'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px]">👑 Direktur SSI</span>
                                {activeDemoRole === 'direktur' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            </div>
                            <span className="text-[10px] text-emerald-700 block truncate mt-0.5">direktur</span>
                        </button>

                        {/* 2. ADMIN PT SSI */}
                        <button
                            type="button"
                            onClick={() => handleSelectDemoRole('admin', 'admin')}
                            className={`p-2.5 rounded-2xl text-left border transition-all duration-150 ${
                                activeDemoRole === 'admin'
                                    ? 'bg-blue-100/80 border-blue-400 text-blue-950 ring-2 ring-blue-400/30 font-semibold'
                                    : 'bg-blue-50/70 hover:bg-blue-100/50 border-blue-200/80 text-blue-900'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px]">🛠️ Admin SSI</span>
                                {activeDemoRole === 'admin' && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                            </div>
                            <span className="text-[10px] text-blue-700 block truncate mt-0.5">admin</span>
                        </button>

                        {/* 3. V-GREEN REPRESENTATIVE */}
                        <button
                            type="button"
                            onClick={() => handleSelectDemoRole('vgreen', 'vgreen')}
                            className={`p-2.5 rounded-2xl text-left border transition-all duration-150 ${
                                activeDemoRole === 'vgreen'
                                    ? 'bg-purple-100/80 border-purple-400 text-purple-950 ring-2 ring-purple-400/30 font-semibold'
                                    : 'bg-purple-50/70 hover:bg-purple-100/50 border-purple-200/80 text-purple-900'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px]">⚡ V-Green Rep</span>
                                {activeDemoRole === 'vgreen' && <CheckCircle2 className="w-3 h-3 text-purple-600" />}
                            </div>
                            <span className="text-[10px] text-purple-700 block truncate mt-0.5">vgreen</span>
                        </button>

                        {/* 4. FIELD SURVEYOR */}
                        <button
                            type="button"
                            onClick={() => handleSelectDemoRole('vendor', 'vendor')}
                            className={`p-2.5 rounded-2xl text-left border transition-all duration-150 ${
                                activeDemoRole === 'vendor'
                                    ? 'bg-amber-100/80 border-amber-400 text-amber-950 ring-2 ring-amber-400/30 font-semibold'
                                    : 'bg-amber-50/70 hover:bg-amber-100/50 border-amber-200/80 text-amber-900'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-extrabold text-[11px]">📱 Surveyor Lapangan</span>
                                {activeDemoRole === 'vendor' && <CheckCircle2 className="w-3 h-3 text-amber-600" />}
                            </div>
                            <span className="text-[10px] text-amber-700 block truncate mt-0.5">vendor</span>
                        </button>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
