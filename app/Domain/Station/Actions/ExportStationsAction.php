<?php

namespace App\Domain\Station\Actions;

use App\Models\Station;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportStationsAction
{
    /**
     * Generate downloadable CSV stream of all stations with full operational attributes.
     */
    public function execute(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="vgreen_stations_recap_' . date('Y-m-d_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Columns
            fputcsv($handle, [
                'Kode Stasiun',
                'Nama Stasiun',
                'Tipe Fasilitas',
                'Status Operasional',
                'Latitude',
                'Longitude',
                'Kota',
                'Provinsi',
                'Alamat Lengkap',
                'Kapasitas Daya (kW)',
                'Tipe Soket',
                'Jumlah Slot',
                'Jam Operasional',
                'Vendor Pelaksana',
                'ID Pelanggan PLN',
                'Tanggal Survei',
                'Tanggal Komisioning',
                'Status Verifikasi Laporan Terakhir',
                'Catatan Internal',
            ]);

            Station::with(['facilityType', 'status', 'latestInspection.approvalStatus'])
                ->chunk(100, function ($stations) use ($handle) {
                    foreach ($stations as $station) {
                        fputcsv($handle, [
                            $station->code,
                            $station->name,
                            $station->facilityType->name ?? $station->facility_type_id,
                            $station->status->name ?? $station->status_id,
                            $station->latitude,
                            $station->longitude,
                            $station->city,
                            $station->province,
                            $station->address,
                            $station->power_capacity_kw ?? '-',
                            $station->socket_types ?? '-',
                            $station->slot_count,
                            $station->operational_hours,
                            $station->vendor_name ?? '-',
                            $station->pln_meter_id ?? '-',
                            $station->survey_date?->format('Y-m-d') ?? '-',
                            $station->commissioning_date?->format('Y-m-d') ?? '-',
                            $station->latestInspection?->approvalStatus?->name ?? 'Belum Ada',
                            $station->internal_notes ?? '-',
                        ]);
                    }
                });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
