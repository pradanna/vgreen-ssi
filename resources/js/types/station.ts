export type FacilityTypeId = 'EVCS' | 'BSS' | 'COMBINED';
export type StationStatusId = 'OPERATIONAL' | 'CONSTRUCTION' | 'SURVEYED' | 'ON_HOLD';
export type ApprovalStatusId = 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_REQUIRED';
export type UserRoleId = 'DIRECTOR_SSI' | 'ADMIN_SSI' | 'VGREEN_REP' | 'FIELD_VENDOR' | 'CONSTRUCTION_TEAM';
export type LandlordType = 'SWASTA' | 'PEMERINTAH';
export type DocumentCategory = 'SWASTA' | 'PEMERINTAH' | 'VENDOR';

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
    id?: string;
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
    id: string;
    stage: string;
    approval_status_id: ApprovalStatusId;
    approval_status_name?: string;
    submitted_by_name?: string;
    submitted_at?: string;
    reviewed_by_name?: string;
    reviewed_at?: string;
    notes?: string;
    rejection_reason?: string;
    photos: PhotoItem[];
}

export interface MachineCategory {
    id: string;
    code: string; // EVCS, BSS
    name: string;
    description?: string;
    machines_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface MasterMachine {
    id: string;
    category_id: string;
    category?: MachineCategory;
    code: string;
    name: string;
    brand: string;
    model_series?: string;
    power_capacity_kw: number;
    socket_types?: string;
    slot_or_gun_count: number;
    dimensions?: string;
    weight?: string;
    cable_length?: string;
    input_voltage?: string;
    input_current?: string;
    output_voltage?: string;
    output_current?: string;
    description?: string;
    is_active: boolean;
    station_machines_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface StationMachine {
    id?: string;
    station_id?: string;
    machine_id?: string;
    machine?: MasterMachine;
    name: string;
    brand?: string;
    model_series?: string;
    serial_number?: string;
    facility_type_id: FacilityTypeId;
    facility_type_name?: string;
    power_capacity_kw: number;
    socket_types?: string;
    slot_or_gun_count: number;
    status: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
    installed_at?: string;
    notes?: string;
}

export interface StationDocument {
    id: string;
    category: DocumentCategory;
    document_type: string;
    title: string;
    file_name?: string;
    file_path?: string;
    file_size?: number;
    file_size_formatted?: string;
    uploaded_at?: string;
    uploaded_by_name?: string;
    notes?: string;
}

export interface DocumentCompliance {
    landlord_type: LandlordType;
    total_required: number;
    total_uploaded: number;
    percentage: number;
    is_complete: boolean;
    status: 'COMPLETE' | 'INCOMPLETE' | 'PENDING_UPLOAD';
    fulfilled_types: string[];
    missing_types: string[];
    missing_details: { type: string; label: string }[];
}

export interface Station {
    id: string;
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
    
    // Dates & Landlord
    survey_date?: string;
    construction_start_date?: string;
    target_completion_date?: string;
    commissioning_date?: string;
    lease_end_date?: string;
    vgreen_contract_end_date?: string;
    landlord_type?: LandlordType;
    ownership_type?: 'SWASTA' | 'NEGERI_BUMN';
    landlord_name?: string;
    landlord_phone?: string;

    // Dual Contract Periods
    contract_vgreen_start_date?: string;
    contract_vgreen_end_date?: string;
    contract_vgreen_doc_number?: string;
    contract_landlord_start_date?: string;
    contract_landlord_end_date?: string;
    contract_landlord_doc_number?: string;

    // Multi-Machines & Legal Documents
    machines?: StationMachine[];
    documents?: StationDocument[];
    document_compliance?: DocumentCompliance;

    // V-Green specific fields
    is_verified?: boolean;
    verified_photos?: PhotoItem[];

    // Internal SSI specific fields
    vendor_name?: string;
    pln_meter_id?: string;
    internal_notes?: string;
    latest_inspection?: InspectionData | null;
    inspections_history?: InspectionData[];
}

export interface ExpiringLeaseItem {
    id: string;
    code: string;
    name: string;
    city?: string;
    lease_end_date: string;
    landlord_name?: string;
    days_remaining: number;
}

export interface MonthlyRolloutPoint {
    month: string;
    monthKey: string;
    planned: number;
    actual: number | null;
    isCurrent?: boolean;
}

export interface StatsSummary {
    total: number;
    national_target?: number;
    national_target_evcs?: number;
    national_target_bss?: number;
    operational: number;
    construction: number;
    construction_evcs?: number;
    construction_bss?: number;
    construction_combined?: number;
    operational_evcs?: number;
    operational_bss?: number;
    operational_combined?: number;
    surveyed: number;
    on_hold: number;
    evcs: number;
    bss: number;
    combined: number;
    total_machines?: number;
    total_slots?: number;
    total_power_kw?: number;
    live_machines?: number;
    live_slots?: number;
    live_power_kw?: number;
    complete_compliance_count?: number;
    live_compliance_count?: number;
    pending_inspections_count?: number;
    vgreen_expiring_count?: number;
    landlord_expiring_count?: number;
    total_expiring_contracts?: number;
    expiring_leases_count?: number;
    expiring_leases?: ExpiringLeaseItem[];
    monthly_rollout?: MonthlyRolloutPoint[];
}

export interface ProvinceTargetItem {
    id: string;
    province_name: string;
    region: string;
    year: number;
    target_evcs: number;
    target_bss: number;
    target_total: number;
    actual_live?: number;
    actual_evcs?: number;
    actual_bss?: number;
    in_construction?: number;
    percentage?: number;
    notes?: string;
    updated_at?: string;
    updated_at_raw?: string;
}

export interface TargetSummary {
    total_target_national: number;
    total_target_evcs: number;
    total_target_bss: number;
    total_provinces: number;
    total_actual_live: number;
    total_in_construction: number;
    national_progress_percentage: number;
    selected_year: number;
}

export type ActivityModule = 'STATION' | 'DOCUMENT' | 'INSPECTION' | 'TARGET' | 'MASTER_DATA' | 'AUTH';

export interface ActivityLogItem {
    id: string;
    user_id?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        role_id: string;
    };
    module: ActivityModule;
    action: string;
    subject_type?: string;
    subject_id?: string;
    subject_name?: string;
    description: string;
    properties?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    updated_at: string;
}

export interface ActivityLogStats {
    total_today: number;
    stations_count: number;
    documents_count: number;
    inspections_count: number;
    total_all: number;
}
