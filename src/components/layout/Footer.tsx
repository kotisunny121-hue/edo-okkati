import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Phone, AlertTriangle, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B132B] text-slate-400 border-t border-slate-800 text-xs">
      {/* Emergency Disclaimer Banner */}
      <div className="bg-rose-950/40 border-b border-rose-900/40 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-white">Emergency Notice:</span>
            <span>
              This system coordinates community supply logistics. For active life-safety emergencies, call 911 immediately.
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-medium">
            <span>Threat: <strong className="text-white">911</strong></span>
            <span>Relief: <strong className="text-white">211</strong></span>
            <span>Distress: <strong className="text-white">988</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-orange-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white tracking-tight">CrisisRelief Network</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              MERN-based emergency resource sharing and disaster staging coordination system. Connecting providers, seekers, verified NGOs, and volunteer dispatch.
            </p>
          </div>

          {/* Quick Access */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/resources" className="hover:text-white transition-colors">
                  Relief Supplies Catalog
                </Link>
              </li>
              <li>
                <Link to="/hotlines" className="hover:text-white transition-colors">
                  Hotline Numbers & Guidelines
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Secure Portal Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Register as Provider or NGO
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational Protocols */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Operational Roles
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Individual Resource Providers</li>
              <li>Emergency Resource Seekers</li>
              <li>Accredited Relief NGOs</li>
              <li>Volunteer Field Coordinators</li>
              <li>Regional Relief Administrators</li>
            </ul>
          </div>

          {/* Verification & Standards */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">
              Integrity & Standards
            </h4>
            <p className="text-slate-400 leading-relaxed mb-3">
              All organization claims require administrative verification. Real inventory locks prevent double-allocation during crisis operations.
            </p>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
              <span>MongoDB Atlas / Embedded</span>
              <span>•</span>
              <span>Express RBAC</span>
              <span>•</span>
              <span>Leaflet GIS</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} CrisisRelief Emergency Resource Sharing Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/hotlines" className="hover:text-slate-400">Crisis Guidance</Link>
            <Link to="/resources" className="hover:text-slate-400">Inventory Map</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
