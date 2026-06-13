"use client";

import { cn } from "@/utils/helpers";
import type { FaqDraft, HoursDraft, MenuItemDraft } from "../types";
import type { StepProps } from "../Wizard";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIMES = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "Midnight",
];

interface IndustryConfig {
  itemsLabel: string;
  itemsSubLabel: string;
  itemsDesc: string;
  categoryOptions: string[];
  namePlaceholder: string;
  pricePlaceholder: string;
  descPlaceholder: string;
  offerLabel: string;
  offerPlaceholder: string;
  showBookingLink: boolean;
  showLoyalty: boolean;
  faqPresets: FaqDraft[];
}

const RESTAURANT_CONFIG: IndustryConfig = {
  itemsLabel: "Your Menu",
  itemsSubLabel: "Dishes & drinks",
  itemsDesc: "Add your most popular items — the AI references these when guests ask what to order, and mentions them in personalized outreach.",
  categoryOptions: ["Appetizers", "Mains", "Sides", "Desserts", "Drinks", "Specials", "Brunch", "Kids"],
  namePlaceholder: "e.g. Truffle Risotto",
  pricePlaceholder: "18",
  descPlaceholder: "e.g. Arborio rice, black truffle, parmesan cream",
  offerLabel: "Current special or promotion",
  offerPlaceholder: "e.g. Happy hour Mon–Fri 4–6 PM, 50% off appetizers",
  showBookingLink: true,
  showLoyalty: false,
  faqPresets: [
    { question: "Do you take reservations?", answer: "" },
    { question: "Do you have vegetarian/vegan options?", answer: "" },
    { question: "Is there parking nearby?", answer: "" },
    { question: "Do you have a private dining room?", answer: "" },
  ],
};

function getConfig(_industry: string): IndustryConfig {
  return RESTAURANT_CONFIG;
}

const inputClass =
  "w-full rounded-btn border border-line bg-base px-3 py-2 text-sm text-content placeholder:text-content-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";
const selectClass =
  "w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-heading text-sm font-semibold text-content">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-content-muted">{subtitle}</p>}
    </div>
  );
}

interface MenuEditorProps {
  items: MenuItemDraft[];
  onChange: (items: MenuItemDraft[]) => void;
  cfg: IndustryConfig;
}

function MenuEditor({ items, onChange, cfg }: MenuEditorProps) {
  function addItem() {
    onChange([...items, { name: "", category: cfg.categoryOptions[0], price: "", description: "" }]);
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, patch: Partial<MenuItemDraft>) {
    onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-btn border border-line bg-base p-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-2">
            <input
              type="text"
              placeholder={cfg.namePlaceholder}
              value={item.name}
              onChange={(e) => updateItem(i, { name: e.target.value })}
              className={inputClass}
            />
            <select
              value={item.category}
              onChange={(e) => updateItem(i, { category: e.target.value })}
              className="rounded-btn border border-line bg-surface px-2 py-2 text-xs text-content focus:border-accent focus:outline-none"
            >
              {cfg.categoryOptions.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="rounded-btn p-2 text-content-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
              aria-label="Remove item"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-content-muted">$</span>
              <input
                type="number"
                placeholder={cfg.pricePlaceholder}
                value={item.price}
                onChange={(e) => updateItem(i, { price: e.target.value })}
                min={0}
                step="0.01"
                className="w-full rounded-btn border border-line bg-base pl-6 pr-2 py-2 text-sm text-content focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder={cfg.descPlaceholder}
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-dashed border-line py-2.5 text-sm text-content-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add {cfg.itemsSubLabel}
      </button>
    </div>
  );
}

interface HoursEditorProps {
  hours: Record<string, HoursDraft>;
  onChange: (hours: Record<string, HoursDraft>) => void;
}

function HoursEditor({ hours, onChange }: HoursEditorProps) {
  function update(day: string, patch: Partial<HoursDraft>) {
    onChange({ ...hours, [day]: { ...hours[day], ...patch } });
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const h = hours[day] ?? { open: "9:00 AM", close: "5:00 PM", closed: false };
        return (
          <div key={day} className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2">
            <span className="text-xs font-medium text-content">{day.slice(0, 3)}</span>
            {h.closed ? (
              <>
                <span className="col-span-2 text-xs text-content-muted italic">Closed</span>
              </>
            ) : (
              <>
                <select
                  value={h.open}
                  onChange={(e) => update(day, { open: e.target.value })}
                  className="rounded-btn border border-line bg-surface px-2 py-1.5 text-xs text-content focus:border-accent focus:outline-none"
                >
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <select
                  value={h.close}
                  onChange={(e) => update(day, { close: e.target.value })}
                  className="rounded-btn border border-line bg-surface px-2 py-1.5 text-xs text-content focus:border-accent focus:outline-none"
                >
                  {TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </>
            )}
            <label className="flex cursor-pointer items-center gap-1">
              <input
                type="checkbox"
                checked={h.closed}
                onChange={(e) => update(day, { closed: e.target.checked })}
                className="rounded border-line"
              />
              <span className="text-[10px] text-content-muted">Closed</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}

interface FaqEditorProps {
  faq: FaqDraft[];
  onChange: (faq: FaqDraft[]) => void;
  presets: FaqDraft[];
}

function FaqEditor({ faq, onChange, presets }: FaqEditorProps) {
  function update(i: number, patch: Partial<FaqDraft>) {
    onChange(faq.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function addBlank() {
    onChange([...faq, { question: "", answer: "" }]);
  }

  function remove(i: number) {
    onChange(faq.filter((_, idx) => idx !== i));
  }

  function applyPreset(preset: FaqDraft) {
    if (!faq.some((f) => f.question === preset.question)) {
      onChange([...faq, { ...preset }]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const applied = faq.some((f) => f.question === p.question);
          return (
            <button
              key={p.question}
              type="button"
              onClick={() => applyPreset(p)}
              disabled={applied}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                applied
                  ? "border-accent/30 bg-accent/10 text-accent/60 cursor-default"
                  : "border-line text-content-muted hover:border-accent hover:text-accent"
              )}
            >
              {applied ? "✓ " : "+ "}{p.question}
            </button>
          );
        })}
      </div>

      {faq.map((f, i) => (
        <div key={i} className="rounded-btn border border-line bg-base p-3 space-y-2">
          <div className="flex items-start gap-2">
            <input
              type="text"
              placeholder="Question customers often ask…"
              value={f.question}
              onChange={(e) => update(i, { question: e.target.value })}
              className={cn(inputClass, "flex-1")}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-btn p-2 text-content-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <textarea
            rows={2}
            placeholder="How should the AI answer this?"
            value={f.answer}
            onChange={(e) => update(i, { answer: e.target.value })}
            className="w-full rounded-btn border border-line bg-base px-3 py-2 text-sm text-content placeholder:text-content-muted/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors resize-none"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addBlank}
        className="flex w-full items-center justify-center gap-1.5 rounded-btn border border-dashed border-line py-2 text-xs text-content-muted transition-colors hover:border-accent hover:text-accent"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add custom FAQ
      </button>
    </div>
  );
}

export function StepBusinessProfile({ state, update }: StepProps) {
  const cfg = getConfig(state.industry);

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-content">
        Build your restaurant profile
      </h2>
      <p className="mt-1 text-sm text-content-muted">
        The more detail you add here, the smarter your AI becomes — it&apos;ll reference your menu, hours, and specials in every message.
      </p>

      <div className="mt-6 space-y-8">

        {/* Items — menu / services / products / classes */}
        <div>
          <SectionHeader title={cfg.itemsLabel} subtitle={cfg.itemsDesc} />
          <MenuEditor
            items={state.menuItems}
            onChange={(menuItems) => update({ menuItems })}
            cfg={cfg}
          />
        </div>

        {/* Business hours */}
        <div>
          <SectionHeader
            title="Business Hours"
            subtitle="Your AI will tell customers when you're open and avoid suggesting visits during closed times."
          />
          <HoursEditor
            hours={state.businessHours}
            onChange={(businessHours) => update({ businessHours })}
          />
        </div>

        {/* Contact + offer */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Phone number</label>
            <input
              type="tel"
              placeholder="(555) 000-0000"
              value={state.businessPhone}
              onChange={(e) => update({ businessPhone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Address</label>
            <input
              type="text"
              placeholder="123 Main St, City, ST"
              value={state.businessAddress}
              onChange={(e) => update({ businessAddress: e.target.value })}
              className={inputClass}
            />
          </div>
          {cfg.showBookingLink && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-muted">Booking / reservation link</label>
              <input
                type="url"
                placeholder="https://…"
                value={state.bookingLink}
                onChange={(e) => update({ bookingLink: e.target.value })}
                className={inputClass}
              />
            </div>
          )}
          {cfg.showLoyalty && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-muted">Loyalty program</label>
              <input
                type="text"
                placeholder="e.g. 10th visit free, punch-card rewards"
                value={state.loyaltyProgram}
                onChange={(e) => update({ loyaltyProgram: e.target.value })}
                className={inputClass}
              />
            </div>
          )}
          <div className={cfg.showBookingLink || cfg.showLoyalty ? "sm:col-span-2" : ""}>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">{cfg.offerLabel}</label>
            <input
              type="text"
              placeholder={cfg.offerPlaceholder}
              value={state.specialOffer}
              onChange={(e) => update({ specialOffer: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        {/* FAQ */}
        <div>
          <SectionHeader
            title="Quick FAQ"
            subtitle="Teach the AI how to answer your most common customer questions — it will use these verbatim."
          />
          <FaqEditor
            faq={state.faq}
            onChange={(faq) => update({ faq })}
            presets={cfg.faqPresets}
          />
        </div>

        {/* Preview of what AI now knows */}
        <div className="rounded-card border border-accent/20 bg-accent/5 px-4 py-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-accent/70">
            What your AI now knows
          </p>
          <ul className="space-y-1 text-xs text-content-muted">
            {state.menuItems.filter((i) => i.name.trim()).length > 0 && (
              <li>
                <span className="text-green-400 mr-1">✓</span>
                {state.menuItems.filter((i) => i.name.trim()).length} {cfg.itemsSubLabel.toLowerCase()} on file
              </li>
            )}
            {Object.values(state.businessHours).some((h) => !h.closed) && (
              <li>
                <span className="text-green-400 mr-1">✓</span>
                Business hours configured
              </li>
            )}
            {state.specialOffer.trim() && (
              <li>
                <span className="text-green-400 mr-1">✓</span>
                Current offer: <span className="italic text-content">"{state.specialOffer.slice(0, 60)}{state.specialOffer.length > 60 ? "…" : ""}"</span>
              </li>
            )}
            {state.faq.filter((f) => f.question.trim() && f.answer.trim()).length > 0 && (
              <li>
                <span className="text-green-400 mr-1">✓</span>
                {state.faq.filter((f) => f.question.trim() && f.answer.trim()).length} FAQ answer{state.faq.filter((f) => f.question.trim() && f.answer.trim()).length > 1 ? "s" : ""} loaded
              </li>
            )}
            {!state.menuItems.filter((i) => i.name.trim()).length &&
             !state.specialOffer.trim() &&
             !state.faq.filter((f) => f.question.trim() && f.answer.trim()).length && (
              <li className="text-content-muted/60 italic">Fill in the sections above to power up your AI — this step is optional but highly recommended.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
