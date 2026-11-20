<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\FacilityType;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationDocument;
use App\Models\StationStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $director;
    protected User $vgreen;
    protected Station $station;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();

        $this->admin = User::where('role_id', Role::ADMIN_SSI)->first();
        $this->director = User::where('role_id', Role::DIRECTOR_SSI)->first();
        $this->vgreen = User::where('role_id', Role::VGREEN_REP)->first();
        $this->station = Station::first();
    }

    public function test_admin_and_director_can_access_activity_logs_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('activity-logs.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('ActivityLog/Index')
            ->has('logs')
            ->has('stats')
            ->has('filters')
            ->has('actors')
        );

        $directorResponse = $this->actingAs($this->director)->get(route('activity-logs.index'));
        $directorResponse->assertStatus(200);
    }

    public function test_vgreen_user_cannot_access_activity_logs_index(): void
    {
        $response = $this->actingAs($this->vgreen)->get(route('activity-logs.index'));
        $response->assertStatus(403);
    }

    public function test_station_creation_records_activity_log(): void
    {
        $countBefore = ActivityLog::where('action', 'STATION_CREATED')->count();

        $stationData = [
            'name' => 'Stasiun Testing Log Baru',
            'facility_type_id' => FacilityType::EVCS,
            'status_id' => StationStatus::SURVEYED,
            'latitude' => -6.175392,
            'longitude' => 106.827153,
            'address' => 'Jl. Medan Merdeka No. 10',
            'city' => 'Jakarta Pusat',
            'province' => 'DKI Jakarta',
            'power_capacity_kw' => 120,
            'slot_count' => 2,
        ];

        $response = $this->actingAs($this->admin)->post(route('admin.stations.store'), $stationData);
        $response->assertRedirect();

        $countAfter = ActivityLog::where('action', 'STATION_CREATED')->count();
        $this->assertEquals($countBefore + 1, $countAfter);

        $log = ActivityLog::where('action', 'STATION_CREATED')->latest('created_at')->first();
        $this->assertEquals('STATION', $log->module);
        $this->assertEquals($this->admin->id, $log->user_id);
        $this->assertStringContainsString('Stasiun Testing Log Baru', $log->description);
    }

    public function test_station_update_records_activity_log_with_diff(): void
    {
        $oldName = $this->station->name;
        $newName = 'Updated Station Name for Log Diff Test';

        $response = $this->actingAs($this->admin)->put(route('admin.stations.update', $this->station->id), [
            'code' => $this->station->code,
            'name' => $newName,
            'facility_type_id' => $this->station->facility_type_id,
            'status_id' => $this->station->status_id,
            'latitude' => $this->station->latitude,
            'longitude' => $this->station->longitude,
            'address' => $this->station->address,
            'city' => $this->station->city,
            'province' => $this->station->province,
        ]);
        $response->assertRedirect();

        $log = ActivityLog::where('action', 'STATION_UPDATED')
            ->where('subject_id', $this->station->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals('STATION', $log->module);
        $this->assertArrayHasKey('old_values', $log->properties);
        $this->assertArrayHasKey('new_values', $log->properties);
        $this->assertEquals($oldName, $log->properties['old_values']['name']);
        $this->assertEquals($newName, $log->properties['new_values']['name']);
    }

    public function test_station_document_upload_and_delete_records_activity_log(): void
    {
        $file = UploadedFile::fake()->create('pks_perjanjian_sewa.pdf', 500, 'application/pdf');

        // 1. Upload
        $uploadResponse = $this->actingAs($this->admin)->post(route('admin.stations.documents.upload', $this->station->id), [
            'category' => 'SWASTA',
            'document_type' => 'PKS',
            'title' => 'Dokumen PKS Sewa Lahan Swasta Test',
            'file' => $file,
        ]);
        $uploadResponse->assertRedirect();

        $uploadLog = ActivityLog::where('action', 'DOCUMENT_UPLOADED')
            ->where('subject_id', $this->station->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($uploadLog);
        $this->assertEquals('DOCUMENT', $uploadLog->module);
        $this->assertStringContainsString('Dokumen PKS Sewa Lahan Swasta Test', $uploadLog->description);

        // 2. Delete
        $document = StationDocument::where('station_id', $this->station->id)
            ->where('title', 'Dokumen PKS Sewa Lahan Swasta Test')
            ->first();
        $this->assertNotNull($document);

        $deleteResponse = $this->actingAs($this->admin)->delete(route('admin.stations.documents.destroy', [
            'station' => $this->station->id,
            'document' => $document->id,
        ]));
        $deleteResponse->assertRedirect();

        $deleteLog = ActivityLog::where('action', 'DOCUMENT_DELETED')
            ->where('subject_id', $this->station->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($deleteLog);
        $this->assertStringContainsString('Dokumen PKS Sewa Lahan Swasta Test', $deleteLog->description);
    }

    public function test_station_activities_on_demand_endpoint(): void
    {
        // Record sample activity for the station
        ActivityLog::create([
            'user_id' => $this->admin->id,
            'module' => 'STATION',
            'action' => 'STATION_UPDATED',
            'subject_type' => Station::class,
            'subject_id' => $this->station->id,
            'subject_name' => "{$this->station->code} - {$this->station->name}",
            'description' => 'Aktivitas uji coba drawer timeline',
            'properties' => ['test' => true],
        ]);

        $response = $this->actingAs($this->admin)->getJson(route('stations.activities', $this->station->id));
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'module',
                    'action',
                    'description',
                    'created_at',
                    'user' => [
                        'id',
                        'name',
                        'role_id',
                    ]
                ]
            ]
        ]);
    }

    public function test_activity_logs_filter_and_search(): void
    {
        ActivityLog::create([
            'user_id' => $this->admin->id,
            'module' => 'TARGET',
            'action' => 'TARGET_UPDATED',
            'description' => 'Menetapkan target provinsi Jawa Barat 2026',
        ]);

        // Filter by module
        $resModule = $this->actingAs($this->admin)->get(route('activity-logs.index', ['module' => 'TARGET']));
        $resModule->assertStatus(200);

        // Search text
        $resSearch = $this->actingAs($this->admin)->get(route('activity-logs.index', ['search' => 'Jawa Barat']));
        $resSearch->assertStatus(200);
    }
}
