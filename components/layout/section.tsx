import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const SECTION_SCROLL_OFFSET_PX = 96;

type SectionProps = Omit<ComponentPropsWithoutRef<"section">, "id"> & {
  id: string;
  heading?: string;
  headingLevel?: 1 | 2;
  children?: ReactNode;
};

export function Section({
  id,
  heading,
  headingLevel = 2,
  children,
  className,
  ...props
}: SectionProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <section
      id={id}
      aria-labelledby={props["aria-labelledby"] ?? (heading ? `${id}-heading` : undefined)}
      className={cn("scroll-mt-24", className)}
      {...props}
    >
      {heading && (
        <Heading
          id={`${id}-heading`}
          className="font-display text-5xl font-medium tracking-[-0.055em] text-cream sm:text-7xl"
        >
          {heading}
        </Heading>
      )}
      {children}
    </section>
  );
}
