export type FacilityTypeId = 'EVCS' | 'BSS' | 'COMBINED';
export type StationStatusId = 'OPERATIONAL' | 'CONSTRUCTION' | 'SURVEYED' | 'ON_HOLD';
export type ApprovalStatusId = 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
export type UserRoleId = 'DIRECTOR_SSI' | 'ADMIN_SSI' | 'VGREEN_REP' | 'FIELD_VENDOR' | 'CONSTRUCTION_TEAM';

export interface FacilityType {
    id: FacilityTypeId;
    name: string;
    icon_name: string;
    description?: string;
}

export interface StationStatus {
    id: StationStatusId;
    name: string;
    color_code: string;
    step_order: number;
}

export interface PhotoItem {
    id?: number;
    slot_id: string;
    slot_label: string;
    category: 'LAHAN' | 'MESIN' | 'PANEL_TIANG';
    angle?: string;
    photo_url: string;
    latitude?: number;
    longitude?: number;
    taken_at?: string;
    is_approved?: boolean;
    reviewer_notes?: string;
}

export interface InspectionData {
    id: number;
    stage: string;
    approval_status_id: ApprovalStatusId;
    approval_status_name?: string;
    submitted_by_name?: string;
    submitted_at?: string;
    reviewed_at?: string;
    notes?: string;
    rejection_reason?: string;
    photos: PhotoItem[];
}

export interface Station {
    id: number;
    code: string;
    name: string;
    facility_type_id: FacilityTypeId;
    facility_type: FacilityType;
    status_id: StationStatusId;
    status: StationStatus;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    province: string;
    postal_code?: string;
    power_capacity_kw?: number;
    socket_types?: string;
    slot_count: number;
    operational_hours: string;
    amenities: string[];
    
    // Dates
    survey_date?: string;
    construction_start_date?: string;
    target_completion_date?: string;
    commissioning_date?: string;

    // V-Green specific fields
    is_verified?: boolean;
    verified_photos?: PhotoItem[];

    // Internal SSI specific fields
    vendor_name?: string;
    pln_meter_id?: string;
    internal_notes?: string;
    latest_inspection?: InspectionData | null;
}

export interface StatsSummary {
    total: number;
    operational: number;
    construction: number;
    surveyed: number;
    on_hold: number;
    evcs: number;
    bss: number;
    combined: number;
}
