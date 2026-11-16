<?php

namespace Tests\Feature;

use App\Models\ProvinceTarget;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProvinceTargetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_director_and_admin_can_access_targets_page(): void
    {
        $director = User::where('role_id', Role::DIRECTOR_SSI)->first();
        $response = $this->actingAs($director)->get(route('targets.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page->component('Targets/Index')
            ->has('targets')
            ->has('summary')
        );

        $admin = User::where('role_id', Role::ADMIN_SSI)->first();
        $response = $this->actingAs($admin)->get(route('targets.index'));
        $response->assertStatus(200);
    }

    public function test_vgreen_rep_can_view_targets_page(): void
    {
        $vgreen = User::where('role_id', Role::VGREEN_REP)->first();
        $response = $this->actingAs($vgreen)->get(route('targets.index'));
        $response->assertStatus(200);
    }

    public function test_admin_can_update_province_target(): void
    {
        $admin = User::where('role_id', Role::ADMIN_SSI)->first();
        $target = ProvinceTarget::where('province_name', 'DKI Jakarta')->first();

        $response = $this->actingAs($admin)->put(route('targets.update', $target->id), [
            'target_evcs' => 400,
            'target_bss' => 200,
            'notes' => 'Peningkatan kuota Q4',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('province_targets', [
            'id' => $target->id,
            'target_evcs' => 400,
            'target_bss' => 200,
            'notes' => 'Peningkatan kuota Q4',
        ]);
    }

    public function test_admin_can_create_new_province_target(): void
    {
        $admin = User::where('role_id', Role::ADMIN_SSI)->first();

        $response = $this->actingAs($admin)->post(route('targets.store'), [
            'province_name' => 'Kalimantan Utara',
            'region' => 'Kalimantan',
            'year' => 2026,
            'target_evcs' => 20,
            'target_bss' => 10,
            'notes' => 'Ekspansi baru',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('province_targets', [
            'province_name' => 'Kalimantan Utara',
            'year' => 2026,
            'target_evcs' => 20,
            'target_bss' => 10,
        ]);
    }
}
