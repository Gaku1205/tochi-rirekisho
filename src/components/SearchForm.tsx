"use client";

// 住所欄。調べている間は、地図の上に札を出し、全部そろってから一度に結果を出す。
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { searchAddress } from "@/lib/search";

export default function SearchForm({ initial = "", className }: { initial?: string; className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [reading, setReading] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = searchAddress(value);
    if (r.kind === "found") {
      setReading(`${r.place.town}${r.place.block}`);
      // 地図と公開データと要約がそろうまで札を出し、そろってから一度に出す
      start(() => router.push(`/tochi/${r.place.slug}`));
    } else {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    }
  };

  return (
    <>
      <form className={`search ${className ?? ""}`} role="search" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="addr">
          福岡市の住所
        </label>
        <input
          id="addr"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="福岡市南区大橋2丁目"
          autoComplete="street-address"
          enterKeyHint="search"
        />
        <button className="btn" type="submit" disabled={pending}>
          調べる
        </button>
      </form>
      {pending && (
        <div className="reading" role="status" aria-live="polite">
          <p className="reading-name name">{reading}</p>
          <p className="reading-line">
            1926年の地形図・1948年と1975年の空中写真・浸水と地盤と地価のデータを重ねて、読み解いています
          </p>
          <p className="reading-years yr" aria-hidden="true">
            <span>1926</span>
            <span>1948</span>
            <span>1975</span>
            <span>2026</span>
          </p>
        </div>
      )}
    </>
  );
}
