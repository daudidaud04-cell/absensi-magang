<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\OfficeSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PengaturanController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/pengaturan', [
            'office' => OfficeSetting::first(),
            'holidays' => Holiday::orderBy('date')->get(),
        ]);
    }

    public function updateOffice(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius_meter' => ['required', 'integer', 'between:10,1000'],
            'jam_masuk' => ['required', 'date_format:H:i'],
            'jam_pulang' => ['required', 'date_format:H:i'],
            'pulang_dibuka_menit' => ['sometimes', 'required', 'integer', 'between:0,180'],
            'toleransi_terlambat_menit' => ['required', 'integer', 'between:0,120'],
            'max_gps_accuracy_meter' => ['required', 'integer', 'between:10,200'],
        ]);

        $office = OfficeSetting::first() ?? new OfficeSetting;
        $office->fill($data)->save();

        return back();
    }

    public function storeHoliday(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date', 'unique:holidays,date'],
            'name' => ['required', 'string', 'max:255'],
        ]);
        Holiday::create($data);

        return back();
    }

    public function destroyHoliday(Holiday $holiday)
    {
        $holiday->delete();

        return back();
    }
}