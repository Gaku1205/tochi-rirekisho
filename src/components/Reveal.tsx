"use client";

// 欄の部品が画面に入ったときに、印（data-reveal）の付いた物を出す。スクリプトが無ければ最初から出ている。
// 下から開く物（wipe）は自分が見えない大きさなので、親が画面に入ったかで決める。
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)")];
    const targets = new Map<Element, HTMLElement[]>();
    for (const el of els) {
      const watch = el.dataset.reveal === "wipe" && el.parentElement ? el.parentElement : el;
      targets.set(watch, [...(targets.get(watch) ?? []), el]);
    }
    const show = (watch: Element) => {
      targets.get(watch)?.forEach((t) => t.classList.add("is-in"));
      io.unobserve(watch);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) show(e.target);
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0 },
    );
    targets.forEach((_, watch) => io.observe(watch));
    root.classList.add("can-reveal");
    // 見落としが無いように：画面より上に過ぎた物は、必ず出す
    const sweep = () => {
      targets.forEach((_, watch) => {
        if (watch.getBoundingClientRect().top < innerHeight) show(watch);
      });
    };
    const timer = window.setInterval(sweep, 800);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, [path]);
  return null;
}
