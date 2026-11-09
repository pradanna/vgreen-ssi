<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StationController;
use Illuminate\Support\Facades\Route;

// Redirect root to dashboard (or login)
Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [StationController::class, 'index'])->name('dashboard');
    Route::post('/demo/switch-role', [StationController::class, 'switchRole'])->name('demo.switch-role');
    Route::post('/stations/{station}/inspections/{report}/review', [StationController::class, 'reviewInspection'])->name('stations.inspections.review');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
