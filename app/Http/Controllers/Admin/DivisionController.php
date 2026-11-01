<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DivisionController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/divisi', [
            'divisions' => Division::with('location:id,name')->withCount('users')
                ->orderBy('location_id')->orderBy('name')->get(),
            'locations' => Location::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        Division::create($request->validate($this->rules()));

        return back();
    }

    public function update(Request $request, Division $division)
    {
        $division->update($request->validate($this->rules($division)));

        return back();
    }

    public function destroy(Division $division)
    {
        if ($division->users()->exists()) {
            return back()->withErrors([
                'delete' => 'Divisi masih dipakai peserta. Nonaktifkan saja, jangan dihapus.',
            ]);
        }

        $division->delete();

        return back();
    }

    private function rules(?Division $division = null): array
    {
        return [
            'location_id' => ['required', 'exists:locations,id'],
            'name' => [
                'required', 'string', 'max:255',
                \Illuminate\Validation\Rule::unique('divisions', 'name')
                    ->where('location_id', request('location_id'))
                    ->ignore($division?->id),
            ],
            'is_active' => ['required', 'boolean'],
        ];
    }
}