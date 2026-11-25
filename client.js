window.__ModuleLoader__.load({
  id: '@zhiyu.pub/dsh-token-bill',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useCallback, useMemo, useRef } = React

    const C = {
      base: 'var(--dsw-alias-bg-base)',
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      border1: 'var(--dsw-alias-border-l1)',
      border2: 'var(--dsw-alias-border-l2)',
      primary: 'var(--dsw-alias-label-primary)',
      secondary: 'var(--dsw-alias-label-secondary)',
      brand: 'var(--dsw-alias-brand-primary)',
      error: 'var(--dsw-alias-state-error-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      success: 'var(--dsw-alias-state-success-primary)',
    }
    const VI = {
      navy: '#2A4A78', teal: '#159A99', moon: '#84A5D2', ivory: '#E8EEF7',
      paper: '#F2ECDE', card: '#FFFDF6', gold: '#F9E87F', yellow: '#F9D76C',
      red: '#9E2B25', ink: '#3D3B4F', gray: '#75878A', jade: '#45B8A1',
    }
    const SERIES = [VI.moon, VI.teal, VI.yellow, VI.red, VI.jade, VI.navy, VI.gray, VI.gold]
    const TOP_COLORS = [
      { bar: '#B55245', soft: 'rgba(181,82,69,.10)', ink: '#fff' },
      { bar: '#D9A441', soft: 'rgba(217,164,65,.14)', ink: '#3D3B4F' },
      { bar: '#84A5D2', soft: 'rgba(132,165,210,.14)', ink: '#2A4A78' },
    ]
    const COST_TYPE_COLORS = {
      command: '#84A5D2',
      file_edit: '#D9A441',
      file_read: '#45B8A1',
      web: '#B55245',
      multi: '#159A99',
      other: '#75878A',
      reply: '#F9D76C',
    }

    const CSS = `
      .tb-root {
        height: 100%; overflow-y: auto; padding: 26px 30px 56px;
        color: ${C.primary}; font-size: 13.5px; line-height: 1.55;
        --tb-paper: color-mix(in srgb, ${VI.paper} 20%, var(--dsw-alias-bg-base));
        --tb-card: color-mix(in srgb, ${VI.card} 24%, var(--dsw-alias-bg-layer-1));
        --tb-line: color-mix(in srgb, ${VI.navy} 18%, var(--dsw-alias-border-l1));
        --tb-line-strong: color-mix(in srgb, ${VI.navy} 32%, var(--dsw-alias-border-l1));
        background: var(--tb-paper);
      }
      .tb-root *, .tb-root *::before, .tb-root *::after { box-sizing: border-box; }
      .tb-wrap { max-width: 1120px; margin: 0 auto; display: grid; gap: 18px; }
      .tb-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .tb-title { font-family: "Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", serif; font-size: 25px; font-weight: 600; letter-spacing: .08em; display: inline-block; padding-bottom: 2px; border-bottom: 2px solid rgba(21,154,153,.32); }
      .tb-sub { color: ${C.secondary}; font-size: 12px; margin-top: 4px; }
      .tb-tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .tb-seg { display: flex; gap: 2px; background: color-mix(in srgb, var(--tb-card) 72%, ${C.layer2}); padding: 3px; border-radius: 9px; border: 1px solid var(--tb-line); }
      .tb-seg button { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: ${C.secondary}; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit; transition: background .18s ease, color .18s ease, transform .12s ease; }
      .tb-seg button:active { transform: scale(.96); }
      .tb-seg button[aria-pressed="true"] { background: var(--tb-card); color: ${C.primary}; box-shadow: 0 1px 3px rgba(42,74,120,.12); }
      .tb-btn { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--tb-line); background: var(--tb-card); color: ${C.primary}; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family: inherit; transition: background .18s ease, border-color .18s ease, transform .12s ease; }
      .tb-btn:hover { background: color-mix(in srgb, ${VI.moon} 10%, var(--tb-card)); }
      .tb-btn:active { transform: scale(.97); }
      .tb-btn:hover { border-color: ${C.border2}; }
      .tb-btn:disabled { opacity: .55; cursor: default; }
      .tb-btn:focus-visible, .tb-seg button:focus-visible { outline: 2px solid ${C.brand}; outline-offset: 2px; }
      .tb-card { background: var(--tb-card); border: 1px solid var(--tb-line); border-radius: 16px; padding: 20px 22px 18px; min-width: 0; box-shadow: 0 1px 2px rgba(42,74,120,.045), 0 2px 8px rgba(42,74,120,.035); }
      .tb-card-h { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
      .tb-card-t { font-size: 15px; font-weight: 600; letter-spacing: .1px; }
      .tb-card-s { font-size: 11.5px; color: ${C.secondary}; }
      .tb-kpis { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
      .tb-kpi { background: var(--tb-card); border: 1px solid var(--tb-line); border-radius: 14px; padding: 15px 16px; min-width: 0; box-shadow: 0 1px 2px rgba(42,74,120,.04); }
      .tb-kpi-head { display: flex; align-items: center; gap: 7px; margin-bottom: 2px; }
      .tb-kpi-icon { width: 24px; height: 24px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; flex: none; }
      .tb-kpi-l { font-size: 10.5px; color: ${C.secondary}; letter-spacing: .4px; }
      .tb-kpi-v { font-size: 24px; font-weight: 620; margin-top: 4px; letter-spacing: -.2px; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tb-kpi-s { font-size: 11px; color: ${C.secondary}; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tb-grid2 { display: grid; grid-template-columns: 1.25fr .75fr; gap: 13px; }
      .tb-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
      @media (max-width: 900px) { .tb-kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .tb-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 860px) { .tb-grid2, .tb-grid3 { grid-template-columns: 1fr; } .tb-root { padding: 16px 14px 40px; } }
      @media (max-width: 640px) {
        .tb-model { grid-template-columns: minmax(96px, 1.4fr) 74px minmax(60px, 1fr); }
        .tb-model > :nth-child(4), .tb-model > :nth-child(5) { display: none; }
        .tb-task { grid-template-columns: 20px minmax(0, 1.4fr) 82px; }
        .tb-task > :nth-child(4) { display: none; }
        .tb-kpi-v { font-size: 19px; }
      }
      .tb-row { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; align-items: center; }
      .tb-bar { height: 6px; border-radius: 99px; background: ${C.layer2}; overflow: hidden; }
      .tb-bar > i { display: block; height: 100%; border-radius: 99px; transition: width .35s ease; }
      .tb-mono { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
      .tb-muted { color: ${C.secondary}; }
      .tb-chart-row { display: grid; grid-template-columns: 48px minmax(0, 1fr); gap: 6px; align-items: stretch; }
      .tb-chart-axis { display: flex; flex-direction: column; justify-content: space-between; font-size: 9.5px; color: ${C.secondary}; text-align: right; padding: 8px 0 18px; font-variant-numeric: tabular-nums; }
      .tb-chart { display: flex; align-items: flex-end; gap: 3px; height: 162px; padding-top: 8px; background-image: linear-gradient(to top, var(--tb-line) 1px, transparent 1px); background-size: 100% 25%; background-position: 0 100%; }
      .tb-col { flex: 1 1 0; min-width: 4px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 5px; height: 100%; }
      .tb-col > i { display: block; width: 100%; border-radius: 5px 5px 2px 2px; background: linear-gradient(180deg, ${VI.moon}, ${VI.teal}); min-height: 3px; }
      .tb-col:hover > i { opacity: 1; filter: brightness(1.08); }
      .tb-col > span { font-size: 9.5px; color: ${C.secondary}; white-space: nowrap; }
      .tb-heat-wrap { overflow-x: auto; padding-bottom: 2px; }
      .tb-heat { display: grid; grid-template-columns: 34px repeat(24, minmax(0, 1fr)); gap: 3px; align-items: center; min-width: 430px; }
      .tb-heat-day { font-size: 10.5px; color: ${C.secondary}; text-align: right; padding-right: 2px; }
      .tb-heat-cell { height: 17px; border: 0; padding: 0; border-radius: 3px; background: ${C.layer2}; cursor: pointer; }
      .tb-heat-cell:focus-visible { outline: 2px solid ${C.brand}; outline-offset: 1px; }
      .tb-heat-hour { font-size: 9px; color: ${C.secondary}; text-align: center; }
      .tb-table { display: grid; gap: 0; }
      .tb-tr { display: grid; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid var(--tb-line); }
      .tb-tr:first-child { border-top: 0; }
      .tb-th { font-size: 10.5px; color: ${C.secondary}; letter-spacing: .3px; padding-bottom: 4px; border-bottom: 1px solid var(--tb-line); }
      .tb-model { display: grid; grid-template-columns: minmax(120px, 1.4fr) 84px minmax(90px, 1fr) 88px 62px; gap: 10px; align-items: center; }
      .tb-task { display: grid; grid-template-columns: 24px minmax(0, 1.5fr) 92px minmax(80px, .7fr); gap: 10px; align-items: center; }
      .tb-chip { display: inline-block; font-size: 10px; padding: 1px 7px; border-radius: 99px; background: ${C.layer2}; color: ${C.secondary}; border: 1px solid ${C.border1}; white-space: nowrap; }
      .tb-rank { font-size: 11px; color: ${C.secondary}; font-variant-numeric: tabular-nums; }
      .tb-task-title { font-weight: 560; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tb-task-meta { font-size: 10.5px; color: ${C.secondary}; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tb-money { font-variant-numeric: tabular-nums; font-weight: 600; text-align: right; white-space: nowrap; }
      .tb-num { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; color: ${C.secondary}; }
      .tb-sug { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
      .tb-sugcard { border: 1px solid var(--tb-line); border-radius: 14px; padding: 14px 16px; background: var(--tb-card); display: flex; flex-direction: column; gap: 7px; box-shadow: 0 1px 2px rgba(42,74,120,.035); }
      .tb-sughead { display: flex; align-items: center; gap: 7px; }
      .tb-dot { width: 7px; height: 7px; border-radius: 99px; flex: none; }
      .tb-sug-t { font-weight: 620; font-size: 13px; }
      .tb-sug-save { margin-left: auto; font-size: 11px; color: ${C.success}; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .tb-sug-p { color: ${C.secondary}; font-size: 12px; }
      .tb-sug-act { font-size: 12px; border-left: 2px solid ${C.border2}; padding-left: 8px; }
      .tb-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 12px; }
      .tb-tag { font-size: 11px; line-height: 1; padding: 4px 9px; border-radius: 99px; border: 1px solid var(--tb-line); background: color-mix(in srgb, var(--tb-card) 70%, ${C.layer2}); color: ${C.secondary}; white-space: nowrap; }
      .tb-tag.u { background: rgba(132,165,210,.16); border-color: rgba(42,74,120,.28); color: ${C.primary}; }
      .tb-tag.a { background: rgba(21,154,153,.14); border-color: rgba(21,154,153,.34); color: ${C.primary}; }
      .tb-match { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; padding: 15px 18px; background: color-mix(in srgb, ${VI.ivory} 26%, var(--tb-card)); border: 1px solid var(--tb-line); border-radius: 14px; margin-bottom: 16px; }
      .tb-match-score { font-size: 40px; font-weight: 640; line-height: 1; letter-spacing: -1.2px; font-variant-numeric: tabular-nums; }
      .tb-match-score small { font-size: 12px; color: ${C.secondary}; font-weight: 400; margin-left: 3px; letter-spacing: 0; }
      .tb-match-label { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
      .tb-axis { display: grid; grid-template-columns: 96px 1fr 58px; gap: 10px; align-items: center; padding: 5px 0; }
      .tb-axis-l { font-size: 11.5px; color: ${C.primary}; }
      .tb-axis-bars { display: grid; gap: 3px; }
      .tb-axis-track { height: 5px; border-radius: 99px; background: ${C.layer2}; overflow: hidden; }
      .tb-axis-track > i { display: block; height: 100%; border-radius: 99px; }
      .tb-axis-v { font-size: 10.5px; color: ${C.secondary}; text-align: right; font-variant-numeric: tabular-nums; }
      .tb-sun { display: flex; flex-direction: column; align-items: center; gap: 2px; }
      .tb-sun svg { max-width: 100%; height: auto; }
      .tb-radar { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
      .tb-dim { display: grid; grid-template-columns: 78px 1fr 34px; gap: 8px; align-items: center; padding: 4px 0; }
      .tb-dim-l { font-size: 11.5px; color: ${C.secondary}; }
      .tb-dim-v { font-size: 11px; text-align: right; color: ${C.secondary}; font-variant-numeric: tabular-nums; }
      .tb-links { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; color: ${C.secondary}; }
      .tb-clickable { cursor: pointer; border-radius: 8px; margin-left: -6px; margin-right: -6px; padding-left: 6px; padding-right: 6px; transition: background .16s ease; }
      .tb-clickable:hover { background: color-mix(in srgb, ${VI.moon} 10%, transparent); }
      .tb-clickable[aria-pressed="true"], .tb-clickable[aria-expanded="true"] { background: color-mix(in srgb, ${VI.teal} 9%, transparent); }
      .tb-period-row { border: 0; background: transparent; font: inherit; color: inherit; width: 100%; text-align: left; padding: 6px; border-radius: 8px; cursor: pointer; }
      .tb-period-row:hover { background: color-mix(in srgb, ${VI.moon} 10%, transparent); }
      .tb-period-row[aria-pressed="true"] { background: color-mix(in srgb, ${VI.teal} 9%, transparent); }
      .tb-domain-row { border: 0; background: transparent; font: inherit; color: inherit; width: 100%; text-align: left; padding: 5px 6px; border-radius: 8px; cursor: pointer; }
      .tb-domain-row:hover { background: color-mix(in srgb, ${VI.moon} 10%, transparent); }
      .tb-domain-row[aria-pressed="true"] { background: color-mix(in srgb, ${VI.teal} 10%, transparent); }
      .tb-col { border: 0; background: transparent; padding: 0; font: inherit; cursor: pointer; }
      .tb-col[aria-pressed="true"] > i { background: linear-gradient(180deg, ${VI.teal}, ${VI.jade}) !important; }
      .tb-detail { margin-top: 8px; padding: 8px 10px; border-radius: 9px; border: 1px solid var(--tb-line); background: color-mix(in srgb, ${VI.ivory} 16%, var(--tb-card)); font-size: 11.5px; color: ${C.secondary}; }
      .tb-filter-chip { display: inline-flex; align-items: center; gap: 3px; border: 1px solid rgba(21,154,153,.34); background: rgba(21,154,153,.12); color: ${C.primary}; border-radius: 99px; padding: 3px 9px; font-size: 11px; cursor: pointer; font-family: inherit; transition: background .18s ease, transform .12s ease; }
      .tb-filter-chip:hover { background: rgba(21,154,153,.18); }
      .tb-filter-chip:active { transform: scale(.96); }
      .tb-task-detail { display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 8px 12px 10px; margin: 0 0 4px 34px; border-left: 2px solid rgba(21,154,153,.35); font-size: 10.5px; color: ${C.secondary}; }
      .tb-tip { position: fixed; z-index: 80; pointer-events: none; background: var(--tb-card); border: 1px solid var(--tb-line-strong); border-radius: 10px; padding: 8px 10px; box-shadow: 0 8px 28px rgba(42,74,120,.18); font-size: 11px; max-width: 280px; }
      .tb-tip-t { font-weight: 600; margin-bottom: 2px; }
      .tb-tip-l { color: ${C.secondary}; line-height: 1.5; }
      .tb-legend-btn { border: 0; background: transparent; color: ${C.secondary}; font: inherit; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; padding: 2px 4px; border-radius: 6px; }
      .tb-legend-btn:hover { background: color-mix(in srgb, ${VI.moon} 10%, transparent); }
      .tb-legend-btn[aria-pressed="true"] { color: ${C.primary}; }
      .tb-search-wrap { display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 8px; border: 1px solid var(--tb-line); border-radius: 8px; background: var(--tb-card); color: ${C.secondary}; transition: border-color .18s ease, box-shadow .18s ease; }
      .tb-search-wrap:focus-within { border-color: ${VI.teal}; box-shadow: 0 0 0 3px rgba(21,154,153,.10); }
      .tb-search-wrap .tb-search { width: 118px; height: 26px; padding: 0; border: 0; background: transparent; outline: none; }
      .tb-collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .38s cubic-bezier(.2,.7,.2,1); }
      .tb-collapse-open { grid-template-rows: 1fr; }
      .tb-collapse-inner { overflow: hidden; min-height: 0; }
      .tb-collapse:not(.tb-collapse-open) .tb-collapse-inner { visibility: hidden; transition: visibility 0s .38s; }
      .tb-collapse-open .tb-collapse-inner { visibility: visible; transition: visibility 0s; }
      .tb-tabpanel { animation: tb-fade .32s ease both; }
      @keyframes tb-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
      @keyframes tb-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @keyframes tb-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      .tb-wrap > * { animation: tb-rise .5s cubic-bezier(.2,.7,.2,1) both; }
      .tb-wrap > *:nth-child(2) { animation-delay: .03s; }
      .tb-wrap > *:nth-child(3) { animation-delay: .06s; }
      .tb-wrap > *:nth-child(4) { animation-delay: .09s; }
      .tb-wrap > *:nth-child(5) { animation-delay: .12s; }
      .tb-wrap > *:nth-child(6) { animation-delay: .15s; }
      .tb-wrap > *:nth-child(7) { animation-delay: .18s; }
      .tb-wrap > *:nth-child(8) { animation-delay: .21s; }
      .tb-bar > i { transform-origin: left; animation: tb-grow .7s cubic-bezier(.2,.7,.2,1) both; }
      .tb-ring circle { transition: stroke-dashoffset .6s ease, stroke-width .2s ease; }
      .tb-heat-cell { transition: transform .15s ease, box-shadow .15s ease; }
      .tb-heat-cell:hover { transform: scale(1.18); box-shadow: 0 0 0 1px rgba(21,154,153,.45); position: relative; z-index: 1; }
      .tb-col > i { transition: height .35s ease, filter .2s ease; }
      .tb-sun path { transition: opacity .2s ease, filter .2s ease; }
      .tb-sun path:hover { filter: brightness(1.06); }
      .tb-top-summary { animation: tb-fade .3s ease both; }
      @media (prefers-reduced-motion: reduce) {
        .tb-root *, .tb-root *::before, .tb-root *::after { animation: none !important; transition: none !important; }
      }
      .tb-top3 { display: grid; gap: 4px; margin-top: 2px; padding: 10px 12px 12px; border: 1px solid var(--tb-line); border-radius: 12px; background: var(--tb-card); }
      .tb-top3-row { display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 8px 10px; border-left: 3px solid transparent; border-radius: 8px; }
      .tb-top3-rank { width: 20px; height: 20px; border-radius: 99px; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 650; }
      .tb-top3-main { min-width: 0; }
      .tb-top3-title { font-weight: 560; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tb-top3-cost { font-weight: 620; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .tb-top3-cost small { display: block; font-size: 10px; color: ${C.secondary}; font-weight: 400; margin-top: 1px; }
      .tb-rank-badge { position: absolute; top: 10px; right: 12px; width: 20px; height: 20px; border-radius: 99px; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 650; }
      .tb-taskcard { position: relative; }
      .tb-costtypes { display: flex; align-items: center; gap: 24px; }
      .tb-costtype-ring { flex: none; }
      .tb-costtype-list { flex: 1; display: grid; gap: 6px; min-width: 0; }
      .tb-costtype-row { display: grid; grid-template-columns: 9px minmax(90px, 1fr) 86px 48px; gap: 8px; align-items: center; padding: 2px 0; }
      .tb-costtype-dot { width: 8px; height: 8px; border-radius: 3px; }
      .tb-costtype-name { font-size: 12px; }
      .tb-costtype-cost { font-size: 11.5px; text-align: right; font-variant-numeric: tabular-nums; font-weight: 560; }
      .tb-costtype-share { font-size: 10.5px; color: ${C.secondary}; text-align: right; font-variant-numeric: tabular-nums; }
      .tb-costtype-bar { grid-column: 2 / -1; height: 4px; border-radius: 99px; background: ${C.layer2}; overflow: hidden; }
      .tb-costtype-bar > i { display: block; height: 100%; border-radius: 99px; }
      .tb-treemap { width: 100%; }
      .tb-heatsteps { width: 100%; }
      .tb-stepgrid { display: flex; flex-wrap: wrap; gap: 3px; max-height: 380px; overflow: auto; padding: 2px; }
      .tb-stepcell { width: 13px; height: 13px; border: 0; border-radius: 3px; padding: 0; cursor: pointer; transition: transform .12s ease, box-shadow .12s ease; }
      .tb-stepcell:hover { transform: scale(1.35); position: relative; z-index: 1; box-shadow: 0 0 0 1px rgba(42,74,120,.35); }
      .tb-costtype-meta { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--tb-line); color: ${C.secondary}; font-size: 11px; }
      @media (max-width: 640px) { .tb-costtypes { flex-direction: column; align-items: flex-start; } .tb-costtype-list { width: 100%; } }
      .tb-session-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
      .tb-switch { display: inline-flex; align-items: center; position: relative; isolation: isolate; padding: 3px; border: 1px solid var(--tb-line); border-radius: 99px; background: color-mix(in srgb, var(--tb-card) 70%, ${VI.ivory}); }
      .tb-switch-thumb { position: absolute; top: 3px; bottom: 3px; left: 3px; width: 0; border-radius: 99px; background: var(--tb-switch-accent); box-shadow: 0 2px 7px color-mix(in srgb, var(--tb-switch-accent) 35%, transparent); transition: transform .26s cubic-bezier(.22,1,.36,1), width .26s cubic-bezier(.22,1,.36,1), background .2s ease; z-index: 0; }
      .tb-switch button { position: relative; z-index: 1; flex: 0 0 auto; border: 0; border-radius: 99px; background: transparent; color: ${C.secondary}; padding: 5px 14px; font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; transition: color .18s ease; }
      .tb-filter-chips { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .tb-filter-chip { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--tb-line); border-radius: 99px; background: color-mix(in srgb, ${VI.moon} 10%, var(--tb-card)); color: ${C.secondary}; padding: 4px 9px; font: inherit; font-size: 10.5px; cursor: pointer; }
      .tb-filter-chip:hover { color: ${C.primary}; border-color: color-mix(in srgb, ${VI.navy} 30%, var(--tb-line)); }
      .tb-filter-x { font-size: 12px; line-height: 1; opacity: .7; }
      .tb-switch button[aria-selected="true"] { color: #fff; font-weight: 600; }
      .tb-module-switch { margin: 2px 0; }
      .tb-detail-line { display: flex; justify-content: space-between; gap: 10px; padding: 5px 0; border-bottom: 1px solid rgba(42,74,120,.08); font-size: 11.5px; }
      .tb-detail-line:last-child { border-bottom: 0; }
      .tb-step-table { display: grid; max-height: 430px; overflow: auto; }
      .tb-step-tr { display: grid; grid-template-columns: 32px 104px minmax(0, 1fr) 64px 84px; gap: 8px; align-items: center; padding: 5px 4px; border-bottom: 1px solid rgba(42,74,120,.08); font-size: 11px; }
      .tb-step-th { position: sticky; top: 0; z-index: 1; background: var(--tb-card); color: ${C.secondary}; font-size: 10px; }
      .tb-step-tr .right { text-align: right; }
      .tb-step-tool { color: ${C.secondary}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tb-step-meta { color: ${C.secondary}; }
      .tb-step-dot { display: inline-block; width: 7px; height: 7px; border-radius: 3px; margin-right: 5px; }
      @media (max-width: 640px) { .tb-step-tr { grid-template-columns: 28px 90px minmax(0,1fr) 54px 72px; } }
      .tb-session-ring { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
      .tb-primary-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; border-bottom: 1px solid var(--tb-line); }
      .tb-primary-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
      .tb-primary-tab { display: inline-flex; align-items: center; gap: 6px; border: 1px solid transparent; border-bottom: 0; background: transparent; color: ${C.secondary}; padding: 9px 15px; border-radius: 10px 10px 0 0; font: inherit; font-size: 13px; cursor: pointer; position: relative; top: 1px; transition: background .18s ease, color .18s ease; }
      .tb-primary-tab:hover { background: color-mix(in srgb, ${VI.moon} 10%, transparent); color: ${C.primary}; }
      .tb-primary-tools { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .tb-github { text-decoration: none; }
      .tb-github-stars { display: inline-flex; align-items: center; gap: 3px; margin-left: 1px; padding-left: 7px; border-left: 1px solid var(--tb-line); color: #B58A2A; font-variant-numeric: tabular-nums; }
      .tb-report { position: relative; }
      .tb-report-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 40; width: 210px; padding: 5px; background: var(--tb-card); border: 1px solid var(--tb-line); border-radius: 10px; box-shadow: 0 14px 38px rgba(42,74,120,.16); }
      .tb-report-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 9px; border: 0; border-radius: 7px; background: transparent; color: ${C.primary}; font: inherit; text-align: left; cursor: pointer; }
      .tb-report-item:hover { background: color-mix(in srgb, ${VI.moon} 13%, transparent); }
      .tb-report-item > span { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .tb-report-item strong { font-size: 12px; font-weight: 600; }
      .tb-report-item small { font-size: 10px; color: ${C.secondary}; }
      .tb-report-error { position: absolute; right: 0; top: calc(100% + 6px); z-index: 41; max-width: 260px; padding: 6px 9px; border: 1px solid ${C.error}; border-radius: 8px; background: var(--tb-card); color: ${C.error}; font-size: 10.5px; box-shadow: 0 8px 24px rgba(42,74,120,.12); }
      .tb-primary-tab[aria-selected="true"] { background: var(--tb-card); border-color: var(--tb-line); color: ${C.primary}; box-shadow: inset 0 2px 0 ${VI.teal}; }
      .tb-module { display: grid; gap: 14px; margin-top: 14px; }
      .tb-module-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
      .tb-module-heading { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
      .tb-module-title { font-family: "Songti SC", "STSong", "Noto Serif SC", serif; font-size: 20px; font-weight: 600; letter-spacing: .06em; color: ${C.primary}; }
      .tb-module-meta { font-size: 11.5px; color: ${C.secondary}; }
      .tb-module-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-left: auto; padding-top: 2px; }
      .tb-top { padding: 16px 18px; background: linear-gradient(140deg, color-mix(in srgb, ${VI.ivory} 26%, var(--tb-card)), var(--tb-card) 64%); }
      .tb-top-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .tb-top-tabs { flex-wrap: wrap; }
      .tb-top-summary { margin-top: 10px; color: ${C.secondary}; font-size: 12px; display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .tb-embedded { margin-top: 14px; }
      .tb-embedded > .tb-card { border: 0; box-shadow: none; background: transparent; padding: 0; }
      .tb-taskcard { cursor: pointer; }
      .tb-taskcard-top { padding-right: 26px; }
      .tb-taskcard-active { border-color: rgba(21,154,153,.55); box-shadow: 0 0 0 2px rgba(21,154,153,.12); }
      .tb-task-detail-panel { margin-top: 16px; border-top: 1px solid var(--tb-line); padding-top: 14px; animation: tb-fade .3s ease both; }
      .tb-task-detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
      .tb-task-detail-grid { display: grid; grid-template-columns: auto minmax(240px, 1fr) minmax(210px, .9fr) minmax(210px, .9fr); gap: 18px; align-items: start; }
      @media (max-width: 980px) { .tb-task-detail-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 640px) { .tb-task-detail-grid { grid-template-columns: 1fr; } }
      .tb-task-detail-ring { display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .tb-task-detail-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 14px; }
      .tb-task-detail-metric { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px dashed var(--tb-line); padding-bottom: 4px; font-size: 11.5px; }
      .tb-task-detail-metric span { color: ${C.secondary}; }
      .tb-task-detail-metric b { font-weight: 600; }
      .tb-task-tool-row { display: grid; grid-template-columns: 96px 1fr 28px; gap: 8px; align-items: center; padding: 3px 0; font-size: 11px; }
      .tb-task-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
      .tb-search { border: 1px solid var(--tb-line); background: var(--tb-card); color: ${C.primary}; border-radius: 8px; padding: 5px 9px; font-size: 11.5px; font-family: inherit; width: 150px; outline: none; }
      .tb-search:focus { border-color: ${VI.teal}; }
      .tb-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(266px, 1fr)); gap: 12px; }
      .tb-cards > * { animation: tb-rise .4s cubic-bezier(.2,.7,.2,1) both; }
      .tb-cards > *:nth-child(2n) { animation-delay: .04s; }
      .tb-cards > *:nth-child(3n) { animation-delay: .08s; }
      .tb-taskcard { border: 1px solid var(--tb-line); background: var(--tb-card); border-radius: 14px; padding: 14px 15px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 2px rgba(42,74,120,.035); transition: box-shadow .16s ease, transform .16s ease; }
      .tb-taskcard:hover { box-shadow: 0 6px 20px rgba(42,74,120,.10); transform: translateY(-1px); }
      .tb-taskcard-top { display: flex; gap: 12px; align-items: center; }
      .tb-taskcard-cost { font-size: 18px; font-weight: 620; margin-top: 2px; letter-spacing: -.2px; }
      .tb-taskcard-metrics { display: flex; flex-wrap: wrap; gap: 4px 12px; padding-top: 8px; border-top: 1px solid var(--tb-line); font-size: 10.5px; color: ${C.secondary}; }
      .tb-taskcard-foot { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 10.5px; color: ${C.secondary}; }
      .tb-ring { position: relative; flex: none; }
      .tb-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; line-height: 1.1; }
      .tb-ring-center small { font-size: 8px; color: ${C.secondary}; font-weight: 400; margin-top: 1px; }
      .tb-task-tools { display: flex; flex-wrap: wrap; gap: 4px; width: 100%; margin-top: 4px; }
      .tb-tool { grid-template-columns: minmax(140px, 1.6fr) minmax(80px, 1fr) 62px 58px 44px; }
      .tb-tool-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 520; }
      .tb-rel-list { display: grid; gap: 4px; margin-top: 10px; }
      .tb-rel-row { display: flex; justify-content: space-between; gap: 12px; font-size: 10.5px; padding-top: 4px; border-top: 1px solid var(--tb-line); color: ${C.secondary}; }
      .tb-rel-pair { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @media (max-width: 640px) {
        .tb-tool { grid-template-columns: minmax(120px, 1.6fr) minmax(60px, 1fr) 58px; }
        .tb-tool > :nth-child(4), .tb-tool > :nth-child(5) { display: none; }
      }
      .tb-empty { padding: 40px 18px; text-align: center; color: ${C.secondary}; }
      .tb-skel { height: 10px; border-radius: 6px; background: ${C.layer2}; animation: tb-pulse 1.4s ease-in-out infinite; }
      @keyframes tb-pulse { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
      .tb-note { font-size: 11px; color: ${C.secondary}; }
      .tb-legend { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; color: ${C.secondary}; }
      .tb-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
      .tb-hl { border-left: 2px solid ${C.brand}; padding: 2px 0 2px 9px; color: ${C.secondary}; font-size: 12px; margin-top: 8px; }
    `

    const pad = n => String(n).padStart(2, '0')
    function localDate(offset = 0) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      }).formatToParts(new Date(Date.now() + offset * 86400000))
      const get = type => parts.find(part => part.type === type)?.value
      return `${get('year')}-${get('month')}-${get('day')}`
    }
    function monthStart() {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit',
      }).formatToParts(new Date())
      return `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-01`
    }
    function periodRange(period) {
      if (period === '7') return { from: localDate(-6), to: localDate(0) }
      if (period === '30') return { from: localDate(-29), to: localDate(0) }
      if (period === 'month') return { from: monthStart(), to: localDate(0) }
      return { from: '', to: '' }
    }

    function money(n, symbol = '¥') {
      if (!Number.isFinite(n)) return '—'
      if (n === 0) return symbol + '0.00'
      if (Math.abs(n) < 0.01) return symbol + n.toFixed(4)
      return symbol + n.toFixed(2)
    }
    function tokens(n) {
      if (!Number.isFinite(n) || n <= 0) return '0'
      if (n >= 1e8) return (n / 1e8).toFixed(2) + ' 亿'
      if (n >= 1e4) return (n / 1e4).toFixed(1) + ' 万'
      return Math.round(n).toLocaleString('zh-CN')
    }
    function pct(n, digits = 0) {
      if (!Number.isFinite(n)) return '—'
      return (n * 100).toFixed(digits) + '%'
    }
    function weekdayName(i) { return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][i] || '' }
    const ICONS = {
      receipt: ['M6 2h12v20l-3-2-3 2-3-2-3 2V2z', 'M9 7h6', 'M9 11h6', 'M9 15h4'],
      radar: ['M12 2a10 10 0 1 0 10 10', 'M12 12l4.5-4.5', 'M12 12a6 6 0 1 0 6 6', 'M12 12a2 2 0 1 0 2 2'],
      sparkles: ['M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z', 'M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z'],
      refresh: ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v6h-6'],
      chevronDown: ['M6 9l6 6 6-6'],
      chevronUp: ['M6 15l6-6 6 6'],
      cards: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
      table: ['M4 5h16', 'M4 12h16', 'M4 19h16', 'M9 5v14'],
      list: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
      chart: ['M4 20V10', 'M10 20V4', 'M16 20v-6', 'M22 20H2'],
      search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
      close: ['M6 6l12 12', 'M18 6L6 18'],
      filter: ['M3 5h18', 'M6 12h12', 'M10 19h4'],
      coins: ['M12 6c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3z', 'M4 3v6c0 1.7 3.6 3 8 3s8-1.3 8-3V3', 'M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9'],
      clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
      wrench: ['M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-2.1 2.5-2.3z'],
      link: ['M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1', 'M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1'],
      target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
      activity: ['M3 12h4l2.5-7 5 14 2.5-7h4'],
      download: ['M12 3v12', 'M7 10l5 5 5-5', 'M5 21h14'],
      fileText: ['M6 2h8l4 4v16H6z', 'M14 2v4h4', 'M9 12h6', 'M9 16h6'],
      star: ['M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.4l6.1-.9L12 3z'],
    }

    function Icon({ name, size = 14 }) {
      return h('svg', {
        viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
        'aria-hidden': true, style: { flex: 'none' },
      }, (ICONS[name] || []).map((d, index) => h('path', { key: index, d })))
    }

    function shortTool(name) {
      const short = String(name || '').replace(/^mcp__browser__/, 'browser.').replace(/^mcp__/, 'mcp.')
      return short.length > 16 ? short.slice(0, 16) + '…' : short
    }

    function modelLabel(id) {
      const known = {
        'deepseek-flash': 'DeepSeek V4.1 Flash',
        'deepseek-v4.1-flash': 'DeepSeek V4.1 Flash',
        'deepseek-v4-flash': 'DeepSeek V4 Flash',
        'deepseek-v4-pro': 'DeepSeek V4 Pro',
        'deepseek-search-server': 'DeepSeek 搜索服务',
      }
      return known[id] || id
    }
    function delta(current, previous) {
      if (!previous) return null
      const change = (current - previous) / previous
      return `${change >= 0 ? '+' : ''}${(change * 100).toFixed(0)}%`
    }

    function Tip({ tip }) {
      if (!tip) return null
      const maxX = typeof window === 'undefined' ? 1200 : window.innerWidth - 250
      const maxY = typeof window === 'undefined' ? 800 : window.innerHeight - 90
      return h('div', { className: 'tb-tip', role: 'tooltip', style: { left: Math.max(8, Math.min(tip.x, maxX)), top: Math.max(8, Math.min(tip.y, maxY)) } },
        h('div', { className: 'tb-tip-t' }, tip.title),
        (tip.lines || []).map((line, index) => h('div', { key: index, className: 'tb-tip-l' }, line)))
    }

    function useTip() {
      const [tip, setTip] = useState(null)
      const show = (event, title, lines) => setTip({ x: event.clientX + 14, y: event.clientY + 14, title, lines })
      const showEl = (event, title, lines) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setTip({ x: rect.left, y: rect.bottom + 6, title, lines })
      }
      return { tip, show, showEl, hide: () => setTip(null) }
    }

    function arcPath(cx, cy, inner, outer, start, end) {
      const large = end - start > Math.PI ? 1 : 0
      const point = (radius, angle) => [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]
      const [x0, y0] = point(outer, start)
      const [x1, y1] = point(outer, end)
      const [x2, y2] = point(inner, end)
      const [x3, y3] = point(inner, start)
      return `M${x0},${y0} A${outer},${outer} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${inner},${inner} 0 ${large} 0 ${x3},${y3} Z`
    }

    function smoothPath(points) {
      if (!points.length) return ''
      if (points.length === 1) return `M${points[0].x},${points[0].y}`
      let path = `M${points[0].x},${points[0].y}`
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1]
        const current = points[index]
        const midX = (previous.x + current.x) / 2
        path += ` C${midX},${previous.y} ${midX},${current.y} ${current.x},${current.y}`
      }
      return path
    }

    function Sunburst({ root = { children: [] }, symbol = '¥', ariaLabel = '费用占比图' }) {
      const [picked, setPicked] = useState(null)
      const { tip, show, hide } = useTip()
      const size = 340
      const cx = 170
      const cy = 170
      const inner = 28
      const ring1 = 66
      const ring2 = 104
      const children = root.children || []
      const total = children.reduce((sum, child) => sum + (child.value || 0), 0) || 1
      const segments = []
      let angle = -Math.PI / 2
      children.forEach((child, index) => {
        const span = (child.value || 0) / total * Math.PI * 2
        const color = SERIES[index % SERIES.length]
        segments.push({ node: child, parent: null, depth: 1, start: angle, end: angle + span, color, share: (child.value || 0) / total })
        let childAngle = angle
        const childTotal = (child.children || []).reduce((sum, item) => sum + (item.value || 0), 0) || 1
        for (const item of child.children || []) {
          const childSpan = (item.value || 0) / childTotal * span
          segments.push({ node: item, parent: child, depth: 2, start: childAngle, end: childAngle + childSpan, color, share: (item.value || 0) / total })
          childAngle += childSpan
        }
        angle += span
      })
      const active = picked
      const labelOf = node => node.label || node.name
      return h('div', { className: 'tb-sun' },
        h('svg', { viewBox: `0 0 ${size} ${size}`, width: 300, height: 300, role: 'img', 'aria-label': ariaLabel, style: { flex: 'none' } },
          segments.map((segment, index) => {
            const dim = active && active !== segment.node && active !== segment.parent
            return h('path', {
              key: `${segment.depth}-${index}`,
              d: arcPath(cx, cy, segment.depth === 1 ? inner : ring1, segment.depth === 1 ? ring1 : ring2, segment.start, segment.end),
              fill: segment.color,
              fillOpacity: dim ? 0.35 : segment.depth === 1 ? 1 : 0.72,
              stroke: 'var(--tb-card)',
              strokeWidth: 1,
              style: { cursor: 'pointer', transition: 'fill-opacity .18s ease' },
              onMouseMove: event => show(event, labelOf(segment.node), [
                `${money(segment.node.cost ?? segment.node.value, symbol)} · ${pct(segment.share, 1)}`,
                segment.node.tokens ? `${tokens(segment.node.tokens)} token · ${segment.node.calls} 次` : '',
              ].filter(Boolean)),
              onMouseLeave: hide,
              onClick: () => setPicked(active === segment.node ? null : segment.node),
            })
          }),
          h('text', { x: cx, y: cy - 2, textAnchor: 'middle', fontSize: 17, fontWeight: 600, fill: C.primary }, money(total, symbol)),
          h('text', { x: cx, y: cy + 15, textAnchor: 'middle', fontSize: 9.5, fill: C.secondary }, '总花费'),
          children.map((child, index) => {
            const mid = segments.find(segment => segment.depth === 1 && segment.node === child)
            if (!mid) return null
            const angleMid = (mid.start + mid.end) / 2
            const radius = 118
            const x = cx + radius * Math.cos(angleMid)
            const y = cy + radius * Math.sin(angleMid)
            const anchor = Math.abs(x - cx) < 12 ? 'middle' : x > cx ? 'start' : 'end'
            return h('text', { key: `label-${index}`, x, y: y + 3, textAnchor: anchor, fontSize: 9.5, fill: C.secondary }, labelOf(child).length > 10 ? labelOf(child).slice(0, 10) + '…' : labelOf(child))
          })),
        h('div', { className: 'tb-legend', style: { justifyContent: 'center' } },
          children.map((child, index) => h('span', { key: child.name }, h('i', { style: { background: SERIES[index % SERIES.length] } }), labelOf(child)))),
        h('div', { className: 'tb-detail' }, active
          ? `${labelOf(active)} · ${money(active.cost ?? active.value, symbol)} · ${pct((active.value || 0) / total, 1)}`
          : '悬停看占比，点击扇区固定详情。'),
        h(Tip, { tip }))
    }

    function useReport(period, sessionId) {
      const range = useMemo(() => periodRange(period), [period])
      const [state, setState] = useState({ loading: true, data: null, error: null })
      const requestId = useRef(0)
      const load = useCallback(async (fresh) => {
        const current = ++requestId.current
        setState(prev => ({ ...prev, loading: true, error: null }))
        try {
          const query = new URLSearchParams()
          if (range.from) query.set('from', range.from)
          if (range.to) query.set('to', range.to)
          if (sessionId) query.set('sessionId', sessionId)
          query.set('currency', 'CNY')
          if (fresh) query.set('refresh', '1')
          const response = await fetch(`/token-bill/report?${query.toString()}`, { headers: { accept: 'application/json' } })
          const body = await response.json().catch(() => ({}))
          if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`)
          if (current === requestId.current) setState({ loading: false, data: body, error: null })
        } catch (error) {
          if (current === requestId.current) setState(prev => ({ ...prev, loading: false, error: error?.message || String(error) }))
        }
      }, [range.from, range.to, sessionId])
      useEffect(() => {
        load(false)
      }, [load])
      return [state, () => load(true)]
    }

    function Card({ title, sub, children, style }) {
      return h('section', { className: 'tb-card', style }, h('div', { className: 'tb-card-h' },
        h('span', { className: 'tb-card-t' }, title), sub ? h('span', { className: 'tb-card-s' }, sub) : null), children)
    }

    function Kpi({ label, value, sub, color, icon, iconColor }) {
      const tone = iconColor || color || VI.teal
      return h('div', { className: 'tb-kpi' },
        h('div', { className: 'tb-kpi-head' },
          icon ? h('span', { className: 'tb-kpi-icon', style: { color: tone, background: `color-mix(in srgb, ${tone} 13%, transparent)` } }, h(Icon, { name: icon, size: 13 })) : null,
          h('div', { className: 'tb-kpi-l' }, label)),
        h('div', { className: 'tb-kpi-v', style: color ? { color } : undefined }, value),
        h('div', { className: 'tb-kpi-s' }, sub || ''))
    }

    function Summary({ data }) {
      const { totals, previous, tasks, hourly } = data
      const topTask = tasks[0]
      const topTasks = tasks.slice(0, 3)
      const change = delta(totals.cost, previous.cost)
      const base = totals.attributed || totals.cost || 1
      const top3 = tasks.slice(0, 3).reduce((sum, task) => sum + task.cost, 0)
      const share = top3 / base
      const lines = []
      if (topTask) lines.push(`最贵的一项「${topTask.title}」占 ${pct(topTask.cost / base)}，前三项合计占 ${pct(share)}。`)
      if (hourly.peakShare > 0.2) lines.push(`约 ${pct(hourly.peakShare)} 的花费、${pct(hourly.peakCallShare || 0)} 的调用落在峰时，错峰是最大的一笔可控成本。`)
      if (totals.cacheShare > 0.8) lines.push(`缓存命中 ${pct(totals.cacheShare, 1)}，重复上下文基本都走了低价缓存——这是账单没有更高的主因。`)
      if (!lines.length) lines.push('这段时间还没有可归因的消费。')
      const topBlock = topTasks.length ? h('div', { className: 'tb-top3', style: { gridColumn: '1 / -1' } },
        h('div', { className: 'tb-card-s' }, '消耗成本 Top 3'),
        topTasks.map((task, index) => {
          const tone = TOP_COLORS[index]
          return h('div', { key: task.id, className: 'tb-top3-row', style: { borderLeftColor: tone.bar, background: tone.soft } },
            h('span', { className: 'tb-top3-rank', style: { background: tone.bar, color: tone.ink } }, index + 1),
            h('div', { className: 'tb-top3-main' },
              h('div', { className: 'tb-top3-title' }, task.title),
              h('div', { className: 'tb-task-meta' }, `${task.date} · ${task.domainLabel}`)),
            h('div', { className: 'tb-top3-cost' }, money(task.cost, data.symbol), h('small', null, pct(task.cost / base))))
        })) : null
      return h('div', { className: 'tb-kpis' },
        h(Kpi, { label: '总花费', value: money(totals.cost, data.symbol), sub: change ? `较上期 ${change}` : `日均 ${money(totals.avgDaily, data.symbol)}`, color: C.primary, icon: 'receipt', iconColor: '#B55245' }),
        h(Kpi, { label: 'Token 总量', value: tokens(totals.tokens), sub: `输出 ${tokens(totals.output)} · 缓存 ${tokens(totals.cacheRead)}`, icon: 'coins', iconColor: VI.moon }),
        h(Kpi, { label: '调用次数', value: totals.calls.toLocaleString('zh-CN'), sub: `单次 ${money(totals.costPerCall, data.symbol)}`, icon: 'activity', iconColor: VI.teal }),
        h(Kpi, { label: '缓存命中', value: pct(totals.cacheShare, 1), sub: `未缓存输入 ${tokens(totals.input)}`, icon: 'target', iconColor: VI.jade }),
        h(Kpi, { label: '会话数', value: String(totals.sessions), sub: `覆盖 ${data.range.days} 天`, icon: 'cards', iconColor: VI.gray }),
        h('div', { className: 'tb-card', style: { gridColumn: '1 / -1', padding: '13px 15px' } },
          h('div', { className: 'tb-card-s', style: { marginBottom: 4 } }, '一句话结论'), lines.map((line, i) => h('div', { key: i, className: 'tb-hl' }, line))),
        topBlock)
    }

    function PeriodChart({ data, mode }) {
      const rows = mode === 'month' ? data.monthly : data.weekly
      const list = rows.filter(row => row.cost > 0 || row.calls > 0)
      const [selected, setSelected] = useState(null)
      const { tip, show, showEl, hide } = useTip()
      if (!list.length) return h('div', { className: 'tb-empty' }, '这段时间没有记录。')
      const max = Math.max(...list.map(row => row.cost), 0.000001)
      const current = selected ? list.find(row => row.key === selected.key) : null
      const label = row => row.label || row.key
      const items = list.map(row => {
        const active = selected?.key === row.key
        const title = label(row)
        return h('button', {
          key: row.key, type: 'button', className: 'tb-period-row tb-row', 'aria-pressed': active,
          onMouseMove: event => show(event, title, [`${money(row.cost, data.symbol)} · ${row.calls} 次`, `${tokens(row.tokens)} token`]),
          onMouseLeave: hide,
          onFocus: event => showEl(event, title, [`${money(row.cost, data.symbol)} · ${row.calls} 次`]),
          onBlur: hide,
          onClick: () => setSelected(row),
        },
          h('span', { className: 'tb-muted', style: { fontSize: 11.5 } }, title),
          h('span', { className: 'tb-money' }, money(row.cost, data.symbol)),
          h('span', { className: 'tb-bar', style: { gridColumn: '1 / -1' } },
            h('i', { style: { width: `${row.cost / max * 100}%`, background: active ? VI.teal : VI.moon } })))
      })
      return h('div', { className: 'tb-table' },
        items,
        h('div', { className: 'tb-detail' }, current
          ? `${label(current)} · ${money(current.cost, data.symbol)} · ${current.calls} 次调用 · ${tokens(current.tokens)} token`
          : '悬停看金额，点击一条看该周期明细。'),
        h(Tip, { tip }))
    }

    function DailyChart({ data }) {
      const rows = data.daily
      const [selected, setSelected] = useState(null)
      const [hover, setHover] = useState(null)
      const { tip, show, hide } = useTip()
      const width = 900
      const height = 236
      const left = 50
      const right = 14
      const top = 14
      const bottom = 30
      const plotW = width - left - right
      const plotH = height - top - bottom
      const count = Math.max(1, rows.length)
      const max = Math.max(...rows.map(row => row.cost), 0.01)
      const band = plotW / count
      const barW = Math.min(42, band * 0.56)
      const x = index => left + band * (index + 0.5)
      const y = value => top + plotH - (value / max) * plotH
      const trend = rows.map((_, index) => {
        const start = rows[Math.max(0, index - 1)].cost
        const end = rows[Math.min(rows.length - 1, index + 1)].cost
        return (start + rows[index].cost + end) / 3
      })
      const curve = smoothPath(rows.map((row, index) => ({ x: x(index), y: y(trend[index]) })))
      const labelStep = Math.max(1, Math.ceil((rows.length - 1) / 6))
      const current = selected ? rows.find(row => row.date === selected.date) : null
      return h('div', { className: 'tb-daily' },
        h('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', role: 'img', 'aria-label': '每日花费柱状图与三日趋势曲线' },
          h('defs', null, h('linearGradient', { id: 'tb-dailybar', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: VI.moon }),
            h('stop', { offset: '100%', stopColor: VI.teal }))),
          [0, 0.5, 1].map((tick, index) => {
            const value = max * tick
            return h('g', { key: `y${index}` },
              h('line', { x1: left, y1: y(value), x2: width - right, y2: y(value), stroke: 'var(--tb-line)', strokeWidth: 1 }),
              h('text', { x: left - 7, y: y(value) + 3.5, textAnchor: 'end', fontSize: 9.5, fill: C.secondary }, money(value, data.symbol)))
          }),
          rows.map((row, index) => h('rect', {
            key: `bar-${row.date}`, x: x(index) - barW / 2, y: y(row.cost), width: barW, height: Math.max(2, y(0) - y(row.cost)),
            rx: 5, fill: 'url(#tb-dailybar)', style: { pointerEvents: 'none' },
            opacity: selected && selected.date !== row.date ? .5 : 1,
            stroke: selected?.date === row.date ? VI.teal : 'none', strokeWidth: selected?.date === row.date ? 2 : 0,
          })),
          h('path', { d: curve, fill: 'none', stroke: '#D9A441', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', style: { pointerEvents: 'none' } }),
          rows.map((row, index) => h('circle', {
            key: `dot-${row.date}`, cx: x(index), cy: y(trend[index]), r: 2.8,
            fill: '#D9A441', stroke: 'var(--tb-card)', strokeWidth: 1.2, style: { pointerEvents: 'none' },
          })),
          hover !== null ? h('line', {
            x1: x(hover), y1: top, x2: x(hover), y2: top + plotH,
            stroke: 'rgba(21,154,153,.45)', strokeDasharray: '3 3', strokeWidth: 1,
          }) : null,
          rows.map((row, index) => {
            const label = index % labelStep === 0 || index === rows.length - 1 ? row.date.slice(5) : ''
            return label ? h('text', { key: `x-${row.date}`, x: x(index), y: height - 9, textAnchor: 'middle', fontSize: 9.5, fill: C.secondary }, label) : null
          }),
          rows.map((row, index) => h('rect', {
            key: `hit-${row.date}`, x: left + band * index, y: top, width: band, height: plotH, fill: 'transparent',
            onMouseMove: event => {
              setHover(index)
              show(event, row.date, [`${money(row.cost, data.symbol)} · ${row.calls} 次调用`, `3 日趋势 ${money(trend[index], data.symbol)}`])
            },
            onMouseLeave: () => { setHover(null); hide() },
            onClick: () => setSelected(selected?.date === row.date ? null : row),
          }))),
        h('div', { className: 'tb-legend', style: { marginTop: 6, justifyContent: 'space-between' } },
          h('span', null, h('i', { style: { background: VI.teal } }), '每日花费', h('i', { style: { background: '#D9A441', width: 14, height: 3, marginLeft: 14 } }), '3 日趋势'),
          h('span', null, `峰值 ${money(max, data.symbol)}`)),
        h('div', { className: 'tb-detail' }, current
          ? `${current.date} · ${money(current.cost, data.symbol)} · ${current.calls} 次调用 · ${tokens(current.tokens)} token · 3 日趋势 ${money(trend[rows.indexOf(current)] || 0, data.symbol)}`
          : '悬停看金额，点击柱子看当天明细。'),
        h(Tip, { tip }))
    }

    function Heatmap({ data }) {
      const { cells, top } = data.hourly
      const [picked, setPicked] = useState(null)
      const { tip, show, showEl, hide } = useTip()
      if (!cells.length) return h('div', { className: 'tb-empty' }, '没有小时级数据：会话日志不可用，或该账期没有调用。')
      const map = new Map(cells.map(cell => [`${cell.weekday}:${cell.hour}`, cell]))
      const max = Math.max(...cells.map(cell => cell.cost), 0.000001)
      const topLine = top.length
        ? `最贵时段 ${weekdayName(top[0].weekday)} ${pad(top[0].hour)}:00 · ${money(top[0].cost, data.symbol)}`
        : '暂无小时数据'
      const detail = picked
        ? `${weekdayName(picked.weekday)} ${pad(picked.hour)}:00 · ${money(picked.cost, data.symbol)} · ${picked.calls} 次调用`
        : topLine
      const head = [
        h('span', { key: 'blank' }),
        ...Array.from({ length: 24 }, (_, hour) => h('span', { key: `h${hour}`, className: 'tb-heat-hour' }, hour % 3 === 0 ? pad(hour) : '')),
      ]
      const rows = Array.from({ length: 7 }, (_, weekday) => [
        h('span', { key: `d${weekday}`, className: 'tb-heat-day' }, weekdayName(weekday).slice(1)),
        ...Array.from({ length: 24 }, (_, hour) => {
          const cell = map.get(`${weekday}:${hour}`)
          const value = cell ? cell.cost : 0
          const calls = cell ? cell.calls : 0
          const alpha = value > 0 ? 0.08 + value / max * 0.84 : 0
          return h('button', {
            key: `${weekday}:${hour}`, type: 'button', className: 'tb-heat-cell',
            title: `${weekdayName(weekday)} ${pad(hour)}:00 · ${money(value, data.symbol)} · ${calls} 次`,
            'aria-label': `${weekdayName(weekday)} ${pad(hour)}:00 ${money(value, data.symbol)}`,
            onMouseMove: event => show(event, `${weekdayName(weekday)} ${pad(hour)}:00`, [`${money(value, data.symbol)} · ${calls} 次调用`]),
            onMouseLeave: hide,
            onFocus: event => showEl(event, `${weekdayName(weekday)} ${pad(hour)}:00`, [`${money(value, data.symbol)}`]),
            onBlur: hide,
            onClick: () => setPicked({ weekday, hour, cost: value, calls }),
            style: { background: value > 0 ? `rgba(21,154,153,${alpha.toFixed(3)})` : 'color-mix(in srgb, var(--tb-card) 60%, var(--dsw-alias-bg-layer-2))' },
          })
        }),
      ])
      return h('div', null,
        h('div', { className: 'tb-heat-wrap' },
          h('div', { className: 'tb-heat', role: 'group', 'aria-label': '星期与小时花费热力图，点击格子查看金额' }, head, rows)),
        h('div', { className: 'tb-legend', style: { marginTop: 8, justifyContent: 'space-between' } },
          h('span', null, detail),
          h('span', null, `峰时花费 ${pct(data.hourly.peakShare)} · 调用 ${pct(data.hourly.peakCallShare || 0)}`)),
        h(Tip, { tip }))
    }

    function TimeSection({ data }) {
      const [mode, setMode] = useState('day')
      const tabs = [['month', '月'], ['week', '周'], ['day', '日'], ['hour', '时']]
      return h(Card, {
        title: '时间分布',
        sub: mode === 'hour' ? '按调用发生的星期与小时分摊 · 悬停/点击看明细' : '账本按本地日切分 · 悬停/点击看明细',
      },
        h('div', { className: 'tb-seg', role: 'group', 'aria-label': '时间粒度', style: { marginBottom: 12, width: 'fit-content' } },
          tabs.map(([key, label]) => h('button', { key, type: 'button', 'aria-pressed': mode === key, onClick: () => setMode(key) }, label))),
        mode === 'day' ? h(DailyChart, { data }) : mode === 'hour' ? h(Heatmap, { data }) : h(PeriodChart, { data, mode }))
    }

    function Models({ data }) {
      const rows = data.models
      const [view, setView] = useState('list')
      const [selected, setSelected] = useState(null)
      const { tip, show, showEl, hide } = useTip()
      if (!rows.length) return h(Card, { title: '模型' }, h('div', { className: 'tb-empty' }, '没有模型记录。'))
      const current = selected ? rows.find(row => row.key === selected.key) : null
      const items = rows.map((row, i) => {
        const active = selected?.key === row.key
        const title = modelLabel(row.model)
        return h('div', {
          key: row.key, className: 'tb-tr tb-model tb-clickable', role: 'button', tabIndex: 0, 'aria-pressed': active,
          onMouseMove: event => show(event, title, [`${money(row.cost, data.symbol)} · ${row.calls} 次`, `${tokens(row.tokens)} token · 缓存 ${pct(row.cacheShare, 1)}`]),
          onMouseLeave: hide,
          onFocus: event => showEl(event, title, [`${money(row.cost, data.symbol)}`]),
          onBlur: hide,
          onClick: () => setSelected(active ? null : row),
          onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(active ? null : row) } },
        },
          h('div', { style: { minWidth: 0 } },
            h('div', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 560 } }, title),
            h('div', { className: 'tb-task-meta' }, `${row.provider} · ${row.calls} 次 · 单次 ${money(row.cost / Math.max(1, row.calls), data.symbol)}`)),
          h('div', { className: 'tb-money' }, money(row.cost, data.symbol)),
          h('div', { className: 'tb-bar' }, h('i', { style: { width: `${Math.max(1, row.share * 100)}%`, background: SERIES[i % SERIES.length] } })),
          h('div', { className: 'tb-num' }, tokens(row.tokens)),
          h('div', { className: 'tb-num' }, pct(row.cacheShare, 1)))
      })
      return h(Card, { title: '模型分布', sub: view === 'sun' ? '图表 · 渠道 → 模型，面积即费用占比' : '列表 · 点击一行查看单价' },
        h('div', { className: 'tb-seg', role: 'group', 'aria-label': '模型视图', style: { marginBottom: 10, width: 'fit-content' } },
          [['list', '列表', 'list'], ['sun', '图表', 'chart']].map(([key, label, icon]) =>
            h('button', { key, type: 'button', 'aria-pressed': view === key, onClick: () => setView(key) }, h(Icon, { name: icon, size: 12 }), label))),
        view === 'sun'
          ? h(Sunburst, { root: data.modelTree, symbol: data.symbol, ariaLabel: '模型费用占比图' })
          : h(React.Fragment, null,
            h('div', { className: 'tb-table' },
              h('div', { className: 'tb-tr tb-th tb-model' }, h('span', null, '模型'), h('span', { style: { textAlign: 'right' } }, '费用'), h('span', null, '占比'), h('span', { style: { textAlign: 'right' } }, 'Token'), h('span', { style: { textAlign: 'right' } }, '缓存')),
              items),
            h('div', { className: 'tb-detail' }, current
              ? `${modelLabel(current.model)} · 每百万 token ${money(current.costPerM, data.symbol)} · 单次 ${money(current.cost / Math.max(1, current.calls), data.symbol)} · 缓存 ${pct(current.cacheShare, 1)}`
              : '点击一行查看每百万 token 与单次成本。'),
            h(Tip, { tip })))
    }

    function Ring({ parts, size = 72, stroke = 9, centerValue, centerLabel, title }) {
      const radius = (size - stroke) / 2
      const circumference = 2 * Math.PI * radius
      const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0) || 1
      let offset = 0
      const arcs = parts.map((part, index) => {
        const length = Math.max(0, part.value) / total * circumference
        const arc = h('circle', {
          key: index, cx: size / 2, cy: size / 2, r: radius, fill: 'none',
          stroke: part.color, strokeWidth: stroke,
          strokeDasharray: `${length} ${circumference - length}`,
          strokeDashoffset: -offset,
          transform: `rotate(-90 ${size / 2} ${size / 2})`,
        })
        offset += length
        return arc
      })
      return h('div', { className: 'tb-ring', title, style: { width: size, height: size } },
        h('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size, role: 'img', 'aria-label': centerLabel || '占比' },
          h('circle', { cx: size / 2, cy: size / 2, r: radius, fill: 'none', stroke: 'var(--dsw-alias-bg-layer-2)', strokeWidth: stroke }),
          arcs),
        h('div', { className: 'tb-ring-center' }, centerValue, h('small', null, centerLabel)))
    }

    function TaskCard({ row, data, base, topics, active, onClick, rank, tone }) {
      const breakdown = row.breakdown || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }
      const parts = [
        { label: '缓存', value: breakdown.cacheRead + breakdown.cacheWrite, color: VI.teal },
        { label: '输入', value: breakdown.input, color: VI.moon },
        { label: '输出', value: breakdown.output + breakdown.reasoning, color: VI.yellow },
      ]
      return h('article', {
        className: `tb-taskcard${active ? ' tb-taskcard-active' : ''}`,
        role: 'button', tabIndex: 0, 'aria-pressed': active,
        onClick, onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.() } },
        style: tone ? { borderTopColor: tone.bar, borderTopWidth: 2 } : undefined,
      },
        rank !== undefined ? h('span', { className: 'tb-rank-badge', style: { background: tone.bar, color: tone.ink } }, rank + 1) : null,
        h('div', { className: 'tb-taskcard-top' },
          h(Ring, { parts, centerValue: pct(row.cacheShare || 0, 0), centerLabel: '缓存', title: `缓存 ${tokens(breakdown.cacheRead)} · 输入 ${tokens(breakdown.input)} · 输出 ${tokens(breakdown.output)}` }),
          h('div', { style: { minWidth: 0, flex: 1 } },
            h('div', { className: 'tb-task-title', title: row.title }, row.title),
            h('div', { className: 'tb-task-meta' }, `${row.date} · ${row.domainLabel} · ${row.turns || '—'} 轮`),
            h('div', { className: 'tb-taskcard-cost' }, money(row.cost, data.symbol)),
            h('div', { className: 'tb-task-meta' }, `${tokens(row.tokens)} token · ${row.calls} 次调用`))),
        h('div', { className: 'tb-taskcard-metrics' },
          h('span', null, `单轮 ${money(row.costPerTurn || 0, data.symbol)}`),
          h('span', null, `中位首响 ${(row.medianLatencySec || 0).toFixed(1)}s`),
          h('span', null, `工具错误 ${pct(row.toolErrorRate || 0, 1)}`)),
        h('div', { className: 'tb-tags', style: { margin: '0' } },
          ...(row.topTools || []).slice(0, 4).map(tool => h('span', { key: tool.name, className: 'tb-tag', title: tool.name }, `${shortTool(tool.name)} ${tool.count}`)),
          ...(topics || []).slice(0, 2).map(topic => h('span', { key: `topic-${topic}`, className: 'tb-tag a' }, topic))),
        h('div', { className: 'tb-taskcard-foot' },
          h('span', { className: 'tb-chip' }, `费用 ${pct(row.cost / base)}`),
          h('span', null, (row.models || []).join('、'))))
    }

    function TaskDetail({ row, data, topics, related, onClose }) {
      const breakdown = row.breakdown || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 }
      const parts = [
        { label: '缓存', value: breakdown.cacheRead + breakdown.cacheWrite, color: VI.teal },
        { label: '输入', value: breakdown.input, color: VI.moon },
        { label: '输出', value: breakdown.output + breakdown.reasoning, color: VI.yellow },
      ]
      const toolMax = Math.max(...(row.topTools || []).map(tool => tool.count), 1)
      return h('section', { className: 'tb-task-detail-panel' },
        h('div', { className: 'tb-task-detail-head' },
          h('div', null,
            h('div', { className: 'tb-card-t' }, row.title),
            h('div', { className: 'tb-card-s' }, `${row.date} · ${row.domainLabel} · 会话 ${row.id}`)),
          h('button', { type: 'button', className: 'tb-btn', onClick: onClose }, h(Icon, { name: 'close', size: 12 }), '关闭')),
        h('div', { className: 'tb-task-detail-grid' },
          h('div', { className: 'tb-task-detail-ring' },
            h(Ring, { parts, size: 104, stroke: 11, centerValue: pct(row.cacheShare || 0, 0), centerLabel: '缓存' }),
            h('div', { className: 'tb-legend', style: { flexDirection: 'column', gap: 4, alignItems: 'flex-start' } },
              parts.map(part => h('span', { key: part.label }, h('i', { style: { background: part.color } }), `${part.label} ${tokens(part.value)}`)))),
          h('div', { className: 'tb-task-detail-metrics' },
            [['费用', money(row.cost, data.symbol)], ['Token', tokens(row.tokens)], ['调用', String(row.calls)], ['轮次', String(row.turns || '—')], ['单轮费用', money(row.costPerTurn || 0, data.symbol)], ['首响中位', `${(row.medianLatencySec || 0).toFixed(1)}s`], ['工具错误', pct(row.toolErrorRate || 0, 1)], ['模型', (row.models || []).join('、') || '—']]
              .map(([label, value]) => h('div', { key: label, className: 'tb-task-detail-metric' }, h('span', null, label), h('b', null, value)))),
          h('div', null,
            h('div', { className: 'tb-card-s', style: { marginBottom: 6 } }, '常用工具'),
            (row.topTools || []).map(tool => h('div', { key: tool.name, className: 'tb-task-tool-row', title: tool.name },
              h('span', null, shortTool(tool.name)),
              h('div', { className: 'tb-bar' }, h('i', { style: { width: `${tool.count / toolMax * 100}%`, background: VI.teal } })),
              h('span', { className: 'tb-num' }, tool.count)))),
          h('div', null,
            h('div', { className: 'tb-card-s', style: { marginBottom: 6 } }, '记忆主题'),
            (topics || []).length
              ? h('div', { className: 'tb-tags' }, topics.map(topic => h('span', { key: topic, className: 'tb-tag a' }, topic)))
              : h('div', { className: 'tb-note' }, '没有匹配到记忆主题。'),
            h('div', { className: 'tb-card-s', style: { margin: '10px 0 6px' } }, '可证实的关联任务'),
            (related || []).length
              ? related.slice(0, 5).map(item => h('div', { key: item.id, className: 'tb-rel-row' },
                h('span', { className: 'tb-rel-pair' }, item.title),
                h('span', { className: 'tb-num' }, item.reasons.join(' / '))))
              : h('div', { className: 'tb-note' }, '未发现可证实的关联任务。'))))
    }

    function Tasks({ data, domain, onDomain, tool, onTool }) {
      const [mode, setMode] = useState('cost')
      const [view, setView] = useState('cards')
      const [query, setQuery] = useState('')
      const [expanded, setExpanded] = useState(null)
      const [selected, setSelected] = useState(null)
      const source = mode === 'cost' ? data.tasks : (data.tasksByTokens || data.tasks)
      const needle = query.trim().toLowerCase()
      const rows = source
        .filter(row => !domain || row.domain === domain)
        .filter(row => !tool || (row.toolNames || []).includes(tool))
        .filter(row => !needle || `${row.title} ${row.domainLabel}`.toLowerCase().includes(needle))
        .slice(0, 12)
      const max = Math.max(...rows.map(row => mode === 'cost' ? row.cost : row.tokens), 0.000001)
      const base = data.totals.attributed || data.totals.cost || 1
      const costRank = new Map([...data.tasks].sort((a, b) => b.cost - a.cost).slice(0, 3).map((row, index) => [row.id, index]))
      const filterLabel = domain ? (data.domains.find(item => item.key === domain)?.label || domain) : ''
      const toolLabel = tool ? shortTool(tool) : ''
      const topicLabels = new Map(((data.relations && data.relations.topics) || []).map(topic => [topic.id, topic.label]))
      const topicsByTask = new Map()
      for (const edge of (data.relations && data.relations.edges) || []) {
        const label = topicLabels.get(edge.source)
        if (!label) continue
        const list = topicsByTask.get(edge.target) || []
        if (!list.includes(label)) list.push(label)
        topicsByTask.set(edge.target, list)
      }
      const relationNodes = new Map(((data.relations && data.relations.nodes) || []).map(node => [node.id, node]))
      const relatedByTask = new Map()
      for (const edge of (data.relations && data.relations.edges) || []) {
        if (edge.source.startsWith('topic:') || edge.target.startsWith('topic:')) continue
        const left = relationNodes.get(edge.source)
        const right = relationNodes.get(edge.target)
        if (!left || !right) continue
        const add = (id, other, reasons) => {
          const list = relatedByTask.get(id) || []
          list.push({ id: other.id, title: other.title, reasons })
          relatedByTask.set(id, list)
        }
        add(left.id, right, edge.reasons)
        add(right.id, left, edge.reasons)
      }
      const header = h('div', { className: 'tb-task-toolbar' },
        h('div', { className: 'tb-seg', role: 'group', 'aria-label': '任务排序' },
          [['cost', '按费用', 'coins'], ['tokens', '按 Token', 'chart']].map(([key, label, icon]) =>
            h('button', { key, type: 'button', 'aria-pressed': mode === key, onClick: () => setMode(key) }, h(Icon, { name: icon, size: 12 }), label))),
        h('div', { className: 'tb-seg', role: 'group', 'aria-label': '任务视图' },
          [['cards', '卡片', 'cards'], ['table', '表格', 'table']].map(([key, label, icon]) =>
            h('button', { key, type: 'button', 'aria-pressed': view === key, onClick: () => setView(key) }, h(Icon, { name: icon, size: 12 }), label))),
        h('label', { className: 'tb-search-wrap' },
          h(Icon, { name: 'search', size: 13 }),
          h('input', {
            className: 'tb-search', value: query, placeholder: '搜索任务', 'aria-label': '搜索任务',
            onChange: event => setQuery(event.target.value),
          })),
        filterLabel ? h('button', { type: 'button', className: 'tb-filter-chip', onClick: () => onDomain('') }, h(Icon, { name: 'close', size: 10 }), `筛选：${filterLabel}`) : null,
        toolLabel ? h('button', { type: 'button', className: 'tb-filter-chip', onClick: () => onTool('') }, h(Icon, { name: 'close', size: 10 }), `工具：${toolLabel}`) : null)
      const cards = h('div', { className: 'tb-cards' },
        rows.map(row => h(TaskCard, {
          key: row.id, row, data, base, topics: topicsByTask.get(row.id),
          active: selected?.id === row.id,
          rank: costRank.get(row.id),
          tone: costRank.has(row.id) ? TOP_COLORS[costRank.get(row.id)] : undefined,
          onClick: () => setSelected(selected?.id === row.id ? null : row),
        })))
      const table = h('div', { className: 'tb-table' },
        rows.length ? rows.map((row, i) => {
          const value = mode === 'cost' ? row.cost : row.tokens
          const open = expanded === row.id
          const rowEl = h('div', {
            key: row.id, className: 'tb-tr tb-task tb-clickable', role: 'button', tabIndex: 0, 'aria-expanded': open,
            onClick: () => setExpanded(open ? null : row.id),
            onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setExpanded(open ? null : row.id) } },
          },
            h('span', { className: 'tb-rank', style: costRank.has(row.id) ? { color: TOP_COLORS[costRank.get(row.id)].bar, fontWeight: 650 } : undefined }, open ? '−' : pad(i + 1)),
            h('div', { style: { minWidth: 0 } },
              h('div', { className: 'tb-task-title' }, row.title),
              h('div', { className: 'tb-task-meta' }, `${row.date} · ${row.domainLabel} · ${row.turns || '—'} 轮 · ${row.calls} 次调用 · ${tokens(row.tokens)} token · 缓存 ${pct(row.cacheShare || 0)}`)),
            h('div', { style: { textAlign: 'right' } },
              h('div', { className: 'tb-money' }, mode === 'cost' ? money(row.cost, data.symbol) : tokens(row.tokens)),
              h('div', { className: 'tb-bar', style: { marginTop: 4 } }, h('i', { style: { width: `${Math.max(1, value / max * 100)}%`, background: i === 0 ? VI.teal : 'rgba(132,165,210,.55)' } }))),
            h('div', { style: { textAlign: 'right' } }, h('span', { className: 'tb-chip' }, pct(row.cost / base))))
          const detail = open ? h('div', { key: `${row.id}-detail`, className: 'tb-task-detail' },
            h('span', null, `会话 ${row.id}`),
            h('span', null, `模型 ${(row.models || []).join('、') || '—'}`),
            h('span', null, `工具 ${row.tools} 次 · 错误 ${pct(row.toolErrorRate || 0, 1)}`),
            h('span', null, `首响中位 ${(row.medianLatencySec || 0).toFixed(1)}s`),
            h('span', null, `单轮 ${money(row.costPerTurn || 0, data.symbol)}`),
            h('div', { className: 'tb-task-tools' }, (row.topTools || []).map(tool => h('span', { key: tool.name, className: 'tb-tag', title: tool.name }, `${shortTool(tool.name)} ${tool.count}`)))) : null
          return h(React.Fragment, { key: row.id }, rowEl, detail)
        }) : h('div', { className: 'tb-empty' }, domain || needle ? '没有符合筛选的任务。' : '该账期没有可归因的任务。'))
      return h(Card, { title: '任务账单', sub: mode === 'cost' ? '按费用排序 · 卡片含 Token 构成与工具画像' : '按 Token 排序 · 卡片含 Token 构成与工具画像' },
        header,
        rows.length ? (view === 'cards' ? cards : table) : h('div', { className: 'tb-empty' }, '没有符合筛选的任务。'),
        selected ? h(TaskDetail, {
          row: selected, data, topics: topicsByTask.get(selected.id),
          related: relatedByTask.get(selected.id) || [],
          onClose: () => setSelected(null),
        }) : null)
    }

    function Domains({ data, active, onSelect }) {
      const rows = data.domains.filter(row => row.cost > 0)
      const [view, setView] = useState('list')
      if (!rows.length) return h(Card, { title: '任务类型' }, h('div', { className: 'tb-empty' }, '该账期没有可归因的任务类型。'))
      const structure = h(React.Fragment, null,
        h('div', { className: 'tb-card-s', style: { marginTop: 14, marginBottom: 6 } }, 'Token 结构'),
        h('div', { className: 'tb-bar', style: { height: 10, display: 'flex', gap: 2, background: 'transparent' } },
          [['未缓存输入', data.totals.input, SERIES[0]], ['缓存读取', data.totals.cacheRead, SERIES[1]], ['输出', data.totals.output, SERIES[2]]].map(([label, value, color]) =>
            h('i', { key: label, style: { width: `${data.totals.tokens > 0 ? value / data.totals.tokens * 100 : 0}%`, background: color }, title: `${label} ${tokens(value)}` }))),
        h('div', { className: 'tb-legend', style: { marginTop: 6 } },
          [['未缓存输入', data.totals.input, SERIES[0]], ['缓存读取', data.totals.cacheRead, SERIES[1]], ['输出', data.totals.output, SERIES[2]]].map(([label, value, color]) =>
            h('span', { key: label }, h('i', { style: { background: color } }), `${label} ${tokens(value)}`))),
        data.totals.unassigned > 0.01 ? h('div', { className: 'tb-note', style: { marginTop: 8 } },
          `另有 ${money(data.totals.unassigned, data.symbol)} 未归因到具体会话。`) : null)
      return h(Card, { title: '任务类型', sub: view === 'sun' ? '图表 · 类型 → 任务，面积即费用占比' : '列表 · 点击类型筛选任务' },
        h('div', { className: 'tb-seg', role: 'group', 'aria-label': '任务类型视图', style: { marginBottom: 10, width: 'fit-content' } },
          [['list', '列表', 'list'], ['sun', '图表', 'chart']].map(([key, label, icon]) =>
            h('button', { key, type: 'button', 'aria-pressed': view === key, onClick: () => setView(key) }, h(Icon, { name: icon, size: 12 }), label))),
        view === 'sun'
          ? h(Sunburst, { root: data.domainTree, symbol: data.symbol, ariaLabel: '任务类型费用占比图' })
          : h(React.Fragment, null,
            h('div', { className: 'tb-bar', style: { height: 10, display: 'flex', gap: 2, background: 'transparent', marginBottom: 12 } },
              rows.map((row, i) => h('i', { key: row.key, style: { width: `${row.share * 100}%`, background: SERIES[i % SERIES.length] }, title: `${row.label} ${pct(row.share)}` }))),
            h('div', { className: 'tb-table' }, rows.map((row, i) => {
              const chosen = active === row.key
              return h('button', {
                key: row.key, type: 'button', className: 'tb-row tb-domain-row', 'aria-pressed': chosen,
                onClick: () => onSelect(chosen ? '' : row.key),
              },
                h('span', null, h('i', { style: { display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: SERIES[i % SERIES.length], marginRight: 7 } }), row.label),
                h('span', { className: 'tb-money' }, `${money(row.cost, data.symbol)} · ${pct(row.share)}`))
            }))),
        structure)
    }

    function graphLayout(nodes, edges) {
      const width = 900
      const height = 420
      const center = { x: width / 2, y: height / 2 }
      const positions = {}
      nodes.forEach((node, index) => {
        const angle = index / Math.max(1, nodes.length) * Math.PI * 2
        const radius = node.kind === 'topic' ? 78 : 168
        positions[node.id] = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius * 0.72 }
      })
      const k = Math.sqrt(width * height / Math.max(1, nodes.length)) * 0.52
      for (let step = 0; step < 150; step += 1) {
        const force = {}
        for (const node of nodes) force[node.id] = { x: 0, y: 0 }
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            const a = positions[nodes[i].id]
            const b = positions[nodes[j].id]
            let dx = a.x - b.x
            let dy = a.y - b.y
            let distance = Math.sqrt(dx * dx + dy * dy) || 1
            const push = Math.min(26, k * k / distance)
            dx /= distance; dy /= distance
            force[nodes[i].id].x += dx * push; force[nodes[i].id].y += dy * push
            force[nodes[j].id].x -= dx * push; force[nodes[j].id].y -= dy * push
          }
        }
        for (const edge of edges) {
          const a = positions[edge.source]
          const b = positions[edge.target]
          if (!a || !b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const spring = (distance - k * 1.35) * 0.012 * Math.min(3, edge.weight / 2)
          const fx = dx / distance * spring
          const fy = dy / distance * spring
          force[edge.source].x += fx; force[edge.source].y += fy
          force[edge.target].x -= fx; force[edge.target].y -= fy
        }
        for (const node of nodes) {
          const position = positions[node.id]
          force[node.id].x += (center.x - position.x) * (node.kind === 'topic' ? 0.05 : 0.006)
          force[node.id].y += (center.y - position.y) * (node.kind === 'topic' ? 0.05 : 0.006)
          position.x = Math.max(35, Math.min(width - 35, position.x + force[node.id].x * 0.55))
          position.y = Math.max(28, Math.min(height - 28, position.y + force[node.id].y * 0.55))
        }
      }
      return { width, height, positions }
    }

    function Tools({ data, active, onSelect }) {
      const rows = data.tools || []
      const { tip, show, hide } = useTip()
      if (!rows.length) return null
      const max = Math.max(...rows.map(row => row.count), 1)
      const duration = ms => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
      return h(Card, { title: '工具与执行', sub: 'Top 12 · 点击筛选任务 · 悬停看耗时与错误' },
        h('div', { className: 'tb-table' },
          h('div', { className: 'tb-tr tb-th tb-tool' }, h('span', null, '工具'), h('span', null, '调用占比'), h('span', { style: { textAlign: 'right' } }, '单次中位'), h('span', { style: { textAlign: 'right' } }, '错误'), h('span', { style: { textAlign: 'right' } }, '任务')),
          rows.map((row, i) => h('div', {
            key: row.name, className: 'tb-tr tb-tool tb-clickable', role: 'button', tabIndex: 0, 'aria-pressed': active === row.name,
            onMouseMove: event => show(event, row.name, [`${row.count} 次 · 覆盖 ${row.tasks} 个任务`, `中位 ${duration(row.medianMs)} · P90 ${duration(row.p90Ms)}`]),
            onMouseLeave: hide,
            onClick: () => onSelect(active === row.name ? '' : row.name),
            onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(active === row.name ? '' : row.name) } },
          },
            h('div', { className: 'tb-tool-name', title: row.name }, shortTool(row.name)),
            h('div', { className: 'tb-bar' }, h('i', { style: { width: `${Math.max(2, row.count / max * 100)}%`, background: SERIES[i % SERIES.length] } })),
            h('span', { className: 'tb-num' }, duration(row.medianMs)),
            h('span', { className: 'tb-num', style: { color: row.errorRate > 0.01 ? VI.red : C.secondary } }, pct(row.errorRate, 2)),
            h('span', { className: 'tb-num' }, String(row.tasks))))),
        h('div', { className: 'tb-note', style: { marginTop: 8 } }, '耗时来自工具调用与结果的配对；错误率按工具结果计数。'),
        h(Tip, { tip }))
    }

    function Relations({ data }) {
      const relations = data.relations
      const [selected, setSelected] = useState(null)
      const [hover, setHover] = useState(null)
      const drag = useRef(null)
      const svgRef = useRef(null)
      const { tip, show, hide } = useTip()

      const taskNodes = (relations?.nodes || []).map(node => ({ ...node, kind: 'task' }))
      const topicNodes = (relations?.topics || []).map(topic => ({
        id: topic.id, title: topic.label, kind: 'topic', cost: 0, domain: 'topic', domainLabel: '记忆主题', count: topic.count,
      }))
      const nodes = [...taskNodes, ...topicNodes]
      const nodeMap = new Map(nodes.map(node => [node.id, node]))
      const edges = (relations?.edges || []).filter(edge => nodeMap.has(edge.source) && nodeMap.has(edge.target))
      const layout = useMemo(() => graphLayout(nodes, edges), [relations])
      const [positions, setPositions] = useState(layout.positions)
      useEffect(() => setPositions(layout.positions), [layout])
      if (!relations || !relations.nodes.length) return null

      const domainIndex = new Map()
      const domainLabels = new Map()
      for (const node of taskNodes) {
        if (!domainIndex.has(node.domain)) domainIndex.set(node.domain, domainIndex.size)
        domainLabels.set(node.domain, node.domainLabel)
      }
      const maxCost = Math.max(...taskNodes.map(node => node.cost), 0.0001)
      const radiusOf = node => node.kind === 'topic' ? 10 : 6 + Math.sqrt(node.cost / maxCost) * 10
      const focus = selected || hover
      const focusEdges = focus ? edges.filter(edge => edge.source === focus || edge.target === focus) : []
      const reasons = [...new Set(focusEdges.flatMap(edge => edge.reasons || []))]
      const focusNode = focus ? nodeMap.get(focus) : null
      const topEdges = edges
        .filter(edge => !edge.source.startsWith('topic:') && !edge.target.startsWith('topic:'))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5)
      const neighbors = focus ? new Set([focus, ...focusEdges.flatMap(edge => [edge.source, edge.target])]) : null

      const move = event => {
        if (!drag.current || !svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const id = drag.current
        const x = (event.clientX - rect.left) / rect.width * layout.width
        const y = (event.clientY - rect.top) / rect.height * layout.height
        setPositions(prev => ({ ...prev, [id]: { x: Math.max(30, Math.min(layout.width - 30, x)), y: Math.max(24, Math.min(layout.height - 24, y)) } }))
      }

      return h(Card, { title: '任务关联度', sub: relations.note },
        relations.topics.length ? h('div', { className: 'tb-tags' },
          relations.topics.map(topic => h('span', { key: topic.id, className: 'tb-tag a' }, `${topic.label} · ${topic.count}`))) : null,
        h('svg', {
          ref: svgRef, viewBox: `0 0 ${layout.width} ${layout.height}`, width: '100%', role: 'group',
          'aria-label': '任务关联关系图，节点可拖动，悬停查看关联', style: { display: 'block', touchAction: 'none' },
          onPointerMove: move, onPointerUp: () => { drag.current = null }, onPointerLeave: () => { drag.current = null; hide() },
        },
          edges.map((edge, index) => {
            const a = positions[edge.source]
            const b = positions[edge.target]
            if (!a || !b) return null
            const active = focus && (edge.source === focus || edge.target === focus)
            const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.14
            const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.14
            const left = nodeMap.get(edge.source)
            const right = nodeMap.get(edge.target)
            return h('path', {
              key: `e${index}`, d: `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`,
              fill: 'none', stroke: active ? VI.teal : 'var(--tb-line-strong)',
              strokeWidth: active ? 1.8 : Math.min(2.2, 0.6 + edge.weight * 0.08),
              strokeOpacity: active ? 0.85 : 0.28, strokeLinecap: 'round',
              onMouseMove: event => show(event, `${left ? left.title : ''} ↔ ${right ? right.title : ''}`, [edge.reasons.join(' / ')]),
              onMouseLeave: hide,
            })
          }),
          nodes.map(node => {
            const position = positions[node.id]
            if (!position) return null
            const radius = radiusOf(node)
            const color = node.kind === 'topic' ? VI.gold : SERIES[(domainIndex.get(node.domain) || 0) % SERIES.length]
            const active = focus === node.id
            const showLabel = node.kind === 'topic' || active || radius > 10
            const dim = neighbors && !neighbors.has(node.id)
            return h('g', {
              key: node.id, transform: `translate(${position.x},${position.y})`, style: { cursor: 'pointer' }, opacity: dim ? 0.35 : 1,
              onPointerDown: event => { drag.current = node.id; event.stopPropagation() },
              onMouseMove: event => {
                setHover(node.id)
                show(event, node.title, [
                  node.kind === 'topic' ? `记忆主题 · 关联 ${node.count} 个任务` : `${money(node.cost, data.symbol)} · ${node.domainLabel}`,
                  node.kind === 'task' ? `${node.turns || '—'} 轮` : '',
                ].filter(Boolean))
              },
              onMouseLeave: () => { setHover(null); hide() },
              onClick: () => setSelected(selected === node.id ? null : node.id),
            },
              h('circle', {
                r: radius, fill: color, fillOpacity: active ? 1 : 0.82,
                stroke: active ? VI.navy : 'var(--tb-card)', strokeWidth: active ? 2 : 1.2,
              }),
              showLabel ? h('text', {
                x: 0, y: radius + 12, textAnchor: 'middle', fontSize: 9,
                fill: C.secondary, style: { pointerEvents: 'none' },
              }, node.title.length > 10 ? node.title.slice(0, 10) + '…' : node.title) : null)
          })),
        h('div', { className: 'tb-legend', style: { marginTop: 4 } },
          [...domainIndex.entries()].map(([domain, index]) => h('span', { key: domain },
            h('i', { style: { background: SERIES[index % SERIES.length] } }), domainLabels.get(domain) || domain)),
          h('span', null, h('i', { style: { background: VI.gold } }), '记忆主题')),
        topEdges.length ? h('div', { className: 'tb-rel-list' },
          h('div', { className: 'tb-card-s' }, '最强关联'),
          topEdges.map((edge, index) => {
            const left = nodeMap.get(edge.source)
            const right = nodeMap.get(edge.target)
            if (!left || !right) return null
            return h('div', { key: `r${index}`, className: 'tb-rel-row' },
              h('span', { className: 'tb-rel-pair' }, `${left.title} ↔ ${right.title}`),
              h('span', { className: 'tb-num' }, `${edge.reasons.join(' / ')} · ${edge.weight.toFixed(1)}`))
          })) : null,
        h('div', { className: 'tb-detail' }, focusNode
          ? `${focusNode.title} · ${focusNode.kind === 'topic' ? `关联 ${focusNode.count} 个任务` : `${money(focusNode.cost, data.symbol)} · ${focusNode.domainLabel} · ${focusNode.turns || '—'} 轮`}${reasons.length ? ` · ${reasons.join(' / ')}` : ''}`
          : '拖动节点重排；悬停看关联原因，点击节点固定。'),
        h(Tip, { tip }))
    }

    function Radar({ axes, showUser = true, showAgent = true }) {
      const size = 360
      const cx = 180
      const cy = 168
      const radius = 96
      const n = axes.length
      const point = (index, ratio) => {
        const angle = -Math.PI / 2 + index * 2 * Math.PI / n
        return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio]
      }
      const ring = ratio => axes.map((_, index) => point(index, ratio).join(',')).join(' ')
      const shape = key => axes.map((axis, index) => point(index, Math.max(0.03, axis[key] / 100)).join(',')).join(' ')
      return h('svg', { viewBox: `0 0 ${size} ${size}`, width: 316, height: 316, role: 'img', 'aria-label': '你与 AI 的六维协作雷达图', style: { flex: 'none' } },
        [0.25, 0.5, 0.75, 1].map(ratio => h('polygon', { key: ratio, points: ring(ratio), fill: 'none', stroke: C.border1, strokeWidth: 1 })),
        axes.map((_, index) => {
          const [x, y] = point(index, 1)
          return h('line', { key: `a${index}`, x1: cx, y1: cy, x2: x, y2: y, stroke: C.border1, strokeWidth: 1 })
        }),
        showUser ? h('polygon', { points: shape('user'), fill: 'rgba(132,165,210,.18)', stroke: VI.moon, strokeWidth: 1.7, strokeLinejoin: 'round' }) : null,
        showAgent ? h('polygon', { points: shape('agent'), fill: 'rgba(21,154,153,.16)', stroke: VI.teal, strokeWidth: 1.7, strokeLinejoin: 'round' }) : null,
        axes.map((axis, index) => {
          const [x, y] = point(index, 1.22)
          const anchor = Math.abs(x - cx) < 8 ? 'middle' : x > cx ? 'start' : 'end'
          return h('text', { key: `l${index}`, x, y: y + 4, textAnchor: anchor, fontSize: 10.5, fill: C.secondary }, axis.label)
        }))
    }

    function StyleSection({ data }) {
      const [showUser, setShowUser] = useState(true)
      const [showAgent, setShowAgent] = useState(true)
      const style = data.style
      if (!style) {
        const message = data.coverage && data.coverage.files === 0
          ? '未找到会话日志，协作默契度与小时分布不可用。'
          : data.coverage && data.coverage.parsed === 0 && data.coverage.files > 0
            ? '会话日志解析失败，暂时读不到提问样本。'
            : '所选账期没有用户提问样本。'
        return h(Card, { title: '协作默契度' }, h('div', { className: 'tb-empty' }, message))
      }
      const arch = style.archetype
      const agent = style.agent || { values: {}, tags: [] }
      const match = style.match
      const axes = match
        ? match.axes
        : style.dims.map(dim => ({ ...dim, label: dim.label, user: dim.value, agent: 0, gap: dim.value }))

      return h(Card, {
        title: '协作默契度',
        sub: `样本 ${style.count} 条 · ${style.sessions} 个会话 · AI 侧为行为代理指标`,
      },
        match ? h('div', { className: 'tb-match' },
          h('div', { className: 'tb-match-score' }, match.score, h('small', null, '/100')),
          h('div', null,
            h('div', { className: 'tb-match-label' }, `${match.label} · ${match.mode}`),
            h('div', { className: 'tb-note' }, match.sentence))) : null,
        h('div', { className: 'tb-grid2', style: { alignItems: 'start' } },
          h('div', null,
            h(Radar, { axes, showUser, showAgent }),
            h('div', { className: 'tb-legend', style: { justifyContent: 'center', marginTop: 2 } },
              h('button', { type: 'button', className: 'tb-legend-btn', 'aria-pressed': showUser, onClick: () => setShowUser(value => !value) },
                h('i', { style: { background: VI.moon, opacity: showUser ? 1 : .35 } }), '你的风格'),
              h('button', { type: 'button', className: 'tb-legend-btn', 'aria-pressed': showAgent, onClick: () => setShowAgent(value => !value) },
                h('i', { style: { background: VI.teal, opacity: showAgent ? 1 : .35 } }), 'AI 的响应')),
            h('div', { className: 'tb-note', style: { marginTop: 8, textAlign: 'center' } },
              '雷达是相对刻度，不是能力评分；两人都低才是风险。')),
          h('div', null,
            h('div', { className: 'tb-card-s', style: { marginBottom: 2 } }, `你的类型：${arch.label}`),
            h('div', { className: 'tb-note', style: { marginBottom: 6 } }, arch.line),
            h('div', { className: 'tb-note' }, `优势：${arch.strength}`),
            h('div', { className: 'tb-note', style: { marginBottom: 10 } }, `注意：${arch.risk}`),
            h('div', { className: 'tb-card-s' }, '你的标签'),
            h('div', { className: 'tb-tags' }, (style.tags || []).map(tag => h('span', { key: tag, className: 'tb-tag u' }, tag))),
            h('div', { className: 'tb-card-s' }, 'AI 的响应标签'),
            h('div', { className: 'tb-tags' }, (agent.tags || []).map(tag => h('span', { key: tag, className: 'tb-tag a' }, tag)))
          )),
        h('div', { style: { marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border1}` } },
          h('div', { className: 'tb-card-s', style: { marginBottom: 6 } }, '六维拆解 · 上条为你，下条为 AI'),
          axes.map(axis => h('div', { key: axis.key, className: 'tb-axis', title: `${axis.hint} · ${axis.evidence || ''}` },
            h('span', { className: 'tb-axis-l' }, axis.label, h('small', { style: { display: 'block', fontSize: 9.5, color: C.secondary, marginTop: 1 } }, axis.hint)),
            h('div', { className: 'tb-axis-bars' },
              h('div', { className: 'tb-axis-track' }, h('i', { style: { width: `${Math.max(2, axis.user)}%`, background: VI.moon } })),
              h('div', { className: 'tb-axis-track' }, h('i', { style: { width: `${Math.max(2, axis.agent)}%`, background: VI.teal } }))),
            h('span', { className: 'tb-axis-v' }, `${axis.user} / ${axis.agent}`)))),
        h('div', { className: 'tb-note', style: { marginTop: 8 } },
          'AI 侧读法：准确=工具成功率与轮次完成率，及时=首响中位延迟，主动=工具与查证行为，解释=平均解释长度，记忆=缓存与记忆类调用，自检=自检类调用与纠正率。'),
        h('div', { className: 'tb-grid2', style: { marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border1}` } },
          h('div', null,
            h('div', { className: 'tb-card-s', style: { marginBottom: 6 } }, '从提问里读到的'),
            style.highlights.map((line, i) => h('div', { key: i, className: 'tb-hl' }, line))),
          h('div', null,
            h('div', { className: 'tb-card-s', style: { marginBottom: 6 } }, '主题分布'),
            style.domains.filter(row => row.key !== 'other').slice(0, 4).map((row, i) => h('div', { key: row.key, className: 'tb-row', style: { padding: '3px 0' } },
              h('span', null, h('i', { style: { display: 'inline-block', width: 7, height: 7, borderRadius: 2, background: SERIES[i % SERIES.length], marginRight: 6 } }), row.label),
              h('span', { className: 'tb-num' }, `${row.count} 条 · ${pct(row.share)}`))),
            style.domains.some(row => row.key === 'other') ? h('div', { className: 'tb-note', style: { marginTop: 6 } },
              `另有 ${pct(style.domains.find(row => row.key === 'other').share)} 是短指令或未归类发言。`) : null)),
        h('div', { className: 'tb-note', style: { marginTop: 12 } }, 'AI 能走多远，往往取决于问题被问到多深。'))
    }

    function Suggestions({ data }) {
      const rows = data.suggestions || []
      const maxSaving = rows.reduce((max, row) => Math.max(max, row.saving || 0), 0)
      const colorOf = priority => priority === 'high' ? VI.red : priority === 'medium' ? VI.yellow : VI.moon
      return h(Card, {
        title: '动作优化',
        sub: maxSaving > 0 ? `单项最大约 ${money(maxSaving, data.symbol)} · 各项可能重叠` : '按当前账单结构生成',
      },
        data.totals.cost <= 0 ? h('div', { className: 'tb-empty' }, '该账期没有记录。') : rows.length
          ? h('div', { className: 'tb-sug' }, rows.map(row => h('div', { key: row.id, className: 'tb-sugcard' },
            h('div', { className: 'tb-sughead' },
              h('span', { className: 'tb-dot', style: { background: colorOf(row.priority) } }),
              h('span', { className: 'tb-sug-t' }, row.title),
              h('span', { className: 'tb-sug-save' }, row.savingLabel || '')),
            h('div', { className: 'tb-sug-p' }, row.why),
            h('div', { className: 'tb-sug-act' }, row.action),
            h('div', { className: 'tb-note' }, row.basis || ''))))
          : h('div', { className: 'tb-empty' }, '当前账单没有明显的浪费项，保持现在的用法即可。'))
    }

    function Notes({ data }) {
      return h('div', { className: 'tb-links', style: { padding: '0 4px' } },
        data.notes.map((note, i) => h('span', { key: i }, note)))
    }

    function Loading() {
      return h('div', { className: 'tb-root' }, h('div', { className: 'tb-wrap', 'aria-busy': 'true' },
        h('div', { className: 'tb-head' },
          h('div', null, h('div', { className: 'tb-title' }, '账单'), h('div', { className: 'tb-sub' }, '正在读取账本与会话日志…'))),
        h('div', { className: 'tb-kpis' }, Array.from({ length: 5 }, (_, i) => h('div', { key: i, className: 'tb-kpi' },
          h('div', { className: 'tb-skel', style: { width: '48%', marginBottom: 10 } }),
          h('div', { className: 'tb-skel', style: { width: '68%', height: 22 } })))),
        h('div', { className: 'tb-card' }, h('div', { className: 'tb-skel', style: { height: 120 } }))))
    }

    function ErrorCard({ message, retry }) {
      return h('div', { className: 'tb-root' }, h('div', { className: 'tb-wrap' },
        h('div', { className: 'tb-head' }, h('div', null, h('div', { className: 'tb-title' }, '账单'), h('div', { className: 'tb-sub' }, '读取失败'))),
        h('div', { className: 'tb-card tb-empty' },
          h('div', null, message || '未知错误'),
          h('div', { style: { marginTop: 12 } }, h('button', { type: 'button', className: 'tb-btn', onClick: retry }, '重试')))))
    }

    function SessionTimeline({ session, data }) {
      const points = session.series || []
      const [hover, setHover] = useState(null)
      const { tip, show, hide } = useTip()
      if (!points.length) return h('div', { className: 'tb-empty' }, '本轮还没有可绘制的时间点。')
      const width = 900
      const height = 220
      const left = 52
      const right = 16
      const top = 18
      const bottom = 30
      const plotW = width - left - right
      const plotH = height - top - bottom
      const max = Math.max(...points.map(point => point.cumulative), session.cost || 0, 0.01)
      const x = index => left + (index / Math.max(1, points.length - 1)) * plotW
      const y = value => top + plotH - (value / max) * plotH
      const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.cumulative)}`).join(' ')
      const area = `${line} L${x(points.length - 1)},${top + plotH} L${x(0)},${top + plotH} Z`
      const ticks = [0, 0.5, 1]
      const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 3), Math.floor((points.length - 1) * 2 / 3), points.length - 1])]
      return h('div', { className: 'tb-chart-line' },
        h('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', role: 'img', 'aria-label': '本轮会话费用累计走势' },
          h('defs', null, h('linearGradient', { id: 'tb-area', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: 'rgba(21,154,153,.26)' }),
            h('stop', { offset: '100%', stopColor: 'rgba(21,154,153,0)' }))),
          ticks.map((tick, index) => {
            const value = max * tick
            return h('g', { key: index },
              h('line', { x1: left, y1: y(value), x2: width - right, y2: y(value), stroke: 'var(--tb-line)', strokeWidth: 1 }),
              h('text', { x: left - 7, y: y(value) + 3.5, textAnchor: 'end', fontSize: 9.5, fill: C.secondary }, money(value, data.symbol)))
          }),
          labelIndexes.map(index => h('text', {
            key: index, x: x(index), y: height - 9, textAnchor: index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle', fontSize: 9.5, fill: C.secondary,
          }, points[index].label)),
          h('path', { d: area, fill: 'url(#tb-area)' }),
          h('path', { d: line, fill: 'none', stroke: VI.teal, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }),
          hover !== null ? h('g', null,
            h('line', { x1: x(hover), y1: top, x2: x(hover), y2: top + plotH, stroke: VI.teal, strokeOpacity: .45, strokeDasharray: '3 3' }),
            h('circle', { cx: x(hover), cy: y(points[hover].cumulative), r: 3.6, fill: VI.teal, stroke: 'var(--tb-card)', strokeWidth: 1.5 })) : null,
          points.map((point, index) => h('rect', {
            key: `hit-${index}`, x: x(index) - plotW / Math.max(1, points.length) / 2, y: top,
            width: plotW / Math.max(1, points.length), height: plotH, fill: 'transparent',
            onMouseMove: event => {
              setHover(index)
              show(event, point.label, [`本段 ${money(point.cost, data.symbol)} · ${point.calls} 次调用`, `累计 ${money(point.cumulative, data.symbol)}`])
            },
            onMouseLeave: () => { setHover(null); hide() },
          }))),
        h(Tip, { tip }))
    }

    function PeriodBar({ period, onChange }) {
      return h('div', { className: 'tb-seg', role: 'group', 'aria-label': '账期' },
        [['all', '全部'], ['7', '近 7 天'], ['30', '近 30 天'], ['month', '本月']].map(([key, label]) =>
          h('button', { key, type: 'button', 'aria-pressed': period === key, onClick: () => onChange(key) }, label)))
    }

    function ModuleBar({ title, meta, period, onChange, filters, children }) {
      return h('div', { className: 'tb-module-head' },
        h('div', { className: 'tb-module-heading' },
          title ? h('div', { className: 'tb-module-title' }, title) : null,
          meta ? h('div', { className: 'tb-module-meta' }, meta) : null),
        h('div', { className: 'tb-module-controls' },
          period ? h(PeriodBar, { period, onChange }) : null,
          filters?.length ? h('div', { className: 'tb-filter-chips' }, filters.map(filter =>
            h('button', { key: filter.key, type: 'button', className: 'tb-filter-chip', onClick: filter.clear, title: '清除此过滤条件' },
              filter.label, h('span', { className: 'tb-filter-x', 'aria-hidden': true }, '×')))) : null,
          children))
    }

    function Switch({ items, value, onChange, accent = VI.teal }) {
      const ref = useRef(null)
      const [thumb, setThumb] = useState({ left: 0, width: 0 })
      useEffect(() => {
        const node = ref.current
        if (!node) return undefined
        const update = () => {
          const active = node.querySelector('[aria-selected="true"]')
          if (!active) return
          setThumb({ left: Math.max(0, active.offsetLeft - 3), width: active.offsetWidth })
        }
        update()
        const timer = setTimeout(update, 0)
        window.addEventListener('resize', update)
        let observer = null
        if (typeof ResizeObserver !== 'undefined') {
          observer = new ResizeObserver(update)
          observer.observe(node)
        }
        return () => {
          clearTimeout(timer)
          window.removeEventListener('resize', update)
          observer?.disconnect()
        }
      }, [value, items.length])
      return h('div', {
        className: 'tb-switch', role: 'tablist',
        ref, style: { '--tb-switch-accent': accent },
      },
        h('span', { className: 'tb-switch-thumb', 'aria-hidden': true, style: { width: thumb.width, transform: `translateX(${thumb.left}px)` } }),
        items.map(([key, label]) => h('button', {
          key, type: 'button', role: 'tab', 'aria-selected': value === key,
          onClick: () => onChange(key),
        }, label)))
    }

    function SessionDetail({ session, data }) {
      const steps = [...(session.costSteps || [])].sort((a, b) => b.cost - a.cost).slice(0, 120)
      const tools = session.topTools || []
      const breakdown = session.breakdown || {}
      const rows = [
        ['输入', breakdown.input], ['输出', breakdown.output],
        ['缓存读取', breakdown.cacheRead], ['缓存写入', breakdown.cacheWrite],
        ['推理', breakdown.reasoning],
      ]
      return h('div', { className: 'tb-session-detail' },
        h('div', { className: 'tb-grid2' },
          h('div', { className: 'tb-card' },
            h('div', { className: 'tb-card-t', style: { marginBottom: 8 } }, 'Token 构成'),
            rows.map(([label, value]) => h('div', { key: label, className: 'tb-detail-line' },
              h('span', null, label), h('span', null, tokens(value || 0))))),
          h('div', { className: 'tb-card' },
            h('div', { className: 'tb-card-t', style: { marginBottom: 8 } }, '工具 Top'),
            tools.length ? tools.slice(0, 10).map((tool, index) => h('div', { key: tool.name, className: 'tb-detail-line' },
              h('span', null, `${index + 1}. ${shortTool(tool.name)}`), h('span', null, `${tool.count} 次`))) : h('div', { className: 'tb-empty' }, '没有工具调用。'))),
        h('div', { className: 'tb-card', style: { marginTop: 12 } },
          h('div', { className: 'tb-card-h' },
            h('span', { className: 'tb-card-t' }, '步骤明细'),
            h('span', { className: 'tb-card-s' }, '按费用排序 · 前 120 步')),
          steps.length ? h('div', { className: 'tb-step-table', role: 'table' },
            h('div', { className: 'tb-step-tr tb-step-th', role: 'row' },
              ['#', '类别', '工具 / 模型', '轮/步', '费用'].map((label, index) => h('span', { key: label, role: 'columnheader', className: index === 4 ? 'right' : '' }, label))),
            steps.map((row, index) => h('div', { key: row.index, className: 'tb-step-tr', role: 'row' },
              h('span', { role: 'cell', className: 'tb-step-num' }, String(index + 1)),
              h('span', { role: 'cell' }, h('i', { className: 'tb-step-dot', style: { background: COST_TYPE_COLORS[row.kind] || VI.gray } }), row.label),
              h('span', { role: 'cell', className: 'tb-step-tool' }, row.tools.length ? row.tools.map(shortTool).join('、') : (row.model || '模型回复')),
              h('span', { role: 'cell', className: 'tb-step-meta' }, `${row.turn || '—'} / ${row.step || '—'}`),
              h('span', { role: 'cell', className: 'right' }, money(row.cost, data.symbol)))))
            : h('div', { className: 'tb-empty' }, '没有步骤数据。')),
        h('div', { className: 'tb-note' }, '步骤费用按该次调用的 token 用量分摊；工具与模型来自会话日志。'))
    }

    function CostComposition({ session, data }) {
      const [costView, setCostView] = useState('share')
      const costTypes = session.costTypes || []
      const costMeta = session.costTypeMeta || { steps: session.calls || 0, calls: session.calls || 0, avgCost: session.costPerTurn || 0 }
      const total = costTypes.reduce((sum, type) => sum + type.cost, 0) || session.cost || 0
      const ringParts = costTypes.map(type => ({ label: type.label, value: type.cost, color: COST_TYPE_COLORS[type.kind] || VI.gray }))
      const list = costTypes.map(type => h('div', { key: type.kind, className: 'tb-costtype-row' },
        h('span', { className: 'tb-costtype-dot', style: { background: COST_TYPE_COLORS[type.kind] || VI.gray } }),
        h('span', { className: 'tb-costtype-name' }, type.label),
        h('span', { className: 'tb-costtype-cost' }, money(type.cost, data.symbol)),
        h('span', { className: 'tb-costtype-share' }, pct(type.share, 1)),
        h('div', { className: 'tb-costtype-bar' }, h('i', { style: { width: `${Math.max(2, type.share * 100)}%`, background: COST_TYPE_COLORS[type.kind] || VI.gray } }))))
      return h('div', { className: 'tb-card', style: { marginTop: 12 } },
        h('div', { className: 'tb-card-h' },
          h('span', { className: 'tb-card-t' }, '费用类型构成'),
          h('div', { className: 'tb-seg', role: 'group', 'aria-label': '费用构成视图', style: { flexWrap: 'wrap' } },
            [['share', '归类占比'], ['rect', '矩形分布'], ['tree', '父子归属'], ['heat', '步骤热力图']].map(([key, label]) =>
              h('button', { key, type: 'button', 'aria-pressed': costView === key, onClick: () => setCostView(key) }, label)))),
        costTypes.length
          ? (costView === 'share'
            ? h('div', { className: 'tb-costtypes' },
              h('div', { className: 'tb-costtype-ring' },
                h(Ring, { parts: ringParts, size: 150, stroke: 18, centerValue: money(total, data.symbol), centerLabel: '总费用' })),
              h('div', { className: 'tb-costtype-list' }, list))
            : costView === 'rect'
              ? h(CostTreemap, { types: costTypes, data })
              : costView === 'tree'
                ? h(Sunburst, { root: session.costAttribution || { children: [] }, symbol: data.symbol, ariaLabel: '费用父子归属' })
                : h(StepHeatmap, { session, data }))
          : h('div', { className: 'tb-empty' }, '本轮还没有可归类的调用。'),
        h('div', { className: 'tb-costtype-meta' }, `步骤 ${costMeta.steps} · 调用 ${costMeta.calls} · 单步均值 ${money(costMeta.avgCost, data.symbol)} · 最高 10 步占比 ${pct(costMeta.top10Share || 0, 1)}`),
        h('div', { className: 'tb-note' }, costView === 'tree'
          ? '内圈为费用类别，外圈为工具或模型；费用按步骤分摊。'
          : costView === 'heat'
            ? '每格一步，颜色区分类别，深浅表示费用。'
            : costView === 'rect'
              ? '矩形面积表示费用占比；颜色区分类别。'
              : '归类来自会话调用与工具名；单步费用按 token 用量分摊。'))
    }

    function SessionOverview({ session, data }) {
      return h(React.Fragment, null,
        h('div', { className: 'tb-kpis' },
          h(Kpi, { label: '本轮费用', value: money(session.cost, data.symbol), sub: `占本期 ${pct((session.cost || 0) / (data.totals.cost || 1))}`, icon: 'receipt', iconColor: '#B55245' }),
          h(Kpi, { label: 'Token', value: tokens(session.tokens), sub: `缓存 ${pct(session.cacheShare || 0, 1)}`, icon: 'coins', iconColor: VI.moon }),
          h(Kpi, { label: '调用', value: String(session.calls || 0), sub: `轮次 ${session.turns || '—'}`, icon: 'activity', iconColor: VI.teal }),
          h(Kpi, { label: '单轮费用', value: money(session.costPerTurn || 0, data.symbol), sub: `首响 ${(session.medianLatencySec || 0).toFixed(1)}s`, icon: 'clock', iconColor: '#D9A441' }),
          h(Kpi, { label: '工具', value: String(session.tools || 0), sub: `错误 ${pct(session.toolErrorRate || 0, 1)}`, icon: 'wrench', iconColor: VI.jade })),
        h(CostComposition, { session, data }))
    }

    function CostTreemap({ types, data }) {
      const { tip, show, hide } = useTip()
      if (!types.length) return h('div', { className: 'tb-empty' }, '没有可画的费用类型。')
      const width = 900
      const height = 260
      const items = [...types].map(type => ({ ...type, value: Math.max(0.0001, type.cost) }))
      const total = items.reduce((sum, item) => sum + item.value, 0) || 1
      const rects = []
      const layout = (list, x, y, w, h, vertical) => {
        if (!list.length) return
        if (list.length === 1) { rects.push({ item: list[0], x, y, w, h }); return }
        const rest = list.slice(1)
        const restValue = rest.reduce((sum, item) => sum + item.value, 0)
        const ratio = list[0].value / Math.max(0.0001, list[0].value + restValue)
        if (vertical) {
          rects.push({ item: list[0], x, y, w: w * ratio, h })
          layout(rest, x + w * ratio, y, w * (1 - ratio), h, false)
        } else {
          rects.push({ item: list[0], x, y, w, h: h * ratio })
          layout(rest, x, y + h * ratio, w, h * (1 - ratio), true)
        }
      }
      layout(items.sort((a, b) => b.value - a.value), 0, 0, width, height, true)
      return h('div', { className: 'tb-treemap' },
        h('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', role: 'img', 'aria-label': '费用类型矩形分布', style: { height: 'auto' } },
          rects.map((rect, index) => {
            const color = COST_TYPE_COLORS[rect.item.kind] || VI.gray
            const label = rect.item.label
            const showLabel = rect.w > 90 && rect.h > 34
            return h('g', { key: rect.item.kind || index },
              h('rect', {
                x: rect.x + 1, y: rect.y + 1, width: Math.max(0, rect.w - 2), height: Math.max(0, rect.h - 2), rx: 6,
                fill: color, fillOpacity: 0.28 + Math.min(0.55, rect.item.share * 2.2), stroke: 'var(--tb-card)', strokeWidth: 1.5,
                onMouseMove: event => show(event, label, [`${money(rect.item.cost, data.symbol)} · ${pct(rect.item.share, 1)}`, `${rect.item.calls} 步`]),
                onMouseLeave: hide,
                style: { cursor: 'pointer' },
              }),
              showLabel ? h('text', { x: rect.x + 12, y: rect.y + 21, fontSize: 10.5, fontWeight: 600, fill: C.primary, style: { pointerEvents: 'none' } }, label) : null,
              showLabel ? h('text', { x: rect.x + 12, y: rect.y + 36, fontSize: 9.5, fill: C.secondary, style: { pointerEvents: 'none' } }, pct(rect.item.share, 1)) : null)
          })),
        h(Tip, { tip }))
    }

    function StepHeatmap({ session, data }) {
      const rows = session.costSteps || []
      const { tip, show, hide } = useTip()
      if (!rows.length) return h('div', { className: 'tb-empty' }, '没有步骤数据。')
      const max = Math.max(...rows.map(row => row.cost), 0.0001)
      return h('div', { className: 'tb-heatsteps' },
        h('div', { className: 'tb-stepgrid', role: 'list', 'aria-label': '步骤费用热力图' },
          rows.map(row => {
            const color = COST_TYPE_COLORS[row.kind] || VI.gray
            const opacity = 0.3 + 0.7 * (row.cost / max)
            return h('button', {
              key: row.index, type: 'button', className: 'tb-stepcell', role: 'listitem',
              'aria-label': `第 ${row.index + 1} 步 ${row.label} ${money(row.cost, data.symbol)}`,
              title: `#${row.index + 1} · ${row.label} · ${money(row.cost, data.symbol)}`,
              style: { background: color, opacity },
              onMouseMove: event => show(event, `#${row.index + 1} · ${row.label}`, [
                `${money(row.cost, data.symbol)} · ${row.turn || '—'} 轮 / ${row.step || '—'} 步`,
                row.tools.length ? row.tools.map(shortTool).join('、') : (row.model || '模型回复'),
              ]),
              onMouseLeave: hide,
            })
          })),
        h('div', { className: 'tb-legend', style: { marginTop: 10 } },
          (session.costTypes || []).map(type => h('span', { key: type.kind },
            h('i', { style: { background: COST_TYPE_COLORS[type.kind] || VI.gray } }), type.label))),
        h(Tip, { tip }))
    }

    function SessionBill({ data }) {
      const [view, setView] = useState('overview')
      const [timelineOpen, setTimelineOpen] = useState(false)
      const session = data.session
      if (!session) return h('div', { className: 'tb-empty' }, '本轮会话还没有计费记录。')
      return h('div', { className: 'tb-session' },
        h(ModuleBar, {
          title: view === 'overview' ? '概览' : '明细',
          meta: `${session.title || '当前会话'} · ${session.date || ''} · ${session.domainLabel || ''} · ${session.turns || '—'} 轮 · ${(session.models || []).join('、') || '—'}`,
        }, h(Switch, { items: [['overview', '概览'], ['detail', '明细']], value: view, onChange: setView, accent: VI.teal })),
        view === 'overview'
          ? h(React.Fragment, null,
            h(SessionOverview, { session, data }),
            h('div', { className: 'tb-card', style: { marginTop: 12 } },
              h('div', { className: 'tb-card-h' },
                h('span', { className: 'tb-card-t' }, '费用走势'),
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                  h('span', { className: 'tb-card-s' }, `累计 ${money(session.cost, data.symbol)} · 按 ${session.bucketMinutes || 5} 分钟分摊`),
                  h('button', { className: 'tb-btn', type: 'button', 'aria-expanded': timelineOpen, onClick: () => setTimelineOpen(value => !value) },
                    h(Icon, { name: timelineOpen ? 'chevronUp' : 'chevronDown', size: 12 }), timelineOpen ? '收起' : '展开'))),
              h('div', { className: `tb-collapse${timelineOpen ? ' tb-collapse-open' : ''}`, 'aria-hidden': !timelineOpen },
                h('div', { className: 'tb-collapse-inner' }, h(SessionTimeline, { session, data })))))
          : h(SessionDetail, { session, data }))
    }

    function ReportButton({ data, sessionId }) {
      const [open, setOpen] = useState(false)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const ref = useRef(null)
      useEffect(() => {
        if (!open) return undefined
        const close = event => { if (!ref.current?.contains(event.target)) setOpen(false) }
        document.addEventListener('pointerdown', close)
        return () => document.removeEventListener('pointerdown', close)
      }, [open])
      const download = async format => {
        setOpen(false)
        setBusy(true)
        setError('')
        try {
          const params = new URLSearchParams({
            format,
            from: data.range?.from || '',
            to: data.range?.to || '',
            currency: data.currency || 'CNY',
            sessionId: sessionId || '',
          })
          const response = await fetch(`/token-bill/report/export?${params.toString()}`)
          if (!response.ok) {
            let message = `HTTP ${response.status}`
            try { const body = await response.json(); if (body?.error) message = body.error } catch {}
            throw new Error(message)
          }
          const blob = await response.blob()
          const disposition = response.headers.get('content-disposition') || ''
          const match = /filename="([^"]+)"/.exec(disposition)
          const name = match?.[1] || `token-bill.${format}`
          const href = URL.createObjectURL(blob)
          const anchor = document.createElement('a')
          anchor.href = href
          anchor.download = name
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          setTimeout(() => URL.revokeObjectURL(href), 1000)
        } catch (reason) {
          setError(reason?.message || '报告生成失败')
        } finally {
          setBusy(false)
        }
      }
      const items = [
        ['html', 'HTML', '可视化网页报告'],
        ['pdf', 'PDF', '适合打印/分享'],
        ['docx', 'DOCX', 'Word 文档报告'],
        ['json', 'JSON', '原始账单数据'],
      ]
      return h('div', { className: 'tb-report', ref },
        h('button', {
          className: 'tb-btn', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': open,
          disabled: busy, onClick: () => setOpen(value => !value),
        }, h(Icon, { name: 'download', size: 13 }), busy ? '生成中…' : '生成报告', h(Icon, { name: 'chevronDown', size: 12 })),
        open ? h('div', { className: 'tb-report-menu', role: 'menu' },
          items.map(([format, label, hint]) => h('button', {
            key: format, type: 'button', className: 'tb-report-item', role: 'menuitem',
            onClick: () => download(format),
          }, h(Icon, { name: 'fileText', size: 14 }), h('span', null,
            h('strong', null, label), h('small', null, hint))))) : null,
        error ? h('div', { className: 'tb-report-error', role: 'alert' }, error) : null)
    }

    function formatStars(value) {
      if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
      return String(value)
    }

    function GitHubButton() {
      const [stars, setStars] = useState(null)
      useEffect(() => {
        let live = true
        fetch('/token-bill/github')
          .then(response => response.ok ? response.json() : null)
          .then(body => { if (live && Number.isFinite(body?.stars)) setStars(body.stars) })
          .catch(() => {})
        return () => { live = false }
      }, [])
      const showStars = Number(stars) > 100
      return h('a', {
        className: 'tb-btn tb-github', href: 'https://github.com/renzg/dsh-token-bill',
        target: '_blank', rel: 'noreferrer noopener', 'aria-label': 'GitHub 仓库',
      },
        h('svg', { viewBox: '0 0 24 24', width: 14, height: 14, fill: 'currentColor', 'aria-hidden': true, style: { flex: 'none' } },
          h('path', { d: 'M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.2c-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z' })),
        h('span', null, 'GitHub'),
        showStars ? h('span', { className: 'tb-github-stars' }, h(Icon, { name: 'star', size: 11 }), formatStars(stars)) : null)
    }

    function PrimaryTabs({ tab, onTab, reload, loading, data, sessionId }) {
      return h('div', { className: 'tb-primary-head' },
        h('nav', { className: 'tb-primary-tabs', role: 'tablist', 'aria-label': '账单模块' },
          [['session', '本轮会话', 'clock'], ['total', '汇总账单', 'receipt'], ['rapport', '协作默契度', 'radar'], ['actions', '动作优化', 'sparkles']].map(([key, label, icon]) =>
            h('button', {
              key, type: 'button', role: 'tab', className: 'tb-primary-tab', 'aria-selected': tab === key,
              onClick: () => onTab(key),
            }, h(Icon, { name: icon, size: 14 }), label))),
        h('div', { className: 'tb-primary-tools' },
          h(ReportButton, { data, sessionId }),
          h('button', { className: 'tb-btn', type: 'button', onClick: reload, disabled: loading },
            h(Icon, { name: 'refresh', size: 13 }), loading ? '读取中…' : '刷新'),
          h(GitHubButton, null)))
    }

    function TotalModule({ data, period, onPeriod, domain, onDomain, tool, onTool }) {
      const [view, setView] = useState('overview')
      const title = view === 'overview' ? '概览' : view === 'detail' ? '明细' : '任务关联度'
      const filters = []
      if (domain) {
        const item = (data.domains || []).find(domainItem => domainItem.key === domain)
        filters.push({ key: 'domain', label: `类型 · ${item?.label || domain}`, clear: () => onDomain('') })
      }
      if (tool) filters.push({ key: 'tool', label: `工具 · ${shortTool(tool)}`, clear: () => onTool('') })
      return h('div', { className: 'tb-module' },
        h(ModuleBar, {
          title,
          meta: `${data.range.from} 至 ${data.range.to} · 账本保留 ${data.retained.from}–${data.retained.to}`,
          period,
          onChange: onPeriod,
          filters,
        }, h(Switch, { items: [['overview', '概览'], ['detail', '明细'], ['relations', '任务关联度']], value: view, onChange: setView, accent: VI.navy })),
        view === 'overview'
          ? h(Summary, { data })
          : view === 'detail'
            ? h(React.Fragment, null,
              h(TimeSection, { data }),
              h('div', { className: 'tb-grid2' },
                h(Models, { data }),
                h(Domains, { data, active: domain, onSelect: onDomain })),
              h(Tasks, { data, domain, onDomain, tool, onTool }),
              h(Tools, { data, active: tool, onSelect: onTool }),
              h(Notes, { data }))
            : h(Relations, { data }))
    }

    function RapportModule({ data, period, onPeriod }) {
      return h('div', { className: 'tb-module' },
        h(ModuleBar, { title: '协作默契度', meta: '按所选账期计算', period, onChange: onPeriod }),
        h(StyleSection, { data }))
    }

    function ActionsModule({ data, period, onPeriod }) {
      return h('div', { className: 'tb-module' },
        h(ModuleBar, { title: '动作优化', meta: '按所选账期计算', period, onChange: onPeriod }),
        h(Suggestions, { data }))
    }

    function TokenBillView(props) {
      const sessionId = props?.sessionId || ''
      const [tab, setTab] = useState('session')
      const [period, setPeriod] = useState('all')
      const [domain, setDomain] = useState('')
      const [toolFilter, setToolFilter] = useState('')
      const [state, reload] = useReport(period, sessionId)
      const changePeriod = value => { setDomain(''); setToolFilter(''); setPeriod(value) }
      const data = state.data
      if (!data && state.loading) return h(React.Fragment, null, h('style', null, CSS), h(Loading))
      if (!data && state.error) return h(React.Fragment, null, h('style', null, CSS), h(ErrorCard, { message: state.error, retry: reload }))
      if (!data) return h(React.Fragment, null, h('style', null, CSS), h(ErrorCard, { message: '没有收到账单数据。', retry: reload }))

      const content = tab === 'session'
        ? h(SessionBill, { data })
        : tab === 'total'
          ? h(TotalModule, { data, period, onPeriod: changePeriod, domain, onDomain: setDomain, tool: toolFilter, onTool: setToolFilter })
          : tab === 'rapport'
            ? h(RapportModule, { data, period, onPeriod: changePeriod })
            : h(ActionsModule, { data, period, onPeriod: changePeriod })

      return h('div', { className: 'tb-root' },
        h('style', null, CSS),
        h('div', { className: 'tb-wrap' },
          h(PrimaryTabs, { tab, onTab: setTab, reload, loading: state.loading, data, sessionId }),
          state.error ? h('div', { className: 'tb-note', role: 'alert', style: { color: C.error } }, `刷新失败，显示上次结果：${state.error}`) : null,
          content))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'token-bill',
          order: 27,
          label: () => '账单',
          inject: sessionId => ({ sessionId }),
        }, TokenBillView))
      },
    }
  },
})
