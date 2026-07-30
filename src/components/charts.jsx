import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

// Every chart in the product, in one file.
//
// This is the only place that imports the charting library, and App.jsx loads
// this file lazily. The library is about 545KB, it is used only on signed-in
// screens, and before this change every visitor to the public marketing site
// downloaded it before the page could run.
//
// Each chart keeps exactly the markup it had in App.jsx, so nothing about how
// they look or behave has changed.

const AXIS = { fontSize: 12, fill: "#69768F" };
const AXIS_SM = { fontSize: 11, fill: "#6B7A93" };

function PipelineTrend({ data }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data}>
        <defs><linearGradient id="d1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00C2B8" stopOpacity={.26} /><stop offset="100%" stopColor="#0E8C7E" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F8" vertical={false} />
        <XAxis dataKey="m" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="v" stroke="#0E8C7E" strokeWidth={2.5} fill="url(#d1)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatusBars({ data, statusFilter, onSelect }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF5" />
        <XAxis dataKey="name" tick={{ fontSize: 9.5, fill: "#6B7A93" }} interval={0} angle={-14} textAnchor="end" height={48} />
        <YAxis allowDecimals={false} tick={AXIS_SM} />
        <Tooltip />
        <Bar dataKey="v" radius={[6, 6, 0, 0]} style={{ cursor: "pointer" }} onClick={(_d, i) => onSelect && onSelect(i)}>
          {data.map((d, i) => (<Cell key={i} fill={d.c} opacity={statusFilter == null || statusFilter === i ? 1 : 0.35} />))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TimeToFill({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <defs><linearGradient id="ttf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0E8C7E" stopOpacity={0.5} /><stop offset="100%" stopColor="#0E8C7E" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF5" />
        <XAxis dataKey="w" tick={AXIS_SM} />
        <YAxis tick={AXIS_SM} />
        <Tooltip />
        <Area type="monotone" dataKey="d" stroke="#0E8C7E" strokeWidth={2.5} fill="url(#ttf)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RegionBars({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F8" horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="r" tick={AXIS} width={90} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey="v" fill="#0E8C7E" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SpecialtyPie({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((s, i) => <Cell key={i} fill={s.c} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function GmvTrend({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00C2B8" stopOpacity={.26} /><stop offset="100%" stopColor="#0E8C7E" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDF1F8" vertical={false} />
        <XAxis dataKey="m" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip />
        <Area type="monotone" dataKey="v" stroke="#0E8C7E" strokeWidth={2.6} fill="url(#pg)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const KINDS = {
  pipeline: PipelineTrend,
  status: StatusBars,
  timeToFill: TimeToFill,
  region: RegionBars,
  specialty: SpecialtyPie,
  gmv: GmvTrend,
};

export default function Charts({ kind, ...rest }) {
  const C = KINDS[kind];
  return C ? <C {...rest} /> : null;
}
