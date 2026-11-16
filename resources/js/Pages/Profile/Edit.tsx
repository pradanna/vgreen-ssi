import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Settings, User, Lock, Trash2 } from 'lucide-react';

export default function Edit({
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Pengaturan Akun & Keamanan
                    </h1>
                </div>
            }
        >
            <Head title="Pengaturan Akun - V-Green SSI" />

            <div className="max-w-4xl mx-auto space-y-7">
                {/* Profile Information Card */}
                <div className="bg-white rounded-3xl p-7 border border-[#EDF1F7] shadow-card">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#EDF1F7]">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <User className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">
                            Informasi Profil Pengguna
                        </h2>
                    </div>
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                {/* Password Update Card */}
                <div className="bg-white rounded-3xl p-7 border border-[#EDF1F7] shadow-card">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#EDF1F7]">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Lock className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">
                            Perbarui Kata Sandi
                        </h2>
                    </div>
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                {/* Delete Account Card */}
                <div className="bg-white rounded-3xl p-7 border border-[#EDF1F7] shadow-card">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#EDF1F7]">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">
                            Hapus Akun
                        </h2>
                    </div>
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
