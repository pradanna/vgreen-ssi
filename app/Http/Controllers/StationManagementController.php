<?php

namespace App\Http\Controllers;

use App\Domain\Station\Actions\CreateStationAction;
use App\Domain\Station\Actions\ExportStationsAction;
use App\Domain\Station\Actions\ImportStationsAction;
use App\Domain\Station\Actions\UpdateStationAction;
use App\Models\Role;
use App\Models\Station;
use App\Models\StationDocument;
use App\Models\StationMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StationManagementController extends Controller
{
    public function __construct(
        protected CreateStationAction $createStationAction,
        protected UpdateStationAction $updateStationAction,
        protected ImportStationsAction $importStationsAction,
        protected ExportStationsAction $exportStationsAction
    ) {}

    /**
     * Generate next auto-increment station code for city.
     */
    public function generateCode(Request $request): JsonResponse
    {
        $this->ensureAuthorized($request);
        $city = $request->query('city', 'Jakarta');
        $code = Station::generateNextCode($city);
        return response()->json(['code' => $code]);
    }

    /**
     * Store newly created station.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'code' => 'nullable|string|max:50|unique:stations,code',
            'name' => 'required|string|max:255',
            'facility_type_id' => 'required|exists:m_facility_types,id',
            'status_id' => 'required|exists:m_station_statuses,id',
            'latitude' => 'required|numeric|between:-12.0,7.0',
            'longitude' => 'required|numeric|between:94.0,142.0',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'power_capacity_kw' => 'nullable|integer|min:0',
            'socket_types' => 'nullable|string|max:255',
            'slot_count' => 'nullable|integer|min:1',
            'operational_hours' => 'nullable|string|max:100',
            'amenities' => 'nullable',
            'vendor_name' => 'nullable|string|max:150',
            'pln_meter_id' => 'nullable|string|max:100',
            'internal_notes' => 'nullable|string',

            // Landlord & Contracts
            'landlord_type' => 'nullable|string|in:SWASTA,PEMERINTAH',
            'landlord_name' => 'nullable|string|max:255',
            'landlord_phone' => 'nullable|string|max:50',
            'contract_vgreen_start_date' => 'nullable|date',
            'contract_vgreen_end_date' => 'nullable|date',
            'contract_vgreen_doc_number' => 'nullable|string|max:100',
            'contract_landlord_start_date' => 'nullable|date',
            'contract_landlord_end_date' => 'nullable|date',
            'contract_landlord_doc_number' => 'nullable|string|max:100',

            // Nested machines
            'machines' => 'nullable|array',
            'machines.*.machine_id' => 'nullable|exists:m_machines,id',
            'machines.*.name' => 'required_with:machines|string|max:150',
            'machines.*.brand' => 'nullable|string|max:100',
            'machines.*.model_series' => 'nullable|string|max:100',
            'machines.*.serial_number' => 'nullable|string|max:100',
            'machines.*.facility_type_id' => 'nullable|exists:m_facility_types,id',
            'machines.*.power_capacity_kw' => 'nullable|integer|min:0',
            'machines.*.socket_types' => 'nullable|string|max:255',
            'machines.*.slot_or_gun_count' => 'nullable|integer|min:1',
            'machines.*.status' => 'nullable|string|max:30',
        ]);

        $this->createStationAction->execute($validated);

        return redirect()->back()->with('success', 'Titik stasiun baru berhasil ditambahkan.');
    }

    /**
     * Update existing station.
     */
    public function update(Request $request, Station $station): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:stations,code,' . $station->id,
            'name' => 'required|string|max:255',
            'facility_type_id' => 'required|exists:m_facility_types,id',
            'status_id' => 'required|exists:m_station_statuses,id',
            'latitude' => 'required|numeric|between:-12.0,7.0',
            'longitude' => 'required|numeric|between:94.0,142.0',
            'address' => 'required|string|max:500',
            'city' => 'required|string|max:100',
            'province' => 'required|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'power_capacity_kw' => 'nullable|integer|min:0',
            'socket_types' => 'nullable|string|max:255',
            'slot_count' => 'nullable|integer|min:1',
            'operational_hours' => 'nullable|string|max:100',
            'amenities' => 'nullable',
            'vendor_name' => 'nullable|string|max:150',
            'pln_meter_id' => 'nullable|string|max:100',
            'internal_notes' => 'nullable|string',

            // Landlord & Contracts
            'landlord_type' => 'nullable|string|in:SWASTA,PEMERINTAH',
            'landlord_name' => 'nullable|string|max:255',
            'landlord_phone' => 'nullable|string|max:50',
            'contract_vgreen_start_date' => 'nullable|date',
            'contract_vgreen_end_date' => 'nullable|date',
            'contract_vgreen_doc_number' => 'nullable|string|max:100',
            'contract_landlord_start_date' => 'nullable|date',
            'contract_landlord_end_date' => 'nullable|date',
            'contract_landlord_doc_number' => 'nullable|string|max:100',

            // Nested machines
            'machines' => 'nullable|array',
            'machines.*.id' => 'nullable|integer',
            'machines.*.machine_id' => 'nullable|exists:m_machines,id',
            'machines.*.name' => 'required_with:machines|string|max:150',
            'machines.*.brand' => 'nullable|string|max:100',
            'machines.*.model_series' => 'nullable|string|max:100',
            'machines.*.serial_number' => 'nullable|string|max:100',
            'machines.*.facility_type_id' => 'nullable|exists:m_facility_types,id',
            'machines.*.power_capacity_kw' => 'nullable|integer|min:0',
            'machines.*.socket_types' => 'nullable|string|max:255',
            'machines.*.slot_or_gun_count' => 'nullable|integer|min:1',
            'machines.*.status' => 'nullable|string|max:30',
        ]);

        $this->updateStationAction->execute($station, $validated);

        return redirect()->back()->with('success', "Titik stasiun {$station->code} berhasil diperbarui.");
    }

    /**
     * Remove station.
     */
    public function destroy(Request $request, Station $station): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $code = $station->code;
        $station->delete();

        return redirect()->back()->with('success', "Titik stasiun {$code} berhasil dihapus.");
    }

    /**
     * Upload station legal/contract document.
     */
    public function uploadDocument(Request $request, Station $station): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $validated = $request->validate([
            'category' => 'required|string|in:SWASTA,PEMERINTAH,VENDOR',
            'document_type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'file' => 'nullable|file|max:10240', // max 10MB
            'notes' => 'nullable|string|max:500',
        ]);

        $filePath = null;
        $fileName = null;
        $fileSize = null;
        $mimeType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
            $filePath = $file->store("documents/stations/{$station->code}", 'public');
        }

        StationDocument::create([
            'station_id' => $station->id,
            'category' => $validated['category'],
            'document_type' => $validated['document_type'],
            'title' => $validated['title'],
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
            'uploaded_by' => $request->user()->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Sync compliance status
        $station->update(['document_status' => $station->document_compliance['status']]);

        return redirect()->back()->with('success', 'Dokumen ' . $validated['title'] . ' berhasil diunggah.');
    }

    /**
     * Delete station document.
     */
    public function deleteDocument(Request $request, Station $station, StationDocument $document): RedirectResponse
    {
        $this->ensureAuthorized($request);

        if ($document->station_id !== $station->id) {
            abort(404);
        }

        $title = $document->title;
        $document->delete();

        // Sync compliance status
        $station->update(['document_status' => $station->document_compliance['status']]);

        return redirect()->back()->with('success', "Dokumen {$title} berhasil dihapus.");
    }

    /**
     * Mass Import Stations from CSV/Spreadsheet.
     */
    public function import(Request $request): RedirectResponse
    {
        $this->ensureAuthorized($request);

        $request->validate([
            'file' => 'required|file|max:10240', // max 10MB
        ]);

        $result = $this->importStationsAction->execute($request->file('file'));

        if ($result['imported_count'] > 0) {
            $msg = "Berhasil mengimpor {$result['imported_count']} titik stasiun.";
            if ($result['failed_count'] > 0) {
                $msg .= " Namun terdapat {$result['failed_count']} baris dengan kesalahan validasi.";
            }
            return redirect()->back()->with('success', $msg)->with('importErrors', $result['errors']);
        }

        return redirect()->back()->withErrors([
            'file' => 'Tidak ada data valid yang dapat diimpor. Silakan periksa format file.',
        ])->with('importErrors', $result['errors']);
    }

    /**
     * Mass Export Stations.
     */
    public function export(Request $request): StreamedResponse
    {
        $this->ensureAuthorized($request);

        return $this->exportStationsAction->execute();
    }

    /**
     * Ensure current user is Director or Admin of PT SSI.
     */
    protected function ensureAuthorized(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->role_id, [Role::DIRECTOR_SSI, Role::ADMIN_SSI])) {
            abort(403, 'Aksi ini hanya dapat dilakukan oleh Admin atau Direktur PT SSI.');
        }
    }
}
