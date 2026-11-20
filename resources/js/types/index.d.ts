export interface User {
    id: string;
    name: string;
    email: string;
    role_id: 'DIRECTOR_SSI' | 'ADMIN_SSI' | 'VGREEN_REP' | 'FIELD_VENDOR' | 'CONSTRUCTION_TEAM';
    role?: {
        id: string;
        name: string;
        description?: string;
    };
    organization?: string;
    phone_number?: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    pendingInspectionCount?: number;
    googleMapsApiKey?: string;
};
