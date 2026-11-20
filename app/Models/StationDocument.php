<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class StationDocument extends Model
{
    use HasUuids;
    protected $table = 'station_documents';

    public const CATEGORY_SWASTA = 'SWASTA';
    public const CATEGORY_PEMERINTAH = 'PEMERINTAH';
    public const CATEGORY_VENDOR = 'VENDOR';

    /**
     * Standard mandatory document requirements matrix
     */
    public const REQUIRED_DOCUMENTS = [
        'SWASTA' => [
            'SHM' => 'Sertifikat Hak Milik (SHM)',
            'KTP' => 'KTP Pemilik Lahan',
            'SURAT_PERSETUJUAN' => 'Surat Persetujuan',
            'LOI' => 'Letter of Intent (LOI)',
            'PINJAM_PAKAI' => 'Perjanjian Pinjam Pakai',
            'MOU' => 'MOU / Perjanjian Kerjasama',
            'KWITANSI' => 'Kwitansi Pembayaran',
            'BUKTI_BAYAR' => 'Bukti Bayar / Transfer',
        ],
        'PEMERINTAH' => [
            'SK' => 'Surat Keputusan (SK)',
            'MOU' => 'MOU Kontrak Kerjasama',
            'BUKTI_BAYAR' => 'Bukti Bayar / Retribusi',
        ],
        'VENDOR' => [
            'SSR_VENDOR' => 'SSR Vendor (Site Survey Report)',
            'LAPORAN_SURVEY' => 'Laporan Survey Teknis',
        ],
    ];

    protected $fillable = [
        'station_id',
        'category',
        'document_type',
        'title',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'uploaded_by',
        'notes',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function station()
    {
        return $this->belongsTo(Station::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
