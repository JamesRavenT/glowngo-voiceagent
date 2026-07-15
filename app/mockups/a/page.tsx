"use client";

import Image from "next/image";
import { Familjen_Grotesk, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const display = Familjen_Grotesk({ subsets: ["latin"], variable: "--display" });
const body = Inter_Tight({ subsets: ["latin"], variable: "--body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono" });

export default function ChairSide() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  return (
    <main className={`${styles.page} ${display.variable} ${body.variable} ${mono.variable}`}>
      <Image src="/Hero.png" alt="Glow & Go salon interior" fill priority className={styles.photo} />
      <div className={styles.shade} />
      <Image src="/Navbar Text.png" alt="Glow & Go" width={162} height={64} className={styles.logo} priority />
      <div className={styles.copy}>
        <p>Los Angeles · By appointment</p>
        <h1>Your chair<br />is waiting.</h1>
      </div>
      <button className={styles.call} onClick={() => setOpen(true)} aria-haspopup="dialog">Call the salon <span>↗</span></button>
      <p className={styles.disclaimer}>STATIC MOCKUP · JAMES RAVEN TABAG · NO LIVE AI</p>

      <dialog ref={dialogRef} className={styles.dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
        <div className={styles.cone} aria-hidden="true" />
        <div className={styles.panel}>
          <header><span>G&amp;G / LIVE</span><span className={styles.timer}>02:14</span></header>
          <div className={styles.wave} aria-hidden="true">{[18,42,68,32,78,52,88,38,64,28,72,46,82,34,58,22].map((h,i)=><i key={i} style={{height:`${h}%`}} />)}</div>
          <div className={styles.transcript} aria-label="Call transcript">
            <p><b>AGENT</b> Welcome to Glow &amp; Go. How can I help?</p>
            <p><b>YOU</b> I’d love a haircut this Friday afternoon.</p>
            <p><b>AGENT</b> I have 2:30 or 4:00 available.</p>
            <p><b>YOU</b> Let’s do 2:30.</p>
          </div>
          <button className={styles.end} onClick={() => dialogRef.current?.close()}>End call</button>
        </div>
      </dialog>
    </main>
  );
}
