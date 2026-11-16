<?php

use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StationController;
use App\Http\Controllers\StationManagementController;
use App\Http\Controllers\TargetController;
use Illuminate\Support\Facades\Route;

// Redirect root to dashboard (or login)
Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Main Navigation Links
    Route::get('/dashboard', [StationController::class, 'index'])->name('dashboard');
    Route::get('/stations', [StationController::class, 'stations'])->name('stations.index');
    Route::get('/gis', [StationController::class, 'gis'])->name('gis.index');
    Route::get('/inspections', [StationController::class, 'inspections'])->name('inspections.index');
    Route::get('/targets', [TargetController::class, 'index'])->name('targets.index');
    Route::post('/targets', [TargetController::class, 'store'])->name('targets.store');
    Route::put('/targets/{target}', [TargetController::class, 'update'])->name('targets.update');

    Route::post('/demo/switch-role', [StationController::class, 'switchRole'])->name('demo.switch-role');
    
    // Inspection Review & Web Submission
    Route::get('/stations/{station}/photos', [StationController::class, 'getStationPhotos'])->name('stations.photos');
    Route::get('/stations/{station}/documents', [StationController::class, 'getStationDocuments'])->name('stations.documents');
    Route::get('/stations/{station}/documents/{document}/file', [StationController::class, 'viewDocument'])->name('stations.documents.file');
    Route::post('/stations/{station}/inspections/{report}/review', [StationController::class, 'reviewInspection'])->name('stations.inspections.review');
    Route::post('/stations/{station}/inspections', [StationController::class, 'submitInspection'])->name('stations.inspections.submit');

    // Milestone 5: Station Management & Data Portability (Admin PT SSI)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/stations/generate-code', [StationManagementController::class, 'generateCode'])->name('stations.generate-code');
        Route::post('/stations', [StationManagementController::class, 'store'])->name('stations.store');
        Route::put('/stations/{station}', [StationManagementController::class, 'update'])->name('stations.update');
        Route::delete('/stations/{station}', [StationManagementController::class, 'destroy'])->name('stations.destroy');
        Route::post('/stations/import', [StationManagementController::class, 'import'])->name('stations.import');
        Route::get('/stations/export', [StationManagementController::class, 'export'])->name('stations.export');
        Route::post('/stations/{station}/documents', [StationManagementController::class, 'uploadDocument'])->name('stations.documents.upload');
        Route::delete('/stations/{station}/documents/{document}', [StationManagementController::class, 'deleteDocument'])->name('stations.documents.destroy');
    });

    // Master Data Management (Mesin & Kategori)
    Route::prefix('master-data')->name('master-data.')->group(function () {
        Route::get('/', [MasterDataController::class, 'index'])->name('index');
        
        // Category routes
        Route::post('/categories', [MasterDataController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{category}', [MasterDataController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [MasterDataController::class, 'destroyCategory'])->name('categories.destroy');

        // Machine routes
        Route::post('/machines', [MasterDataController::class, 'storeMachine'])->name('machines.store');
        Route::put('/machines/{machine}', [MasterDataController::class, 'updateMachine'])->name('machines.update');
        Route::delete('/machines/{machine}', [MasterDataController::class, 'destroyMachine'])->name('machines.destroy');
    });

    // Profile Settings
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Shared Hosting Symlink-Free Storage Server Bridge
Route::get('/storage/{path}', [StationController::class, 'serveStorageFile'])
    ->where('path', '.*')
    ->name('storage.file');

require __DIR__.'/auth.php';
