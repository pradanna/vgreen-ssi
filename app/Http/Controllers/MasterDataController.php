<?php

namespace App\Http\Controllers;

use App\Domain\Activity\Services\ActivityLogger;
use App\Models\Machine;
use App\Models\MachineCategory;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    /**
     * Ensure only Director and Admin PT SSI have access.
     */
    protected function ensureAuthorized(Request $request): void
    {
        $user = $request->user();
        if (!in_array($user?->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI])) {
            abort(403, 'Akses terbatas untuk Direktur dan Admin PT SSI.');
        }
    }

    /**
     * Display the Master Data Index Page (Mesin & Kategori).
     */
    public function index(Request $request): Response
    {
        $this->ensureAuthorized($request);

        $categories = MachineCategory::withCount('machines')
            ->orderBy('code', 'asc')
            ->get();

        $machines = Machine::with('category')
            ->withCount('stationMachines')
            ->orderBy('brand', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        $stats = [
            'total_machines' => $machines->count(),
            'total_categories' => $categories->count(),
            'evcs_machines' => $machines->where('category.code', 'EVCS')->count(),
            'bss_machines' => $machines->where('category.code', 'BSS')->count(),
            'active_machines' => $machines->where('is_active', true)->count(),
        ];

        return Inertia::render('MasterData/Index', [
            'categories' => $categories,
            'machines' => $machines,
            'stats' => $stats,
            'activeNav' => 'master-data',
            'availableRoles' => Role::all(),
        ]);
    }

    /**
     * Store new Machine Category.
     */
    public function storeCategory(Request $request): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:m_machine_categories,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));

        $category = MachineCategory::create($validated);

        ActivityLogger::log(
            module: 'MASTER_DATA',
            action: 'CATEGORY_CREATED',
            description: "Menambahkan kategori mesin baru {$category->code} - {$category->name}",
            subject: $category,
            properties: $validated
        );

        return redirect()->back()->with('success', 'Kategori mesin baru berhasil ditambahkan.');
    }

    /**
     * Update existing Machine Category.
     */
    public function updateCategory(Request $request, MachineCategory $category): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'code' => 'required|string|max:30|unique:m_machine_categories,code,' . $category->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));

        $category->update($validated);

        ActivityLogger::log(
            module: 'MASTER_DATA',
            action: 'CATEGORY_UPDATED',
            description: "Memperbarui kategori mesin {$category->code} - {$category->name}",
            subject: $category,
            properties: $validated
        );

        return redirect()->back()->with('success', 'Data kategori mesin berhasil diperbarui.');
    }

    /**
     * Delete Machine Category with safety restriction.
     */
    public function destroyCategory(Request $request, MachineCategory $category): RedirectResponse
    {
        $this->ensureAuthorized($request);

        if ($category->machines()->count() > 0) {
            return redirect()->back()->withErrors([
                'error' => "Kategori '{$category->name}' tidak dapat dihapus karena masih menaungi {$category->machines()->count()} model mesin."
            ]);
        }

        $code = $category->code;
        $name = $category->name;
        $category->delete();

        ActivityLogger::log(
            module: 'MASTER_DATA',
            action: 'CATEGORY_DELETED',
            description: "Menghapus kategori mesin {$code} - {$name}",
            subject: null,
            properties: ['code' => $code, 'name' => $name],
            subjectNameOverride: "{$code} - {$name}"
        );

        return redirect()->back()->with('success', 'Kategori mesin berhasil dihapus.');
    }

    /**
     * Store new Master Machine.
     */
    public function storeMachine(Request $request): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'category_id' => 'required|exists:m_machine_categories,id',
            'code' => 'required|string|max:50|unique:m_machines,code',
            'name' => 'required|string|max:150',
            'brand' => 'required|string|max:100',
            'model_series' => 'nullable|string|max:100',
            'power_capacity_kw' => 'required|integer|min:0',
            'socket_types' => 'nullable|string|max:255',
            'slot_or_gun_count' => 'required|integer|min:1',
            'dimensions' => 'nullable|string|max:100',
            'weight' => 'nullable|string|max:50',
            'cable_length' => 'nullable|string|max:50',
            'input_voltage' => 'nullable|string|max:150',
            'input_current' => 'nullable|string|max:50',
            'output_voltage' => 'nullable|string|max:100',
            'output_current' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $machine = Machine::create($validated);

        ActivityLogger::log(
            module: 'MASTER_DATA',
            action: 'MACHINE_CREATED',
            description: "Menambahkan model mesin {$machine->brand} {$machine->name} ({$machine->power_capacity_kw} kW)",
            subject: $machine,
            properties: $validated
        );

        return redirect()->back()->with('success', 'Model mesin baru berhasil ditambahkan ke katalog master.');
    }

    /**
     * Update existing Master Machine.
     */
    public function updateMachine(Request $request, Machine $machine): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'category_id' => 'required|exists:m_machine_categories,id',
            'code' => 'required|string|max:50|unique:m_machines,code,' . $machine->id,
            'name' => 'required|string|max:150',
            'brand' => 'required|string|max:100',
            'model_series' => 'nullable|string|max:100',
            'power_capacity_kw' => 'required|integer|min:0',
            'socket_types' => 'nullable|string|max:255',
            'slot_or_gun_count' => 'required|integer|min:1',
            'dimensions' => 'nullable|string|max:100',
            'weight' => 'nullable|string|max:50',
            'cable_length' => 'nullable|string|max:50',
            'input_voltage' => 'nullable|string|max:150',
            'input_current' => 'nullable|string|max:50',
            'output_voltage' => 'nullable|string|max:100',
            'output_current' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $machine->update($validated);

        ActivityLogger::log(
            module: 'MASTER_DATA',
            action: 'MACHINE_UPDATED',
            description: "Memperbarui data mesin {$machine->brand} {$machine->name}",
            subject: $machine,
            properties: $validated
        );

        return redirect()->back()->with('success', 'Data model mesin berhasil diperbarui.');
    }

    /**
     * Delete Master Machine with safety restriction.
     */
    public function destroyMachine(Request $request, Machine $machine): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $usageCount = $machine->stationMachines()->count();
        if ($usageCount > 0) {
            return redirect()->back()->withErrors([
                'error' => "Item tidak bisa dihapus karena sudah ada titik yang memakai item ini ({$usageCount} titik terdaftar)."
            ]);
        }

        $code = $machine->code;
        $name = $machine->name;
        $machine->delete();

        ActivityLogger::log(
            module: 'MASTER_DATA',
            action: 'MACHINE_DELETED',
            description: "Menghapus mesin {$code} - {$name}",
            subject: null,
            properties: ['code' => $code, 'name' => $name],
            subjectNameOverride: "{$code} - {$name}"
        );

        return redirect()->back()->with('success', 'Model mesin berhasil dihapus dari katalog master.');
    }
}
