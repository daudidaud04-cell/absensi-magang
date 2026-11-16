<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah status "cancelled" (kolom enum hanya bisa diubah lewat SQL di MySQL/MariaDB)
        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::statement("ALTER TABLE leave_requests MODIFY status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('review_notes');
            $table->foreignId('cancelled_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->text('cancel_reason')->nullable()->after('cancelled_by');
        });

        // Penanda: baris absensi ini dibuat oleh pengajuan izin yang mana
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('leave_request_id')->nullable()->after('admin_notes')
                ->constrained('leave_requests')->nullOnDelete();
        });

        // Isi data lama: baris izin yang sudah ada dikenali dari teks admin_notes
        DB::table('attendances')
            ->where('admin_notes', 'like', 'Pengajuan % #% disetujui')
            ->orderBy('id')
            ->each(function ($row) {
                if (
                    preg_match('/^Pengajuan (izin|sakit) #(\d+) disetujui$/', $row->admin_notes, $m)
                    && DB::table('leave_requests')->where('id', (int) $m[2])->exists()
                ) {
                    DB::table('attendances')->where('id', $row->id)->update(['leave_request_id' => (int) $m[2]]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropConstrainedForeignId('leave_request_id');
        });

        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cancelled_by');
            $table->dropColumn(['cancelled_at', 'cancel_reason']);
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            DB::table('leave_requests')->where('status', 'cancelled')->update(['status' => 'rejected']);
            DB::statement("ALTER TABLE leave_requests MODIFY status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'");
        }
    }
};