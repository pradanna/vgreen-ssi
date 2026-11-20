<?php

namespace Tests\Feature;

use App\Models\ApprovalStatus;
use App\Models\FacilityType;
use App\Models\InspectionPhoto;
use App\Models\InspectionReport;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationDocument;
use App\Models\StationStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class StationManagementAndApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $vgreen;
    protected User $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $this->admin = User::where('role_id', Role::ADMIN_SSI)->first();
        $this->vgreen = User::where('role_id', Role::VGREEN_REP)->first();
        $this->vendor = User::where('role_id', Role::FIELD_VENDOR)->first();
    }

    /**
     * Milestone 2 & 4: Dashboard returns role-projected stations.
     */
    public function test_vgreen_user_can_view_all_stations_with_masked_landlord(): void
    {
        $response = $this->actingAs($this->vgreen)->get(route('stations.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Dashboard')
                ->has('stations.data')
                ->where('stations.data.0.contract_vgreen_doc_number', fn($val) => !empty($val))
        );

        $gisResponse = $this->actingAs($this->vgreen)->get(route('gis.index'));
        $gisResponse->assertOk();
        $gisResponse->assertInertia(fn ($page) =>
            $page->component('Gis/Index')
                ->has('stations')
                ->where('stations', function ($stations) {
                    $statuses = collect($stations)->pluck('status_id')->unique()->all();
                    return in_array(StationStatus::OPERATIONAL, $statuses)
                        && in_array(StationStatus::CONSTRUCTION, $statuses);
                })
        );
    }

    /**
     * Test navigation sidebar routes render successfully.
     */
    public function test_sidebar_navigation_routes_are_accessible(): void
    {
        // Stations index
        $this->actingAs($this->admin)->get(route('stations.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard')->where('activeNav', 'stations'));

        // GIS map index
        $this->actingAs($this->admin)->get(route('gis.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Gis/Index'));

        // Inspections QC index
        $this->actingAs($this->admin)->get(route('inspections.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Inspections/Index')->where('activeNav', 'inspections'));
    }

    /**
     * Milestone 4: Director or Admin SSI can approve an inspection report.
     */
    public function test_admin_can_approve_inspection_report_and_publish_station(): void
    {
        $station = Station::where('status_id', '!=', StationStatus::OPERATIONAL)->first();
        if (!$station) {
            $station = Station::first();
        }

        $report = InspectionReport::create([
            'station_id' => $station->id,
            'submitted_by' => $this->vendor->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => 'COMMISSIONING',
            'submitted_at' => now(),
        ]);

        $photo = InspectionPhoto::create([
            'report_id' => $report->id,
            'checklist_slot_id' => 'MESIN_DEPAN',
            'photo_url' => 'https://example.com/test.jpg',
            'is_approved' => false,
        ]);

        $response = $this->actingAs($this->admin)->post(
            route('stations.inspections.review', ['station' => $station->id, 'report' => $report->id]),
            [
                'action' => 'APPROVE',
                'notes' => 'Disetujui untuk go-live publik.',
            ]
        );

        $response->assertRedirect();
        
        $this->assertDatabaseHas('inspection_reports', [
            'id' => $report->id,
            'approval_status_id' => ApprovalStatus::APPROVED,
            'reviewed_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('inspection_photos', [
            'id' => $photo->id,
            'is_approved' => true,
        ]);

        $this->assertDatabaseHas('stations', [
            'id' => $station->id,
            'status_id' => StationStatus::OPERATIONAL,
        ]);
    }

    /**
     * Milestone 4: Admin rejection sets status to ON_HOLD and records rejection notes.
     */
    public function test_admin_can_reject_inspection_and_request_revision(): void
    {
        $station = Station::first();

        $report = InspectionReport::create([
            'station_id' => $station->id,
            'submitted_by' => $this->vendor->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => 'CONSTRUCTION_PROGRESS',
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->post(
            route('stations.inspections.review', ['station' => $station->id, 'report' => $report->id]),
            [
                'action' => 'REJECT',
                'notes' => 'Grounding kabel belum memenuhi standar keselamatan.',
            ]
        );

        $response->assertRedirect();

        $this->assertDatabaseHas('inspection_reports', [
            'id' => $report->id,
            'approval_status_id' => ApprovalStatus::REVISION_REQUIRED,
            'rejection_reason' => 'Grounding kabel belum memenuhi standar keselamatan.',
        ]);

        $this->assertDatabaseHas('stations', [
            'id' => $station->id,
            'status_id' => StationStatus::ON_HOLD,
        ]);
    }

    /**
     * Milestone 3: Web inspection submission maintains non-destructive history.
     */
    public function test_non_destructive_historical_inspection_submission(): void
    {
        $station = Station::first();
        $initialReportsCount = $station->inspections()->count();

        $response = $this->actingAs($this->admin)->post(
            route('stations.inspections.submit', ['station' => $station->id]),
            [
                'stage' => 'ROUTINE_PERIODIC',
                'notes' => 'Inspeksi berkala 4 bulan berhasil dilakukan.',
                'photos' => [
                    [
                        'checklist_slot_id' => 'MESIN_DEPAN',
                        'photo_url' => 'https://example.com/periodic.jpg',
                        'latitude' => $station->latitude,
                        'longitude' => $station->longitude,
                    ],
                ],
            ]
        );

        $response->assertRedirect();

        $station->refresh();
        $this->assertEquals($initialReportsCount + 1, $station->inspections()->count());
    }

    /**
     * Milestone 5: Admin can create new station with valid coordinates.
     */
    public function test_admin_can_create_new_station(): void
    {
        $uniqueCode = 'VG-TEST-' . rand(1000, 9999);

        $response = $this->actingAs($this->admin)->post(
            route('admin.stations.store'),
            [
                'code' => $uniqueCode,
                'name' => 'V-Green Stasiun Uji Coba Lab',
                'facility_type_id' => FacilityType::EVCS,
                'status_id' => StationStatus::SURVEYED,
                'latitude' => -6.2088,
                'longitude' => 106.8456,
                'address' => 'Jl. Pengujian Otomotif No. 1',
                'city' => 'Jakarta Selatan',
                'province' => 'DKI Jakarta',
                'slot_count' => 4,
                'power_capacity_kw' => 120,
            ]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('stations', ['code' => $uniqueCode]);
    }

    /**
     * Milestone 5: Admin can mass import stations via CSV.
     */
    public function test_admin_mass_import_stations_csv(): void
    {
        $uniqueCode = 'VG-IMP-' . rand(1000, 9999);
        $csvContent = "code,name,facility_type_id,status_id,latitude,longitude,address,city,province,power_capacity_kw,slot_count\n"
                    . "{$uniqueCode},V-Green Import Test,EVCS,SURVEYED,-6.2100,106.8400,Jl. Tes Import,Jakarta,DKI Jakarta,60,2";

        $file = UploadedFile::fake()->createWithContent('import.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post(
            route('admin.stations.import'),
            ['file' => $file]
        );

        $response->assertRedirect();
        $this->assertDatabaseHas('stations', ['code' => $uniqueCode]);
    }

    /**
     * Milestone 5: Admin export data endpoint returns streamed CSV.
     */
    public function test_admin_export_data_returns_streamed_csv(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.stations.export'));

        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('content-type'), 'text/csv'));
    }

    /**
     * Titik Stasiun: Auto generate code based on city name.
     */
    public function test_auto_code_generation_endpoint(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.stations.generate-code', ['city' => 'Bandung']));

        $response->assertOk();
        $response->assertJsonStructure(['code']);
        $code = $response->json('code');
        $this->assertStringStartsWith('VG-BDG-', $code);
        $this->assertMatchesRegularExpression('/^VG-BDG-\d{5}$/', $code);
    }

    /**
     * Titik Stasiun: Admin can create station with multi machines and dual contracts.
     */
    public function test_admin_can_create_station_with_multi_machines_and_contracts(): void
    {
        $response = $this->actingAs($this->admin)->post(
            route('admin.stations.store'),
            [
                'city' => 'Surabaya',
                'name' => 'V-Green Gubeng Multi Machine Hub',
                'facility_type_id' => FacilityType::COMBINED,
                'status_id' => StationStatus::CONSTRUCTION,
                'latitude' => -7.2655,
                'longitude' => 112.7512,
                'address' => 'Jl. Stasiun Gubeng No. 1',
                'province' => 'Jawa Timur',
                'landlord_name' => 'PT Kereta Api Indonesia (Persero)',
                'landlord_phone' => '0315031234',
                'landlord_type' => 'PEMERINTAH',
                'contract_vgreen_start_date' => '2025-01-01',
                'contract_vgreen_end_date' => '2030-01-01',
                'contract_vgreen_doc_number' => 'VG-SSI-2025-001',
                'contract_landlord_start_date' => '2025-01-01',
                'contract_landlord_end_date' => '2030-01-01',
                'contract_landlord_doc_number' => 'SSI-KAI-2025-089',
                'machines' => [
                    [
                        'name' => 'EVCS Fast Charger 120kW',
                        'facility_type_id' => FacilityType::EVCS,
                        'power_capacity_kw' => 120,
                        'slot_or_gun_count' => 2,
                        'serial_number' => 'FC-SUR-001',
                        'status' => 'OPERATIONAL',
                    ],
                    [
                        'name' => 'BSS 12-Slot Swapper',
                        'facility_type_id' => FacilityType::BSS,
                        'power_capacity_kw' => 30,
                        'slot_or_gun_count' => 12,
                        'serial_number' => 'BSS-SUR-002',
                        'status' => 'OPERATIONAL',
                    ],
                ],
            ]
        );

        $response->assertRedirect();
        
        $this->assertDatabaseHas('stations', [
            'name' => 'V-Green Gubeng Multi Machine Hub',
            'landlord_name' => 'PT Kereta Api Indonesia (Persero)',
            'landlord_type' => 'PEMERINTAH',
        ]);

        $createdStation = Station::where('name', 'V-Green Gubeng Multi Machine Hub')->first();
        $this->assertNotNull($createdStation);
        $this->assertStringStartsWith('VG-SBY-', $createdStation->code);
        $this->assertCount(2, $createdStation->machines);
        $this->assertEquals(150, $createdStation->power_capacity_kw);
        $this->assertEquals(14, $createdStation->slot_count);
    }

    /**
     * Titik Stasiun: Document compliance calculation and upload.
     */
    public function test_document_compliance_and_upload(): void
    {
        $station = Station::where('landlord_type', 'PEMERINTAH')->first();
        if (!$station) {
            $station = Station::first();
            $station->update(['landlord_type' => 'PEMERINTAH']);
        }

        $compliance = $station->document_compliance;
        $this->assertNotNull($compliance);
        $this->assertEquals('PEMERINTAH', $compliance['landlord_type']);
        $this->assertEquals(3, $compliance['total_required']); // SK, MOU, BUKTI_BAYAR

        // Test document upload
        $fakePdf = UploadedFile::fake()->create('sk_penunjukan.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->admin)->post(
            route('admin.stations.documents.upload', ['station' => $station->id]),
            [
                'category' => 'PEMERINTAH',
                'document_type' => 'SK',
                'title' => 'Surat Keputusan Walikota',
                'notes' => 'SK Izin Pemanfaatan Lahan Publik',
                'file' => $fakePdf,
            ]
        );

        $response->assertRedirect();

        $this->assertDatabaseHas('station_documents', [
            'station_id' => $station->id,
            'category' => 'PEMERINTAH',
            'document_type' => 'SK',
            'title' => 'Surat Keputusan Walikota',
        ]);
    }

    /**
     * Security: V-Green Representative cannot access confidential landlord documents or contracts.
     */
    public function test_vgreen_user_cannot_see_confidential_landlord_documents_or_contracts(): void
    {
        $response = $this->actingAs($this->vgreen)->get(route('stations.index'));

        $response->assertOk();
        $response->assertInertia(function ($page) {
            $stationsProp = $page->toArray()['props']['stations'];
            $station = $stationsProp['data'][0] ?? $stationsProp[0] ?? null;
            $this->assertNotNull($station);
            // Must NOT contain sensitive landlord/contract/document details
            $this->assertArrayNotHasKey('documents', $station);
            $this->assertArrayNotHasKey('document_compliance', $station);
            $this->assertArrayNotHasKey('landlord_phone', $station);
            $this->assertArrayNotHasKey('contract_landlord_start_date', $station);
            $this->assertArrayNotHasKey('contract_landlord_end_date', $station);
            $this->assertArrayNotHasKey('contract_landlord_doc_number', $station);
            $this->assertArrayNotHasKey('lease_end_date', $station);
            $this->assertArrayNotHasKey('landlord_name', $station);
            // Must contain V-Green & PT SSI contract details
            $this->assertArrayHasKey('contract_vgreen_doc_number', $station);
        });

        // V-Green cannot access internal QC & verification module (HTTP 403)
        $inspectionsRes = $this->actingAs($this->vgreen)->get(route('inspections.index'));
        $inspectionsRes->assertForbidden();
    }

    /**
     * On-Demand Lazy Loading: Fetch station photos and documents endpoints.
     */
    public function test_lazy_load_photos_and_documents_endpoints(): void
    {
        $station = Station::where('status_id', StationStatus::OPERATIONAL)->first();

        // 1. Admin can fetch photos
        $photosRes = $this->actingAs($this->admin)->getJson(route('stations.photos', $station));
        $photosRes->assertOk();
        $photosRes->assertJsonStructure(['latest_inspection', 'inspections_history']);

        // 2. Admin can fetch documents
        $docsRes = $this->actingAs($this->admin)->getJson(route('stations.documents', $station));
        $docsRes->assertOk();
        $docsRes->assertJsonStructure(['documents', 'document_compliance']);

        // 3. V-Green cannot fetch documents (403 Forbidden)
        $vgreenDocsRes = $this->actingAs($this->vgreen)->getJson(route('stations.documents', $station));
        $vgreenDocsRes->assertForbidden();

        // 4. V-Green can fetch verified photos for operational station
        $vgreenPhotosRes = $this->actingAs($this->vgreen)->getJson(route('stations.photos', $station));
        $vgreenPhotosRes->assertOk();
        $vgreenPhotosRes->assertJsonStructure(['verified_photos']);
    }

    /**
     * Shared Hosting & Zero Symlink: Verify documents are served via route streaming.
     */
    public function test_document_served_via_route_streaming_without_symlink(): void
    {
        $station = Station::where('status_id', StationStatus::OPERATIONAL)->first();
        $document = StationDocument::where('station_id', $station->id)->first();

        if (!$document) {
            $document = StationDocument::create([
                'station_id' => $station->id,
                'category' => 'SWASTA',
                'document_type' => 'KTP',
                'title' => 'KTP Pemilik Lahan',
                'file_name' => 'ktp.pdf',
                'file_path' => "documents/stations/{$station->code}/ktp.pdf",
                'uploaded_by' => $this->admin->id,
            ]);
        }

        // 1. Admin can view document via route (HTTP 200, application/pdf)
        $res = $this->actingAs($this->admin)->get(route('stations.documents.file', [$station, $document]));
        $res->assertOk();
        $res->assertHeader('Content-Type', 'application/pdf');

        // 2. V-Green cannot view confidential landlord document (HTTP 403)
        $vgRes = $this->actingAs($this->vgreen)->get(route('stations.documents.file', [$station, $document]));
        $vgRes->assertForbidden();

        // 3. Fallback direct /storage/ bridge serves file without symlink
        $storageRes = $this->actingAs($this->admin)->get("/storage/{$document->file_path}");
        $storageRes->assertOk();
        $storageRes->assertHeader('Content-Type', 'application/pdf');
    }

    /**
     * GIS Map: Verify masterMachines are provided and station machines include machine_id for filtering.
     */
    public function test_gis_page_provides_master_machines_and_machine_id_mapping(): void
    {
        $response = $this->actingAs($this->admin)->get(route('gis.index'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Gis/Index')
            ->has('masterMachines')
            ->where('masterMachines', fn ($machines) => count($machines) > 0)
            ->has('stations')
        );

        $stations = $response->viewData('page')['props']['stations'];
        $firstWithMachines = collect($stations)->first(fn ($s) => !empty($s['machines']));
        $this->assertNotNull($firstWithMachines);
        $this->assertArrayHasKey('machine_id', $firstWithMachines['machines'][0]);
    }

    /**
     * Geolocation & POI Search: Verify /geo/search endpoint returns location candidates.
     */
    public function test_geo_search_endpoint_returns_location_candidates(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Http::fake([
            '*google.com/*' => \Illuminate\Support\Facades\Http::response([], 200),
            'nominatim.openstreetmap.org/*' => \Illuminate\Support\Facades\Http::response([
                [
                    'place_id' => 12345,
                    'name' => 'RSU Indriati Solo Baru',
                    'display_name' => 'RSU Indriati Solo Baru, Jalan Jeruk, Grogol, Sukoharjo, Jawa Tengah',
                    'lat' => '-7.6113715',
                    'lon' => '110.8085877',
                    'type' => 'hospital',
                    'class' => 'amenity',
                    'address' => [
                        'amenity' => 'RSU Indriati Solo Baru',
                        'road' => 'Jalan Jeruk',
                        'county' => 'Sukoharjo',
                        'state' => 'Jawa Tengah',
                    ],
                ]
            ], 200),
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('geo.search', ['q' => 'indriati solo']));
        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'name' => 'RSU Indriati Solo Baru',
            'type' => 'hospital',
            'city' => 'Sukoharjo',
            'province' => 'Jawa Tengah',
        ]);
    }

    /**
     * Geolocation & POI Search: Verify Indonesian typo normalization (e.g. patimura -> pattimura).
     */
    public function test_geo_search_endpoint_normalizes_indonesian_typos(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Http::fake([
            '*google.com/*' => \Illuminate\Support\Facades\Http::response([], 200),
            'nominatim.openstreetmap.org/search?*q=patimura*' => \Illuminate\Support\Facades\Http::response([], 200),
            'nominatim.openstreetmap.org/search?*q=pattimura*' => \Illuminate\Support\Facades\Http::response([
                [
                    'place_id' => 7771,
                    'name' => 'Alfamart',
                    'display_name' => 'Alfamart, Jalan Kapten Pattimura, Jambi, Indonesia',
                    'lat' => '-1.6200712',
                    'lon' => '103.5812599',
                    'type' => 'convenience',
                    'class' => 'shop',
                    'address' => [
                        'shop' => 'Alfamart',
                        'road' => 'Jalan Kapten Pattimura',
                        'city' => 'Jambi',
                        'state' => 'Jambi',
                    ],
                ]
            ], 200),
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('geo.search', ['q' => 'patimura alfamart']));
        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'name' => 'Alfamart',
            'city' => 'Jambi',
        ]);
    }

    /**
     * Geolocation & POI Search: Verify fallback to Photon fuzzy geocoder when Nominatim is empty.
     */
    public function test_geo_search_endpoint_falls_back_to_photon_fuzzy_search(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Http::fake([
            '*google.com/*' => \Illuminate\Support\Facades\Http::response([], 200),
            'nominatim.openstreetmap.org/*' => \Illuminate\Support\Facades\Http::response([], 200),
            'photon.komoot.io/*' => \Illuminate\Support\Facades\Http::response([
                'features' => [
                    [
                        'properties' => [
                            'osm_id' => 999123,
                            'name' => 'Alfamart Pattimura',
                            'street' => 'Jalan Kapten Pattimura',
                            'city' => 'Surakarta',
                            'state' => 'Jawa Tengah',
                            'country' => 'Indonesia',
                            'countrycode' => 'ID',
                            'osm_key' => 'shop',
                            'osm_value' => 'convenience',
                        ],
                        'geometry' => [
                            'type' => 'Point',
                            'coordinates' => [110.8119, -7.5830],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('geo.search', ['q' => 'patimura alfamart', 'city' => 'Surakarta']));
        $response->assertOk();
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'name' => 'Alfamart Pattimura',
            'city' => 'Surakarta',
            'province' => 'Jawa Tengah',
        ]);
    }

    /**
     * Geolocation & POI Search: Verify Google Maps Place Search matching businesses seen on map tiles.
     */
    public function test_geo_search_endpoint_matches_google_places(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Http::fake([
            '*google.com/*' => \Illuminate\Support\Facades\Http::response(
                ")]}'\n" . json_encode([
                    [
                        'alfamart patimura solo',
                        [
                            [
                                14 => [
                                    9 => [null, null, -7.5862429, 110.8157058],
                                    11 => 'Alfamart Patimura Solo',
                                    13 => ['Minimarket'],
                                    18 => 'Alfamart Patimura Solo, Jl. Patimura Kel No.100, RT.03/RW.04, Serengan, Surakarta City, Central Java 57155',
                                    2 => ['Jl. Patimura Kel No.100', 'Serengan', 'Surakarta City', 'Central Java 57155'],
                                ]
                            ]
                        ]
                    ]
                ]),
                200
            ),
            'nominatim.openstreetmap.org/*' => \Illuminate\Support\Facades\Http::response([], 200),
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('geo.search', ['q' => 'alfamart patimura solo']));
        $response->assertOk();
        $response->assertJsonFragment([
            'name' => 'Alfamart Patimura Solo',
            'lat' => -7.5862429,
            'lon' => 110.8157058,
        ]);
    }

    /**
     * Geolocation & Reverse Geocoding: Verify /geo/reverse endpoint returns address, city, province, and postcode.
     */
    public function test_geo_reverse_endpoint_returns_address_details(): void
    {
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Http::fake([
            'nominatim.openstreetmap.org/reverse*' => \Illuminate\Support\Facades\Http::response([
                'display_name' => 'Jalan Kapten Pattimura, Serengan, Surakarta, Kecamatan Serengan, Jawa Tengah, 57156, Indonesia',
                'address' => [
                    'road' => 'Jalan Kapten Pattimura',
                    'village' => 'Serengan',
                    'city' => 'Surakarta',
                    'municipality' => 'Kecamatan Serengan',
                    'state' => 'Jawa Tengah',
                    'postcode' => '57156',
                    'country' => 'Indonesia',
                ],
            ], 200),
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('geo.reverse', [
            'lat' => -7.5864254,
            'lon' => 110.8158706,
        ]));

        $response->assertOk();
        $response->assertJsonFragment([
            'road' => 'Jalan Kapten Pattimura',
            'city' => 'Surakarta',
            'province' => 'Jawa Tengah',
            'postal_code' => '57156',
        ]);
    }
}
