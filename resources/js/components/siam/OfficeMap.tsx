import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

type UserPos = { lat: number; lng: number; accuracy: number };

type Props = {
    lat: number;
    lng: number;
    radius: number;
    user?: UserPos | null;
    height?: number;
    onPick?: (lat: number, lng: number) => void;
};

export default function OfficeMap({ lat, lng, radius, user = null, height = 300, onPick }: Props) {
    const elRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const officeRef = useRef<L.CircleMarker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const userDotRef = useRef<L.CircleMarker | null>(null);
    const userAccRef = useRef<L.Circle | null>(null);
    const pickRef = useRef(onPick);
    const fittedUser = useRef(false);

    useEffect(() => {
        pickRef.current = onPick;
    });

    // Buat peta sekali
    useEffect(() => {
        if (!elRef.current) return;
        const map = L.map(elRef.current).setView([lat, lng], 18);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const circle = L.circle([lat, lng], {
            radius: Math.max(radius, 1),
            color: '#2563eb',
            weight: 2,
            fillOpacity: 0.15,
        }).addTo(map);
        const office = L.circleMarker([lat, lng], {
            radius: 6,
            color: '#1d4ed8',
            fillColor: '#2563eb',
            fillOpacity: 1,
        })
            .addTo(map)
            .bindTooltip('Titik kantor');

        map.fitBounds(circle.getBounds(), { padding: [20, 20] });
        map.on('click', (e: L.LeafletMouseEvent) => pickRef.current?.(e.latlng.lat, e.latlng.lng));

        mapRef.current = map;
        circleRef.current = circle;
        officeRef.current = office;
        const t = setTimeout(() => map.invalidateSize(), 0);

        return () => {
            clearTimeout(t);
            map.remove();
            mapRef.current = null;
            circleRef.current = null;
            officeRef.current = null;
            userDotRef.current = null;
            userAccRef.current = null;
            fittedUser.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Perbarui titik kantor dan lingkaran radius saat nilainya berubah
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !circleRef.current || !officeRef.current) return;
        officeRef.current.setLatLng([lat, lng]);
        circleRef.current.setLatLng([lat, lng]).setRadius(Math.max(radius, 1));
        map.fitBounds(circleRef.current.getBounds(), { padding: [20, 20] });
    }, [lat, lng, radius]);

    // Posisi peserta + lingkaran akurasi GPS
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!user) {
            userDotRef.current?.remove();
            userAccRef.current?.remove();
            userDotRef.current = null;
            userAccRef.current = null;
            return;
        }
        const ll: L.LatLngTuple = [user.lat, user.lng];
        if (!userDotRef.current || !userAccRef.current) {
            userAccRef.current = L.circle(ll, {
                radius: user.accuracy,
                color: '#16a34a',
                weight: 1,
                fillOpacity: 0.1,
            }).addTo(map);
            userDotRef.current = L.circleMarker(ll, {
                radius: 7,
                color: '#fff',
                weight: 2,
                fillColor: '#16a34a',
                fillOpacity: 1,
            })
                .addTo(map)
                .bindTooltip('Posisi Anda');
        } else {
            userAccRef.current.setLatLng(ll).setRadius(user.accuracy);
            userDotRef.current.setLatLng(ll);
        }
        // Zoom menyesuaikan sekali saja saat posisi pertama didapat, agar peta tidak loncat-loncat
        if (!fittedUser.current && circleRef.current) {
            map.fitBounds(circleRef.current.getBounds().extend(userAccRef.current.getBounds()), { padding: [20, 20] });
            fittedUser.current = true;
        }
    }, [user]);

    return <div ref={elRef} style={{ height }} className="relative z-0 w-full rounded-md border" />;
}