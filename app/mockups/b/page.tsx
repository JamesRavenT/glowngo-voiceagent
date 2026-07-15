"use client";

import Image from "next/image";
import { Bricolage_Grotesque, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--display" });
const body = Inter_Tight({ subsets: ["latin"], variable: "--body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono" });
const bars = [22,38,68,44,86,58,28,74,48,92,62,34,76,52,84,40,66,26,54,78,46,88,32,70,50,80,36,60];

export default function TheVoice() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus();
    }
  }, [open]);

  function close() {
    setOpen(false);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <main className={`${styles.page} ${display.variable} ${body.variable} ${mono.variable}`}>
      <div className={styles.background} inert={open ? true : undefined} aria-hidden={open || undefined}>
        <Image src="/Navbar Text.png" alt="Glow & Go" width={150} height={60} className={styles.logo} priority />
        <Image src="/Hero.png" alt="Salon styling detail" width={280} height={360} className={styles.inset} priority />
        <p className={styles.disclaimer}>STATIC MOCKUP · JAMES RAVEN TABAG · NO LIVE AI</p>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Glow &amp; Go voice concierge · standing by</p>
          <h1><span>Hello.</span> What can I<br />do for your hair?</h1>
          <div className={styles.wavePlaceholder} />
          <button ref={triggerRef} className={styles.call} onClick={() => setOpen(true)} aria-haspopup="dialog"><span>Start a conversation</span><b>Speak now ↗</b></button>
        </section>
      </div>

      <motion.div
        layout
        className={`${styles.wave} ${open ? styles.waveOpen : styles.waveClosed}`}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 24 }}
        aria-hidden="true"
      >
        {bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
      </motion.div>

      {open && (
        <div className={styles.overlay} onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-dialog-title"
            onKeyDown={handleDialogKeyDown}
            initial={reduceMotion ? false : { opacity: 0, scaleY: 0.82 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28, delay: 0.12 }}
          >
            <header><span id="voice-dialog-title">VOICE CHANNEL / ACTIVE</span><span>02:14</span></header>
            <div className={styles.transcript}>
              <p><b>AGENT</b> Hello. What can I do for your hair?</p>
              <p><b>YOU</b> Can I book a color consultation?</p>
              <p><b>AGENT</b> Absolutely. Which day works for you?</p>
              <p><b>YOU</b> Thursday, after lunch.</p>
              <p><b>AGENT</b> I can offer 1:30 or 3:00.</p>
            </div>
            <button onClick={close}>End conversation</button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
