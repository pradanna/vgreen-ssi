<?php

namespace Tests\Feature;

use App\Models\Machine;
use App\Models\MachineCategory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterDataTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $vgreen;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();

        $this->admin = User::where('role_id', Role::ADMIN_SSI)->first();
        $this->vgreen = User::where('role_id', Role::VGREEN_REP)->first();
    }

    public function test_vgreen_user_cannot_access_master_data(): void
    {
        $response = $this->actingAs($this->vgreen)->get(route('master-data.index'));
        $response->assertStatus(403);
    }

    public function test_admin_can_access_master_data_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('master-data.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('MasterData/Index')
            ->has('categories')
            ->has('machines')
            ->has('stats')
        );
    }

    public function test_admin_can_create_and_update_category(): void
    {
        // 1. Store
        $storeResponse = $this->actingAs($this->admin)->post(route('master-data.categories.store'), [
            'code' => 'TEST_CAT',
            'name' => 'Kategori Testing',
            'description' => 'Deskripsi untuk testing',
        ]);
        $storeResponse->assertRedirect();

        $category = MachineCategory::where('code', 'TEST_CAT')->first();
        $this->assertNotNull($category);
        $this->assertEquals('Kategori Testing', $category->name);

        // 2. Update
        $updateResponse = $this->actingAs($this->admin)->put(route('master-data.categories.update', $category->id), [
            'code' => 'TEST_CAT',
            'name' => 'Kategori Testing Updated',
            'description' => 'Deskripsi updated',
        ]);
        $updateResponse->assertRedirect();

        $category->refresh();
        $this->assertEquals('Kategori Testing Updated', $category->name);

        // 3. Delete
        $deleteResponse = $this->actingAs($this->admin)->delete(route('master-data.categories.destroy', $category->id));
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('m_machine_categories', ['id' => $category->id]);
    }

    public function test_admin_can_create_update_and_delete_machine(): void
    {
        $category = MachineCategory::where('code', 'EVCS')->first();

        // 1. Create machine
        $storeResponse = $this->actingAs($this->admin)->post(route('master-data.machines.store'), [
            'category_id' => $category->id,
            'code' => 'TEST-MACH-01',
            'name' => 'Unit Mesin Test 120kW',
            'brand' => 'TestBrand',
            'model_series' => 'TestSeries',
            'power_capacity_kw' => 120,
            'socket_types' => '2x CCS2',
            'slot_or_gun_count' => 2,
            'description' => 'Deskripsi uji coba mesin',
            'is_active' => true,
        ]);
        $storeResponse->assertRedirect();

        $machine = Machine::where('code', 'TEST-MACH-01')->first();
        $this->assertNotNull($machine);
        $this->assertEquals(120, $machine->power_capacity_kw);

        // 2. Update machine
        $updateResponse = $this->actingAs($this->admin)->put(route('master-data.machines.update', $machine->id), [
            'category_id' => $category->id,
            'code' => 'TEST-MACH-01',
            'name' => 'Unit Mesin Test 180kW Updated',
            'brand' => 'TestBrand',
            'model_series' => 'TestSeries',
            'power_capacity_kw' => 180,
            'socket_types' => '2x CCS2 Liquid',
            'slot_or_gun_count' => 2,
            'description' => 'Diperbarui',
            'is_active' => true,
        ]);
        $updateResponse->assertRedirect();

        $machine->refresh();
        $this->assertEquals(180, $machine->power_capacity_kw);

        // 3. Delete machine
        $deleteResponse = $this->actingAs($this->admin)->delete(route('master-data.machines.destroy', $machine->id));
        $deleteResponse->assertRedirect();
        $this->assertDatabaseMissing('m_machines', ['id' => $machine->id]);
    }

    public function test_cannot_delete_category_or_machine_when_still_in_use(): void
    {
        $evcsCategory = MachineCategory::where('code', 'EVCS')->first();
        $vinfastMachine = Machine::where('code', 'VF-DC-60KW')->first();

        // 1. Trying to delete EVCS category which still has models
        $catDeleteResponse = $this->actingAs($this->admin)->delete(route('master-data.categories.destroy', $evcsCategory->id));
        $catDeleteResponse->assertSessionHasErrors('error');
        $this->assertDatabaseHas('m_machine_categories', ['id' => $evcsCategory->id]);

        // 2. Trying to delete VinFast machine which is already used by operational stations
        $machDeleteResponse = $this->actingAs($this->admin)->delete(route('master-data.machines.destroy', $vinfastMachine->id));
        $machDeleteResponse->assertSessionHasErrors('error');
        $this->assertDatabaseHas('m_machines', ['id' => $vinfastMachine->id]);
    }
}
