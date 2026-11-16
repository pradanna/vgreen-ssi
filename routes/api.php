<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MobileInspectionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mobile REST API Routes (Fase 2 Android / Flutter Ready)
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Public Auth
    Route::post('/auth/login', [AuthController::class, 'login'])->name('api.v1.auth.login');
    Route::get('/checklist-slots', [MobileInspectionController::class, 'checklistSlots'])->name('api.v1.checklist-slots');

    // Protected Routes (Sanctum Bearer Token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::get('/auth/me', [AuthController::class, 'me'])->name('api.v1.auth.me');

        // Field Assignments & Inspections
        Route::get('/assignments', [MobileInspectionController::class, 'assignments'])->name('api.v1.assignments');
        Route::post('/stations/{station}/inspections', [MobileInspectionController::class, 'storeInspection'])->name('api.v1.stations.inspections.store');
        Route::get('/inspections/{report}/status', [MobileInspectionController::class, 'getInspectionStatus'])->name('api.v1.inspections.status');
    });
});
