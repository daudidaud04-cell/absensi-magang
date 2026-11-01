import { router } from '@inertiajs/react';
import { Camera, Check, Loader2, MapPin, RefreshCw, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import OfficeMap from './OfficeMap';
import { pBtn, pBtnGhost, pCard } from './peserta-ui';
import type { Office } from './types';

type Pos = { lat: number; lng: number; accuracy: number };
type GeoIssue = 'insecure' | 'unsupported' | 'denied' | 'unavailable' | 'timeout';
type CamIssue = 'insecure' | 'denied' | 'notfound' | 'busy' | 'other';

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const R = 6371000;
    const rad = (d: number) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

/** Ambil frame video, perkecil, lalu kompres JPEG sampai <= 100 KB. */
async function compressFrame(video: HTMLVideoElement, maxBytes = 100 * 1024): Promise<File> {
    const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);

    let quality = 0.8;
    let blob: Blob | null = null;
    while (quality >= 0.3) {
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= maxBytes) break;
        quality -= 0.1;
    }
    if (!blob) throw new Error('Gagal memproses foto');
    return new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
}

function Step({ n, label, done }: { n: number; label: string; done: boolean }) {
    return (
        <div className="flex flex-1 flex-col items-center gap-1 text-xs">
            <span
                className={`flex h-7 w-7 items-center justify-center rounded-full font-semibold ${
                    done ? 'bg-green-600 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
            >
                {done ? <Check className="h-4 w-4" /> : n}
            </span>
            <span className={done ? 'font-medium text-neutral-900' : 'text-neutral-500'}>{label}</span>
        </div>
    );
}

const smallBtn =
    'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 transition active:scale-95';

/** Panduan saat lokasi atau kamera bermasalah */
function Help({ title, text, steps, children }: { title: string; text: string; steps?: string[]; children?: React.ReactNode }) {
    return (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="flex items-center gap-1.5 font-semibold">
                <TriangleAlert className="h-4 w-4 shrink-0" /> {title}
            </p>
            <p className="mt-1">{text}</p>
            {steps && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                    {steps.map((s) => (
                        <li key={s}>{s}</li>
                    ))}
                </ul>
            )}
            {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
        </div>
    );
}

const izinLangkah = [
    'Android (Chrome): ketuk ikon gembok di samping alamat → Izin → izinkan Lokasi dan Kamera.',
    'iPhone (Safari): Pengaturan → Privasi & Keamanan → Layanan Lokasi → Safari → "Saat Menggunakan App". Untuk kamera: Pengaturan → Safari → Kamera → Izinkan.',
    'Setelah diizinkan, muat ulang halaman ini.',
];

function GeoHelp({ issue, onRetry }: { issue: GeoIssue; onRetry: () => void }) {
    const reload = (
        <button type="button" className={smallBtn} onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Muat ulang halaman
        </button>
    );

    if (issue === 'denied')
        return <Help title="Izin lokasi diblokir" text="Absen butuh lokasi Anda. Aktifkan lagi izinnya lewat pengaturan browser." steps={izinLangkah}>{reload}</Help>;

    if (issue === 'insecure')
        return <Help title="Alamat situs tidak aman" text="Lokasi hanya bisa dipakai jika situs dibuka lewat alamat https://. Minta admin memberi alamat yang benar." />;

    if (issue === 'unsupported')
        return <Help title="Browser tidak mendukung lokasi" text="Buka situs ini lewat Chrome (Android) atau Safari (iPhone)." />;

    if (issue === 'unavailable')
        return (
            <Help title="Lokasi tidak ditemukan" text="Pastikan GPS/Layanan Lokasi di HP menyala, lalu coba di tempat terbuka.">
                <button type="button" className={smallBtn} onClick={onRetry}>
                    <RefreshCw className="h-4 w-4" /> Coba lagi
                </button>
            </Help>
        );

    return (
        <Help title="Pencarian lokasi terlalu lama" text="Sinyal GPS lemah. Coba pindah ke area terbuka, lalu ulangi.">
            <button type="button" className={smallBtn} onClick={onRetry}>
                <RefreshCw className="h-4 w-4" /> Coba lagi
            </button>
        </Help>
    );
}

function CamHelp({ issue }: { issue: CamIssue }) {
    if (issue === 'denied')
        return <Help title="Izin kamera diblokir" text="Selfie dibutuhkan untuk absen. Aktifkan lagi izin kamera." steps={izinLangkah} />;
    if (issue === 'insecure')
        return <Help title="Alamat situs tidak aman" text="Kamera hanya bisa dipakai jika situs dibuka lewat alamat https://." />;
    if (issue === 'notfound')
        return <Help title="Kamera tidak ditemukan" text="Perangkat ini tidak memiliki kamera depan yang bisa dipakai." />;
    if (issue === 'busy')
        return <Help title="Kamera sedang dipakai" text="Tutup aplikasi lain yang memakai kamera (video call, kamera), lalu coba lagi." />;
    return <Help title="Kamera tidak bisa dibuka" text="Muat ulang halaman, lalu coba lagi." />;
}

export default function CaptureAttendance({
    mode,
    office,
    initialLogbook = '',
}: {
    mode: 'masuk' | 'pulang';
    office: Office;
    initialLogbook?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [pos, setPos] = useState<Pos | null>(null);
    const [geoIssue, setGeoIssue] = useState<GeoIssue | null>(null);
    const [geoTry, setGeoTry] = useState(0);
    const [camIssue, setCamIssue] = useState<CamIssue | null>(null);
    const [showMap, setShowMap] = useState(true);
    const [cameraOn, setCameraOn] = useState(false);
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [logbook, setLogbook] = useState(initialLogbook);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraOn(false);
    };

    const retryGeo = () => {
        setPos(null);
        setGeoIssue(null);
        setGeoTry((n) => n + 1);
    };

    // GPS presisi tinggi, terus dipantau
    useEffect(() => {
        if (!window.isSecureContext) {
            setGeoIssue('insecure');
            return;
        }
        if (!navigator.geolocation) {
            setGeoIssue('unsupported');
            return;
        }
        const id = navigator.geolocation.watchPosition(
            (p) => {
                setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
                setGeoIssue(null);
            },
            (e) => setGeoIssue(e.code === 1 ? 'denied' : e.code === 3 ? 'timeout' : 'unavailable'),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
        );
        return () => navigator.geolocation.clearWatch(id);
    }, [geoTry]);

    // Matikan kamera saat halaman ditutup
    useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

    // Bebaskan memori pratinjau foto
    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    useEffect(() => {
        if (cameraOn && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [cameraOn]);

    const startCamera = async () => {
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            setCamIssue('insecure');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });
            streamRef.current = stream;
            setPhoto(null);
            setPreview(null);
            setErrors({});
            setCamIssue(null);
            setCameraOn(true);
        } catch (e) {
            const name = (e as DOMException).name;
            if (name === 'NotAllowedError' || name === 'SecurityError') setCamIssue('denied');
            else if (name === 'NotFoundError' || name === 'OverconstrainedError') setCamIssue('notfound');
            else if (name === 'NotReadableError' || name === 'AbortError') setCamIssue('busy');
            else setCamIssue('other');
        }
    };

    const capture = async () => {
        if (!videoRef.current) return;
        try {
            const file = await compressFrame(videoRef.current);
            setPhoto(file);
            setPreview(URL.createObjectURL(file));
            stopCamera();
        } catch {
            setErrors({ camera: 'Foto gagal diproses. Silakan ambil ulang.' });
        }
    };

    const officeLat = Number(office.latitude);
    const officeLng = Number(office.longitude);
    const officeRadius = Number(office.radius_meter);
    const maxAccuracy = Number(office.max_gps_accuracy_meter);

    const distance = pos ? haversine(pos, { lat: officeLat, lng: officeLng }) : null;
    const gpsOk = !!pos && distance !== null && distance <= officeRadius && pos.accuracy <= maxAccuracy;
    const logbookOk = mode === 'masuk' || logbook.trim().length >= 10;
    const ready = gpsOk && !!photo && logbookOk;

    // Alasan tombol kirim belum aktif
    let hint = '';
    if (geoIssue) hint = 'Lokasi belum bisa dibaca. Lihat petunjuk di atas.';
    else if (!pos) hint = 'Menunggu lokasi Anda...';
    else if (distance !== null && distance > officeRadius) hint = 'Anda belum berada di area absen.';
    else if (pos.accuracy > maxAccuracy) hint = 'Akurasi GPS masih rendah. Tunggu sebentar atau pindah ke area terbuka.';
    else if (!photo) hint = 'Ambil selfie terlebih dahulu.';
    else if (!logbookOk) hint = 'Isi jurnal kegiatan minimal 10 karakter.';

    const submit = () => {
        if (!pos || !photo) return;
        setBusy(true);
        router.post(
            `/absensi/${mode}`,
            {
                photo,
                latitude: pos.lat,
                longitude: pos.lng,
                accuracy: pos.accuracy,
                ...(mode === 'pulang' ? { logbook } : {}),
            },
            {
                forceFormData: true,
                onError: (e) => setErrors(e as Record<string, string>),
                onSuccess: () => setErrors({}),
                onFinish: () => setBusy(false),
            },
        );
    };

    const errorList = Object.values(errors);

    return (
        <div className="space-y-4">
            {/* Indikator langkah */}
            <div className={`${pCard} flex`}>
                <Step n={1} label="Lokasi" done={gpsOk} />
                <Step n={2} label="Selfie" done={!!photo} />
                <Step n={3} label="Kirim" done={false} />
            </div>

            {/* Langkah 1: lokasi */}
            <section className={pCard}>
                <div className="flex items-start gap-3">
                    <MapPin className={`mt-0.5 h-5 w-5 shrink-0 ${gpsOk ? 'text-green-600' : 'text-blue-700'}`} />
                    <div className="flex-1 text-sm">
                        <p className="font-semibold">Lokasi</p>
                        {geoIssue ? (
                            <p className="text-red-600">Lokasi belum bisa dibaca</p>
                        ) : !pos ? (
                            <p className="flex items-center gap-1.5 text-neutral-500">
                                <Loader2 className="h-4 w-4 animate-spin" /> Mencari lokasi Anda...
                            </p>
                        ) : (
                            <p className={gpsOk ? 'text-green-700' : 'text-amber-700'}>
                                {Math.round(distance!)} m dari kantor (maks {officeRadius} m) · akurasi {Math.round(pos.accuracy)} m
                            </p>
                        )}
                    </div>
                    <button type="button" className="-m-2 p-2 text-xs font-medium text-blue-700" onClick={() => setShowMap((v) => !v)}>
                        {showMap ? 'Sembunyikan peta' : 'Lihat peta'}
                    </button>
                </div>

                {geoIssue && <GeoHelp issue={geoIssue} onRetry={retryGeo} />}

                {showMap && Number.isFinite(officeLat) && Number.isFinite(officeLng) && (
                    <div className="mt-3 space-y-1 overflow-hidden rounded-2xl">
                        <OfficeMap lat={officeLat} lng={officeLng} radius={officeRadius} user={pos} height={180} />
                        <p className="text-xs text-neutral-500">Biru = area absen, hijau = posisi Anda.</p>
                    </div>
                )}
            </section>

            {/* Langkah 2: selfie */}
            <section className={pCard}>
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Camera className="h-5 w-5 text-blue-700" /> Selfie
                </p>

                {cameraOn && (
                    <div className="space-y-3">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="aspect-[4/3] max-h-72 w-full scale-x-[-1] rounded-2xl bg-black object-cover"
                        />
                        <button type="button" className={pBtn} onClick={capture}>
                            Ambil Foto
                        </button>
                    </div>
                )}

                {preview && !cameraOn && (
                    <div className="space-y-3">
                        <img src={preview} alt="Selfie" className="aspect-[4/3] max-h-72 w-full rounded-2xl object-cover" />
                        <button type="button" className={pBtnGhost} onClick={startCamera}>
                            <RefreshCw className="h-4 w-4" /> Ambil Ulang
                        </button>
                    </div>
                )}

                {!preview && !cameraOn && (
                    <button type="button" className={pBtnGhost} onClick={startCamera}>
                        <Camera className="h-4 w-4" /> Buka Kamera Selfie
                    </button>
                )}

                {camIssue && <CamHelp issue={camIssue} />}

                {photo && <p className="mt-2 text-xs text-neutral-500">Ukuran foto: {Math.round(photo.size / 1024)} KB</p>}
            </section>

            {/* Jurnal (khusus pulang) */}
            {mode === 'pulang' && (
                <section className={pCard}>
                    <label htmlFor="logbook" className="mb-2 block text-sm font-semibold">
                        Jurnal kegiatan hari ini
                    </label>
                    {/* text-base (16px) agar iPhone tidak memperbesar layar saat mengetik */}
                    <textarea
                        id="logbook"
                        className="w-full rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-base focus:border-blue-700 focus:outline-none"
                        rows={4}
                        value={logbook}
                        onChange={(e) => setLogbook(e.target.value)}
                        placeholder="Tuliskan kegiatan yang Anda kerjakan hari ini (minimal 10 karakter)"
                    />
                    <p className="mt-1 text-right text-xs text-neutral-500 tabular-nums">{logbook.trim().length} / 10 karakter minimum</p>
                </section>
            )}

            {errorList.length > 0 && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                    {errorList.map((e, i) => (
                        <p key={i}>{e}</p>
                    ))}
                </div>
            )}

            {/* Langkah 3: kirim */}
            <div className="space-y-2">
                {!ready && hint && <p className="text-center text-sm text-neutral-500">{hint}</p>}
                <button type="button" className={pBtn} disabled={!ready || busy} onClick={submit}>
                    {busy ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" /> Memproses...
                        </>
                    ) : mode === 'masuk' ? (
                        'Konfirmasi & Kirim Absen Masuk'
                    ) : (
                        'Konfirmasi & Kirim Absen Pulang'
                    )}
                </button>
            </div>
        </div>
    );
}