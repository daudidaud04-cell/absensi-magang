<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/lokasi', [
            'locations' => Location::withCount('users')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $location = Location::create($request->validate($this->rules()));

        ActivityLogger::log('lokasi.dibuat', "Menambah lokasi {$location->name}", $location, [
            'is_active' => (bool) $location->is_active,
        ]);

        return back();
    }

    public function update(Request $request, Location $location)
    {
        $location->fill($request->validate($this->rules()));
        $perubahan = ActivityLogger::perubahan($location);
        $location->save();

        if ($perubahan) {
            ActivityLogger::log(
                'lokasi.diubah',
                "Mengubah lokasi {$location->name} (".implode(', ', array_keys($perubahan)).')',
                $location,
                $perubahan,
            );
        }

        return back();
    }

    public function destroy(Location $location)
    {
        if ($location->users()->exists()) {
            return back()->withErrors([
                'delete' => 'Lokasi masih dipakai peserta. Nonaktifkan saja, jangan dihapus.',
            ]);
        }

        $nama = $location->name;
        $location->delete();

        ActivityLogger::log('lokasi.dihapus', "Menghapus lokasi {$nama}", $location);

        return back();
    }

    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}