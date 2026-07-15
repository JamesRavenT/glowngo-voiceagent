"use client";

import Image from "next/image";
import { Inter_Tight, JetBrains_Mono, Newsreader } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

const display = Newsreader({ subsets: ["latin"], variable: "--display", style: ["normal", "italic"] });
const body = Inter_Tight({ subsets: ["latin"], variable: "--body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--mono" });

export default function BrassAndMirror() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog=dialogRef.current; if(open&&dialog&&!dialog.open) dialog.showModal(); }, [open]);
  return (
    <main className={`${styles.page} ${display.variable} ${body.variable} ${mono.variable}`}>
      <Image src="/Navbar Text.png" alt="Glow & Go" width={156} height={62} className={styles.logo} priority />
      <p className={styles.corner}>Los Angeles · Hair atelier</p>
      <p className={styles.disclaimer}>STATIC MOCKUP · JAMES RAVEN TABAG · NO LIVE AI</p>
      <section className={styles.mirror}>
        <Image src="/Hero.png" alt="The illuminated mirrors at Glow & Go" fill priority className={styles.photo} />
        <div className={styles.copy}><p>A private appointment with</p><h1>Your <em>best light.</em></h1></div>
      </section>
      <button className={styles.call} onClick={() => setOpen(true)} aria-haspopup="dialog"><span>●</span> Wake the mirror</button>
      <dialog ref={dialogRef} className={styles.dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
        <div className={styles.glass}>
          <header><span>GLOW &amp; GO</span><span>02:14</span></header>
          <div className={styles.orb} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          <p className={styles.status}>LISTENING</p>
          <div className={styles.transcript}>
            <p><b>AGENT</b> Good evening. How may I help?</p>
            <p><b>YOU</b> I’m looking for a fresh cut.</p>
            <p><b>AGENT</b> Do you have a stylist in mind?</p>
            <p><b>YOU</b> Surprise me.</p>
          </div>
          <button onClick={() => dialogRef.current?.close()}>Close mirror</button>
        </div>
      </dialog>
    </main>
  );
}
