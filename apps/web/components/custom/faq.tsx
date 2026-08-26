// @polsia:user-owned — FAQ accordion for the landing page.

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export interface FaqEntry {
  question: string;
  answer: React.ReactNode;
}

export function Faq({ items, className }: { items: readonly FaqEntry[]; className?: string }) {
  return (
    <Accordion type="single" collapsible className={cn('w-full', className)}>
      {items.map((item) => (
        <AccordionItem
          key={item.question}
          value={item.question}
          className="rounded-lg border border-border bg-card px-4 transition-colors hover:border-brand-400/60 [&[data-state=open]]:border-brand-500/70 [&[data-state=open]]:bg-card"
        >
          <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
