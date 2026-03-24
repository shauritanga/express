import { Head } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

type Status = "transit" | "delivered" | "pending" | "delayed" | "customs";
type Mode = "Sea" | "Air" | "Road" | "Rail";
type PageName = "dashboard" | "shipments" | "bookings";
type BookingStatus =
    | "new"
    | "reviewing"
    | "approved"
    | "converted"
    | "rejected";
type BookingUrgency = "high" | "medium" | "low";

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

type Booking = {
    id: string;
    customer: string;
    origin: string;
    destination: string;
    mode: Mode;
    type: string;
    weight: number;
    containers: number;
    urgency: BookingUrgency;
    status: BookingStatus;
    received: string;
    contact: string;
    email: string;
    phone: string;
    message: string;
    convertedTo: string | null;
    assignedTo: string | null;
    notes: string;
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

type BookingConvertForm = {
    origin: string;
    destination: string;
    mode: Mode;
    eta: string;
    customer: string;
    weight: string;
    type: string;
    containers: string;
    contact: string;
    email: string;
};

const CSS = `
*, *::before, *::after { box-sizing: border-box; }
:root {
    --blue:#3651BE; --blue-dim:rgba(54,81,190,0.14); --blue-border:rgba(54,81,190,0.36);
    --bg:#0A0A0A; --bg-2:#151515; --bg-3:#1F1F1F; --bg-4:#373232;
    --border:rgba(255,255,255,0.12); --border-strong:rgba(255,255,255,0.2);
    --text-1:#FEFFFF; --text-2:#CFCFD0; --text-3:#A1A1A1;
        --scroll-track:#151515; --scroll-thumb:#646464; --scroll-thumb-hover:#A1A1A1;
    --green:#738CBF; --amber:#84A9DB; --red:#D84446; --purple:#522227;
    --green-dim:rgba(115,140,191,0.14); --amber-dim:rgba(132,169,219,0.16);
    --red-dim:rgba(216,68,70,0.14); --purple-dim:rgba(82,34,39,0.18);
  --sidebar-w:240px; --sidebar-collapsed:60px;
  --radius:10px; --transition:0.22s cubic-bezier(0.4,0,0.2,1);
}
[data-theme="light"] {
    --bg:#FEFFFF; --bg-2:#FEFFFF; --bg-3:#F4F5F8; --bg-4:#DED2E3;
    --border:rgba(10,10,10,0.1); --border-strong:rgba(10,10,10,0.16);
    --text-1:#0A0A0A; --text-2:#373232; --text-3:#646464;
        --scroll-track:#F4F5F8; --scroll-thumb:#CFCFD0; --scroll-thumb-hover:#A1A1A1;
    --blue-dim:rgba(54,81,190,0.1);
}
html,body{height:100%;margin:0;background:var(--bg);color:var(--text-1);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5;overflow:hidden;}
/* Theme-aware scrollbars for both dark and light modes */
*{scrollbar-width:thin;scrollbar-color:var(--scroll-thumb) var(--scroll-track);}
*::-webkit-scrollbar{width:10px;height:10px;}
*::-webkit-scrollbar-track{background:var(--scroll-track);}
*::-webkit-scrollbar-thumb{background:var(--scroll-thumb);border-radius:8px;border:2px solid var(--scroll-track);}
*::-webkit-scrollbar-thumb:hover{background:var(--scroll-thumb-hover);}
.shell{display:flex;height:100vh;background:var(--bg);color:var(--text-1);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5;overflow:hidden;}
.sidebar{width:var(--sidebar-w);min-width:var(--sidebar-w);height:100vh;background:var(--bg-2);border-right:1px solid var(--border);display:flex;flex-direction:column;transition:width var(--transition),min-width var(--transition);overflow:hidden;position:relative;z-index:10;}
.sidebar.collapsed{width:var(--sidebar-collapsed);min-width:var(--sidebar-collapsed);}
.sidebar-header{height:56px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--border);gap:10px;flex-shrink:0;}
.logo-mark{width:28px;height:28px;background:var(--blue);border-radius:7px;display:grid;place-items:center;flex-shrink:0;color:white;}
.logo-mark svg{width:16px;height:16px;}
.logo-text{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;transition:opacity var(--transition);}
.sidebar.collapsed .logo-text{opacity:0;pointer-events:none;}
.toggle-btn{width:38px;height:30px;background:var(--bg-3);border:0;border-radius:6px;cursor:pointer;display:grid;place-items:center;color:#D1D5DB;transition:background var(--transition),color var(--transition);}
.toggle-btn:hover{background:var(--bg-4);color:#F1F3F7;}
.toggle-btn svg{width:18px;height:18px;}
.sidebar-nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto;overflow-x:hidden;}
.nav-section-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);padding:8px 8px 4px;white-space:nowrap;overflow:hidden;}
.sidebar.collapsed .nav-section-label{opacity:0;}
.nav-item{display:flex;align-items:center;gap:10px;padding:8px;border-radius:7px;cursor:pointer;color:var(--text-2);transition:background var(--transition),color var(--transition);white-space:nowrap;overflow:hidden;border:none;background:transparent;text-align:left;position:relative;}
.nav-item:hover{background:var(--bg-3);color:var(--text-1);}
.nav-item.active{background:var(--blue-dim);color:var(--blue);}
.nav-icon{width:18px;height:18px;flex-shrink:0;}
.floating-nav-tooltip{position:fixed;left:0;top:0;transform:translateY(-50%) translateX(-4px);background:var(--bg-3);border:1px solid var(--border-strong);border-radius:6px;padding:5px 8px;font-size:12px;font-weight:500;color:var(--text-1);white-space:nowrap;opacity:0;pointer-events:none;box-shadow:0 8px 18px rgba(0,0,0,.24);transition:opacity var(--transition),transform var(--transition);z-index:300;}
.floating-nav-tooltip.show{opacity:1;transform:translateY(-50%) translateX(0);}
.nav-label{font-size:13.5px;font-weight:500;transition:opacity var(--transition);}
.sidebar.collapsed .nav-label{opacity:0;}
.nav-badge{margin-left:auto;font-size:10px;font-weight:600;background:var(--blue);color:white;padding:1px 6px;border-radius:20px;}
.sidebar.collapsed .nav-badge{opacity:0;}
.sidebar-footer{padding:12px 8px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;}
.avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3651BE,#84A9DB);display:grid;place-items:center;flex-shrink:0;font-size:12px;font-weight:600;color:white;}
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
.sh-select{height:34px;padding:0 10px;border-radius:7px;background:var(--bg-3);border:1px solid var(--border);color:var(--text-1);font-family:inherit;font-size:13px;cursor:pointer;outline:none;appearance:none;padding-right:28px;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7385' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;}
.icon-btn{width:34px;height:34px;border-radius:7px;background:var(--bg-3);border:1px solid var(--border);display:grid;place-items:center;cursor:pointer;color:var(--text-2);transition:background var(--transition),color var(--transition);}
.icon-btn:hover{background:var(--bg-4);color:var(--text-1);}
.icon-btn svg{width:16px;height:16px;}
.btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border-strong);background:var(--bg-3);color:var(--text-1);transition:background var(--transition),border-color var(--transition);}
.btn:hover{background:var(--bg-4);}
.btn.primary{background:var(--blue);border-color:var(--blue);color:white;}
.btn.primary:hover{background:#2C449E;border-color:#2C449E;}
.btn.danger{background:var(--red-dim);border-color:rgba(216,68,70,0.34);color:var(--red);}
.page{display:none;flex:1;overflow:hidden;flex-direction:column;}
.page.active{display:flex;}
.content{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px;}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
.stat-card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:border-color var(--transition);animation:fadeUp .4s ease both;}
.stat-card:nth-child(1){animation-delay:.05s;}.stat-card:nth-child(2){animation-delay:.1s;}.stat-card:nth-child(3){animation-delay:.15s;}.stat-card:nth-child(4){animation-delay:.2s;}
.stat-card:hover{border-color:var(--border-strong);}
.stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
.stat-icon{width:36px;height:36px;border-radius:8px;display:grid;place-items:center;}
.stat-icon svg{width:18px;height:18px;}
.stat-change{font-size:12px;font-weight:500;padding:3px 8px;border-radius:20px;}
.stat-change.up{background:var(--green-dim);color:var(--green);} .stat-change.down{background:var(--red-dim);color:var(--red);}
.stat-value{font-size:28px;font-weight:600;letter-spacing:-.03em;line-height:1;margin-bottom:4px;}
.stat-label{font-size:12.5px;color:var(--text-3);} .progress-bar{height:3px;background:var(--bg-4);border-radius:2px;overflow:hidden;margin-top:6px;}
.progress-fill{height:100%;border-radius:2px;background:var(--blue);}
.card{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
.card-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);} .card-title{font-size:14px;font-weight:600;}
.card-subtitle{font-size:12px;color:var(--text-3);margin-top:1px;}
.two-col{display:grid;grid-template-columns:1.06fr 0.94fr;gap:14px;}
.three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.cargo-volume-card{display:flex;flex-direction:column;height:100%;}
.chart-wrap{padding:12px 14px 8px;}
.cargo-volume-card .chart-wrap{flex:1;min-height:230px;}
.apex-cargo{width:100%;height:100%;}
.route-item{display:flex;align-items:center;gap:12px;padding:13px 20px;border-bottom:1px solid var(--border);transition:background var(--transition);cursor:pointer;} .route-item:last-child{border-bottom:none;}
.route-item:hover{background:var(--bg-3);}
.route-list{display:flex;flex-direction:column;}
.route-info{flex:1;min-width:0;}
.route-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;} .route-name{font-size:13px;font-weight:500;} .route-meta{font-size:11.5px;color:var(--text-3);} .route-count{font-family:'DM Mono',monospace;font-size:12px;color:var(--text-2);font-weight:500;}
.chart-legend{display:flex;gap:16px;padding:10px 20px 16px;}
.cargo-volume-card .chart-legend{margin-top:auto;}
.legend-item{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--text-3);}
.legend-dot{width:8px;height:8px;border-radius:2px;}
.mini-stat-row{display:flex;flex-direction:column;}
.mini-stat{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);}
.mini-stat:last-child{border-bottom:none;}
.mini-stat-icon{width:32px;height:32px;border-radius:7px;display:grid;place-items:center;flex-shrink:0;}
.mini-stat-icon svg{width:15px;height:15px;}
.mini-stat-body{flex:1;}
.mini-stat-label{font-size:11.5px;color:var(--text-3);}
.mini-stat-value{font-size:14px;font-weight:600;}
.mini-stat-bar-wrap{width:60px;}
.mini-stat-bar{height:4px;background:var(--bg-4);border-radius:2px;overflow:hidden;}
.mini-stat-bar-fill{height:100%;border-radius:2px;background:var(--blue);}
.filter-tabs{display:flex;gap:4px;background:var(--bg-3);border:1px solid var(--border);border-radius:8px;padding:3px;}
.filter-tab{padding:5px 12px;border-radius:6px;font-size:12.5px;font-weight:500;cursor:pointer;color:var(--text-2);background:transparent;border:none;}
.filter-tab.active{background:var(--bg-2);color:var(--text-1);}
.form-input,.form-select,.form-textarea{background:var(--bg-3);border:1px solid var(--border-strong);border-radius:7px;padding:8px 12px;font-family:inherit;font-size:13px;color:var(--text-1);outline:none;transition:border-color var(--transition);}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--blue);}
.form-select{cursor:pointer;appearance:none;padding-right:30px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236B7385' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;}
.form-textarea{resize:vertical;min-height:72px;}
.data-table{width:100%;border-collapse:collapse;} .data-table thead th{text-align:left;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);padding:10px 16px;border-bottom:1px solid var(--border);white-space:nowrap;}
.data-table tbody tr{border-bottom:1px solid var(--border);transition:background var(--transition);cursor:pointer;} .data-table tbody tr:hover{background:var(--bg-3);} .data-table tbody tr.row-sel{background:var(--blue-dim);} .data-table td{padding:11px 16px;font-size:13px;vertical-align:middle;}
.td-mono{font-family:'DM Mono',monospace;font-size:12px;color:var(--blue);font-weight:500;} .badge{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:500;padding:3px 9px;border-radius:20px;white-space:nowrap;} .badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;}
.badge.transit{background:var(--blue-dim);color:var(--blue);} .badge.delivered{background:var(--green-dim);color:var(--green);} .badge.pending{background:var(--amber-dim);color:var(--amber);} .badge.delayed{background:var(--red-dim);color:var(--red);} .badge.customs{background:var(--purple-dim);color:var(--purple);}
.badge.new{background:var(--blue-dim);color:var(--blue);} .badge.reviewing{background:var(--purple-dim);color:var(--purple);} .badge.approved{background:var(--green-dim);color:var(--green);} .badge.converted{background:rgba(115,140,191,.14);color:var(--green);border:1px solid rgba(115,140,191,.3);} .badge.rejected{background:var(--red-dim);color:var(--red);}
.bk-grid-scroll{flex:1;overflow-y:auto;padding:20px 24px;}
.bk-grid-body{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;align-content:start;}
.bk-card{background:var(--bg-2);border:1px solid var(--border);border-radius:9px;padding:14px;cursor:pointer;transition:border-color var(--transition),box-shadow var(--transition);} .bk-card:hover{border-color:var(--border-strong);box-shadow:0 2px 12px rgba(0,0,0,.2);} .bk-card.selected{border-color:var(--blue);box-shadow:0 0 0 2px var(--blue-dim);}
.bk-card-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;} .bk-card-id{font-family:'DM Mono',monospace;font-size:11px;color:var(--blue);font-weight:500;} .bk-card-time{font-size:11px;color:var(--text-3);} .bk-card-name{font-size:13px;font-weight:600;margin-bottom:3px;} .bk-card-route{font-size:12px;color:var(--text-2);display:flex;align-items:center;gap:4px;}
.bk-card-footer{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);} .bk-urgency{width:6px;height:6px;border-radius:50%;flex-shrink:0;}
.bk-table-wrap{flex:1;overflow-x:auto;} .bk-table-wrap::-webkit-scrollbar{height:6px;} .bk-table-wrap::-webkit-scrollbar-thumb{background:var(--border-strong);border-radius:3px;} .bk-table{width:100%;border-collapse:collapse;min-width:700px;} .bk-table thead{position:sticky;top:0;z-index:2;} .bk-table thead th{background:var(--bg-2);text-align:left;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);padding:10px 16px;border-bottom:1px solid var(--border);white-space:nowrap;} .bk-table tbody tr{border-bottom:1px solid var(--border);cursor:pointer;transition:background var(--transition);} .bk-table tbody tr:last-child{border-bottom:none;} .bk-table tbody tr:hover{background:var(--bg-3);} .bk-table tbody tr.bk-selected-row{background:var(--blue-dim);} .bk-table td{padding:11px 16px;font-size:13px;vertical-align:middle;} .bk-table td.mono{font-family:'DM Mono',monospace;font-size:12px;color:var(--blue);font-weight:500;} .bk-table td .text-muted{font-size:11px;color:var(--text-3);margin-top:1px;}
.bk-detail{position:fixed;top:0;right:0;bottom:0;width:0;min-width:0;overflow:hidden;border-left:1px solid var(--border);background:var(--bg-2);transition:width var(--transition),min-width var(--transition);display:flex;flex-direction:column;z-index:50;box-shadow:-4px 0 24px rgba(0,0,0,0.18);} .bk-detail.open{width:400px;min-width:400px;} .bk-detail-scroll{flex:1;overflow-y:auto;}
.bk-detail .dp-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;}
.view-toggle{display:flex;gap:2px;background:var(--bg-3);border:1px solid var(--border);border-radius:7px;padding:3px;} .view-btn{width:30px;height:28px;border-radius:5px;display:grid;place-items:center;cursor:pointer;color:var(--text-3);transition:all var(--transition);border:none;background:none;} .view-btn.active{background:var(--bg-2);color:var(--text-1);box-shadow:0 1px 3px rgba(0,0,0,.3);} .view-btn svg{width:14px;height:14px;}
.bk-pagination{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-top:1px solid var(--border);background:var(--bg-2);flex-shrink:0;font-size:12.5px;color:var(--text-3);}
.sh-checkbox{width:15px;height:15px;border-radius:4px;border:1.5px solid var(--border-strong);background:transparent;cursor:pointer;accent-color:var(--blue);}
.dp-section{padding:16px 20px;border-bottom:1px solid var(--border);} .dp-section:last-child{border-bottom:none;} .dp-section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:12px;} .dp-row{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:8px;} .dp-row:last-child{margin-bottom:0;} .dp-key{font-size:12.5px;color:var(--text-3);flex-shrink:0;} .dp-val{font-size:12.5px;color:var(--text-1);font-weight:500;text-align:right;} .dp-val.mono{font-family:'DM Mono',monospace;font-size:12px;}
.timeline{display:flex;flex-direction:column;gap:0;padding:16px 20px;} .tl-dot.active{background:var(--blue-dim);border-color:var(--blue);} .tl-dot.pending{background:var(--bg-3);border-color:var(--border-strong);} .tl-dot.cur{background:var(--blue-dim);border-color:var(--blue);} .tl-dot.pend{background:var(--bg-3);border-color:var(--border-strong);}
.pag-btns{display:flex;gap:4px;} .pag-btn{width:30px;height:30px;border-radius:6px;background:var(--bg-3);border:1px solid var(--border);color:var(--text-2);display:grid;place-items:center;cursor:pointer;font-size:12.5px;font-family:inherit;font-weight:500;transition:all var(--transition);} .pag-btn:hover{background:var(--bg-4);color:var(--text-1);} .pag-btn.active{background:var(--blue);border-color:var(--blue);color:#fff;} .pag-btn:disabled{opacity:.4;cursor:not-allowed;} .pag-btn svg{width:12px;height:12px;}
.row-menu{display:none;position:absolute;right:0;top:34px;background:var(--bg-2);border:1px solid var(--border-strong);border-radius:8px;z-index:30;min-width:148px;box-shadow:0 8px 24px rgba(0,0,0,0.3);overflow:hidden;padding:4px;} .row-menu.open{display:block;}
.row-menu-item{padding:7px 10px;font-size:12.5px;border-radius:5px;cursor:pointer;color:var(--text-2);border:none;background:transparent;width:100%;text-align:left;} .row-menu-item:hover{background:var(--bg-3);color:var(--text-1);} .row-menu-item.green{color:var(--green);} .row-menu-item.red{color:var(--red);}
.row-menu-divider{height:1px;background:var(--border);margin:4px 0;}
.pagination{display:flex;align-items:center;gap:6px;padding:14px 16px;border-top:1px solid var(--border);} .page-info{font-size:12.5px;color:var(--text-3);flex:1;} .page-btn{width:30px;height:30px;border-radius:6px;border:1px solid var(--border);background:var(--bg-3);color:var(--text-2);cursor:pointer;display:grid;place-items:center;font-size:12.5px;font-weight:500;transition:background var(--transition),color var(--transition);} .page-btn:hover:not(:disabled){background:var(--bg-4);color:var(--text-1);} .page-btn.active{background:var(--blue);border-color:var(--blue);color:white;} .page-btn:disabled{opacity:.35;cursor:not-allowed;}
.page-btn svg{width:12px;height:12px;}
.bulk-bar{display:none;padding:10px 16px;border-top:1px solid var(--border);background:var(--blue-dim);align-items:center;gap:10px;} .bulk-bar.show{display:flex;}
.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 24px;color:var(--text-3);gap:12px;}
.detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:50;opacity:0;pointer-events:none;transition:opacity var(--transition);} .detail-overlay.open{opacity:1;pointer-events:all;}
.detail-panel{position:fixed;top:0;right:0;height:100vh;width:480px;max-width:95vw;background:var(--bg-2);border-left:1px solid var(--border);z-index:51;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);} .detail-panel.open{transform:translateX(0);} .dp-header{height:56px;display:flex;align-items:center;padding:0 20px;border-bottom:1px solid var(--border);gap:10px;} .dp-id{font-family:'DM Mono',monospace;font-size:13px;color:var(--blue);font-weight:500;} .dp-body{flex:1;overflow-y:auto;padding:20px;}
.dp-close{width:28px;height:28px;border-radius:6px;background:var(--bg-3);border:1px solid var(--border);display:grid;place-items:center;cursor:pointer;color:var(--text-3);flex-shrink:0;}
.dp-close:hover{color:var(--text-1);background:var(--bg-4);}
.dp-close svg{width:12px;height:12px;}
.tl-item{display:flex;gap:12px;position:relative;} .tl-item:not(:last-child)::before{content:'';position:absolute;left:7px;top:18px;bottom:-4px;width:1px;background:var(--border);} .tl-dot{width:15px;height:15px;border-radius:50%;flex-shrink:0;margin-top:3px;border:2px solid;} .tl-dot.done{background:var(--green);border-color:var(--green);} .tl-dot.cur{background:var(--blue);border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-dim);} .tl-dot.pend{background:var(--bg-3);border-color:var(--border-strong);} .tl-body{flex:1;padding-bottom:14px;}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:none;align-items:center;justify-content:center;padding:24px;overflow:auto;} .modal-overlay.open{display:flex;}
.modal{background:var(--bg-2);border:1px solid var(--border-strong);border-radius:12px;width:560px;max-width:100%;max-height:72vh;margin:auto;display:flex;flex-direction:column;} .modal-header{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;} .modal-title{font-size:16px;font-weight:600;flex:1;} .modal-body{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px;} .modal-footer{padding:16px 24px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;} .form-group{display:flex;flex-direction:column;gap:6px;} .form-label{font-size:12px;font-weight:600;color:var(--text-2);} .form-section-title{font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--text-3);padding-top:4px;border-top:1px solid var(--border);} .form-divider{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);padding-bottom:4px;border-bottom:1px solid var(--border);}
.confirm-modal{background:var(--bg-2);border:1px solid var(--border-strong);border-radius:12px;width:380px;max-width:100%;padding:24px;} .confirm-modal h3{font-size:15px;font-weight:600;margin:0 0 8px;} .confirm-modal p{font-size:13px;color:var(--text-2);line-height:1.6;margin:0 0 20px;}
.toast-wrap{position:fixed;bottom:24px;right:24px;z-index:200;display:flex;flex-direction:column;gap:8px;} .toast{background:var(--bg-3);border:1px solid var(--border-strong);border-radius:8px;padding:11px 15px;font-size:13px;color:var(--text-1);display:flex;align-items:center;gap:10px;min-width:240px;} .toast.success{border-left:3px solid var(--green);} .toast.error{border-left:3px solid var(--red);} .toast.info{border-left:3px solid var(--blue);}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
@media (max-width:1200px){.stat-grid{grid-template-columns:repeat(2,1fr)}.two-col{grid-template-columns:1.06fr 0.94fr;width:100%;margin:0}}
@media (max-width:980px){.two-col{grid-template-columns:1fr}}
@media (max-width:1100px){.three-col{grid-template-columns:1fr 1fr;}}
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

const BK_CUSTOMERS = [
    "Horizon Trade Ltd",
    "Pacific Rim Co.",
    "AlphaGoods GmbH",
    "Meridian Imports",
    "BlueStar Exports",
    "Nova Freight Inc",
    "Stellar Commerce",
    "Atlas Logistics",
    "Caspian Cargo",
    "Summit Trade",
];

const BK_ROUTES: Array<readonly [string, string]> = [
    ["Nairobi", "London"],
    ["Dubai", "Chicago"],
    ["Shanghai", "Hamburg"],
    ["Singapore", "Rotterdam"],
    ["Lagos", "Antwerp"],
    ["Dar es Salaam", "Mumbai"],
    ["Casablanca", "Barcelona"],
    ["Jakarta", "Frankfurt"],
    ["Manila", "Long Beach"],
    ["Karachi", "Amsterdam"],
];

const BK_TYPES = [
    "Electronics",
    "General",
    "Perishable",
    "Hazardous",
    "Automotive",
    "Textiles",
    "Machinery",
];

const BK_NOTES = [
    "Fragile items - handle with care",
    "Temperature controlled required",
    "Hazardous documentation enclosed",
    "Pre-clearance paperwork attached",
    "Consolidation with existing booking preferred",
    "Express delivery required - client deadline",
    "Partial shipment, remainder to follow",
];

const BK_CONTACTS = [
    "Maria Santos",
    "James Okonkwo",
    "Li Wei",
    "Sara Hassan",
    "Tom Muller",
];

function genInitialBookings(n = 22): Booking[] {
    return Array.from({ length: n }, (_, i) => {
        const [origin, destination] = BK_ROUTES[i % BK_ROUTES.length];
        const customer = BK_CUSTOMERS[i % BK_CUSTOMERS.length];
        const status: BookingStatus =
            i < 3
                ? "new"
                : i < 6
                  ? "reviewing"
                  : i < 10
                    ? "approved"
                    : i < 16
                      ? "converted"
                      : "rejected";
        const urgency: BookingUrgency =
            i % 3 === 0 ? "high" : i % 3 === 1 ? "medium" : "low";
        return {
            id: `BKG-${String(2000 + i).padStart(5, "0")}`,
            customer,
            origin,
            destination,
            mode: ["Sea", "Air", "Road", "Rail"][i % 4] as Mode,
            type: BK_TYPES[i % BK_TYPES.length],
            weight: 350 + i * 410,
            containers: (i % 5) + 1,
            urgency,
            status,
            received: new Date(
                Date.now() - (i % 15) * 24 * 60 * 60 * 1000,
            ).toISOString(),
            contact: BK_CONTACTS[i % BK_CONTACTS.length],
            email: `contact${i + 1}@${customer.toLowerCase().replace(/[^a-z]/g, "")}.com`,
            phone: `+${(i % 80) + 10} 555 ${String(1000 + i)}`,
            message: i % 3 === 0 ? BK_NOTES[i % BK_NOTES.length] : "",
            convertedTo: status === "converted" ? `SH-${11000 + i}` : null,
            assignedTo:
                status === "reviewing" || status === "approved"
                    ? ["Amir K.", "Sara M.", "Chen W."][i % 3]
                    : null,
            notes: "",
        };
    });
}

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

function bookingModeIcon(mode: Mode) {
    if (mode === "Sea") {
        return (
            <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ width: 12, height: 12, verticalAlign: "middle" }}
            >
                <path d="M1 9l2-5h8l2 5H1z" />
                <path d="M4 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
            </svg>
        );
    }
    if (mode === "Air") {
        return (
            <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ width: 12, height: 12, verticalAlign: "middle" }}
            >
                <path d="M1 8l3-4 2 2 5-3 1 2-5 2 1 3-2 1-1-2-4 1z" />
            </svg>
        );
    }
    if (mode === "Road") {
        return (
            <svg
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ width: 12, height: 12, verticalAlign: "middle" }}
            >
                <rect x="1" y="4" width="9" height="6" rx="1" />
                <path d="M10 7l3 1.5V10h-3V7z" />
                <circle cx="3.5" cy="10" r="1.5" />
                <circle cx="8.5" cy="10" r="1.5" />
            </svg>
        );
    }
    return (
        <svg
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{ width: 12, height: 12, verticalAlign: "middle" }}
        >
            <rect x="2" y="2" width="10" height="8" rx="1.5" />
            <path d="M2 6h10" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="10" cy="12" r="1" />
            <path d="M4 10v2M10 10v2M5 12h4" />
        </svg>
    );
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

function bookingStatusLabel(status: BookingStatus) {
    if (status === "new") return "New";
    if (status === "reviewing") return "Reviewing";
    if (status === "approved") return "Approved";
    if (status === "converted") return "Converted";
    return "Rejected";
}

function bookingTimeAgo(isoDate: string) {
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

function urgencyColor(urgency: BookingUrgency) {
    if (urgency === "high") return "var(--red)";
    if (urgency === "medium") return "var(--amber)";
    return "var(--green)";
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
    const [navTip, setNavTip] = useState({
        text: "",
        x: 0,
        y: 0,
        show: false,
    });
    const [bookings, setBookings] = useState<Booking[]>(() =>
        genInitialBookings(),
    );
    const [bkSearch, setBkSearch] = useState("");
    const [bkStatusFlt, setBkStatusFlt] = useState<"all" | BookingStatus>(
        "all",
    );
    const [bkUrgencyFlt, setBkUrgencyFlt] = useState<"all" | BookingUrgency>(
        "all",
    );
    const [bkModeFlt, setBkModeFlt] = useState<"all" | Mode>("all");
    const [bkView, setBkView] = useState<"grid" | "list">("grid");
    const [bkCurPage, setBkCurPage] = useState(1);
    const [bkSelectedId, setBkSelectedId] = useState<string | null>(null);
    const [bkSelected, setBkSelected] = useState<Set<string>>(new Set());
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [convertBookingId, setConvertBookingId] = useState<string | null>(
        null,
    );
    const [convertForm, setConvertForm] = useState<BookingConvertForm>({
        origin: "",
        destination: "",
        mode: "Sea",
        eta: "",
        customer: "",
        weight: "",
        type: "General",
        containers: "",
        contact: "",
        email: "",
    });

    const PER = 10;
    const BK_PER = 10;
    const deliveredChart = useMemo(
        () =>
            CHART.map((v, i) =>
                Math.max(24, Math.round(v * 0.64 + (i % 2 ? 4 : 0))),
            ),
        [],
    );
    const cargoSeries = useMemo(
        () => [
            { name: "Dispatched", data: CHART },
            { name: "Delivered", data: deliveredChart },
        ],
        [deliveredChart],
    );
    const cargoOptions = useMemo<ApexOptions>(
        () => ({
            chart: {
                type: "bar",
                background: "transparent",
                toolbar: { show: false },
                fontFamily: "DM Sans, sans-serif",
            },
            theme: { mode: theme === "dark" ? "dark" : "light" },
            colors: ["#3651BE", "#84A9DB"],
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 6,
                    columnWidth: "42%",
                },
            },
            dataLabels: { enabled: false },
            stroke: { show: false },
            xaxis: {
                categories: CHART.map((_, i) => `W${i + 1}`),
                axisTicks: { show: false },
                axisBorder: { show: false },
                labels: {
                    style: {
                        colors: CHART.map(() =>
                            theme === "dark" ? "#A1A1A1" : "#646464",
                        ),
                        fontFamily: "DM Mono, monospace",
                        fontSize: "11px",
                    },
                },
            },
            yaxis: {
                show: false,
            },
            grid: {
                borderColor:
                    theme === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.08)",
                strokeDashArray: 4,
                padding: { left: 0, right: 8, top: 0, bottom: -10 },
            },
            legend: {
                show: true,
                position: "bottom",
                horizontalAlign: "left",
                fontSize: "13px",
                labels: {
                    colors: theme === "dark" ? "#CFCFD0" : "#373232",
                },
                markers: {
                    size: 9,
                    shape: "square",
                },
            },
            tooltip: {
                theme: theme === "dark" ? "dark" : "light",
            },
        }),
        [theme],
    );

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
        if (page === "bookings") {
            setBkSearch(value);
            setBkCurPage(1);
        } else {
            setSearch(value);
            setCurPage(1);
            if (page === "dashboard" && value.trim()) {
                setPage("shipments");
            }
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        const out = db.filter((s) => {
            if (statusFlt !== "all" && s.status !== statusFlt) return false;
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
    }, [db, search, sortCol, sortDir, statusFlt]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
    const pageRows = useMemo(
        () => filtered.slice((curPage - 1) * PER, curPage * PER),
        [filtered, curPage],
    );
    const detail = useMemo(
        () => db.find((x) => x.id === detailId) ?? null,
        [db, detailId],
    );

    const bkFiltered = useMemo(() => {
        const q = bkSearch.toLowerCase().trim();
        return bookings.filter((b) => {
            if (bkStatusFlt !== "all" && b.status !== bkStatusFlt) return false;
            if (bkUrgencyFlt !== "all" && b.urgency !== bkUrgencyFlt)
                return false;
            if (bkModeFlt !== "all" && b.mode !== bkModeFlt) return false;
            if (
                q &&
                !`${b.id} ${b.customer} ${b.origin} ${b.destination} ${b.type}`
                    .toLowerCase()
                    .includes(q)
            )
                return false;
            return true;
        });
    }, [bookings, bkModeFlt, bkSearch, bkStatusFlt, bkUrgencyFlt]);

    const bkTotalPages = Math.max(1, Math.ceil(bkFiltered.length / BK_PER));
    const bkPageRows = useMemo(
        () => bkFiltered.slice((bkCurPage - 1) * BK_PER, bkCurPage * BK_PER),
        [bkCurPage, bkFiltered],
    );
    const bkDetail = useMemo(
        () => bookings.find((x) => x.id === bkSelectedId) ?? null,
        [bookings, bkSelectedId],
    );

    useEffect(() => {
        if (curPage > totalPages) setCurPage(totalPages);
    }, [curPage, totalPages]);

    useEffect(() => {
        if (bkCurPage > bkTotalPages) setBkCurPage(bkTotalPages);
    }, [bkCurPage, bkTotalPages]);

    useEffect(() => {
        if (page !== "shipments") setDetailId(null);
        if (page !== "bookings") setBkSelectedId(null);
    }, [page]);

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

    const bkKpi = useMemo(() => {
        const out = {
            total: bookings.length,
            new: 0,
            reviewing: 0,
            approved: 0,
            converted: 0,
            rejected: 0,
        };
        bookings.forEach((b) => {
            out[b.status] += 1;
        });
        return out;
    }, [bookings]);

    const bookingBadgeCount = bkKpi.new + bkKpi.reviewing;

    const openConfirm = (title: string, msg: string, action: () => void) => {
        setConfirmTitle(title);
        setConfirmMsg(msg);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const onSidebarNavHover = (e: React.MouseEvent<HTMLElement>) => {
        if (!sidebarCollapsed) return;
        const target = e.target as HTMLElement;
        const navItem = target.closest(".nav-item") as HTMLElement | null;
        if (!navItem) {
            setNavTip((p) => ({ ...p, show: false }));
            return;
        }
        const text = navItem.getAttribute("data-tip") || "";
        if (!text) {
            setNavTip((p) => ({ ...p, show: false }));
            return;
        }
        const rect = navItem.getBoundingClientRect();
        setNavTip({
            text,
            x: rect.right + 10,
            y: rect.top + rect.height / 2,
            show: true,
        });
    };

    const onSidebarNavLeave = () => {
        setNavTip((p) => ({ ...p, show: false }));
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

    const bkToggleRow = (id: string) => {
        setBkSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const bkToggleAllOnPage = (checked: boolean) => {
        setBkSelected((prev) => {
            const next = new Set(prev);
            bkPageRows.forEach((row) => {
                if (checked) next.add(row.id);
                else next.delete(row.id);
            });
            return next;
        });
    };

    const bkUpdateStatus = (id: string, status: BookingStatus) => {
        setBookings((prev) =>
            prev.map((x) =>
                x.id === id
                    ? {
                          ...x,
                          status,
                          assignedTo:
                              status === "reviewing" || status === "approved"
                                  ? (x.assignedTo ?? "Amir K.")
                                  : x.assignedTo,
                      }
                    : x,
            ),
        );
        pushToast(
            status === "approved" ? "Booking approved" : "Booking updated",
            "success",
        );
    };

    const openConvertModal = (id: string) => {
        const b = bookings.find((x) => x.id === id);
        if (!b) return;
        setConvertBookingId(id);
        setConvertForm({
            origin: b.origin,
            destination: b.destination,
            mode: b.mode,
            eta: "",
            customer: b.customer,
            weight: String(b.weight),
            type: b.type,
            containers: String(b.containers),
            contact: b.contact,
            email: b.email,
        });
        setConvertModalOpen(true);
    };

    const closeConvertModal = () => {
        setConvertModalOpen(false);
        setConvertBookingId(null);
    };

    const confirmConvert = () => {
        const b = bookings.find((x) => x.id === convertBookingId);
        if (!b) return;
        const eta = convertForm.eta
            ? convertForm.eta
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 10);
        const newShipId = `WEB-${String(Date.now()).slice(-5)}`;
        const newShipment: Shipment = {
            id: newShipId,
            customer: convertForm.customer || b.customer,
            mode: convertForm.mode || b.mode,
            origin: convertForm.origin || b.origin,
            originCountry: "Unknown",
            destination: convertForm.destination || b.destination,
            destCountry: "Unknown",
            weight: Number(convertForm.weight) || b.weight,
            volume: Math.max(
                1,
                Math.round((Number(convertForm.weight) || b.weight) / 700),
            ),
            status: "pending",
            eta,
            cost: 0,
            container: "TBD",
            notes: `Converted from booking ${b.id}`,
            created: new Date().toISOString().slice(0, 10),
        };
        setDb((prev) => [newShipment, ...prev]);
        setBookings((prev) =>
            prev.map((x) =>
                x.id === b.id
                    ? { ...x, status: "converted", convertedTo: newShipId }
                    : x,
            ),
        );
        setBkSelectedId(b.id);
        closeConvertModal();
        pushToast(`Shipment ${newShipId} created`, "success");
    };

    const bkSimulateIncoming = () => {
        const [origin, destination] =
            BK_ROUTES[Math.floor(Math.random() * BK_ROUTES.length)];
        const customer =
            BK_CUSTOMERS[Math.floor(Math.random() * BK_CUSTOMERS.length)];
        const nextNum = bookings.length + 2000;
        const newBk: Booking = {
            id: `BKG-${String(nextNum).padStart(5, "0")}`,
            customer,
            origin,
            destination,
            mode: ["Sea", "Air", "Road", "Rail"][
                Math.floor(Math.random() * 4)
            ] as Mode,
            type: BK_TYPES[Math.floor(Math.random() * BK_TYPES.length)],
            weight: 300 + Math.floor(Math.random() * 7000),
            containers: 1 + Math.floor(Math.random() * 4),
            urgency: ["high", "medium", "low"][
                Math.floor(Math.random() * 3)
            ] as BookingUrgency,
            status: "new",
            received: new Date().toISOString(),
            contact: "Web Portal User",
            email: "booking@website.com",
            phone: "+1 555 0000",
            message: BK_NOTES[Math.floor(Math.random() * BK_NOTES.length)],
            convertedTo: null,
            assignedTo: null,
            notes: "",
        };
        setBookings((prev) => [newBk, ...prev]);
        pushToast(`New booking request from ${newBk.customer}`, "info");
    };

    const bkExportCsv = () => {
        const header =
            "id,customer,origin,destination,mode,type,weight,urgency,status,received";
        const rows = bkFiltered.map(
            (b) =>
                `${b.id},${b.customer},${b.origin},${b.destination},${b.mode},${b.type},${b.weight},${b.urgency},${b.status},${b.received}`,
        );
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bookings.csv";
        a.click();
        URL.revokeObjectURL(url);
        pushToast("Exported bookings CSV", "success");
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
                        <span className="logo-text">RTEXPRESS</span>
                    </div>
                    <nav
                        className="sidebar-nav"
                        onMouseOver={onSidebarNavHover}
                        onMouseMove={onSidebarNavHover}
                        onMouseLeave={onSidebarNavLeave}
                    >
                        <div className="nav-section-label">Operations</div>
                        <button
                            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
                            onClick={() => setPage("dashboard")}
                            data-tip="Dashboard"
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
                            data-tip="Shipments"
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
                            className={`nav-item ${page === "bookings" ? "active" : ""}`}
                            onClick={() => setPage("bookings")}
                            data-tip="Bookings"
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
                                    y="3"
                                    width="14"
                                    height="13"
                                    rx="1.5"
                                />
                                <path d="M2 7h14" />
                                <path d="M6 1v4M12 1v4" />
                                <path d="M6 11h2M10 11h2M6 14h2" />
                            </svg>
                            <span className="nav-label">Bookings</span>
                            <span
                                className="nav-badge"
                                style={{
                                    background: "var(--amber)",
                                    display:
                                        bookingBadgeCount > 0
                                            ? "inline-flex"
                                            : "none",
                                }}
                            >
                                {bookingBadgeCount}
                            </span>
                        </button>
                        <button
                            className="nav-item"
                            onClick={() => setPage("dashboard")}
                            data-tip="Fleet"
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
                            data-tip="Routes"
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
                            data-tip="Warehouses"
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
                            data-tip="Customers"
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
                            data-tip="Billing"
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
                            data-tip="Reports"
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
                            data-tip="Settings"
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
                        <button
                            className="toggle-btn"
                            onClick={() => setSidebarCollapsed((p) => !p)}
                            aria-label="Toggle sidebar"
                        >
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="2"
                                    y="3"
                                    width="14"
                                    height="12"
                                    rx="1.8"
                                />
                                <path d="M8.2 3v12" />
                            </svg>
                        </button>
                        <span className="topbar-title">
                            {page === "dashboard"
                                ? "Dashboard"
                                : page === "bookings"
                                  ? "Bookings"
                                  : "Shipments"}
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
                                    value={
                                        page === "bookings" ? bkSearch : search
                                    }
                                    onChange={(e) =>
                                        onGlobalSearch(e.target.value)
                                    }
                                    placeholder={
                                        page === "bookings"
                                            ? "Search bookings..."
                                            : "Search cargo, routes..."
                                    }
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
                                <div className="stat-card">
                                    <div className="stat-top">
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background: "var(--blue-dim)",
                                                color: "var(--blue)",
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
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
                                                <circle
                                                    cx="4.5"
                                                    cy="14"
                                                    r="1.5"
                                                />
                                                <circle
                                                    cx="10.5"
                                                    cy="14"
                                                    r="1.5"
                                                />
                                                <circle
                                                    cx="15"
                                                    cy="14"
                                                    r="1.5"
                                                />
                                            </svg>
                                        </div>
                                        <span className="stat-change up">
                                            ↑ 8.4%
                                        </span>
                                    </div>
                                    <div className="stat-value">1,284</div>
                                    <div className="stat-label">
                                        Active Shipments
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: "72%" }}
                                        />
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-top">
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background: "var(--green-dim)",
                                                color: "var(--green)",
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <path d="M2 9l5 5 9-9" />
                                            </svg>
                                        </div>
                                        <span className="stat-change up">
                                            ↑ 2.1%
                                        </span>
                                    </div>
                                    <div
                                        className="stat-value"
                                        style={{ color: "var(--green)" }}
                                    >
                                        94.7%
                                    </div>
                                    <div className="stat-label">
                                        On-time Delivery
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: "94.7%",
                                                background: "var(--green)",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-top">
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background: "var(--amber-dim)",
                                                color: "var(--amber)",
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <circle cx="9" cy="9" r="7" />
                                                <path d="M9 5v4l2.5 2.5" />
                                            </svg>
                                        </div>
                                        <span className="stat-change down">
                                            ↓ 1.2%
                                        </span>
                                    </div>
                                    <div className="stat-value">38</div>
                                    <div className="stat-label">
                                        Pending Clearance
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: "38%",
                                                background: "var(--amber)",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-top">
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background: "var(--purple-dim)",
                                                color: "var(--purple)",
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <rect
                                                    x="2"
                                                    y="4"
                                                    width="14"
                                                    height="11"
                                                    rx="1.5"
                                                />
                                                <path d="M2 8h14M6 2v4M12 2v4" />
                                            </svg>
                                        </div>
                                        <span className="stat-change up">
                                            ↑ 12.8%
                                        </span>
                                    </div>
                                    <div className="stat-value">$2.4M</div>
                                    <div className="stat-label">
                                        Revenue This Month
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: "60%",
                                                background: "var(--purple)",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="two-col">
                                <div className="card cargo-volume-card">
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">
                                                Cargo Volume
                                            </div>
                                            <div className="card-subtitle">
                                                Shipments per week
                                            </div>
                                        </div>
                                        <div
                                            style={{ display: "flex", gap: 6 }}
                                        >
                                            <button
                                                className="btn"
                                                style={{
                                                    padding: "5px 10px",
                                                    fontSize: 12,
                                                }}
                                            >
                                                Weekly
                                            </button>
                                            <button
                                                className="btn"
                                                style={{
                                                    padding: "5px 10px",
                                                    fontSize: 12,
                                                    background:
                                                        "var(--blue-dim)",
                                                    borderColor:
                                                        "var(--blue-border)",
                                                    color: "var(--blue)",
                                                }}
                                            >
                                                Monthly
                                            </button>
                                        </div>
                                    </div>
                                    <div className="chart-wrap">
                                        <div className="apex-cargo">
                                            <ReactApexChart
                                                options={cargoOptions}
                                                series={cargoSeries}
                                                type="bar"
                                                height="100%"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="card">
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">
                                                Active Routes
                                            </div>
                                            <div className="card-subtitle">
                                                Live corridors
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11.5,
                                                color: "var(--blue)",
                                                cursor: "pointer",
                                                fontWeight: 500,
                                            }}
                                            onClick={() => setPage("shipments")}
                                        >
                                            View all →
                                        </span>
                                    </div>
                                    <div className="route-list">
                                        <div className="route-item">
                                            <div
                                                className="route-dot"
                                                style={{
                                                    background: "var(--green)",
                                                }}
                                            />
                                            <div className="route-info">
                                                <div className="route-name">
                                                    Shanghai → Rotterdam
                                                </div>
                                                <div className="route-meta">
                                                    Sea freight · 28 days avg
                                                </div>
                                            </div>
                                            <span className="route-count">
                                                142
                                            </span>
                                        </div>
                                        <div className="route-item">
                                            <div
                                                className="route-dot"
                                                style={{
                                                    background: "var(--blue)",
                                                }}
                                            />
                                            <div className="route-info">
                                                <div className="route-name">
                                                    Dubai → New York
                                                </div>
                                                <div className="route-meta">
                                                    Air + sea · 7 days avg
                                                </div>
                                            </div>
                                            <span className="route-count">
                                                89
                                            </span>
                                        </div>
                                        <div className="route-item">
                                            <div
                                                className="route-dot"
                                                style={{
                                                    background: "var(--amber)",
                                                }}
                                            />
                                            <div className="route-info">
                                                <div className="route-name">
                                                    Singapore → Los Angeles
                                                </div>
                                                <div className="route-meta">
                                                    Sea freight · 22 days avg
                                                </div>
                                            </div>
                                            <span className="route-count">
                                                61
                                            </span>
                                        </div>
                                        <div className="route-item">
                                            <div
                                                className="route-dot"
                                                style={{
                                                    background: "var(--purple)",
                                                }}
                                            />
                                            <div className="route-info">
                                                <div className="route-name">
                                                    Frankfurt → Chicago
                                                </div>
                                                <div className="route-meta">
                                                    Air freight · 2 days avg
                                                </div>
                                            </div>
                                            <span className="route-count">
                                                47
                                            </span>
                                        </div>
                                        <div className="route-item">
                                            <div
                                                className="route-dot"
                                                style={{
                                                    background: "var(--green)",
                                                }}
                                            />
                                            <div className="route-info">
                                                <div className="route-name">
                                                    Dar es Salaam → Mumbai
                                                </div>
                                                <div className="route-meta">
                                                    Sea freight · 18 days avg
                                                </div>
                                            </div>
                                            <span className="route-count">
                                                33
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="three-col">
                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Fleet Status
                                        </div>
                                    </div>
                                    <div className="mini-stat-row">
                                        <div className="mini-stat">
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--green-dim)",
                                                    color: "var(--green)",
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
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
                                                    <circle
                                                        cx="4.5"
                                                        cy="14"
                                                        r="1.5"
                                                    />
                                                    <circle
                                                        cx="10.5"
                                                        cy="14"
                                                        r="1.5"
                                                    />
                                                    <circle
                                                        cx="15"
                                                        cy="14"
                                                        r="1.5"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Trucks En Route
                                                </div>
                                                <div className="mini-stat-value">
                                                    48 / 64
                                                </div>
                                            </div>
                                            <div className="mini-stat-bar-wrap">
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "75%",
                                                            background:
                                                                "var(--green)",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mini-stat">
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--blue-dim)",
                                                    color: "var(--blue)",
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <path d="M9 2L2 6v10h14V6L9 2z" />
                                                    <path d="M6 16V10h6v6" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Container Ships
                                                </div>
                                                <div className="mini-stat-value">
                                                    7 / 12
                                                </div>
                                            </div>
                                            <div className="mini-stat-bar-wrap">
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{ width: "58%" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mini-stat">
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--amber-dim)",
                                                    color: "var(--amber)",
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <path d="M9 2l1.5 4.5H15l-3.75 2.75 1.5 4.5L9 11 5.25 13.75l1.5-4.5L3 6.5h4.5L9 2z" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Aircraft Cargo
                                                </div>
                                                <div className="mini-stat-value">
                                                    3 / 5
                                                </div>
                                            </div>
                                            <div className="mini-stat-bar-wrap">
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "60%",
                                                            background:
                                                                "var(--amber)",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mini-stat">
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--red-dim)",
                                                    color: "var(--red)",
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <circle
                                                        cx="9"
                                                        cy="9"
                                                        r="7"
                                                    />
                                                    <path d="M9 5v4M9 12.5v.5" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    In Maintenance
                                                </div>
                                                <div className="mini-stat-value">
                                                    6 vehicles
                                                </div>
                                            </div>
                                            <div className="mini-stat-bar-wrap">
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "12%",
                                                            background:
                                                                "var(--red)",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title">Alerts</div>
                                        <span
                                            className="badge delayed"
                                            style={{ fontSize: 11 }}
                                        >
                                            3 critical
                                        </span>
                                    </div>
                                    <div className="mini-stat-row">
                                        <div
                                            className="mini-stat"
                                            style={{ alignItems: "flex-start" }}
                                        >
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--red-dim)",
                                                    color: "var(--red)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <path d="M9 2L1.5 15h15L9 2z" />
                                                    <path d="M9 7v4M9 13.5v.5" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div
                                                    className="mini-stat-value"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    Port Congestion
                                                </div>
                                                <div className="mini-stat-label">
                                                    Rotterdam - 24h delay
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="mini-stat"
                                            style={{ alignItems: "flex-start" }}
                                        >
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--amber-dim)",
                                                    color: "var(--amber)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <circle
                                                        cx="9"
                                                        cy="9"
                                                        r="7"
                                                    />
                                                    <path d="M9 5v4M9 12.5v.5" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div
                                                    className="mini-stat-value"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    Customs Hold
                                                </div>
                                                <div className="mini-stat-label">
                                                    SHG-0091 awaiting docs
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="mini-stat"
                                            style={{ alignItems: "flex-start" }}
                                        >
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--red-dim)",
                                                    color: "var(--red)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <path d="M9 2L1.5 15h15L9 2z" />
                                                    <path d="M9 7v4M9 13.5v.5" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div
                                                    className="mini-stat-value"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    Temp Exceedance
                                                </div>
                                                <div className="mini-stat-label">
                                                    Cold chain SG-441 &gt;4C
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="mini-stat"
                                            style={{ alignItems: "flex-start" }}
                                        >
                                            <div
                                                className="mini-stat-icon"
                                                style={{
                                                    background:
                                                        "var(--blue-dim)",
                                                    color: "var(--blue)",
                                                    marginTop: 2,
                                                }}
                                            >
                                                <svg
                                                    viewBox="0 0 18 18"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <circle
                                                        cx="9"
                                                        cy="9"
                                                        r="7"
                                                    />
                                                    <path d="M9 6v3l2 2" />
                                                </svg>
                                            </div>
                                            <div className="mini-stat-body">
                                                <div
                                                    className="mini-stat-value"
                                                    style={{ fontSize: 13 }}
                                                >
                                                    Route Diversion
                                                </div>
                                                <div className="mini-stat-label">
                                                    TK-210 rerouted - weather
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-header">
                                        <div className="card-title">
                                            Warehouse Capacity
                                        </div>
                                    </div>
                                    <div className="mini-stat-row">
                                        <div className="mini-stat">
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Dubai Hub
                                                </div>
                                                <div className="mini-stat-value">
                                                    87%
                                                </div>
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "87%",
                                                            background:
                                                                "var(--red)",
                                                            height: 4,
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mini-stat">
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Singapore DHL
                                                </div>
                                                <div className="mini-stat-value">
                                                    62%
                                                </div>
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "62%",
                                                            height: 4,
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mini-stat">
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Rotterdam Port
                                                </div>
                                                <div className="mini-stat-value">
                                                    45%
                                                </div>
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "45%",
                                                            background:
                                                                "var(--green)",
                                                            height: 4,
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mini-stat">
                                            <div className="mini-stat-body">
                                                <div className="mini-stat-label">
                                                    Chicago O'Hare
                                                </div>
                                                <div className="mini-stat-value">
                                                    71%
                                                </div>
                                                <div className="mini-stat-bar">
                                                    <div
                                                        className="mini-stat-bar-fill"
                                                        style={{
                                                            width: "71%",
                                                            background:
                                                                "var(--amber)",
                                                            height: 4,
                                                            borderRadius: 2,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
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
                                                view.
                                                <br />
                                                Try adjusting search criteria.
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

                    <div
                        className={`page ${page === "bookings" ? "active" : ""}`}
                    >
                        <div className="content">
                            <div style={{ display: "flex", gap: 14 }}>
                                <div
                                    className="stat-card"
                                    style={{
                                        flex: 1,
                                        padding: "14px 18px",
                                        animation: "none",
                                    }}
                                >
                                    <div
                                        className="stat-top"
                                        style={{ marginBottom: 6 }}
                                    >
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background:
                                                    "var(--blue-dim)",
                                                color: "var(--blue)",
                                                width: 28,
                                                height: 28,
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <rect
                                                    x="2"
                                                    y="3"
                                                    width="14"
                                                    height="13"
                                                    rx="1.5"
                                                />
                                                <path d="M2 7h14" />
                                                <path d="M6 1v4M12 1v4" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div
                                        className="stat-value"
                                        style={{ fontSize: 22 }}
                                    >
                                        {bkKpi.total}
                                    </div>
                                    <div className="stat-label">
                                        Total Requests
                                    </div>
                                </div>
                                <div
                                    className="stat-card"
                                    style={{
                                        flex: 1,
                                        padding: "14px 18px",
                                        animation: "none",
                                    }}
                                >
                                    <div
                                        className="stat-top"
                                        style={{ marginBottom: 6 }}
                                    >
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background:
                                                    "var(--blue-dim)",
                                                color: "var(--blue)",
                                                width: 28,
                                                height: 28,
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <path d="M9 2l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div
                                        className="stat-value"
                                        style={{
                                            fontSize: 22,
                                            color: "var(--blue)",
                                        }}
                                    >
                                        {bkKpi.new}
                                    </div>
                                    <div className="stat-label">
                                        New / Unreviewed
                                    </div>
                                </div>
                                <div
                                    className="stat-card"
                                    style={{
                                        flex: 1,
                                        padding: "14px 18px",
                                        animation: "none",
                                    }}
                                >
                                    <div
                                        className="stat-top"
                                        style={{ marginBottom: 6 }}
                                    >
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background:
                                                    "var(--purple-dim)",
                                                color: "var(--purple)",
                                                width: 28,
                                                height: 28,
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <circle cx="9" cy="9" r="7" />
                                                <path d="M9 5v4l2.5 2.5" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div
                                        className="stat-value"
                                        style={{
                                            fontSize: 22,
                                            color: "var(--purple)",
                                        }}
                                    >
                                        {bkKpi.reviewing}
                                    </div>
                                    <div className="stat-label">Under Review</div>
                                </div>
                                <div
                                    className="stat-card"
                                    style={{
                                        flex: 1,
                                        padding: "14px 18px",
                                        animation: "none",
                                    }}
                                >
                                    <div
                                        className="stat-top"
                                        style={{ marginBottom: 6 }}
                                    >
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background:
                                                    "var(--green-dim)",
                                                color: "var(--green)",
                                                width: 28,
                                                height: 28,
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <path d="M2 9l5 5 9-9" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div
                                        className="stat-value"
                                        style={{
                                            fontSize: 22,
                                            color: "var(--green)",
                                        }}
                                    >
                                        {bkKpi.converted}
                                    </div>
                                    <div className="stat-label">Converted</div>
                                </div>
                                <div
                                    className="stat-card"
                                    style={{
                                        flex: 1,
                                        padding: "14px 18px",
                                        animation: "none",
                                    }}
                                >
                                    <div
                                        className="stat-top"
                                        style={{ marginBottom: 6 }}
                                    >
                                        <div
                                            className="stat-icon"
                                            style={{
                                                background: "var(--red-dim)",
                                                color: "var(--red)",
                                                width: 28,
                                                height: 28,
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 18 18"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <path d="M5 5l8 8M13 5l-8 8" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div
                                        className="stat-value"
                                        style={{
                                            fontSize: 22,
                                            color: "var(--red)",
                                        }}
                                    >
                                        {bkKpi.rejected}
                                    </div>
                                    <div className="stat-label">Rejected</div>
                                </div>
                            </div>

                            <div className="card" style={{ overflow: "visible" }}>
                                <div
                                    style={{
                                        padding: "12px 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div
                                        className="search-wrap"
                                        style={{
                                            flex: 1,
                                            maxWidth: 280,
                                            minWidth: 180,
                                        }}
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
                                            value={bkSearch}
                                            onChange={(e) => {
                                                setBkSearch(e.target.value);
                                                setBkCurPage(1);
                                            }}
                                            placeholder="Search ID, customer, route…"
                                            style={{ width: "100%" }}
                                        />
                                    </div>
                                    <div className="filter-tabs">
                                        {(
                                            [
                                                "all",
                                                "new",
                                                "reviewing",
                                                "approved",
                                                "converted",
                                                "rejected",
                                            ] as const
                                        ).map((s) => (
                                            <button
                                                key={s}
                                                className={`filter-tab ${bkStatusFlt === s ? "active" : ""}`}
                                                onClick={() => {
                                                    setBkStatusFlt(s);
                                                    setBkCurPage(1);
                                                }}
                                            >
                                                {s === "all"
                                                    ? "All"
                                                    : bookingStatusLabel(s)}
                                            </button>
                                        ))}
                                    </div>
                                    <select
                                        className="sh-select"
                                        value={bkUrgencyFlt}
                                        onChange={(e) => {
                                            setBkUrgencyFlt(
                                                e.target.value as
                                                    | "all"
                                                    | BookingUrgency,
                                            );
                                            setBkCurPage(1);
                                        }}
                                    >
                                        <option value="all">All Urgency</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                    <select
                                        className="sh-select"
                                        value={bkModeFlt}
                                        onChange={(e) => {
                                            setBkModeFlt(
                                                e.target.value as "all" | Mode,
                                            );
                                            setBkCurPage(1);
                                        }}
                                    >
                                        <option value="all">All Modes</option>
                                        <option value="Sea">Sea</option>
                                        <option value="Air">Air</option>
                                        <option value="Road">Road</option>
                                        <option value="Rail">Rail</option>
                                    </select>
                                    <div
                                        style={{
                                            marginLeft: "auto",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                                        <div className="view-toggle">
                                            <button
                                                className={`view-btn ${bkView === "grid" ? "active" : ""}`}
                                                onClick={() => setBkView("grid")}
                                                title="Grid view"
                                            >
                                                <svg
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <rect
                                                        x="1"
                                                        y="1"
                                                        width="5"
                                                        height="5"
                                                        rx="1"
                                                    />
                                                    <rect
                                                        x="8"
                                                        y="1"
                                                        width="5"
                                                        height="5"
                                                        rx="1"
                                                    />
                                                    <rect
                                                        x="1"
                                                        y="8"
                                                        width="5"
                                                        height="5"
                                                        rx="1"
                                                    />
                                                    <rect
                                                        x="8"
                                                        y="8"
                                                        width="5"
                                                        height="5"
                                                        rx="1"
                                                    />
                                                </svg>
                                            </button>
                                            <button
                                                className={`view-btn ${bkView === "list" ? "active" : ""}`}
                                                onClick={() => setBkView("list")}
                                                title="List view"
                                            >
                                                <svg
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.7"
                                                    strokeLinecap="round"
                                                >
                                                    <path d="M1 3h12M1 7h12M1 11h12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <button
                                            className="btn"
                                            onClick={bkSimulateIncoming}
                                            style={{
                                                color: "var(--amber)",
                                                borderColor:
                                                    "rgba(245,158,11,0.3)",
                                            }}
                                        >
                                            <svg
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                                style={{ width: 13, height: 13 }}
                                            >
                                                <path d="M7 10V2M4 5l3-3 3 3" />
                                                <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
                                            </svg>
                                            Simulate Incoming
                                        </button>
                                        <button className="btn" onClick={bkExportCsv}>
                                            <svg
                                                viewBox="0 0 14 14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                strokeLinecap="round"
                                            >
                                                <path d="M7 1v8M4 6l3 3 3-3" />
                                                <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
                                            </svg>
                                            Export
                                        </button>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        overflow: "hidden",
                                        minHeight: 460,
                                    }}
                                >
                                    {bkView === "grid" ? (
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div className="bk-grid-scroll">
                                                {bkPageRows.length === 0 ? (
                                                    <div className="empty-state">
                                                        <svg
                                                            viewBox="0 0 40 40"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.2"
                                                            strokeLinecap="round"
                                                        >
                                                            <rect
                                                                x="4"
                                                                y="8"
                                                                width="32"
                                                                height="28"
                                                                rx="3"
                                                            />
                                                            <path d="M13 4v8M27 4v8M4 18h32" />
                                                        </svg>
                                                        <p>
                                                            No bookings match
                                                            your filters
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="bk-grid-body">
                                                        {bkPageRows.map((b) => (
                                                            <div
                                                                key={b.id}
                                                                className={`bk-card ${bkSelectedId === b.id ? "selected" : ""}`}
                                                                onClick={() =>
                                                                    setBkSelectedId(
                                                                        b.id,
                                                                    )
                                                                }
                                                            >
                                                                <div className="bk-card-top">
                                                                    <span className="bk-card-id">
                                                                        {b.id}
                                                                    </span>
                                                                    <span className="bk-card-time">
                                                                        {bookingTimeAgo(
                                                                            b.received,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="bk-card-name">
                                                                    {b.customer}
                                                                </div>
                                                                <div className="bk-card-route">
                                                                    <span>
                                                                        {
                                                                            b.origin
                                                                        }
                                                                    </span>
                                                                    <svg
                                                                        viewBox="0 0 10 6"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.5"
                                                                        strokeLinecap="round"
                                                                        style={{
                                                                            width: 10,
                                                                            flexShrink: 0,
                                                                            color: "var(--text-3)",
                                                                        }}
                                                                    >
                                                                        <path d="M1 3h8M6 1l2 2-2 2" />
                                                                    </svg>
                                                                    <span>
                                                                        {
                                                                            b.destination
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        fontSize: 11.5,
                                                                        color: "var(--text-3)",
                                                                        marginTop: 6,
                                                                    }}
                                                                >
                                                                    {b.type} ·{" "}
                                                                    {b.weight.toLocaleString()}{" "}
                                                                    kg ·{" "}
                                                                    {
                                                                        b.containers
                                                                    }{" "}
                                                                    ctr
                                                                </div>
                                                                <div className="bk-card-footer">
                                                                    <span
                                                                        className={`badge ${b.status}`}
                                                                        style={{ fontSize: 11 }}
                                                                    >
                                                                        {bookingStatusLabel(
                                                                            b.status,
                                                                        )}
                                                                    </span>
                                                                    <div
                                                                        style={{
                                                                            display: "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 6,
                                                                            fontSize: 11,
                                                                            color: "var(--text-3)",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 4,
                                                                            }}
                                                                        >
                                                                            {bookingModeIcon(
                                                                                b.mode,
                                                                            )}
                                                                            {b.mode}
                                                                        </div>
                                                                        <div
                                                                            style={{
                                                                                width: 1,
                                                                                height: 10,
                                                                                background:
                                                                                    "var(--border)",
                                                                            }}
                                                                        />
                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: 4,
                                                                                color: urgencyColor(
                                                                                    b.urgency,
                                                                                ),
                                                                                textTransform:
                                                                                    "capitalize",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    width: 5,
                                                                                    height: 5,
                                                                                    borderRadius:
                                                                                        "50%",
                                                                                    background:
                                                                                        urgencyColor(
                                                                                            b.urgency,
                                                                                        ),
                                                                                    display:
                                                                                        "inline-block",
                                                                                }}
                                                                            />
                                                                            {b.urgency}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bk-pagination">
                                                <span>
                                                    {bkFiltered.length === 0
                                                        ? "No results"
                                                        : `Showing ${(bkCurPage - 1) * BK_PER + 1}-${Math.min(bkCurPage * BK_PER, bkFiltered.length)} of ${bkFiltered.length}`}
                                                </span>
                                                <div className="pag-btns">
                                                    <button
                                                        className="pag-btn"
                                                        disabled={
                                                            bkCurPage <= 1
                                                        }
                                                        onClick={() =>
                                                            setBkCurPage((p) =>
                                                                Math.max(
                                                                    1,
                                                                    p - 1,
                                                                ),
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
                                                            <path d="M7 2L3 6l4 4" />
                                                        </svg>
                                                    </button>
                                                    {pageRange(
                                                        bkCurPage,
                                                        bkTotalPages,
                                                    ).map((p, i) =>
                                                        typeof p ===
                                                        "number" ? (
                                                            <button
                                                                key={p}
                                                                className={`pag-btn ${p === bkCurPage ? "active" : ""}`}
                                                                onClick={() =>
                                                                    setBkCurPage(
                                                                        p,
                                                                    )
                                                                }
                                                            >
                                                                {p}
                                                            </button>
                                                        ) : (
                                                            <span
                                                                key={`bk-ellipsis-${i}`}
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    placeItems:
                                                                        "center",
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: "var(--text-3)",
                                                                }}
                                                            >
                                                                …
                                                            </span>
                                                        ),
                                                    )}
                                                    <button
                                                        className="pag-btn"
                                                        disabled={
                                                            bkCurPage >=
                                                            bkTotalPages
                                                        }
                                                        onClick={() =>
                                                            setBkCurPage((p) =>
                                                                Math.min(
                                                                    bkTotalPages,
                                                                    p + 1,
                                                                ),
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
                                                            <path d="M5 2l4 4-4 4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div className="bk-table-wrap">
                                                <table className="bk-table">
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
                                                                    className="sh-checkbox"
                                                                    checked={
                                                                        bkPageRows.length >
                                                                            0 &&
                                                                        bkPageRows.every(
                                                                            (
                                                                                r,
                                                                            ) =>
                                                                                bkSelected.has(
                                                                                    r.id,
                                                                                ),
                                                                        )
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        bkToggleAllOnPage(
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                />
                                                            </th>
                                                            <th>Booking ID</th>
                                                            <th>Customer</th>
                                                            <th>Route</th>
                                                            <th>Mode</th>
                                                            <th>Cargo</th>
                                                            <th>Weight</th>
                                                            <th>Urgency</th>
                                                            <th>Received</th>
                                                            <th>Status</th>
                                                            <th />
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bkPageRows.map((b) => (
                                                            <tr
                                                                key={b.id}
                                                                className={
                                                                    bkSelectedId ===
                                                                    b.id
                                                                        ? "bk-selected-row"
                                                                        : ""
                                                                }
                                                                onClick={() =>
                                                                    setBkSelectedId(
                                                                        b.id,
                                                                    )
                                                                }
                                                            >
                                                                <td
                                                                    style={{
                                                                        paddingLeft: 16,
                                                                    }}
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sh-checkbox"
                                                                        checked={bkSelected.has(
                                                                            b.id,
                                                                        )}
                                                                        onChange={() =>
                                                                            bkToggleRow(
                                                                                b.id,
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="mono">
                                                                    {b.id}
                                                                </td>
                                                                <td>
                                                                    {b.customer}
                                                                    <div className="text-muted">
                                                                        {b.email}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {b.origin}{" "}
                                                                    -&gt;{" "}
                                                                    {
                                                                        b.destination
                                                                    }
                                                                </td>
                                                                <td>
                                                                    {bookingModeIcon(
                                                                        b.mode,
                                                                    )}{" "}
                                                                    {b.mode}
                                                                </td>
                                                                <td>
                                                                    {b.type}
                                                                </td>
                                                                <td>
                                                                    {b.weight.toLocaleString()}{" "}
                                                                    kg
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        textTransform:
                                                                            "capitalize",
                                                                    }}
                                                                >
                                                                    <span
                                                                        className="bk-urgency"
                                                                        style={{
                                                                            display:
                                                                                "inline-block",
                                                                            marginRight: 6,
                                                                            width: 7,
                                                                            height: 7,
                                                                            background:
                                                                                urgencyColor(
                                                                                    b.urgency,
                                                                                ),
                                                                        }}
                                                                    />
                                                                    {b.urgency}
                                                                </td>
                                                                <td>
                                                                    {fmtDate(
                                                                        b.received,
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <span
                                                                        className={`badge ${b.status}`}
                                                                    >
                                                                        {bookingStatusLabel(
                                                                            b.status,
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        style={{
                                                                            background:
                                                                                "none",
                                                                            border:
                                                                                "none",
                                                                            cursor:
                                                                                "pointer",
                                                                            color: "var(--text-3)",
                                                                            padding: 4,
                                                                            borderRadius: 5,
                                                                            display:
                                                                                "grid",
                                                                            placeItems:
                                                                                "center",
                                                                        }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setBkSelectedId(
                                                                                b.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            viewBox="0 0 14 14"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="1.7"
                                                                            strokeLinecap="round"
                                                                            style={{
                                                                                width: 13,
                                                                                height: 13,
                                                                            }}
                                                                        >
                                                                            <path d="M5 2h7v7" />
                                                                            <path d="M12 2L2 12" />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="bk-pagination">
                                                <span>
                                                    {bkFiltered.length === 0
                                                        ? "No results"
                                                        : `Showing ${(bkCurPage - 1) * BK_PER + 1}-${Math.min(bkCurPage * BK_PER, bkFiltered.length)} of ${bkFiltered.length}`}
                                                </span>
                                                <div className="pag-btns">
                                                    <button
                                                        className="pag-btn"
                                                        disabled={
                                                            bkCurPage <= 1
                                                        }
                                                        onClick={() =>
                                                            setBkCurPage((p) =>
                                                                Math.max(
                                                                    1,
                                                                    p - 1,
                                                                ),
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
                                                            <path d="M7 2L3 6l4 4" />
                                                        </svg>
                                                    </button>
                                                    {pageRange(
                                                        bkCurPage,
                                                        bkTotalPages,
                                                    ).map((p, i) =>
                                                        typeof p ===
                                                        "number" ? (
                                                            <button
                                                                key={p}
                                                                className={`pag-btn ${p === bkCurPage ? "active" : ""}`}
                                                                onClick={() =>
                                                                    setBkCurPage(
                                                                        p,
                                                                    )
                                                                }
                                                            >
                                                                {p}
                                                            </button>
                                                        ) : (
                                                            <span
                                                                key={`bk-list-ellipsis-${i}`}
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    placeItems:
                                                                        "center",
                                                                    width: 30,
                                                                    height: 30,
                                                                    color: "var(--text-3)",
                                                                }}
                                                            >
                                                                …
                                                            </span>
                                                        ),
                                                    )}
                                                    <button
                                                        className="pag-btn"
                                                        disabled={
                                                            bkCurPage >=
                                                            bkTotalPages
                                                        }
                                                        onClick={() =>
                                                            setBkCurPage((p) =>
                                                                Math.min(
                                                                    bkTotalPages,
                                                                    p + 1,
                                                                ),
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
                                                            <path d="M5 2l4 4-4 4" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className={`bk-detail ${bkDetail ? "open" : ""}`}
                                    >
                                        {bkDetail && (
                                            <>
                                                <div className="dp-header">
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontSize: 15,
                                                                fontWeight: 600,
                                                                letterSpacing:
                                                                    "-0.02em",
                                                            }}
                                                        >
                                                            {bkDetail.id}
                                                        </div>
                                                        <div
                                                            style={{
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            <span
                                                                className={`badge ${bkDetail.status}`}
                                                            >
                                                                {bookingStatusLabel(
                                                                    bkDetail.status,
                                                                )}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    marginLeft: 6,
                                                                    display:
                                                                        "inline-flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 4,
                                                                    fontSize: 11.5,
                                                                    color: urgencyColor(
                                                                        bkDetail.urgency,
                                                                    ),
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        width: 6,
                                                                        height: 6,
                                                                        borderRadius:
                                                                            "50%",
                                                                        background:
                                                                            urgencyColor(
                                                                                bkDetail.urgency,
                                                                            ),
                                                                        display:
                                                                            "inline-block",
                                                                    }}
                                                                />
                                                                {
                                                                    bkDetail.urgency
                                                                }{" "}
                                                                urgency
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="dp-close"
                                                        onClick={() =>
                                                            setBkSelectedId(
                                                                null,
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
                                                            <path d="M1 1l10 10M11 1L1 11" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="bk-detail-scroll">
                                                    <div className="dp-body">
                                                        <div className="dp-section">
                                                            <div className="dp-section-title">
                                                                Requester
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Company
                                                                </span>
                                                                <span className="dp-val">
                                                                    {
                                                                        bkDetail.customer
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Contact
                                                                </span>
                                                                <span className="dp-val">
                                                                    {
                                                                        bkDetail.contact
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Email
                                                                </span>
                                                                <span
                                                                    className="dp-val"
                                                                    style={{
                                                                        color: "var(--blue)",
                                                                    }}
                                                                >
                                                                    {
                                                                        bkDetail.email
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Phone
                                                                </span>
                                                                <span className="dp-val">
                                                                    {
                                                                        bkDetail.phone
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Received
                                                                </span>
                                                                <span className="dp-val mono">
                                                                    {fmtDate(
                                                                        bkDetail.received,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {bkDetail.assignedTo && (
                                                                <div className="dp-row">
                                                                    <span className="dp-key">
                                                                        Assigned
                                                                        To
                                                                    </span>
                                                                    <span className="dp-val">
                                                                        {
                                                                            bkDetail.assignedTo
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="dp-section">
                                                            <div className="dp-section-title">
                                                                Shipment Request
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 8,
                                                                    marginBottom: 12,
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        flex: 1,
                                                                        background:
                                                                            "var(--bg-3)",
                                                                        borderRadius: 7,
                                                                        padding:
                                                                            "8px 12px",
                                                                        textAlign:
                                                                            "center",
                                                                    }}
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
                                                                            marginTop: 2,
                                                                        }}
                                                                    >
                                                                        {
                                                                            bkDetail.origin
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <svg
                                                                    viewBox="0 0 20 10"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                    style={{
                                                                        width: 28,
                                                                        flexShrink:
                                                                            0,
                                                                        color: "var(--text-3)",
                                                                    }}
                                                                >
                                                                    <path d="M2 5h16M14 2l4 3-4 3" />
                                                                </svg>
                                                                <div
                                                                    style={{
                                                                        flex: 1,
                                                                        background:
                                                                            "var(--bg-3)",
                                                                        borderRadius: 7,
                                                                        padding:
                                                                            "8px 12px",
                                                                        textAlign:
                                                                            "center",
                                                                    }}
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
                                                                            marginTop: 2,
                                                                        }}
                                                                    >
                                                                        {
                                                                            bkDetail.destination
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Mode
                                                                </span>
                                                                <span className="dp-val">
                                                                    {bookingModeIcon(
                                                                        bkDetail.mode,
                                                                    )}{" "}
                                                                    {
                                                                        bkDetail.mode
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Cargo Type
                                                                </span>
                                                                <span className="dp-val">
                                                                    {
                                                                        bkDetail.type
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Weight
                                                                </span>
                                                                <span className="dp-val">
                                                                    {bkDetail.weight.toLocaleString()}{" "}
                                                                    kg
                                                                </span>
                                                            </div>
                                                            <div className="dp-row">
                                                                <span className="dp-key">
                                                                    Containers
                                                                </span>
                                                                <span className="dp-val">
                                                                    {
                                                                        bkDetail.containers
                                                                    }
                                                                </span>
                                                            </div>
                                                            {bkDetail.message && (
                                                                <div
                                                                    style={{
                                                                        marginTop: 8,
                                                                        background:
                                                                            "var(--bg-3)",
                                                                        borderRadius: 7,
                                                                        padding:
                                                                            "10px 12px",
                                                                        fontSize: 12.5,
                                                                        color: "var(--text-2)",
                                                                        lineHeight: 1.5,
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            fontSize: 11,
                                                                            color: "var(--text-3)",
                                                                            marginBottom: 4,
                                                                            fontWeight: 600,
                                                                            textTransform:
                                                                                "uppercase",
                                                                            letterSpacing:
                                                                                ".06em",
                                                                        }}
                                                                    >
                                                                        Customer
                                                                        Note
                                                                    </div>
                                                                    {
                                                                        bkDetail.message
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                        {bkDetail.status ===
                                                            "converted" &&
                                                            bkDetail.convertedTo && (
                                                                <div className="dp-section">
                                                                    <div className="dp-section-title">
                                                                        Conversion
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            background:
                                                                                "var(--green-dim)",
                                                                            border: "1px solid rgba(34,197,94,0.2)",
                                                                            borderRadius: 8,
                                                                            padding:
                                                                                "12px 14px",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: 10,
                                                                        }}
                                                                    >
                                                                        <svg
                                                                            viewBox="0 0 18 18"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            strokeWidth="1.7"
                                                                            strokeLinecap="round"
                                                                            style={{
                                                                                width: 18,
                                                                                height: 18,
                                                                                color: "var(--green)",
                                                                                flexShrink: 0,
                                                                            }}
                                                                        >
                                                                            <path d="M2 9l5 5 9-9" />
                                                                        </svg>
                                                                        <div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 13,
                                                                                    fontWeight: 600,
                                                                                    color: "var(--green)",
                                                                                }}
                                                                            >
                                                                                Converted
                                                                                to
                                                                                Shipment
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize: 12,
                                                                                    color: "var(--text-3)",
                                                                                    marginTop: 2,
                                                                                }}
                                                                            >
                                                                                Shipment
                                                                                ID:{" "}
                                                                                <span
                                                                                    style={{
                                                                                        fontFamily:
                                                                                            "DM Mono, monospace",
                                                                                        color: "var(--blue)",
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        bkDetail.convertedTo
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        {bkDetail.status ===
                                                            "rejected" && (
                                                            <div className="dp-section">
                                                                <div
                                                                    style={{
                                                                        background:
                                                                            "var(--red-dim)",
                                                                        border: "1px solid rgba(239,68,68,0.2)",
                                                                        borderRadius: 8,
                                                                        padding:
                                                                            "12px 14px",
                                                                        display:
                                                                            "flex",
                                                                        alignItems:
                                                                            "center",
                                                                        gap: 10,
                                                                    }}
                                                                >
                                                                    <svg
                                                                        viewBox="0 0 18 18"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.7"
                                                                        strokeLinecap="round"
                                                                        style={{
                                                                            width: 18,
                                                                            height: 18,
                                                                            color: "var(--red)",
                                                                            flexShrink: 0,
                                                                        }}
                                                                    >
                                                                        <path d="M5 5l8 8M13 5l-8 8" />
                                                                    </svg>
                                                                    <div>
                                                                        <div
                                                                            style={{
                                                                                fontSize: 13,
                                                                                fontWeight: 600,
                                                                                color: "var(--red)",
                                                                            }}
                                                                        >
                                                                            Booking
                                                                            Rejected
                                                                        </div>
                                                                        <div
                                                                            style={{
                                                                                fontSize: 12,
                                                                                color: "var(--text-3)",
                                                                                marginTop: 2,
                                                                            }}
                                                                        >
                                                                            This
                                                                            booking
                                                                            request
                                                                            was
                                                                            declined.
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="dp-section">
                                                            <div
                                                                className="dp-section-title"
                                                                style={{
                                                                    marginBottom:
                                                                        8,
                                                                }}
                                                            >
                                                                Internal Notes
                                                            </div>
                                                            <textarea
                                                                style={{
                                                                    width: "100%",
                                                                    background:
                                                                        "var(--bg-3)",
                                                                    border: "1px solid var(--border-strong)",
                                                                    borderRadius: 7,
                                                                    padding:
                                                                        "8px 10px",
                                                                    fontFamily:
                                                                        "inherit",
                                                                    fontSize: 12.5,
                                                                    color: "var(--text-1)",
                                                                    outline:
                                                                        "none",
                                                                    resize: "vertical",
                                                                    minHeight: 64,
                                                                    lineHeight:
                                                                        1.5,
                                                                }}
                                                                placeholder="Add ops note…"
                                                                value={
                                                                    bkDetail.notes
                                                                }
                                                                onChange={(e) => {
                                                                    const val =
                                                                        e.target
                                                                            .value;
                                                                    setBookings(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev.map(
                                                                                (
                                                                                    x,
                                                                                ) =>
                                                                                    x.id ===
                                                                                    bkDetail.id
                                                                                        ? {
                                                                                              ...x,
                                                                                              notes: val,
                                                                                          }
                                                                                        : x,
                                                                            ),
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="dp-section">
                                                            <div className="dp-section-title">
                                                                Actions
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                {(bkDetail.status ===
                                                                    "new" ||
                                                                    bkDetail.status ===
                                                                        "reviewing" ||
                                                                    bkDetail.status ===
                                                                        "approved") && (
                                                                    <button
                                                                        className="btn primary"
                                                                        style={{
                                                                            justifyContent:
                                                                                "center",
                                                                            width: "100%",
                                                                        }}
                                                                        onClick={() =>
                                                                            openConvertModal(
                                                                                bkDetail.id,
                                                                            )
                                                                        }
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
                                                                            <path d="M7 1v12M1 7h12" />
                                                                        </svg>
                                                                        Convert
                                                                        to
                                                                        Shipment
                                                                    </button>
                                                                )}
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "grid",
                                                                        gridTemplateColumns:
                                                                            "1fr 1fr",
                                                                        gap: 8,
                                                                    }}
                                                                >
                                                                    {bkDetail.status !==
                                                                        "reviewing" &&
                                                                        bkDetail.status !==
                                                                            "converted" &&
                                                                        bkDetail.status !==
                                                                            "rejected" && (
                                                                            <button
                                                                                className="btn"
                                                                                style={{
                                                                                    justifyContent:
                                                                                        "center",
                                                                                }}
                                                                                onClick={() =>
                                                                                    bkUpdateStatus(
                                                                                        bkDetail.id,
                                                                                        "reviewing",
                                                                                    )
                                                                                }
                                                                            >
                                                                                Mark
                                                                                Reviewing
                                                                            </button>
                                                                        )}
                                                                    {bkDetail.status !==
                                                                        "approved" &&
                                                                        bkDetail.status !==
                                                                            "converted" &&
                                                                        bkDetail.status !==
                                                                            "rejected" && (
                                                                            <button
                                                                                className="btn"
                                                                                style={{
                                                                                    justifyContent:
                                                                                        "center",
                                                                                    color: "var(--green)",
                                                                                }}
                                                                                onClick={() =>
                                                                                    bkUpdateStatus(
                                                                                        bkDetail.id,
                                                                                        "approved",
                                                                                    )
                                                                                }
                                                                            >
                                                                                Approve
                                                                            </button>
                                                                        )}
                                                                    {bkDetail.status !==
                                                                        "rejected" &&
                                                                        bkDetail.status !==
                                                                            "converted" && (
                                                                            <button
                                                                                className="btn"
                                                                                style={{
                                                                                    justifyContent:
                                                                                        "center",
                                                                                    color: "var(--red)",
                                                                                }}
                                                                                onClick={() =>
                                                                                    bkUpdateStatus(
                                                                                        bkDetail.id,
                                                                                        "rejected",
                                                                                    )
                                                                                }
                                                                            >
                                                                                Reject
                                                                            </button>
                                                                        )}
                                                                </div>
                                                                {bkDetail.status ===
                                                                    "converted" &&
                                                                    bkDetail.convertedTo && (
                                                                        <button
                                                                            className="btn"
                                                                            style={{
                                                                                justifyContent:
                                                                                    "center",
                                                                                color: "var(--blue)",
                                                                            }}
                                                                            onClick={() => {
                                                                                setPage(
                                                                                    "shipments",
                                                                                );
                                                                                setSearch(
                                                                                    bkDetail.convertedTo ??
                                                                                        "",
                                                                                );
                                                                                setBkSelectedId(
                                                                                    null,
                                                                                );
                                                                            }}
                                                                        >
                                                                            View
                                                                            in
                                                                            Shipments
                                                                            →
                                                                        </button>
                                                                    )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
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

            <div
                className={`modal-overlay ${convertModalOpen ? "open" : ""}`}
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeConvertModal();
                }}
            >
                <div className="modal" style={{ width: 600 }}>
                    <div className="modal-header">
                        <div>
                            <span className="modal-title">
                                Convert Booking to Shipment
                            </span>
                            <div
                                style={{
                                    fontSize: 12,
                                    color: "var(--text-3)",
                                    marginTop: 2,
                                }}
                            >
                                Review and confirm details before creating the
                                shipment
                            </div>
                        </div>
                        <button className="dp-close" onClick={closeConvertModal}>
                            <svg
                                viewBox="0 0 13 13"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            >
                                <path d="M1 1l11 11M12 1L1 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div
                            style={{
                                background: "var(--blue-dim)",
                                border: "1px solid var(--blue-border)",
                                borderRadius: 9,
                                padding: "12px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            <svg
                                viewBox="0 0 18 18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                style={{
                                    width: 20,
                                    height: 20,
                                    color: "var(--blue)",
                                    flexShrink: 0,
                                }}
                            >
                                <rect x="2" y="3" width="14" height="13" rx="1.5" />
                                <path d="M2 7h14" />
                                <path d="M6 1v4M12 1v4" />
                            </svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "var(--blue)",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: ".06em",
                                    }}
                                >
                                    Source Booking
                                </div>
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        marginTop: 2,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "DM Mono, monospace",
                                            color: "var(--blue)",
                                        }}
                                    >
                                        {convertBookingId ?? "—"}
                                    </span>
                                    {" · "}
                                    <span>{convertForm.customer || "—"}</span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: "var(--text-3)",
                                        marginTop: 1,
                                    }}
                                >
                                    <span>
                                        {convertForm.origin || "—"} →{" "}
                                        {convertForm.destination || "—"}
                                    </span>
                                    {" · "}
                                    <span>
                                        {convertForm.weight
                                            ? `${Number(convertForm.weight).toLocaleString()} kg`
                                            : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="form-divider">Route</div>
                        <div className="form-row">
                            <FormInput
                                label="Origin"
                                value={convertForm.origin}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        origin: v,
                                    }))
                                }
                            />
                            <FormInput
                                label="Destination"
                                value={convertForm.destination}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        destination: v,
                                    }))
                                }
                            />
                            <FormSelect
                                label="Transport Mode"
                                value={convertForm.mode}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        mode: v as Mode,
                                    }))
                                }
                                options={["Sea", "Air", "Road", "Rail"]}
                            />
                            <FormInput
                                label="ETA"
                                type="date"
                                value={convertForm.eta}
                                onChange={(v) =>
                                    setConvertForm((p) => ({ ...p, eta: v }))
                                }
                            />
                        </div>
                        <div className="form-divider">Cargo</div>
                        <div className="form-row">
                            <FormInput
                                label="Customer"
                                value={convertForm.customer}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        customer: v,
                                    }))
                                }
                            />
                            <FormInput
                                label="Weight (kg)"
                                type="number"
                                value={convertForm.weight}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        weight: v,
                                    }))
                                }
                            />
                            <FormSelect
                                label="Cargo Type"
                                value={convertForm.type}
                                onChange={(v) =>
                                    setConvertForm((p) => ({ ...p, type: v }))
                                }
                                options={BK_TYPES}
                            />
                            <FormInput
                                label="Containers"
                                type="number"
                                value={convertForm.containers}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        containers: v,
                                    }))
                                }
                            />
                        </div>
                        <div className="form-divider">Contact</div>
                        <div className="form-row">
                            <FormInput
                                label="Contact Name"
                                value={convertForm.contact}
                                onChange={(v) =>
                                    setConvertForm((p) => ({
                                        ...p,
                                        contact: v,
                                    }))
                                }
                            />
                            <FormInput
                                label="Contact Email"
                                type="email"
                                value={convertForm.email}
                                onChange={(v) =>
                                    setConvertForm((p) => ({ ...p, email: v }))
                                }
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn" onClick={closeConvertModal}>
                            Cancel
                        </button>
                        <button className="btn primary" onClick={confirmConvert}>
                            <svg
                                viewBox="0 0 14 14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                style={{ width: 13, height: 13 }}
                            >
                                <path d="M7 1v12M1 7h12" />
                            </svg>
                            Create Shipment
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

            <div
                className={`floating-nav-tooltip ${navTip.show ? "show" : ""}`}
                style={{ left: navTip.x, top: navTip.y }}
            >
                {navTip.text}
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
