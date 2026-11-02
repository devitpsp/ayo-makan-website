"use client";

import { ArrowCounterClockwise, CaretDown, MapPin } from "@phosphor-icons/react";
import { DEFAULT_STATE, hasCustomFilters, type SearchState } from "@/lib/client/search-state";
import { radiusLabel } from "@/lib/client/format";
import type { MinRating, Radius } from "@/lib/places/types";

export const RADIUS_OPTIONS: { value: Radius; label: string }[] = [
  { value: 500, label: "500 m" },
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 3000, label: "3 km" },
];

export const RATING_OPTIONS: { value: MinRating; label: string }[] = [
  { value: 0, label: "Semua" },
  { value: 4, label: "4,0+" },
  { value: 4.5, label: "4,5+" },
];

export const ratingLabel = (r: MinRating) => RATING_OPTIONS.find((o) => o.value === r)?.label ?? "Semua";

export const MURAH_HELP = "Hanya tempat yang ditandai murah di Google. Warung tanpa data harga ikut tersembunyi.";

export function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="space-y-2">
      <p className="field-label" aria-hidden="true">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            className="chip"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Panel filter samping (desktop ≥ 1024 px), melekat di kiri. */
export function FilterSidebar({
  state,
  onChange,
  onReset,
  locationLabel,
  onOpenLocation,
}: {
  state: SearchState;
  onChange: (p: Partial<SearchState>) => void;
  onReset: () => void;
  locationLabel: string;
  onOpenLocation: () => void;
}) {
  return (
    <div className="card-ink space-y-5 p-4">
      <button type="button" className="chip !h-auto w-full justify-between !whitespace-normal py-2 text-left" onClick={onOpenLocation}>
        <span className="inline-flex items-center gap-2">
          <MapPin size={18} weight="bold" aria-hidden="true" />
          {locationLabel}
        </span>
        <CaretDown size={16} weight="bold" aria-hidden="true" />
      </button>
      <OptionGroup label="Radius" options={RADIUS_OPTIONS} value={state.radius} onChange={(radius) => onChange({ radius })} />
      <OptionGroup label="Rating minimal" options={RATING_OPTIONS} value={state.minRating} onChange={(minRating) => onChange({ minRating })} />
      <div className="space-y-2">
        <p className="field-label" aria-hidden="true">Lainnya</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter lainnya">
          <button type="button" className="chip" aria-pressed={state.openNow} onClick={() => onChange({ openNow: !state.openNow })}>
            Buka sekarang
          </button>
          <button type="button" className="chip" aria-pressed={state.murah} onClick={() => onChange({ murah: !state.murah })}>
            Murah
          </button>
        </div>
        <p className="text-sm text-redup">{MURAH_HELP}</p>
      </div>
      {hasCustomFilters(state) && (
        <button type="button" className="chip" onClick={onReset}>
          <ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" />
          Reset
        </button>
      )}
    </div>
  );
}

/** Baris chip yang bisa digeser horizontal di HP. Radius dan rating membuka bottom sheet. */
export function FilterChipsRow({
  state,
  onChange,
  onReset,
  onOpen,
}: {
  state: SearchState;
  onChange: (p: Partial<SearchState>) => void;
  onReset: () => void;
  onOpen: (which: "radius" | "rating") => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none" role="group" aria-label="Filter">
      <div className="flex w-max gap-2">
        <button type="button" className="chip" aria-haspopup="dialog" data-active={state.radius !== DEFAULT_STATE.radius} onClick={() => onOpen("radius")}>
          {radiusLabel(state.radius)}
          <CaretDown size={14} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="chip" aria-haspopup="dialog" data-active={state.minRating !== DEFAULT_STATE.minRating} onClick={() => onOpen("rating")}>
          Rating {ratingLabel(state.minRating)}
          <CaretDown size={14} weight="bold" aria-hidden="true" />
        </button>
        <button type="button" className="chip" aria-pressed={state.openNow} onClick={() => onChange({ openNow: !state.openNow })}>
          Buka sekarang
        </button>
        <button type="button" className="chip" aria-pressed={state.murah} onClick={() => onChange({ murah: !state.murah })}>
          Murah
        </button>
        {hasCustomFilters(state) && (
          <button type="button" className="chip" onClick={onReset}>
            <ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
