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

    public function test_targets_page_supports_serverside_pagination(): void
    {
        $admin = User::where('role_id', Role::ADMIN_SSI)->first();

        // Page 1 with per_page 10
        $response = $this->actingAs($admin)->get(route('targets.index', ['per_page' => 10, 'page' => 1]));
        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('targets.per_page', 10)
            ->where('targets.current_page', 1)
            ->has('targets.data', 10)
            ->has('targets.links')
        );

        // Page 2
        $responsePage2 = $this->actingAs($admin)->get(route('targets.index', ['per_page' => 10, 'page' => 2]));
        $responsePage2->assertStatus(200);
        $responsePage2->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('targets.current_page', 2)
            ->where('targets.per_page', 10)
        );
    }

    public function test_targets_page_supports_serverside_search_and_filters(): void
    {
        $admin = User::where('role_id', Role::ADMIN_SSI)->first();

        // Search for 'Jawa'
        $response = $this->actingAs($admin)->get(route('targets.index', ['search' => 'Jawa']));
        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('filters.search', 'Jawa')
        );

        // Filter by exact province
        $responseProv = $this->actingAs($admin)->get(route('targets.index', ['province' => 'DKI Jakarta']));
        $responseProv->assertStatus(200);
        $responseProv->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('targets.total', 1)
            ->where('targets.data.0.province_name', 'DKI Jakarta')
        );

        // Filter by status OPERATIONAL
        $responseStatus = $this->actingAs($admin)->get(route('targets.index', ['status' => 'OPERATIONAL']));
        $responseStatus->assertStatus(200);
        $responseStatus->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('filters.status', 'OPERATIONAL')
        );

        // Sort by NAME_ASC
        $responseSortName = $this->actingAs($admin)->get(route('targets.index', ['sort' => 'NAME_ASC']));
        $responseSortName->assertStatus(200);
        $responseSortName->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('filters.sort', 'NAME_ASC')
            ->where('targets.data.0.province_name', 'Aceh')
        );

        // Sort by TARGET_DESC
        $responseSortTarget = $this->actingAs($admin)->get(route('targets.index', ['sort' => 'TARGET_DESC']));
        $responseSortTarget->assertStatus(200);
        $responseSortTarget->assertInertia(fn($page) => $page->component('Targets/Index')
            ->where('filters.sort', 'TARGET_DESC')
        );
    }
}
