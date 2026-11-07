import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type Option = {
    value: string | number;
    label: string;
    hint?: string | null;
};

type Props = {
    options: Option[];
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = '-- pilih --',
    className = '',
}: Props) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [active, setActive] = useState(0);
    const box = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => String(o.value) === String(value ?? ''));

    const filtered = useMemo(() => {
        const key = q.trim().toLowerCase();

        if (!key) return options;

        return options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(key));
    }, [options, q]);

    // Tutup saat klik di luar
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (box.current && !box.current.contains(e.target as Node)) {
                setOpen(false);
                setQ('');
            }
        };

        document.addEventListener('mousedown', close);

        return () => document.removeEventListener('mousedown', close);
    }, []);

    const pick = (o: Option) => {
        onChange(String(o.value));
        setOpen(false);
        setQ('');
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            // Cegah form ter-submit saat memilih dengan Enter
            e.preventDefault();

            if (open && filtered[active]) pick(filtered[active]);
        } else if (e.key === 'Escape') {
            setOpen(false);
            setQ('');
        }
    };

    return (
        <div ref={box} className={`relative ${className}`}>
            <input
                type="text"
                value={open ? q : (selected?.label ?? '')}
                placeholder={open && selected ? selected.label : placeholder}
                onFocus={() => setOpen(true)}
                onClick={() => setOpen(true)}
                onChange={(e) => {
                    setQ(e.target.value);
                    setActive(0);
                    setOpen(true);
                }}
                onKeyDown={onKeyDown}
                autoComplete="off"
                className="h-11 w-full rounded-xl border bg-background pr-9 pl-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            />

            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />

            {open && (
                <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-card p-1 shadow-lg">
                    {filtered.length === 0 && (
                        <li className="px-3 py-2 text-sm text-muted-foreground">Tidak ditemukan</li>
                    )}

                    {filtered.map((o, i) => (
                        <li
                            key={o.value}
                            ref={(el) => {
                                if (el && i === active) el.scrollIntoView({ block: 'nearest' });
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                pick(o);
                            }}
                            onMouseEnter={() => setActive(i)}
                            className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                                i === active ? 'bg-muted' : ''
                            }`}
                        >
                            <span className="min-w-0">
                                <span className="block truncate font-medium">{o.label}</span>
                                {o.hint && <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>}
                            </span>

                            {String(o.value) === String(value ?? '') && <Check className="size-4 shrink-0" />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}