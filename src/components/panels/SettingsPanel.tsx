"use client";

import { Gauge, Zap, MessageSquare, Mountain, Activity } from "lucide-react";
import { useCompanionStore } from "@/lib/store/companionStore";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SettingsPanel() {
  const settings = useCompanionStore((s) => s.settings);
  const setSetting = useCompanionStore((s) => s.setSetting);
  const isPaused = useCompanionStore((s) => s.isPaused);
  const togglePause = useCompanionStore((s) => s.togglePause);
  const companions = useCompanionStore((s) => s.companions);

  const count = Object.keys(companions).length;

  return (
    <div className="p-5 sm:p-6 space-y-6">
      {/* Engine status */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Engine Status</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="State" value={isPaused ? "Paused" : "Running"} accent={isPaused ? "text-amber-300" : "text-emerald-300"} />
          <Stat label="Companions" value={String(count)} />
          <Stat label="FPS target" value="60" />
        </div>
        <button
          onClick={togglePause}
          className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
        >
          {isPaused ? "Resume engine" : "Pause engine"}
        </button>
      </section>

      {/* Physics */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Physics</h3>
        </div>
        <div className="space-y-4">
          <SliderRow
            icon={Zap}
            label="Gravity scale"
            value={settings.gravityScale}
            min={0.3}
            max={2}
            step={0.1}
            onChange={(v) => setSetting("gravityScale", v)}
            format={(v) => `${v.toFixed(1)}×`}
            hint="Lower = floaty moon jumps. Higher = heavy falls."
          />
          <SliderRow
            icon={Gauge}
            label="Speed scale"
            value={settings.speedScale}
            min={0.4}
            max={2}
            step={0.1}
            onChange={(v) => setSetting("speedScale", v)}
            format={(v) => `${v.toFixed(1)}×`}
            hint="Movement + animation speed multiplier."
          />
        </div>
      </section>

      {/* Behaviour */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Behaviour</h3>
        </div>
        <div className="space-y-3">
          <ToggleRow
            icon={MessageSquare}
            label="Speech bubbles"
            description="Time-based greetings and state quotes at high affinity."
            checked={settings.speechEnabled}
            onChange={(v) => setSetting("speechEnabled", v)}
          />
          <ToggleRow
            icon={Mountain}
            label="Wall climbing"
            description="Allow companions to climb screen edges and hang from the ceiling."
            checked={settings.climbEnabled}
            onChange={(v) => setSetting("climbEnabled", v)}
          />
        </div>
      </section>

      <p className="text-[11px] text-white/40 leading-relaxed">
        All physics runs in a single requestAnimationFrame loop with a clamped
        fixed timestep. Position updates apply directly to the DOM via transforms
        — React state only updates on logical transitions, keeping animation
        smooth across Windows, macOS, and Linux browsers.
      </p>
    </div>
  );
}

function Stat({ label, value, accent = "text-white" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-white/5 py-2.5">
      <div className={`text-base font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function SliderRow({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-white/60" />
          <Label className="text-sm font-medium text-white/90">{label}</Label>
        </div>
        <span className="text-sm font-semibold text-white tabular-nums">{format(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
      {hint && <p className="text-[10px] text-white/40 mt-1.5">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
      <div className="flex items-start gap-2.5 pr-3">
        <Icon className="w-3.5 h-3.5 text-white/60 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-white/90">{label}</div>
          <div className="text-[10px] text-white/40 leading-snug">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
