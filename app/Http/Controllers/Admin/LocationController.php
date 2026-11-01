<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
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
        Location::create($request->validate($this->rules()));

        return back();
    }

    public function update(Request $request, Location $location)
    {
        $location->update($request->validate($this->rules()));

        return back();
    }

    public function destroy(Location $location)
    {
        if ($location->users()->exists()) {
            return back()->withErrors([
                'delete' => 'Lokasi masih dipakai peserta. Nonaktifkan saja, jangan dihapus.',
            ]);
        }

        $location->delete();

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