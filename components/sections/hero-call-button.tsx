"use client";

import { Mic } from "lucide-react";

import { useCall } from "@/components/call/call-provider";
import { Button } from "@/components/ui/button";
import { contactCopy } from "@/content";

export function HeroCallButton() {
  const { open } = useCall();

  return (
    <Button
      type="button"
      aria-label={contactCopy.floatingCallButtonAccessibleName}
      onClick={() => open("hero")}
      className="mt-6 h-auto rounded-none px-6 py-4 font-utility text-xs uppercase tracking-[0.12em] md:hidden"
    >
      <Mic aria-hidden="true" className="size-4" />
      <span aria-hidden="true">Book Now</span>
    </Button>
  );
}
