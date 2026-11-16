import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import SidebarNav from '@/Components/Navigation/SidebarNav';
import SidebarTrigger from '@/Components/Navigation/SidebarTrigger';
import UserDropdown from '@/Components/Navigation/UserDropdown';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;

    return (
        <div className="flex h-screen w-screen bg-[#F7F9FC] text-slate-800 font-sans overflow-hidden antialiased">
            {/* Unified Sinao Sidebar Navigation */}
            <SidebarNav user={user} activeNav="settings" />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-20 px-8 flex items-center justify-between shrink-0 bg-transparent z-10 border-b border-[#EDF1F7]">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        {header}
                    </div>
                    <div className="flex items-center gap-4">
                        <UserDropdown user={user} />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-8 py-8 space-y-7">
                    {children}
                </main>
            </div>
        </div>
    );
}
