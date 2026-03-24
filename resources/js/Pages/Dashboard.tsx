import { Head } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";

type Status = "transit" | "delivered" | "pending" | "delayed" | "customs";
type Mode = "Sea" | "Air" | "Road" | "Rail";
type PageName = "dashboard" | "shipments";

type Shipment = {
    id: string;
    customer: string;
    origin: string;
    originCountry: string;
    destination: string;
    destCountry: string;
    weight: number;
    volume: number;
    mode: Mode;
    eta: string;
    status: Status;
    cost: number;
    container: string;
    notes: string;
    created: string;
};

type ToastType = "success" | "error" | "info";

type FormState = {
    customer: string;
    mode: "" | Mode;
    origin: string;
    originCountry: string;
    destination: string;
    destCountry: string;
    weight: string;
    volume: string;
    status: Status;
    eta: string;
    cost: string;
    container: string;
    notes: string;
};

const CSS = `
*, *::before, *::after { box-sizing: border-box; }
:root {
  --blue:#3B82F6; --blue-dim:rgba(59,130,246,0.12); --blue-border:rgba(59,130,246,0.3);
  --bg:#0F1117; --bg-2:#161923; --bg-3:#1D2230; --bg-4:#242A38;
  --border:rgba(255,255,255,0.07); --border-strong:rgba(255,255,255,0.12);
  --text-1:#F1F3F7; --text-2:#9BA3B5; --text-3:#6B7385;
  --green:#22C55E; --amber:#F59E0B; --red:#EF4444; --purple:#A78BFA;
  --green-dim:rgba(34,197,94,0.1); --amber-dim:rgba(245,158,11,0.1);
  --red-dim:rgba(239,68,68,0.1); --purple-dim:rgba(167,139,250,0.1);
  --sidebar-w:240px; --sidebar-collapsed:60px;
  --radius:10px; --transition:0.22s cubic-bezier(0.4,0,0.2,1);
}
[data-theme="light"] {
  --bg:#F4F5F8; --bg-2:#FFFFFF; --bg-3:#F0F1F5; --bg-4:#E8EAEF;
  --border:rgba(0,0,0,0.07); --border-strong:rgba(0,0,0,0.12);
  --text-1:#111827; --text-2:#4B5563; --text-3:#9CA3AF;
  --blue-dim:rgba(59,130,246,0.08);
}
html,body{height:100%;margin:0;background:var(--bg);color:var(--text-1);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5;overflow:hidden;}
.shell{display:flex;height:100vh;background:var(--bg);color:var(--text-1);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5;overflow:hidden;}
.sidebar{width:var(--sidebar-w);min-width:var(--sidebar-w);height:100vh;background:var(--bg-2);border-right:1px solid var(--border);display:flex;flex-direction:column;transition:width var(--transition),min-width var(--transition);overflow:hidden;position:relative;z-index:10;}
.sidebar.collapsed{width:var(--sidebar-collapsed);min-width:var(--sidebar-collapsed);}
.sidebar-header{height:56px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--border);gap:10px;flex-shrink:0;}
.logo-mark{width:28px;height:28px;background:var(--blue);border-radius:7px;display:grid;place-items:center;flex-shrink:0;color:white;}
.logo-mark svg{width:16px;height:16px;}
.logo-text{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;transition:opacity var(--transition);}
.sidebar.collapsed .logo-text{opacity:0;pointer-events:none;}
.toggle-btn{position:absolute;top:14px;right:-12px;width:24px;height:24px;background:var(--bg-3);border:1px solid var(--border-strong);border-radius:50%;cursor:pointer;display:grid;place-items:center;color:var(--text-3);z-index:20;transition:all var(--transition);}
.sidebar.collapsed .toggle-btn{transform:rotate(180deg);}
.sidebar-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;overflow-x:hidden;}
.nav-section-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);padding:8px 8px 4px;white-space:nowrap;overflow:hidden;}
.sidebar.collapsed .nav-section-label{opacity:0;}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:7px;cursor:pointer;color:var(--text-2);transition:background var(--transition),color var(--transition);white-space:nowrap;overflow:hidden;border:none;background:transparent;text-align:left;}
.nav-item:hover{background:var(--bg-3);color:var(--text-1);}
.nav-item.active{background:var(--blue-dim);color:var(--blue);}
.nav-icon{width:18px;height:18px;flex-shrink:0;}
.nav-label{font-size:13.5px;font-weight:500;transition:opacity var(--transition);}
.sidebar.collapsed .nav-label{opacity:0;}
.nav-badge{margin-left:auto;font-size:10px;font-weight:600;background:var(--blue);color:white;padding:1px 6px;border-radius:20px;}
.sidebar.collapsed .nav-badge{opacity:0;}
.sidebar-footer{padding:12px 8px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;}
.avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#7C3AED);display:grid;place-items:center;flex-shrink:0;font-size:12px;font-weight:600;color:white;}
.user-info{overflow:hidden;}
.sidebar.collapsed .user-info{opacity:0;}
.user-name{font-size:13px;font-weight:500;}
.user-role{font-size:11px;color:var(--text-3);}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
.topbar{height:56px;display:flex;align-items:center;gap:12px;padding:0 24px;border-bottom:1px solid var(--border);background:var(--bg-2);flex-shrink:0;}
.topbar-title{font-size:17px;font-weight:600;letter-spacing:-.02em;flex:1;}
.topbar-actions{display:flex;align-items:center;gap:8px;}
.search-wrap{display:flex;align-items:center;gap:8px;background:var(--bg-3);border:1px solid var(--border);border-radius:7px;padding:0 12px;height:34px;transition:border-color var(--transition);}
.search-wrap:focus-within{border-color:var(--blue);}
.search-wrap svg{width:14px;height:14px;color:var(--text-3);flex-shrink:0;}
.search-wrap input{background:none;border:none;outline:none;font-family:inherit;font-size:13px;color:var(--text-1);}
.search-wrap input::placeholder{color:var(--text-3);}
.icon-btn{width:34px;height:34px;border-radius:7px;background:var(--bg-3);border:1px solid var(--border);display:grid;place-items:center;cursor:pointer;color:var(--text-2);transition:background var(--transition),color var(--transition);}
.icon-btn:hover{background:var(--bg-4);color:var(--text-1);}
.icon-btn svg{width:16px;height:16px;}
.btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border-strong);background:var(--bg-3);color:var(--text-1);transition:background var(--transition),border-color var(--transition);}
.btn:hover{background:var(--bg-4);}
.btn.primary{background:var(--blue);border-color:var(--blue);color:white;}
.btn.primary:hover{background:#2563EB;border-color:#2563EB;}
.btn.active-filter{background:var(--blue-dim);border-color:var(--blue-border);color:var(--blue);}
.btn.danger{background:var(--red-dim);border-color:rgba(239,68,68,0.3);color:var(--red);}
.page{display:none;flex:1;overflow:hidden;flex-direction:column;}
.page.active{display:flex;}
.content{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px;}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.stat-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:border-color var(--transition);animation:fadeUp .4s ease both;}
.stat-card:nth-child(1){animation-delay:.05s;}.stat-card:nth-child(2){animation-delay:.1s;}.stat-card:nth-child(3){animation-delay:.15s;}.stat-card:nth-child(4){animation-delay:.2s;}
.stat-card:hover{border-color:var(--border-strong);}
.stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
.stat-icon{width:36px;height:36px;border-radius:8px;display:grid;place-items:center;}
.stat-change{font-size:12px;font-weight:500;padding:3px 8px;border-radius:20px;}
.stat-change.up{background:var(--green-dim);color:var(--green);} .stat-change.down{background:var(--red-dim);color:var(--red);}
.stat-value{font-size:28px;font-weight:600;letter-spacing:-.03em;line-height:1;margin-bottom:4px;}
.stat-label{font-size:12.5px;color:var(--text-3);} .progress-bar{height:3px;background:var(--bg-4);border-radius:2px;overflow:hidden;margin-top:6px;}
.progress-fill{height:100%;border-radius:2px;background:var(--blue);}
.card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
.card-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);} .card-title{font-size:14px;font-weight:600;}
.two-col{display:grid;grid-template-columns:1fr 340px;gap:14px;} .bar-chart{display:flex;align-items:flex-end;gap:6px;height:100px;}
.route-item{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid var(--border);transition:background var(--transition);cursor:pointer;} .route-item:last-child{border-bottom:none;}
.route-item:hover{background:var(--bg-3);}
.route-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;} .route-name{font-size:13px;font-weight:500;} .route-meta{font-size:11.5px;color:var(--text-3);} .route-count{font-family:'DM Mono',monospace;font-size:12px;color:var(--text-2);font-weight:500;}
.chart-legend{display:flex;gap:16px;padding:10px 20px 16px;}
.legend-item{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--text-3);}
.legend-dot{width:8px;height:8px;border-radius:2px;}
.filter-tabs{display:flex;gap:4px;background:var(--bg-3);border:1px solid var(--border);border-radius:8px;padding:3px;}
.filter-tab{padding:5px 12px;border-radius:6px;font-size:12.5px;font-weight:500;cursor:pointer;color:var(--text-2);background:transparent;border:none;}
.filter-tab.active{background:var(--bg-2);color:var(--text-1);}
.filter-panel{display:none;padding:14px 16px;gap:12px;flex-wrap:wrap;align-items:flex-end;border-bottom:1px solid var(--border);} .filter-panel.open{display:flex;}
.filter-group{display:flex;flex-direction:column;gap:5px;min-width:130px;} .filter-group label{font-size:11.5px;font-weight:500;color:var(--text-3);}
.form-input,.form-select,.form-textarea{background:var(--bg-3);border:1px solid var(--border-strong);border-radius:7px;padding:8px 12px;font-family:inherit;font-size:13px;color:var(--text-1);outline:none;transition:border-color var(--transition);}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--blue);}
.form-select{cursor:pointer;appearance:none;padding-right:30px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B7385' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;}
.form-textarea{resize:vertical;min-height:72px;}
.filter-input,.filter-select{background:var(--bg-3);border:1px solid var(--border-strong);border-radius:7px;padding:6px 10px;font-family:inherit;font-size:12.5px;color:var(--text-1);outline:none;}
.filter-select{cursor:pointer;appearance:none;padding-right:28px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B7385' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;}
.data-table{width:100%;border-collapse:collapse;} .data-table thead th{text-align:left;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);padding:10px 16px;border-bottom:1px solid var(--border);white-space:nowrap;}
.data-table tbody tr{border-bottom:1px solid var(--border);transition:background var(--transition);cursor:pointer;} .data-table tbody tr:hover{background:var(--bg-3);} .data-table tbody tr.row-sel{background:var(--blue-dim);} .data-table td{padding:11px 16px;font-size:13px;vertical-align:middle;}
.td-mono{font-family:'DM Mono',monospace;font-size:12px;color:var(--blue);font-weight:500;} .badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500;padding:3px 9px;border-radius:20px;white-space:nowrap;} .badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;}
.badge.transit{background:var(--blue-dim);color:var(--blue);} .badge.delivered{background:var(--green-dim);color:var(--green);} .badge.pending{background:var(--amber-dim);color:var(--amber);} .badge.delayed{background:var(--red-dim);color:var(--red);} .badge.customs{background:var(--purple-dim);color:var(--purple);}
.row-menu{display:none;position:absolute;right:0;top:34px;background:var(--bg-2);border:1px solid var(--border-strong);border-radius:8px;z-index:30;min-width:148px;box-shadow:0 8px 24px rgba(0,0,0,0.3);overflow:hidden;padding:4px;} .row-menu.open{display:block;}
.row-menu-item{padding:7px 10px;font-size:12.5px;border-radius:5px;cursor:pointer;color:var(--text-2);border:none;background:transparent;width:100%;text-align:left;} .row-menu-item:hover{background:var(--bg-3);color:var(--text-1);} .row-menu-item.green{color:var(--green);} .row-menu-item.red{color:var(--red);}
.row-menu-divider{height:1px;background:var(--border);margin:4px 0;}
.pagination{display:flex;align-items:center;gap:6px;padding:14px 16px;border-top:1px solid var(--border);} .page-info{font-size:12.5px;color:var(--text-3);flex:1;} .page-btn{width:30px;height:30px;border-radius:6px;border:1px solid var(--border);background:var(--bg-3);color:var(--text-2);cursor:pointer;display:grid;place-items:center;font-size:12.5px;font-weight:500;transition:background var(--transition),color var(--transition);} .page-btn:hover:not(:disabled){background:var(--bg-4);color:var(--text-1);} .page-btn.active{background:var(--blue);border-color:var(--blue);color:white;} .page-btn:disabled{opacity:.35;cursor:not-allowed;}
.page-btn svg{width:12px;height:12px;}
.bulk-bar{display:none;padding:10px 16px;border-top:1px solid var(--border);background:var(--blue-dim);align-items:center;gap:10px;} .bulk-bar.show{display:flex;}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;color:var(--text-3);gap:12px;}
.detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;opacity:0;pointer-events:none;transition:opacity var(--transition);} .detail-overlay.open{opacity:1;pointer-events:all;}
.detail-panel{position:fixed;top:0;right:0;height:100vh;width:480px;max-width:95vw;background:var(--bg-2);border-left:1px solid var(--border);z-index:51;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);} .detail-panel.open{transform:translateX(0);} .dp-header{height:56px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid var(--border);gap:10px;} .dp-id{font-family:'DM Mono',monospace;font-size:13px;color:var(--blue);font-weight:500;} .dp-body{flex:1;overflow-y:auto;padding:20px;}
.dp-close{margin-left:auto;background:none;border:none;cursor:pointer;color:var(--text-3);display:grid;place-items:center;width:28px;height:28px;border-radius:6px;transition:background var(--transition),color var(--transition);}
.dp-close:hover{background:var(--bg-3);color:var(--text-1);}
.tl-item{display:flex;gap:12px;position:relative;} .tl-item:not(:last-child)::before{content:'';position:absolute;left:7px;top:18px;bottom:-4px;width:1px;background:var(--border);} .tl-dot{width:15px;height:15px;border-radius:50%;flex-shrink:0;margin-top:3px;border:2px solid;} .tl-dot.done{background:var(--green);border-color:var(--green);} .tl-dot.cur{background:var(--blue);border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-dim);} .tl-dot.pend{background:var(--bg-3);border-color:var(--border-strong);} .tl-body{flex:1;padding-bottom:14px;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:none;align-items:center;justify-content:center;padding:24px;} .modal-overlay.open{display:flex;}
.modal{background:var(--bg-2);border:1px solid var(--border-strong);border-radius:12px;width:560px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;} .modal-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;} .modal-title{font-size:16px;font-weight:600;flex:1;} .modal-body{flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;gap:14px;} .modal-footer{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;} .form-group{display:flex;flex-direction:column;gap:5px;} .form-label{font-size:12px;font-weight:500;color:var(--text-2);} .form-section-title{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3);padding-top:4px;border-top:1px solid var(--border);}
.confirm-modal{background:var(--bg-2);border:1px solid var(--border-strong);border-radius:12px;width:380px;max-width:100%;padding:24px;} .confirm-modal h3{font-size:15px;font-weight:600;margin:0 0 8px;} .confirm-modal p{font-size:13px;color:var(--text-2);line-height:1.6;margin:0 0 20px;}
.toast-wrap{position:fixed;bottom:24px;right:24px;z-index:200;display:flex;flex-direction:column;gap:8px;} .toast{background:var(--bg-3);border:1px solid var(--border-strong);border-radius:8px;padding:11px 15px;font-size:13px;color:var(--text-1);display:flex;align-items:center;gap:10px;min-width:240px;} .toast.success{border-left:3px solid var(--green);} .toast.error{border-left:3px solid var(--red);} .toast.info{border-left:3px solid var(--blue);}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
@media (max-width:1200px){.stat-grid{grid-template-columns:repeat(2,1fr)}.two-col{grid-template-columns:1fr}}
@media (max-width:760px){.sidebar{display:none}.topbar{padding:0 12px}.content{padding:12px}.stat-grid{grid-template-columns:1fr}}
`;

const ROUTES = [
    ["Shanghai → Rotterdam", "Sea · 28d avg", "142"],
    ["Dubai → New York", "Air+Sea · 7d avg", "89"],
    ["Singapore → Los Angeles", "Sea · 22d avg", "61"],
    ["Frankfurt → Chicago", "Air · 2d avg", "47"],
    ["Dar es Salaam → Mumbai", "Sea · 18d avg", "33"],
] as const;

const CHART = [72, 85, 60, 75, 90, 68, 78];

const INITIAL_DB: Shipment[] = [
    {
        id: "SHG-00214",
        customer: "Siemens AG",
        origin: "Shanghai",
        originCountry: "China",
        destination: "Hamburg",
        destCountry: "Germany",
        weight: 4200,
        volume: 18,
        mode: "Sea",
        eta: "2025-04-02",
        status: "transit",
        cost: 12400,
        container: "MSCU1234567",
        notes: "Priority cargo, handle with care.",
        created: "2025-03-01",
    },
    {
        id: "DXB-00891",
        customer: "Amazon Supply",
        origin: "Dubai",
        originCountry: "UAE",
        destination: "Chicago",
        destCountry: "USA",
        weight: 820,
        volume: 5,
        mode: "Air",
        eta: "2025-03-26",
        status: "transit",
        cost: 5800,
        container: "AWB-72819234",
        notes: "",
        created: "2025-03-15",
    },
    {
        id: "SGP-00441",
        customer: "Apple Inc.",
        origin: "Singapore",
        originCountry: "Singapore",
        destination: "Los Angeles",
        destCountry: "USA",
        weight: 12500,
        volume: 42,
        mode: "Sea",
        eta: "2025-03-28",
        status: "customs",
        cost: 31200,
        container: "OOLU9871234",
        notes: "Customs documentation submitted. Awaiting clearance.",
        created: "2025-02-20",
    },
    {
        id: "RTM-00078",
        customer: "Philips Global",
        origin: "Rotterdam",
        originCountry: "Netherlands",
        destination: "New York",
        destCountry: "USA",
        weight: 3100,
        volume: 14,
        mode: "Sea",
        eta: "2025-03-24",
        status: "delivered",
        cost: 8700,
        container: "MSCU7823901",
        notes: "Delivered on schedule.",
        created: "2025-02-10",
    },
    {
        id: "NBO-00133",
        customer: "Unilever Ltd",
        origin: "Nairobi",
        originCountry: "Kenya",
        destination: "London",
        destCountry: "UK",
        weight: 640,
        volume: 3,
        mode: "Air",
        eta: "2025-03-27",
        status: "pending",
        cost: 3200,
        container: "AWB-88239021",
        notes: "Awaiting pickup confirmation.",
        created: "2025-03-18",
    },
    {
        id: "MUM-00562",
        customer: "Tata Consultancy",
        origin: "Mumbai",
        originCountry: "India",
        destination: "Frankfurt",
        destCountry: "Germany",
        weight: 1980,
        volume: 9,
        mode: "Air",
        eta: "2025-04-01",
        status: "transit",
        cost: 7600,
        container: "AWB-44820192",
        notes: "",
        created: "2025-03-12",
    },
    {
        id: "DAR-00091",
        customer: "TanzaTrade Co.",
        origin: "Dar es Salaam",
        originCountry: "Tanzania",
        destination: "Mumbai",
        destCountry: "India",
        weight: 7200,
        volume: 28,
        mode: "Sea",
        eta: "2025-04-08",
        status: "delayed",
        cost: 9100,
        container: "HLCU2340912",
        notes: "Port congestion delay.",
        created: "2025-02-28",
    },
    {
        id: "ORD-00714",
        customer: "Boeing Parts",
        origin: "Chicago",
        originCountry: "USA",
        destination: "Berlin",
        destCountry: "Germany",
        weight: 9850,
        volume: 35,
        mode: "Air",
        eta: "2025-03-25",
        status: "delivered",
        cost: 44000,
        container: "AWB-10293847",
        notes: "Aerospace components.",
        created: "2025-03-05",
    },
    {
        id: "FRA-00302",
        customer: "BASF SE",
        origin: "Frankfurt",
        originCountry: "Germany",
        destination: "Singapore",
        destCountry: "Singapore",
        weight: 5600,
        volume: 22,
        mode: "Sea",
        eta: "2025-04-15",
        status: "transit",
        cost: 14200,
        container: "MSCU8811902",
        notes: "Chemical cargo.",
        created: "2025-03-08",
    },
    {
        id: "TYO-00188",
        customer: "Sony Electronics",
        origin: "Tokyo",
        originCountry: "Japan",
        destination: "Los Angeles",
        destCountry: "USA",
        weight: 2300,
        volume: 10,
        mode: "Sea",
        eta: "2025-04-10",
        status: "transit",
        cost: 6700,
        container: "OOLU3344221",
        notes: "",
        created: "2025-03-11",
    },
    {
        id: "LON-00447",
        customer: "BP Logistics",
        origin: "London",
        originCountry: "UK",
        destination: "Dubai",
        destCountry: "UAE",
        weight: 870,
        volume: 4,
        mode: "Air",
        eta: "2025-03-29",
        status: "pending",
        cost: 2900,
        container: "AWB-55671234",
        notes: "Waiting for export license.",
        created: "2025-03-20",
    },
    {
        id: "SEO-00621",
        customer: "Samsung Heavy",
        origin: "Seoul",
        originCountry: "South Korea",
        destination: "Rotterdam",
        destCountry: "Netherlands",
        weight: 18400,
        volume: 60,
        mode: "Sea",
        eta: "2025-04-20",
        status: "transit",
        cost: 38000,
        container: "HLCU4499102",
        notes: "Oversized cargo.",
        created: "2025-03-03",
    },
    {
        id: "LAX-00039",
        customer: "SpaceX Cargo",
        origin: "Los Angeles",
        originCountry: "USA",
        destination: "Singapore",
        destCountry: "Singapore",
        weight: 3400,
        volume: 15,
        mode: "Air",
        eta: "2025-03-31",
        status: "transit",
        cost: 22000,
        container: "AWB-99120034",
        notes: "High-value precision equipment.",
        created: "2025-03-17",
    },
    {
        id: "BOM-00775",
        customer: "Reliance Industries",
        origin: "Mumbai",
        originCountry: "India",
        destination: "London",
        destCountry: "UK",
        weight: 6700,
        volume: 27,
        mode: "Sea",
        eta: "2025-04-18",
        status: "customs",
        cost: 17800,
        container: "MSCU2200741",
        notes: "HS code verification pending.",
        created: "2025-02-25",
    },
    {
        id: "SIN-00852",
        customer: "DHL Supply Chain",
        origin: "Singapore",
        originCountry: "Singapore",
        destination: "Frankfurt",
        destCountry: "Germany",
        weight: 4100,
        volume: 16,
        mode: "Sea",
        eta: "2025-04-12",
        status: "transit",
        cost: 11300,
        container: "OOLU7762001",
        notes: "",
        created: "2025-03-09",
    },
    {
        id: "NYC-00199",
        customer: "Maersk Line",
        origin: "New York",
        originCountry: "USA",
        destination: "Shanghai",
        destCountry: "China",
        weight: 22000,
        volume: 80,
        mode: "Sea",
        eta: "2025-04-25",
        status: "pending",
        cost: 49000,
        container: "MSCU5544112",
        notes: "Return cargo.",
        created: "2025-03-21",
    },
    {
        id: "DUS-00338",
        customer: "Lufthansa Cargo",
        origin: "Dusseldorf",
        originCountry: "Germany",
        destination: "Nairobi",
        destCountry: "Kenya",
        weight: 1200,
        volume: 6,
        mode: "Air",
        eta: "2025-03-28",
        status: "delivered",
        cost: 5500,
        container: "AWB-31190234",
        notes: "",
        created: "2025-03-14",
    },
    {
        id: "SYD-00411",
        customer: "Rio Tinto",
        origin: "Sydney",
        originCountry: "Australia",
        destination: "Shanghai",
        destCountry: "China",
        weight: 48000,
        volume: 180,
        mode: "Sea",
        eta: "2025-05-02",
        status: "transit",
        cost: 72000,
        container: "HLCU9900234",
        notes: "Bulk mineral ore shipment.",
        created: "2025-03-01",
    },
    {
        id: "CGK-00094",
        customer: "Garuda Freight",
        origin: "Jakarta",
        originCountry: "Indonesia",
        destination: "Rotterdam",
        destCountry: "Netherlands",
        weight: 8900,
        volume: 34,
        mode: "Sea",
        eta: "2025-04-22",
        status: "delayed",
        cost: 21400,
        container: "OOLU1199023",
        notes: "Rerouted after vessel issue.",
        created: "2025-03-10",
    },
    {
        id: "IST-00667",
        customer: "Turkish Cargo",
        origin: "Istanbul",
        originCountry: "Turkey",
        destination: "Chicago",
        destCountry: "USA",
        weight: 3700,
        volume: 14,
        mode: "Air",
        eta: "2025-04-03",
        status: "transit",
        cost: 13200,
        container: "AWB-66234891",
        notes: "",
        created: "2025-03-16",
    },
    {
        id: "JNB-00511",
        customer: "Anglo American",
        origin: "Johannesburg",
        originCountry: "South Africa",
        destination: "London",
        destCountry: "UK",
        weight: 15000,
        volume: 55,
        mode: "Sea",
        eta: "2025-04-28",
        status: "transit",
        cost: 33000,
        container: "MSCU1100998",
        notes: "Platinum group metals. High security transit.",
        created: "2025-02-22",
    },
    {
        id: "GRU-00243",
        customer: "Embraer Export",
        origin: "Sao Paulo",
        originCountry: "Brazil",
        destination: "Paris",
        destCountry: "France",
        weight: 2800,
        volume: 11,
        mode: "Air",
        eta: "2025-04-06",
        status: "transit",
        cost: 16500,
        container: "AWB-77823001",
        notes: "Aircraft components.",
        created: "2025-03-13",
    },
    {
        id: "AMS-00781",
        customer: "Heineken Logistics",
        origin: "Amsterdam",
        originCountry: "Netherlands",
        destination: "New York",
        destCountry: "USA",
        weight: 24000,
        volume: 90,
        mode: "Sea",
        eta: "2025-04-17",
        status: "transit",
        cost: 41000,
        container: "MSCU3300887",
        notes: "Temperature-controlled. Keep 8-12 C.",
        created: "2025-03-07",
    },
    {
        id: "BKK-00155",
        customer: "Thai Airways Cargo",
        origin: "Bangkok",
        originCountry: "Thailand",
        destination: "Los Angeles",
        destCountry: "USA",
        weight: 5100,
        volume: 20,
        mode: "Air",
        eta: "2025-04-05",
        status: "customs",
        cost: 19800,
        container: "AWB-48223910",
        notes: "Customs query on declared value.",
        created: "2025-03-19",
    },
];

const COUNTRIES = [
    "China",
    "UAE",
    "Singapore",
    "Netherlands",
    "Tanzania",
    "India",
    "Germany",
    "USA",
    "Kenya",
    "UK",
    "Japan",
    "South Korea",
    "Australia",
    "Indonesia",
    "Turkey",
    "Brazil",
    "France",
    "South Africa",
    "Thailand",
];

const EMPTY_FORM: FormState = {
    customer: "",
    mode: "",
    origin: "",
    originCountry: "",
    destination: "",
    destCountry: "",
    weight: "",
    volume: "",
    status: "transit",
    eta: "",
    cost: "",
    container: "",
    notes: "",
};

function modeIcon(mode: string) {
    if (mode === "Sea") return "⚓";
    if (mode === "Air") return "✈";
    if (mode === "Road") return "🚗";
    return "🚂";
}

function statusLabel(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(v: string) {
    return new Date(v).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function pageRange(cur: number, tot: number) {
    if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, "…", tot] as const;
    if (cur >= tot - 3)
        return [1, "…", tot - 4, tot - 3, tot - 2, tot - 1, tot] as const;
    return [1, "…", cur - 1, cur, cur + 1, "…", tot] as const;
}

export default function Dashboard() {
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [page, setPage] = useState<PageName>("shipments");
    const [db, setDb] = useState<Shipment[]>(INITIAL_DB);
    const [search, setSearch] = useState("");
    const [statusFlt, setStatusFlt] = useState<"all" | Status>("all");
    const [sortCol, setSortCol] = useState<keyof Shipment>("eta");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [curPage, setCurPage] = useState(1);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [menuId, setMenuId] = useState<string | null>(null);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        mode: "",
        origin: "",
        from: "",
        to: "",
        weight: "",
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTitle, setConfirmTitle] = useState("Confirm Action");
    const [confirmMsg, setConfirmMsg] = useState("Are you sure?");
    const [confirmAction, setConfirmAction] = useState<(() => void) | null>(
        null,
    );
    const [toasts, setToasts] = useState<
        Array<{ id: number; msg: string; type: ToastType }>
    >([]);

    const PER = 10;

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    useEffect(() => {
        const handler = () => setMenuId(null);
        document.addEventListener("click", handler);
        return () => document.removeEventListener("click", handler);
    }, []);

    const pushToast = (msg: string, type: ToastType) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, msg, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id));
        }, 2800);
    };

    const onGlobalSearch = (value: string) => {
        setSearch(value);
        setCurPage(1);
        if (page === "dashboard" && value.trim()) {
            setPage("shipments");
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const minW = Number(filters.weight) || 0;
        const out = db.filter((s) => {
            if (statusFlt !== "all" && s.status !== statusFlt) return false;
            if (filters.mode && s.mode !== filters.mode) return false;
            if (filters.origin && s.originCountry !== filters.origin)
                return false;
            if (filters.from && s.eta < filters.from) return false;
            if (filters.to && s.eta > filters.to) return false;
            if (minW > 0 && s.weight < minW) return false;
            if (
                q &&
                !`${s.id} ${s.origin} ${s.destination} ${s.customer} ${s.mode} ${s.originCountry} ${s.destCountry}`
                    .toLowerCase()
                    .includes(q)
            )
                return false;
            return true;
        });

        out.sort((a, b) => {
            const av = a[sortCol];
            const bv = b[sortCol];
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return out;
    }, [db, filters, search, sortCol, sortDir, statusFlt]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
    const pageRows = useMemo(
        () => filtered.slice((curPage - 1) * PER, curPage * PER),
        [filtered, curPage],
    );
    const detail = useMemo(
        () => db.find((x) => x.id === detailId) ?? null,
        [db, detailId],
    );

    useEffect(() => {
        if (curPage > totalPages) setCurPage(totalPages);
    }, [curPage, totalPages]);

    const kpi = useMemo(() => {
        const total = db.length || 1;
        const transit = db.filter((x) => x.status === "transit").length;
        const delivered = db.filter((x) => x.status === "delivered").length;
        const delayed = db.filter((x) => x.status === "delayed").length;
        const pending = db.filter(
            (x) => x.status === "pending" || x.status === "customs",
        ).length;
        return { total, transit, delivered, delayed, pending };
    }, [db]);

    const shipmentBadgeCount = db.filter(
        (x) => x.status !== "delivered",
    ).length;

    const openConfirm = (title: string, msg: string, action: () => void) => {
        setConfirmTitle(title);
        setConfirmMsg(msg);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const clearFilters = () => {
        setFilters({ mode: "", origin: "", from: "", to: "", weight: "" });
        setSearch("");
        setStatusFlt("all");
        setCurPage(1);
    };

    const toggleSort = (col: keyof Shipment) => {
        if (sortCol === col) setSortDir((p) => (p === "asc" ? "desc" : "asc"));
        else {
            setSortCol(col);
            setSortDir("asc");
        }
        setCurPage(1);
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAllOnPage = (checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            pageRows.forEach((row) => {
                if (checked) next.add(row.id);
                else next.delete(row.id);
            });
            return next;
        });
    };

    const bulkDeliver = () => {
        const n = selected.size;
        if (!n) return;
        setDb((prev) =>
            prev.map((x) =>
                selected.has(x.id) ? { ...x, status: "delivered" } : x,
            ),
        );
        setSelected(new Set());
        pushToast(
            `${n} shipment${n > 1 ? "s" : ""} marked delivered`,
            "success",
        );
    };

    const bulkDelete = () => {
        const n = selected.size;
        if (!n) return;
        openConfirm(
            `Delete ${n} shipment${n > 1 ? "s" : ""}?`,
            `Permanently remove ${n} shipment${n > 1 ? "s" : ""}?`,
            () => {
                setDb((prev) => prev.filter((x) => !selected.has(x.id)));
                setSelected(new Set());
                pushToast(`${n} deleted`, "info");
            },
        );
    };

    const quickStatus = (id: string, status: Status) => {
        setDb((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
        pushToast(`${id} -> ${statusLabel(status)}`, "success");
        setMenuId(null);
    };

    const exportCsv = () => {
        const header = "id,customer,origin,destination,weight,mode,eta,status";
        const rows = filtered.map(
            (s) =>
                `${s.id},${s.customer},${s.origin},${s.destination},${s.weight},${s.mode},${s.eta},${s.status}`,
        );
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "shipments.csv";
        a.click();
        URL.revokeObjectURL(url);
        pushToast("Exported CSV", "success");
    };

    const openCreate = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (id: string) => {
        const s = db.find((x) => x.id === id);
        if (!s) return;
        setEditId(id);
        setForm({
            customer: s.customer,
            mode: s.mode,
            origin: s.origin,
            originCountry: s.originCountry,
            destination: s.destination,
            destCountry: s.destCountry,
            weight: String(s.weight),
            volume: String(s.volume),
            status: s.status,
            eta: s.eta,
            cost: String(s.cost),
            container: s.container,
            notes: s.notes,
        });
        setModalOpen(true);
    };

    const saveShipment = () => {
        if (
            !form.customer ||
            !form.mode ||
            !form.origin ||
            !form.originCountry ||
            !form.destination ||
            !form.destCountry ||
            !form.weight ||
            !form.eta
        ) {
            pushToast("Fill all required fields", "error");
            return;
        }

        const payload: Shipment = {
            id: editId ?? `SH-${Math.floor(Math.random() * 90000 + 10000)}`,
            customer: form.customer.trim(),
            mode: form.mode,
            origin: form.origin.trim(),
            originCountry: form.originCountry,
            destination: form.destination.trim(),
            destCountry: form.destCountry,
            weight: Number(form.weight) || 0,
            volume: Number(form.volume) || 0,
            status: form.status,
            eta: form.eta,
            cost: Number(form.cost) || 0,
            container: form.container.trim(),
            notes: form.notes.trim(),
            created: editId
                ? (db.find((x) => x.id === editId)?.created ??
                  new Date().toISOString().slice(0, 10))
                : new Date().toISOString().slice(0, 10),
        };

        if (editId) {
            setDb((prev) => prev.map((x) => (x.id === editId ? payload : x)));
            pushToast(`Updated ${editId}`, "success");
        } else {
            setDb((prev) => [payload, ...prev]);
            pushToast(`Created ${payload.id}`, "success");
        }

        setModalOpen(false);
    };

    const deleteById = (id: string) => {
        openConfirm(`Delete ${id}?`, "This action cannot be undone.", () => {
            setDb((prev) => prev.filter((x) => x.id !== id));
            if (detailId === id) setDetailId(null);
            pushToast(`${id} deleted`, "info");
        });
    };

    return (
        <>
            <Head title="Dashboard" />
            <style>{CSS}</style>
            <div className="shell">
                <aside
                    className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
                >
                    <div className="sidebar-header">
                        <div className="logo-mark">
                            <svg
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <rect
                                    x="1"
                                    y="5"
                                    width="14"
                                    height="9"
                                    rx="1.5"
                                />
                                <path d="M4 5V4a2 2 0 014 0v1" />
                                <path d="M8 5V3a2 2 0 014 0v2" />
                                <circle
                                    cx="5"
                                    cy="9.5"
                                    r="1"
                                    fill="currentColor"
                                    stroke="none"
                                />
                                <circle
                                    cx="11"
                                    cy="9.5"
                                    r="1"
                                    fill="currentColor"
                                    stroke="none"
                                />
                            </svg>
                        </div>
                        <span className="logo-text">CargoOS</span>
                    </div>
                    <button
                        className="toggle-btn"
                        onClick={() => setSidebarCollapsed((p) => !p)}
                    >
                        <svg
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        >
                            <path d="M7.5 2L3.5 6l4 4" />
                        </svg>
                    </button>
                    <nav className="sidebar-nav">
                        <div className="nav-section-label">Operations</div>
                        <button
                            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <rect
                                    x="1.5"
                                    y="1.5"
                                    width="6"
                                    height="6"
                                    rx="1.5"
                                />
                                <rect
                                    x="10.5"
                                    y="1.5"
                                    width="6"
                                    height="6"
                                    rx="1.5"
                                />
                                <rect
                                    x="1.5"
                                    y="10.5"
                                    width="6"
                                    height="6"
                                    rx="1.5"
                                />
                                <rect
                                    x="10.5"
                                    y="10.5"
                                    width="6"
                                    height="6"
                                    rx="1.5"
                                />
                            </svg>
                            <span className="nav-label">Dashboard</span>
                        </button>
                        <button
                            className={`nav-item ${page === "shipments" ? "active" : ""}`}
                            onClick={() => setPage("shipments")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M2 4h14v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
                                <path d="M6 4V2.5A.5.5 0 016.5 2h5a.5.5 0 01.5.5V4" />
                                <path d="M2 8h14" />
                            </svg>
                            <span className="nav-label">Shipments</span>
                            <span className="nav-badge">
                                {shipmentBadgeCount}
                            </span>
                        </button>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <rect
                                    x="1"
                                    y="5"
                                    width="12"
                                    height="9"
                                    rx="1.5"
                                />
                                <path d="M13 8l3 2v4h-3V8z" />
                                <circle cx="4.5" cy="14" r="1.5" />
                                <circle cx="10.5" cy="14" r="1.5" />
                                <circle cx="15" cy="14" r="1.5" />
                            </svg>
                            <span className="nav-label">Fleet</span>
                        </button>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <circle cx="4" cy="4" r="2" />
                                <circle cx="14" cy="14" r="2" />
                                <path d="M4 6c0 5 10 3 10 8" />
                            </svg>
                            <span className="nav-label">Routes</span>
                        </button>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M2 8L9 2l7 6v8H2V8z" />
                                <rect x="7" y="11" width="4" height="5" />
                            </svg>
                            <span className="nav-label">Warehouses</span>
                        </button>
                        <div
                            className="nav-section-label"
                            style={{ marginTop: 8 }}
                        >
                            Management
                        </div>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <circle cx="9" cy="6" r="3" />
                                <path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7" />
                            </svg>
                            <span className="nav-label">Customers</span>
                        </button>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <rect
                                    x="2"
                                    y="4"
                                    width="14"
                                    height="11"
                                    rx="1.5"
                                />
                                <path d="M2 8h14" />
                                <path d="M6 12h2M10 12h2" />
                            </svg>
                            <span className="nav-label">Billing</span>
                        </button>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <path d="M4 14V9M8 14V5M12 14v-3M16 14v-7" />
                            </svg>
                            <span className="nav-label">Reports</span>
                        </button>
                        <div
                            className="nav-section-label"
                            style={{ marginTop: 8 }}
                        >
                            System
                        </div>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                        >
                            <svg
                                className="nav-icon"
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            >
                                <circle cx="9" cy="9" r="2.5" />
                                <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.1 3.1l1.4 1.4M13.5 13.5l1.4 1.4M3.1 14.9l1.4-1.4M13.5 4.5l1.4-1.4" />
                            </svg>
                            <span className="nav-label">Settings</span>
                        </button>
                    </nav>
                    <div className="sidebar-footer">
                        <div className="avatar">AK</div>
                        <div className="user-info">
                            <div className="user-name">Amir Khalil</div>
                            <div className="user-role">Ops Manager</div>
                        </div>
                    </div>
                </aside>

                <div className="main">
                    <header className="topbar">
                        <span className="topbar-title">
                            {page === "dashboard" ? "Dashboard" : "Shipments"}
                        </span>
                        <div className="topbar-actions">
                            <div className="search-wrap">
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                >
                                    <circle cx="7" cy="7" r="5" />
                                    <path d="M11 11l3 3" />
                                </svg>
                                <input
                                    value={search}
                                    onChange={(e) =>
                                        onGlobalSearch(e.target.value)
                                    }
                                    placeholder="Search cargo, routes…"
                                    style={{ width: 160 }}
                                />
                            </div>
                            <button
                                className="icon-btn"
                                onClick={() =>
                                    setTheme((t) =>
                                        t === "dark" ? "light" : "dark",
                                    )
                                }
                            >
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
                                    {theme === "dark" ? (
                                        <>
                                            <circle cx="8" cy="8" r="3" />
                                            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
                                        </>
                                    ) : (
                                        <path
                                            d="M8 1a7 7 0 000 14A7 7 0 008 1z"
                                            strokeLinecap="round"
                                        />
                                    )}
                                </svg>
                            </button>
                            <button
                                className="icon-btn"
                                style={{ position: "relative" }}
                            >
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                >
                                    <path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5z" />
                                    <path d="M6.5 13a1.5 1.5 0 003 0" />
                                </svg>
                                <span
                                    style={{
                                        position: "absolute",
                                        top: 6,
                                        right: 6,
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        background: "var(--red)",
                                        border: "1.5px solid var(--bg-2)",
                                    }}
                                />
                            </button>
                        </div>
                    </header>

                    <div
                        className={`page ${page === "dashboard" ? "active" : ""}`}
                    >
                        <div className="content">
                            <div className="stat-grid">
                                <StatCard
                                    label="Active Shipments"
                                    value="1,284"
                                    change="↑ 8.4%"
                                    progress={72}
                                    kind="blue"
                                    icon="truck"
                                />
                                <StatCard
                                    label="On-time Delivery"
                                    value="94.7%"
                                    change="↑ 2.1%"
                                    progress={95}
                                    kind="green"
                                    icon="check"
                                />
                                <StatCard
                                    label="Pending Clearance"
                                    value="38"
                                    change="↓ 1.2%"
                                    progress={38}
                                    kind="amber"
                                    icon="clock"
                                    down
                                />
                                <StatCard
                                    label="Revenue This Month"
                                    value="$2.4M"
                                    change="↑ 12.8%"
                                    progress={60}
                                    kind="purple"
                                    icon="calendar"
                                />
                            </div>

                            <div className="two-col">
                                <div className="card">
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">
                                                Cargo Volume
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--text-3)",
                                                    marginTop: 1,
                                                }}
                                            >
                                                Shipments dispatched per week
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: "16px 20px 8px" }}>
                                        <div className="bar-chart">
                                            {CHART.map((v, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        flex: 1,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        gap: 6,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: "100%",
                                                            borderRadius:
                                                                "4px 4px 0 0",
                                                            background:
                                                                i === 4
                                                                    ? "rgba(59,130,246,0.25)"
                                                                    : "var(--blue-dim)",
                                                            borderTop:
                                                                "2px solid var(--blue)",
                                                            minHeight: 2,
                                                            height: v,
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            fontSize: 10,
                                                            color: "var(--text-3)",
                                                            fontFamily:
                                                                "DM Mono, monospace",
                                                        }}
                                                    >
                                                        W{i + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="chart-legend">
                                        <div className="legend-item">
                                            <div
                                                className="legend-dot"
                                                style={{
                                                    background: "var(--blue)",
                                                }}
                                            />
                                            Dispatched
                                        </div>
                                        <div className="legend-item">
                                            <div
                                                className="legend-dot"
                                                style={{
                                                    background: "var(--green)",
                                                }}
                                            />
                                            Delivered
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Active Routes
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--blue)",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => setPage("shipments")}
                                        >
                                            View all →
                                        </span>
                                    </div>
                                    <div>
                                        {ROUTES.map((r, i) => (
                                            <div
                                                key={r[0]}
                                                className="route-item"
                                            >
                                                <div
                                                    className="route-dot"
                                                    style={{
                                                        background: [
                                                            "var(--green)",
                                                            "var(--blue)",
                                                            "var(--amber)",
                                                            "var(--purple)",
                                                            "var(--green)",
                                                        ][i],
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div className="route-name">
                                                        {r[0]}
                                                    </div>
                                                    <div className="route-meta">
                                                        {r[1]}
                                                    </div>
                                                </div>
                                                <span className="route-count">
                                                    {r[2]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`page ${page === "shipments" ? "active" : ""}`}
                    >
                        <div className="content">
                            <div className="stat-grid">
                                <StatCard
                                    label="In Transit"
                                    value={String(kpi.transit)}
                                    change="↑ 0%"
                                    progress={(kpi.transit / kpi.total) * 100}
                                    kind="blue"
                                    icon="truck"
                                />
                                <StatCard
                                    label="Delivered"
                                    value={String(kpi.delivered)}
                                    change="↑ 0%"
                                    progress={(kpi.delivered / kpi.total) * 100}
                                    kind="green"
                                    icon="check"
                                />
                                <StatCard
                                    label="Pending / Customs"
                                    value={String(kpi.pending)}
                                    change="↓ 0%"
                                    progress={(kpi.pending / kpi.total) * 100}
                                    kind="amber"
                                    icon="clock"
                                    down
                                />
                                <StatCard
                                    label="Delayed"
                                    value={String(kpi.delayed)}
                                    change="↓ 0%"
                                    progress={(kpi.delayed / kpi.total) * 100}
                                    kind="red"
                                    icon="alert"
                                    down
                                />
                            </div>

                            <div
                                className="card"
                                style={{ overflow: "visible" }}
                            >
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        flexWrap: "wrap",
                                        borderBottom: "1px solid var(--border)",
                                    }}
                                >
                                    <div className="filter-tabs">
                                        {(
                                            [
                                                "all",
                                                "transit",
                                                "pending",
                                                "customs",
                                                "delayed",
                                                "delivered",
                                            ] as const
                                        ).map((s) => (
                                            <button
                                                key={s}
                                                className={`filter-tab ${statusFlt === s ? "active" : ""}`}
                                                onClick={() => {
                                                    setStatusFlt(s);
                                                    setCurPage(1);
                                                }}
                                            >
                                                {s === "transit"
                                                    ? "In Transit"
                                                    : statusLabel(s)}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ flex: 1 }} />
                                    <div
                                        className="search-wrap"
                                        style={{ width: 210 }}
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            strokeLinecap="round"
                                        >
                                            <circle cx="7" cy="7" r="5" />
                                            <path d="M11 11l3 3" />
                                        </svg>
                                        <input
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setCurPage(1);
                                            }}
                                            placeholder="ID, city, customer…"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                    <button
                                        className={`btn ${filterOpen ? "active-filter" : ""}`}
                                        onClick={() => setFilterOpen((v) => !v)}
                                    >
                                        <svg
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            style={{ width: 14, height: 14 }}
                                        >
                                            <path d="M1 3h12M3 7h8M5 11h4" />
                                        </svg>
                                        Filters
                                    </button>
                                    <button className="btn" onClick={exportCsv}>
                                        <svg
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            style={{ width: 14, height: 14 }}
                                        >
                                            <path d="M7 1v8M4 6l3 3 3-3M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
                                        </svg>
                                        Export
                                    </button>
                                    <button
                                        className="btn primary"
                                        onClick={openCreate}
                                    >
                                        <svg
                                            viewBox="0 0 14 14"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            style={{ width: 14, height: 14 }}
                                        >
                                            <path d="M7 1v12M1 7h12" />
                                        </svg>
                                        New
                                    </button>
                                </div>

                                <div
                                    className={`filter-panel ${filterOpen ? "open" : ""}`}
                                >
                                    <div className="filter-group">
                                        <label>Mode</label>
                                        <select
                                            className="filter-select"
                                            value={filters.mode}
                                            onChange={(e) => {
                                                setFilters((p) => ({
                                                    ...p,
                                                    mode: e.target.value,
                                                }));
                                                setCurPage(1);
                                            }}
                                        >
                                            <option value="">All modes</option>
                                            <option>Sea</option>
                                            <option>Air</option>
                                            <option>Road</option>
                                            <option>Rail</option>
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label>Origin Country</label>
                                        <select
                                            className="filter-select"
                                            value={filters.origin}
                                            onChange={(e) => {
                                                setFilters((p) => ({
                                                    ...p,
                                                    origin: e.target.value,
                                                }));
                                                setCurPage(1);
                                            }}
                                        >
                                            <option value="">Any</option>
                                            {COUNTRIES.map((c) => (
                                                <option key={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="filter-group">
                                        <label>ETA From</label>
                                        <input
                                            type="date"
                                            className="filter-input"
                                            value={filters.from}
                                            onChange={(e) => {
                                                setFilters((p) => ({
                                                    ...p,
                                                    from: e.target.value,
                                                }));
                                                setCurPage(1);
                                            }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>ETA To</label>
                                        <input
                                            type="date"
                                            className="filter-input"
                                            value={filters.to}
                                            onChange={(e) => {
                                                setFilters((p) => ({
                                                    ...p,
                                                    to: e.target.value,
                                                }));
                                                setCurPage(1);
                                            }}
                                        />
                                    </div>
                                    <div className="filter-group">
                                        <label>Min Weight (kg)</label>
                                        <input
                                            type="number"
                                            className="filter-input"
                                            value={filters.weight}
                                            onChange={(e) => {
                                                setFilters((p) => ({
                                                    ...p,
                                                    weight: e.target.value,
                                                }));
                                                setCurPage(1);
                                            }}
                                            placeholder="0"
                                        />
                                    </div>
                                    <button
                                        className="btn"
                                        onClick={clearFilters}
                                    >
                                        Clear all
                                    </button>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    {filtered.length === 0 ? (
                                        <div className="empty-state">
                                            <svg
                                                viewBox="0 0 36 36"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.4"
                                            >
                                                <rect
                                                    x="3"
                                                    y="9"
                                                    width="22"
                                                    height="20"
                                                    rx="2"
                                                />
                                                <path d="M14 9V7a4 4 0 018 0v2M3 17h22" />
                                            </svg>
                                            <p
                                                style={{
                                                    fontSize: 13,
                                                    textAlign: "center",
                                                    lineHeight: 1.7,
                                                }}
                                            >
                                                No shipments match your current
                                                filters.
                                                <br />
                                                Try adjusting search or filter
                                                criteria.
                                            </p>
                                        </div>
                                    ) : (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th
                                                        style={{
                                                            width: 36,
                                                            paddingLeft: 16,
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                pageRows.length >
                                                                    0 &&
                                                                pageRows.every(
                                                                    (r) =>
                                                                        selected.has(
                                                                            r.id,
                                                                        ),
                                                                )
                                                            }
                                                            onChange={(e) =>
                                                                toggleSelectAllOnPage(
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                        />
                                                    </th>
                                                    <SortableHead
                                                        label="Tracking ID"
                                                        active={
                                                            sortCol === "id"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort("id")
                                                        }
                                                    />
                                                    <SortableHead
                                                        label="Origin"
                                                        active={
                                                            sortCol === "origin"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort("origin")
                                                        }
                                                    />
                                                    <SortableHead
                                                        label="Destination"
                                                        active={
                                                            sortCol ===
                                                            "destination"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort(
                                                                "destination",
                                                            )
                                                        }
                                                    />
                                                    <SortableHead
                                                        label="Customer"
                                                        active={
                                                            sortCol ===
                                                            "customer"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort(
                                                                "customer",
                                                            )
                                                        }
                                                    />
                                                    <SortableHead
                                                        label="Weight"
                                                        active={
                                                            sortCol === "weight"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort("weight")
                                                        }
                                                    />
                                                    <th>Mode</th>
                                                    <SortableHead
                                                        label="ETA"
                                                        active={
                                                            sortCol === "eta"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort("eta")
                                                        }
                                                    />
                                                    <SortableHead
                                                        label="Status"
                                                        active={
                                                            sortCol === "status"
                                                        }
                                                        dir={sortDir}
                                                        onClick={() =>
                                                            toggleSort("status")
                                                        }
                                                    />
                                                    <th style={{ width: 40 }} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pageRows.map((s) => (
                                                    <tr
                                                        key={s.id}
                                                        className={
                                                            selected.has(s.id)
                                                                ? "row-sel"
                                                                : ""
                                                        }
                                                        onClick={() =>
                                                            setDetailId(s.id)
                                                        }
                                                    >
                                                        <td
                                                            style={{
                                                                paddingLeft: 16,
                                                            }}
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selected.has(
                                                                    s.id,
                                                                )}
                                                                onChange={() =>
                                                                    toggleSelect(
                                                                        s.id,
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="td-mono">
                                                            {s.id}
                                                        </td>
                                                        <td>
                                                            {s.origin}
                                                            <span
                                                                style={{
                                                                    color: "var(--text-3)",
                                                                    fontSize: 11.5,
                                                                }}
                                                            >
                                                                {" "}
                                                                ·{" "}
                                                                {
                                                                    s.originCountry
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {s.destination}
                                                            <span
                                                                style={{
                                                                    color: "var(--text-3)",
                                                                    fontSize: 11.5,
                                                                }}
                                                            >
                                                                {" "}
                                                                ·{" "}
                                                                {s.destCountry}
                                                            </span>
                                                        </td>
                                                        <td>{s.customer}</td>
                                                        <td
                                                            style={{
                                                                fontFamily:
                                                                    "DM Mono, monospace",
                                                                fontSize: 12,
                                                            }}
                                                        >
                                                            {s.weight.toLocaleString()}{" "}
                                                            kg
                                                        </td>
                                                        <td>
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "inline-flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 5,
                                                                    fontSize: 12,
                                                                    color: "var(--text-2)",
                                                                }}
                                                            >
                                                                {modeIcon(
                                                                    s.mode,
                                                                )}{" "}
                                                                {s.mode}
                                                            </span>
                                                        </td>
                                                        <td
                                                            style={{
                                                                fontFamily:
                                                                    "DM Mono, monospace",
                                                                fontSize: 12,
                                                                color: "var(--text-2)",
                                                            }}
                                                        >
                                                            {fmtDate(s.eta)}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge ${s.status}`}
                                                            >
                                                                {statusLabel(
                                                                    s.status,
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td
                                                            style={{
                                                                position:
                                                                    "relative",
                                                                padding:
                                                                    "0 8px",
                                                            }}
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <button
                                                                className="icon-btn"
                                                                style={{
                                                                    width: 28,
                                                                    height: 28,
                                                                }}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setMenuId(
                                                                        (p) =>
                                                                            p ===
                                                                            s.id
                                                                                ? null
                                                                                : s.id,
                                                                    );
                                                                }}
                                                            >
                                                                <svg
                                                                    viewBox="0 0 14 14"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.8"
                                                                    strokeLinecap="round"
                                                                    style={{
                                                                        width: 14,
                                                                        height: 14,
                                                                    }}
                                                                >
                                                                    <circle
                                                                        cx="7"
                                                                        cy="2.5"
                                                                        r="0.6"
                                                                        fill="currentColor"
                                                                    />
                                                                    <circle
                                                                        cx="7"
                                                                        cy="7"
                                                                        r="0.6"
                                                                        fill="currentColor"
                                                                    />
                                                                    <circle
                                                                        cx="7"
                                                                        cy="11.5"
                                                                        r="0.6"
                                                                        fill="currentColor"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <div
                                                                className={`row-menu ${menuId === s.id ? "open" : ""}`}
                                                            >
                                                                <button
                                                                    className="row-menu-item"
                                                                    onClick={() => {
                                                                        setDetailId(
                                                                            s.id,
                                                                        );
                                                                        setMenuId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                >
                                                                    View Details
                                                                </button>
                                                                <button
                                                                    className="row-menu-item"
                                                                    onClick={() => {
                                                                        openEdit(
                                                                            s.id,
                                                                        );
                                                                        setMenuId(
                                                                            null,
                                                                        );
                                                                    }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="row-menu-item green"
                                                                    onClick={() =>
                                                                        quickStatus(
                                                                            s.id,
                                                                            "delivered",
                                                                        )
                                                                    }
                                                                >
                                                                    Mark
                                                                    Delivered
                                                                </button>
                                                                <div className="row-menu-divider" />
                                                                <button
                                                                    className="row-menu-item red"
                                                                    onClick={() =>
                                                                        deleteById(
                                                                            s.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>

                                <div
                                    className={`bulk-bar ${selected.size > 0 ? "show" : ""}`}
                                >
                                    <span
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: "var(--blue)",
                                        }}
                                    >
                                        {selected.size} selected
                                    </span>
                                    <div style={{ flex: 1 }} />
                                    <button
                                        className="btn"
                                        style={{
                                            fontSize: 12.5,
                                            padding: "5px 12px",
                                        }}
                                        onClick={bulkDeliver}
                                    >
                                        Mark Delivered
                                    </button>
                                    <button
                                        className="btn danger"
                                        style={{
                                            fontSize: 12.5,
                                            padding: "5px 12px",
                                        }}
                                        onClick={bulkDelete}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className="btn"
                                        style={{
                                            fontSize: 12.5,
                                            padding: "5px 12px",
                                        }}
                                        onClick={() => setSelected(new Set())}
                                    >
                                        Clear selection
                                    </button>
                                </div>

                                {filtered.length > 0 && (
                                    <div className="pagination">
                                        <span className="page-info">
                                            Showing {(curPage - 1) * PER + 1}–
                                            {Math.min(
                                                curPage * PER,
                                                filtered.length,
                                            )}{" "}
                                            of {filtered.length}
                                        </span>
                                        <button
                                            className="page-btn"
                                            disabled={curPage <= 1}
                                            onClick={() =>
                                                setCurPage((p) =>
                                                    Math.max(1, p - 1),
                                                )
                                            }
                                        >
                                            <svg
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                            >
                                                <path d="M7.5 2L3.5 6l4 4" />
                                            </svg>
                                        </button>
                                        {pageRange(curPage, totalPages).map(
                                            (p, i) =>
                                                typeof p === "number" ? (
                                                    <button
                                                        key={p}
                                                        className={`page-btn ${p === curPage ? "active" : ""}`}
                                                        onClick={() =>
                                                            setCurPage(p)
                                                        }
                                                    >
                                                        {p}
                                                    </button>
                                                ) : (
                                                    <span
                                                        key={`ellipsis-${i}`}
                                                        style={{
                                                            display: "grid",
                                                            placeItems:
                                                                "center",
                                                            width: 30,
                                                            height: 30,
                                                            fontSize: 12,
                                                            color: "var(--text-3)",
                                                        }}
                                                    >
                                                        …
                                                    </span>
                                                ),
                                        )}
                                        <button
                                            className="page-btn"
                                            disabled={curPage >= totalPages}
                                            onClick={() =>
                                                setCurPage((p) =>
                                                    Math.min(totalPages, p + 1),
                                                )
                                            }
                                        >
                                            <svg
                                                viewBox="0 0 12 12"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                            >
                                                <path d="M4.5 2l4 4-4 4" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={`detail-overlay ${detail ? "open" : ""}`}
                onClick={() => setDetailId(null)}
            />
            <div className={`detail-panel ${detail ? "open" : ""}`}>
                {detail && (
                    <>
                        <div className="dp-header">
                            <span className="dp-id">{detail.id}</span>
                            <span className={`badge ${detail.status}`}>
                                {statusLabel(detail.status)}
                            </span>
                            <div style={{ flex: 1 }} />
                            <button
                                className="btn"
                                style={{ fontSize: 12, padding: "5px 10px" }}
                                onClick={() => openEdit(detail.id)}
                            >
                                Edit
                            </button>
                            <button
                                className="btn danger"
                                style={{ fontSize: 12, padding: "5px 10px" }}
                                onClick={() => deleteById(detail.id)}
                            >
                                Delete
                            </button>
                            <button
                                className="dp-close"
                                onClick={() => setDetailId(null)}
                            >
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    style={{ width: 16, height: 16 }}
                                >
                                    <path d="M4 4l8 8M12 4l-8 8" />
                                </svg>
                            </button>
                        </div>
                        <div className="dp-body">
                            <div style={{ marginBottom: 24 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: ".07em",
                                        textTransform: "uppercase",
                                        color: "var(--text-3)",
                                        marginBottom: 10,
                                    }}
                                >
                                    Route
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: 14,
                                        background: "var(--bg-3)",
                                        borderRadius: 8,
                                        border: "1px solid var(--border)",
                                    }}
                                >
                                    <div
                                        style={{ flex: 1, textAlign: "center" }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "var(--text-3)",
                                            }}
                                        >
                                            Origin
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {detail.origin}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--text-3)",
                                            }}
                                        >
                                            {detail.originCountry}
                                        </div>
                                    </div>
                                    <div style={{ flex: 2, padding: "0 8px" }}>
                                        <div
                                            style={{
                                                position: "relative",
                                                height: 2,
                                                background:
                                                    "var(--border-strong)",
                                                borderRadius: 1,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    height: "100%",
                                                    width:
                                                        detail.status ===
                                                        "delivered"
                                                            ? "100%"
                                                            : detail.status ===
                                                                "customs"
                                                              ? "78%"
                                                              : detail.status ===
                                                                  "delayed"
                                                                ? "35%"
                                                                : detail.status ===
                                                                    "pending"
                                                                  ? "8%"
                                                                  : "52%",
                                                    background: "var(--blue)",
                                                    borderRadius: 1,
                                                    transition:
                                                        "width .6s ease",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left:
                                                        detail.status ===
                                                        "delivered"
                                                            ? "100%"
                                                            : detail.status ===
                                                                "customs"
                                                              ? "78%"
                                                              : detail.status ===
                                                                  "delayed"
                                                                ? "35%"
                                                                : detail.status ===
                                                                    "pending"
                                                                  ? "8%"
                                                                  : "52%",
                                                    transform:
                                                        "translate(-50%,-50%)",
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    background: "var(--blue)",
                                                    border: "2px solid var(--bg-3)",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "center",
                                                marginTop: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    background: "var(--bg-2)",
                                                    border: "1px solid var(--border)",
                                                    padding: "3px 8px",
                                                    borderRadius: 20,
                                                    fontSize: 11,
                                                    color: "var(--text-2)",
                                                }}
                                            >
                                                {modeIcon(detail.mode)}{" "}
                                                {detail.mode}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{ flex: 1, textAlign: "center" }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                color: "var(--text-3)",
                                            }}
                                        >
                                            Destination
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                            }}
                                        >
                                            {detail.destination}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--text-3)",
                                            }}
                                        >
                                            {detail.destCountry}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: ".07em",
                                        textTransform: "uppercase",
                                        color: "var(--text-3)",
                                        marginBottom: 10,
                                    }}
                                >
                                    Details
                                </div>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 12,
                                    }}
                                >
                                    <DetailField
                                        label="Customer"
                                        value={detail.customer}
                                    />
                                    <DetailField
                                        label="Container / AWB"
                                        value={detail.container || "—"}
                                        mono
                                    />
                                    <DetailField
                                        label="Weight"
                                        value={`${detail.weight.toLocaleString()} kg`}
                                    />
                                    <DetailField
                                        label="Volume"
                                        value={`${detail.volume} m³`}
                                    />
                                    <DetailField
                                        label="Freight Cost"
                                        value={`$${detail.cost.toLocaleString()}`}
                                    />
                                    <DetailField
                                        label="ETA"
                                        value={fmtDate(detail.eta)}
                                    />
                                </div>
                                {detail.notes && (
                                    <div
                                        style={{
                                            marginTop: 12,
                                            padding: "10px 12px",
                                            background: "var(--bg-3)",
                                            borderRadius: 7,
                                            border: "1px solid var(--border)",
                                            fontSize: 12.5,
                                            color: "var(--text-2)",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {detail.notes}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: ".07em",
                                        textTransform: "uppercase",
                                        color: "var(--text-3)",
                                        marginBottom: 10,
                                    }}
                                >
                                    Tracking Timeline
                                </div>
                                {[
                                    [
                                        "Order Created",
                                        fmtDate(detail.created),
                                        "done",
                                    ],
                                    [
                                        "Pickup Confirmed",
                                        `${detail.originCountry}`,
                                        detail.status === "pending"
                                            ? "pend"
                                            : "done",
                                    ],
                                    [
                                        "In Transit",
                                        `${detail.origin} -> ${detail.destination}`,
                                        [
                                            "transit",
                                            "customs",
                                            "delayed",
                                            "delivered",
                                        ].includes(detail.status)
                                            ? "done"
                                            : "pend",
                                    ],
                                    [
                                        "Customs Clearance",
                                        "Documentation verification",
                                        detail.status === "customs"
                                            ? "cur"
                                            : detail.status === "delivered"
                                              ? "done"
                                              : "pend",
                                    ],
                                    [
                                        "Delivered",
                                        detail.status === "delivered"
                                            ? `Confirmed ${fmtDate(detail.eta)}`
                                            : `ETA ${fmtDate(detail.eta)}`,
                                        detail.status === "delivered"
                                            ? "done"
                                            : "pend",
                                    ],
                                ].map((x, i) => (
                                    <div key={i} className="tl-item">
                                        <div className={`tl-dot ${x[2]}`} />
                                        <div className="tl-body">
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {x[0]}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 11.5,
                                                    color: "var(--text-3)",
                                                    marginTop: 1,
                                                }}
                                            >
                                                {x[1]}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: ".07em",
                                        textTransform: "uppercase",
                                        color: "var(--text-3)",
                                        marginBottom: 10,
                                    }}
                                >
                                    Update Status
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 6,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {(
                                        [
                                            "transit",
                                            "pending",
                                            "customs",
                                            "delayed",
                                            "delivered",
                                        ] as const
                                    ).map((st) => (
                                        <button
                                            key={st}
                                            className={`btn ${detail.status === st ? "active-filter" : ""}`}
                                            style={{
                                                fontSize: 12,
                                                padding: "5px 12px",
                                            }}
                                            onClick={() => {
                                                quickStatus(detail.id, st);
                                                setDetailId(detail.id);
                                            }}
                                        >
                                            {statusLabel(st)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className={`modal-overlay ${modalOpen ? "open" : ""}`}>
                <div className="modal">
                    <div className="modal-header">
                        <span className="modal-title">
                            {editId ? `Edit ${editId}` : "New Shipment"}
                        </span>
                        <button
                            className="icon-btn"
                            style={{ width: 28, height: 28 }}
                            onClick={() => setModalOpen(false)}
                        >
                            <svg
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                style={{ width: 16, height: 16 }}
                            >
                                <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div
                            className="form-section-title"
                            style={{ border: "none", paddingTop: 0 }}
                        >
                            Cargo & Route
                        </div>
                        <div className="form-row">
                            <FormInput
                                label="Customer *"
                                value={form.customer}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, customer: v }))
                                }
                            />
                            <FormSelect
                                label="Mode *"
                                value={form.mode}
                                onChange={(v) =>
                                    setForm((p) => ({
                                        ...p,
                                        mode: v as Mode | "",
                                    }))
                                }
                                options={["Sea", "Air", "Road", "Rail"]}
                                includeEmpty
                            />
                        </div>
                        <div className="form-row">
                            <FormInput
                                label="Origin City *"
                                value={form.origin}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, origin: v }))
                                }
                            />
                            <FormSelect
                                label="Origin Country *"
                                value={form.originCountry}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, originCountry: v }))
                                }
                                options={COUNTRIES}
                                includeEmpty
                            />
                        </div>
                        <div className="form-row">
                            <FormInput
                                label="Destination City *"
                                value={form.destination}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, destination: v }))
                                }
                            />
                            <FormSelect
                                label="Destination Country *"
                                value={form.destCountry}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, destCountry: v }))
                                }
                                options={COUNTRIES}
                                includeEmpty
                            />
                        </div>

                        <div className="form-section-title">Shipment Info</div>
                        <div className="form-row">
                            <FormInput
                                label="Weight (kg) *"
                                type="number"
                                value={form.weight}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, weight: v }))
                                }
                            />
                            <FormInput
                                label="Volume (m³)"
                                type="number"
                                value={form.volume}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, volume: v }))
                                }
                            />
                        </div>
                        <div className="form-row">
                            <FormSelect
                                label="Status *"
                                value={form.status}
                                onChange={(v) =>
                                    setForm((p) => ({
                                        ...p,
                                        status: v as Status,
                                    }))
                                }
                                options={[
                                    "transit",
                                    "pending",
                                    "customs",
                                    "delayed",
                                    "delivered",
                                ]}
                            />
                            <FormInput
                                label="ETA *"
                                type="date"
                                value={form.eta}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, eta: v }))
                                }
                            />
                        </div>
                        <div className="form-row">
                            <FormInput
                                label="Freight Cost ($)"
                                type="number"
                                value={form.cost}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, cost: v }))
                                }
                            />
                            <FormInput
                                label="Container / AWB #"
                                value={form.container}
                                onChange={(v) =>
                                    setForm((p) => ({ ...p, container: v }))
                                }
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea
                                className="form-textarea"
                                style={{
                                    minHeight: 72,
                                    resize: "vertical" as const,
                                }}
                                value={form.notes}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        notes: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            className="btn"
                            onClick={() => setModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button className="btn primary" onClick={saveShipment}>
                            {editId ? "Save Changes" : "Create Shipment"}
                        </button>
                    </div>
                </div>
            </div>

            <div className={`modal-overlay ${confirmOpen ? "open" : ""}`}>
                <div className="confirm-modal">
                    <h3>{confirmTitle}</h3>
                    <p>{confirmMsg}</p>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                        }}
                    >
                        <button
                            className="btn"
                            onClick={() => setConfirmOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn danger"
                            onClick={() => {
                                confirmAction?.();
                                setConfirmOpen(false);
                            }}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>

            <div className="toast-wrap">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type}`}>
                        <span>
                            {t.type === "success"
                                ? "✓"
                                : t.type === "error"
                                  ? "✕"
                                  : "ℹ"}
                        </span>
                        <span>{t.msg}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

function SortableHead({
    label,
    active,
    dir,
    onClick,
}: {
    label: string;
    active: boolean;
    dir: "asc" | "desc";
    onClick: () => void;
}) {
    return (
        <th style={{ cursor: "pointer" }} onClick={onClick}>
            {label}
            <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.4 }}>
                {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
            </span>
        </th>
    );
}

function DetailField({
    label,
    value,
    mono = false,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div>
            <div
                style={{
                    fontSize: 11.5,
                    color: "var(--text-3)",
                    marginBottom: 3,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: mono ? 12.5 : 13.5,
                    fontWeight: 500,
                    fontFamily: mono ? "DM Mono, monospace" : undefined,
                    color: mono ? "var(--blue)" : undefined,
                }}
            >
                {value}
            </div>
        </div>
    );
}

function FormInput({
    label,
    value,
    onChange,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
}) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <input
                className="form-input"
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function FormSelect({
    label,
    value,
    onChange,
    options,
    includeEmpty = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    includeEmpty?: boolean;
}) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <select
                className="form-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {includeEmpty && <option value="">Select</option>}
                {options.map((x) => (
                    <option key={x} value={x}>
                        {x}
                    </option>
                ))}
            </select>
        </div>
    );
}

function StatCard({
    label,
    value,
    change,
    progress,
    kind,
    icon,
    down = false,
}: {
    label: string;
    value: string;
    change: string;
    progress: number;
    kind: "blue" | "green" | "amber" | "red" | "purple";
    icon: "truck" | "check" | "clock" | "calendar" | "alert";
    down?: boolean;
}) {
    const color = `var(--${kind})`;
    return (
        <div className="stat-card">
            <div className="stat-top">
                <div
                    className="stat-icon"
                    style={{ background: `var(--${kind}-dim)`, color }}
                >
                    {icon === "truck" && (
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            style={{ width: 18, height: 18 }}
                        >
                            <rect x="1" y="5" width="12" height="9" rx="1.5" />
                            <path d="M13 8l3 2v4h-3V8z" />
                            <circle cx="4.5" cy="14" r="1.5" />
                            <circle cx="10.5" cy="14" r="1.5" />
                            <circle cx="15" cy="14" r="1.5" />
                        </svg>
                    )}
                    {icon === "check" && (
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            style={{ width: 18, height: 18 }}
                        >
                            <path d="M2 9l5 5 9-9" />
                        </svg>
                    )}
                    {icon === "clock" && (
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            style={{ width: 18, height: 18 }}
                        >
                            <circle cx="9" cy="9" r="7" />
                            <path d="M9 5v4l2.5 2.5" />
                        </svg>
                    )}
                    {icon === "calendar" && (
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            style={{ width: 18, height: 18 }}
                        >
                            <rect x="2" y="4" width="14" height="11" rx="1.5" />
                            <path d="M2 8h14" />
                            <path d="M6 2v4M12 2v4" />
                        </svg>
                    )}
                    {icon === "alert" && (
                        <svg
                            viewBox="0 0 18 18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            style={{ width: 18, height: 18 }}
                        >
                            <path d="M9 2L1.5 15h15L9 2z" />
                            <path d="M9 7v4M9 13.5v.5" />
                        </svg>
                    )}
                </div>
                <span className={`stat-change ${down ? "down" : "up"}`}>
                    {change}
                </span>
            </div>
            <div
                className="stat-value"
                style={{
                    color:
                        kind === "green" || kind === "red" ? color : undefined,
                }}
            >
                {value}
            </div>
            <div className="stat-label">{label}</div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{
                        width: `${Math.max(0, Math.min(100, progress))}%`,
                        background: color,
                    }}
                />
            </div>
        </div>
    );
}
