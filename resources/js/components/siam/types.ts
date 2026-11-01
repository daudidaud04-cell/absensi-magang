export type Office = {
    name: string;
    latitude: number;
    longitude: number;
    radius_meter: number;
    jam_masuk: string;
    jam_pulang: string;
    toleransi_terlambat_menit: number;
    max_gps_accuracy_meter: number;
};

export type Attendance = {
    id: number;
    date: string;
    time_in: string | null;
    time_out: string | null;
    status: string;
    source: string;
    logbook: string | null;
};

export type LeaveRequest = {
    id: number;
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
    proof_file: string | null;
    status: string;
    review_notes: string | null;
    user?: { id: number; name: string };
};