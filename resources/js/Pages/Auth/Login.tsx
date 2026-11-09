import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="Password" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4 block">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                        />
                        <span className="ms-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="mt-4 flex items-center justify-end">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Log in
                    </PrimaryButton>
                </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                    ⚡ Akses Cepat Demo Akun:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => {
                            setData({ email: 'direktur@ssi.co.id', password: 'password123', remember: true });
                        }}
                        className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-left border border-emerald-200 transition"
                    >
                        <strong className="block">👑 Direktur PT SSI</strong>
                        <span className="text-[11px] text-emerald-600">direktur@ssi.co.id</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setData({ email: 'admin@ssi.co.id', password: 'password123', remember: true });
                        }}
                        className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-left border border-blue-200 transition"
                    >
                        <strong className="block">🛠️ Admin PT SSI</strong>
                        <span className="text-[11px] text-blue-600">admin@ssi.co.id</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setData({ email: 'vgreen@vgreen.vn', password: 'password123', remember: true });
                        }}
                        className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-left border border-purple-200 transition"
                    >
                        <strong className="block">⚡ Perwakilan V-Green</strong>
                        <span className="text-[11px] text-purple-600">vgreen@vgreen.vn</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setData({ email: 'vendor@mitra.co.id', password: 'password123', remember: true });
                        }}
                        className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-left border border-amber-200 transition"
                    >
                        <strong className="block">📱 Vendor Lapangan</strong>
                        <span className="text-[11px] text-amber-600">vendor@mitra.co.id</span>
                    </button>
                </div>
            </div>
        </GuestLayout>
    );
}
