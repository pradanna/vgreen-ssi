<?php

namespace Tests\Feature;

use App\Models\ApprovalStatus;
use App\Models\ChecklistSlot;
use App\Models\InspectionReport;
use App\Models\Role;
use App\Models\Station;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class MobileRestApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $surveyor;
    protected Station $station;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $this->surveyor = User::where('role_id', Role::FIELD_VENDOR)->first();
        $this->station = Station::first();
    }

    /**
     * Milestone 6: Mobile login returns Sanctum bearer token.
     */
    public function test_surveyor_can_authenticate_via_api(): void
    {
        $response = $this->postJson(route('api.v1.auth.login'), [
            'email' => $this->surveyor->email,
            'password' => 'password123',
            'device_name' => 'Surveyor Tablet Test',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'token_type',
                    'user' => ['id', 'name', 'email', 'role_id'],
                ],
            ]);

        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('data.token'));
    }

    /**
     * Milestone 6: Retrieve checklist slots reference.
     */
    public function test_can_fetch_standardized_checklist_slots(): void
    {
        $response = $this->getJson(route('api.v1.checklist-slots'));

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'slots' => [
                        '*' => ['id', 'category', 'label', 'angle', 'is_required'],
                    ],
                ],
            ]);

        $this->assertGreaterThanOrEqual(7, count($response->json('data.slots')));
    }

    /**
     * Milestone 6: Authenticated surveyor can view assignments.
     */
    public function test_authenticated_surveyor_can_fetch_assignments(): void
    {
        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->getJson(route('api.v1.assignments'));

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'total',
                    'assignments' => [
                        '*' => ['id', 'code', 'name', 'facility_type', 'status', 'coordinates'],
                    ],
                ],
            ]);
    }

    /**
     * Milestone 6: Submit inspection report with 7 photo slots from mobile.
     */
    public function test_surveyor_can_submit_inspection_via_api(): void
    {
        $file = UploadedFile::fake()->image('depan.jpg', 800, 600);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->postJson(route('api.v1.stations.inspections.store', ['station' => $this->station->id]), [
                'stage' => 'CONSTRUCTION_PROGRESS',
                'notes' => 'Pemasangan kanopi dan pengelasan tiang selesai.',
                'photo_LAHAN_DEPAN' => $file,
                'lat_LAHAN_DEPAN' => -6.2255,
                'lng_LAHAN_DEPAN' => 106.8095,
            ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'report_id',
                    'station_code',
                    'stage',
                    'approval_status',
                    'photos_count',
                ],
            ]);

        $this->assertEquals(ApprovalStatus::PENDING_REVIEW, $response->json('data.approval_status'));
    }

    /**
     * Milestone 6: Check inspection report status.
     */
    public function test_can_query_inspection_status(): void
    {
        $report = InspectionReport::create([
            'station_id' => $this->station->id,
            'submitted_by' => $this->surveyor->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => 'INITIAL_SURVEY',
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->getJson(route('api.v1.inspections.status', ['report' => $report->id]));

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'report_id',
                    'station' => ['id', 'code', 'name'],
                    'stage',
                    'approval_status' => ['id', 'name'],
                ],
            ]);

        $this->assertEquals($report->id, $response->json('data.report_id'));
    }

    /**
     * Vendor can fetch specific station details including machines and specs before audit.
     */
    public function test_vendor_can_fetch_station_details_with_machines(): void
    {
        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->getJson(route('api.v1.stations.show', ['station' => $this->station->id]));

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'station' => [
                        'id',
                        'code',
                        'name',
                        'facility_type',
                        'status',
                        'coordinates' => ['latitude', 'longitude'],
                        'address',
                        'city',
                        'province',
                        'machines',
                    ],
                ],
            ]);

        $this->assertEquals($this->station->id, $response->json('data.station.id'));
    }

    /**
     * Vendor can submit complete inspection with condition assessment and coordinates per photo.
     */
    public function test_vendor_can_submit_inspection_with_condition_assessment_and_photo_coordinates(): void
    {
        $file1 = UploadedFile::fake()->image('depan.jpg', 800, 600);
        $file2 = UploadedFile::fake()->image('mesin.jpg', 800, 600);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->postJson(route('api.v1.stations.inspections.store', ['station' => $this->station->id]), [
                'stage' => 'ROUTINE_PERIODIC',
                'overall_condition' => 'BAIK',
                'physical_condition' => 'Lahan bersih, kanopi terpasang aman, penerangan malam hari memadai.',
                'electrical_condition' => 'Tegangan stabil 380V, PLN meter aktif, grounding < 2 ohm.',
                'issues_found' => [
                    'Stiker petunjuk pemakaian sedikit memudar',
                ],
                'machine_conditions' => [
                    [
                        'machine_id' => 1,
                        'status' => 'OPERATIONAL',
                        'notes' => 'Gun charger CCS2 berfungsi normal',
                    ],
                ],
                'latitude' => $this->station->latitude,
                'longitude' => $this->station->longitude,
                'notes' => 'Pemeriksaan berkala selesai, kondisi siap pakai.',
                'photo_LAHAN_DEPAN' => $file1,
                'lat_LAHAN_DEPAN' => $this->station->latitude,
                'lng_LAHAN_DEPAN' => $this->station->longitude,
                'photo_MESIN_DEPAN' => $file2,
                'lat_MESIN_DEPAN' => $this->station->latitude,
                'lng_MESIN_DEPAN' => $this->station->longitude,
            ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'report_id',
                    'station_code',
                    'stage',
                    'overall_condition',
                    'distance_meters',
                    'approval_status',
                    'photos_count',
                ],
            ]);

        $reportId = $response->json('data.report_id');
        $report = InspectionReport::with('photos')->find($reportId);

        $this->assertNotNull($report);
        $this->assertEquals('BAIK', $report->overall_condition);
        $this->assertEquals('ROUTINE_PERIODIC', $report->stage);
        $this->assertNotNull($report->physical_condition);
        $this->assertNotNull($report->electrical_condition);
        $this->assertContains('Stiker petunjuk pemakaian sedikit memudar', $report->issues_found);

        // Verify photo coordinates and distance audit
        $lahanPhoto = $report->photos->where('checklist_slot_id', 'LAHAN_DEPAN')->first();
        $this->assertNotNull($lahanPhoto);
        $this->assertEquals((float) $this->station->latitude, $lahanPhoto->latitude);
        $this->assertEquals((float) $this->station->longitude, $lahanPhoto->longitude);
        $this->assertNotNull($lahanPhoto->distance_meters);
    }

    /**
     * Vendor can fetch inspection history and filter by status.
     */
    public function test_vendor_can_fetch_inspection_history(): void
    {
        InspectionReport::create([
            'station_id' => $this->station->id,
            'submitted_by' => $this->surveyor->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => 'INITIAL_SURVEY',
            'overall_condition' => 'BAIK',
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->getJson(route('api.v1.inspections.history'));

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'total',
                    'reports' => [
                        '*' => [
                            'id',
                            'station' => ['id', 'code', 'name', 'city', 'province'],
                            'stage',
                            'overall_condition',
                            'approval_status' => ['id', 'name'],
                            'photos_count',
                            'submitted_at',
                        ],
                    ],
                ],
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('data.total'));
    }

    /**
     * Vendor can fetch detailed inspection report with condition and photos.
     */
    public function test_vendor_can_fetch_detailed_inspection_report_with_conditions(): void
    {
        $report = InspectionReport::create([
            'station_id' => $this->station->id,
            'submitted_by' => $this->surveyor->id,
            'approval_status_id' => ApprovalStatus::PENDING_REVIEW,
            'stage' => 'CONSTRUCTION_PROGRESS',
            'overall_condition' => 'CUKUP',
            'physical_condition' => 'Pengecoran selesai, tinggal pengecatan marka.',
            'electrical_condition' => 'Kabel ducting terpasang.',
            'issues_found' => ['Perlu perapian sampah sisa kabel'],
            'latitude' => $this->station->latitude,
            'longitude' => $this->station->longitude,
            'distance_meters' => 5.2,
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->getJson(route('api.v1.inspections.show', ['report' => $report->id]));

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'report_id',
                    'station',
                    'stage',
                    'overall_condition',
                    'physical_condition',
                    'electrical_condition',
                    'issues_found',
                    'submission_gps' => ['latitude', 'longitude', 'distance_meters'],
                    'approval_status',
                    'photos',
                ],
            ]);

        $this->assertEquals('CUKUP', $response->json('data.overall_condition'));
        $this->assertEquals('Pengecoran selesai, tinggal pengecatan marka.', $response->json('data.physical_condition'));
    }

    /**
     * Vendor can resubmit revised report and photos when revision required.
     */
    public function test_vendor_can_resubmit_inspection_when_revision_required(): void
    {
        $report = InspectionReport::create([
            'station_id' => $this->station->id,
            'submitted_by' => $this->surveyor->id,
            'approval_status_id' => ApprovalStatus::REVISION_REQUIRED,
            'stage' => 'CONSTRUCTION_PROGRESS',
            'overall_condition' => 'RUSAK_RINGAN',
            'rejection_reason' => 'Foto panel buram dan belum ada MCB cadangan',
            'submitted_at' => now()->subDay(),
        ]);

        $newFile = UploadedFile::fake()->image('panel_rev.jpg', 800, 600);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->postJson(route('api.v1.inspections.resubmit', ['report' => $report->id]), [
                'overall_condition' => 'BAIK',
                'electrical_condition' => 'MCB cadangan sudah dipasang dan diberi label rapi.',
                'notes' => 'Perbaikan panel selesai dan foto ulang terlampir.',
                'photo_PANEL_DEPAN' => $newFile,
                'lat_PANEL_DEPAN' => $this->station->latitude,
                'lng_PANEL_DEPAN' => $this->station->longitude,
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'report_id',
                    'approval_status',
                    'submitted_at',
                ],
            ]);

        $report->refresh();
        $this->assertEquals(ApprovalStatus::PENDING_REVIEW, $report->approval_status_id);
        $this->assertEquals('BAIK', $report->overall_condition);
        $this->assertNull($report->rejection_reason);
    }

    /**
     * Validation errors return clear Indonesian messages for mobile app display.
     */
    public function test_validation_errors_return_clear_indonesian_messages(): void
    {
        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->postJson(route('api.v1.stations.inspections.store', ['station' => $this->station->id]), [
                // missing stage
                'latitude' => 99.0, // out of range
            ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors',
            ]);

        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('Tahapan inspeksi wajib dipilih', $response->json('message'));
        $this->assertArrayHasKey('stage', $response->json('errors'));
        $this->assertArrayHasKey('latitude', $response->json('errors'));
    }

    /**
     * Resubmit fails with clear Indonesian message when report is already approved.
     */
    public function test_resubmit_fails_when_report_already_approved(): void
    {
        $report = InspectionReport::create([
            'station_id' => $this->station->id,
            'submitted_by' => $this->surveyor->id,
            'approval_status_id' => ApprovalStatus::APPROVED,
            'stage' => 'CONSTRUCTION_PROGRESS',
            'overall_condition' => 'BAIK',
            'submitted_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->postJson(route('api.v1.inspections.resubmit', ['report' => $report->id]), [
                'overall_condition' => 'BAIK',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Laporan inspeksi ini sudah disetujui (APPROVED) dan tidak dapat direvisi kembali.',
            ]);
    }

    /**
     * Non-owner vendor cannot resubmit other vendor report.
     */
    public function test_unauthorized_vendor_cannot_resubmit_other_vendor_report(): void
    {
        $otherVendor = User::where('role_id', Role::CONSTRUCTION_TEAM)->first();

        $report = InspectionReport::create([
            'station_id' => $this->station->id,
            'submitted_by' => $otherVendor->id,
            'approval_status_id' => ApprovalStatus::REVISION_REQUIRED,
            'stage' => 'CONSTRUCTION_PROGRESS',
            'submitted_at' => now(),
        ]);

        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->postJson(route('api.v1.inspections.resubmit', ['report' => $report->id]), [
                'overall_condition' => 'BAIK',
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk merevisi laporan ini.',
            ]);
    }

    /**
     * Non-existent station returns standard Indonesian 404 message.
     */
    public function test_not_found_returns_clean_indonesian_message(): void
    {
        $response = $this->actingAs($this->surveyor, 'sanctum')
            ->getJson('/api/v1/stations/999999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Data titik stasiun atau laporan inspeksi tidak ditemukan.',
            ]);
    }

    /**
     * Unauthenticated request returns standard Indonesian 401 message.
     */
    public function test_unauthenticated_request_returns_clean_indonesian_message(): void
    {
        $response = $this->getJson(route('api.v1.assignments'));

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Sesi login telah berakhir atau token tidak valid. Silakan login kembali.',
            ]);
    }
}
