<?php

namespace App\Support;

class PdfPreviewGenerator
{
    public static function generate(string $title, string $stationCode, string $stationName, string $docType, string $category): string
    {
        $stationCode = self::escapePdfString($stationCode);
        $stationName = self::escapePdfString($stationName);
        $title = self::escapePdfString($title);
        $docType = self::escapePdfString($docType);
        $category = self::escapePdfString($category);
        $date = now()->format('d F Y');

        $text = "BT\n";
        $text .= "/F1 18 Tf\n";
        $text .= "50 720 Td (PT SURVEYOR SUPERIOR INDONESIA) Tj\n";
        $text .= "/F2 12 Tf\n";
        $text .= "0 -24 Td (V-Green EV Charging & Swap Station Network) Tj\n";
        $text .= "/F1 14 Tf\n";
        $text .= "0 -35 Td (SALINAN DIGITAL DOKUMEN RESMI) Tj\n";
        $text .= "/F2 11 Tf\n";
        $text .= "0 -25 Td (Judul Dokumen  : {$title}) Tj\n";
        $text .= "0 -18 Td (Jenis Berkas   : {$docType} [{$category}]) Tj\n";
        $text .= "0 -18 Td (Kode Stasiun   : {$stationCode}) Tj\n";
        $text .= "0 -18 Td (Nama Stasiun   : {$stationName}) Tj\n";
        $text .= "0 -18 Td (Tanggal Terbit : {$date}) Tj\n";
        $text .= "/F1 11 Tf\n";
        $text .= "0 -30 Td (STATUS: TERVERIFIKASI & MEMENUHI KEPATUHAN HUKUM) Tj\n";
        $text .= "/F2 10 Tf\n";
        $text .= "0 -22 Td (Dokumen ini merupakan arsip legalitas resmi yang telah diunggah dan) Tj\n";
        $text .= "0 -15 Td (disetujui dalam sistem operasional stasiun pengisian daya PT SSI.) Tj\n";
        $text .= "ET\n";

        $len = strlen($text);

        $out = "%PDF-1.4\n";
        $out .= "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n";
        $out .= "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n";
        $out .= "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj\n";
        $out .= "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n";
        $out .= "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n";
        $out .= "6 0 obj << /Length {$len} >> stream\n{$text}\nendstream\nendobj\n";
        $out .= "xref\n0 7\n";
        $out .= "0000000000 65535 f \n";
        $out .= "0000000009 00000 n \n";
        $out .= "0000000058 00000 n \n";
        $out .= "0000000115 00000 n \n";
        $out .= "0000000256 00000 n \n";
        $out .= "0000000330 00000 n \n";
        $out .= "0000000399 00000 n \n";
        $out .= "trailer << /Size 7 /Root 1 0 R >>\nstartxref\n" . (470 + $len) . "\n%%EOF\n";

        return $out;
    }

    private static function escapePdfString(string $str): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $str);
    }
}
