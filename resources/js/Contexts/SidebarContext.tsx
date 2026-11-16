import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'vgreen_sidebar_collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'true';
        }
        return false;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, String(isCollapsed));
        }
    }, [isCollapsed]);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => !prev);
    };

    const setCollapsed = (collapsed: boolean) => {
        setIsCollapsed(collapsed);
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar, setCollapsed }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar(): SidebarContextType {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
