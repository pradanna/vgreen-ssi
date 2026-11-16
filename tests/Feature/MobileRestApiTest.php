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
}
