<?php

namespace App\Http\Middleware;

use App\Models\Holiday;
use Closure;
use Illuminate\Http\Request;

class EnsureWorkday
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->role === 'magang' && ! $user->isWorkday(now())) {
            $libur = Holiday::whereDate('date', today())->value('name');

            return back()->withErrors([
                'absen' => $libur
                    ? "Hari ini libur ({$libur}). Tidak perlu absen."
                    : 'Hari ini bukan jadwal masuk kamu. Tidak perlu absen.',
            ]);
        }

        return $next($request);
    }
}