import React from 'react';
import { Phone, AlertTriangle, ShieldCheck, HeartHandshake, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmergencyHotlinePage: React.FC = () => {
  const hotlines = [
    {
      title: 'Life-Safety & Emergency Services',
      number: '911',
      desc: 'Immediate life-threatening peril, structural collapse, swiftwater rescue, fire, or acute medical trauma.',
      color: 'border-rose-300 bg-rose-50/50',
    },
    {
      title: 'Disaster Community Relief & Shelters',
      number: '211',
      desc: 'Local emergency warming/cooling shelters, official food banks, municipal evacuation routes, and disaster aid.',
      color: 'border-blue-300 bg-blue-50/50',
    },
    {
      title: 'Disaster Distress Crisis Helpline',
      number: '1-800-985-5990 or 988',
      desc: '24/7, 365-day-a-year crisis counseling for people experiencing emotional distress related to natural or human-caused disasters.',
      color: 'border-teal-300 bg-teal-50/50',
    },
    {
      title: 'FEMA Regional Coordination',
      number: '1-800-621-FEMA (3362)',
      desc: 'Federal individual disaster assistance registrations, emergency housing grants, and federal disaster declarations.',
      color: 'border-purple-300 bg-purple-50/50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-rose-600">
          Emergency Protocols & Contacts
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          Crisis Directory & Action Guidelines
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          The Emergency Resource Sharing System provides community logistics coordination. For immediate life-safety emergencies, contact primary government emergency responders directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {hotlines.map((h, i) => (
          <div key={i} className={`p-5 rounded-lg border ${h.color} shadow-xs space-y-2`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">{h.title}</h3>
              <Phone className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">{h.number}</p>
            <p className="text-xs text-slate-600 leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900">Immediate Disaster Staging Checklist</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">1. Personal Safety First</span>
            <p className="text-slate-600 leading-relaxed">
              Evacuate high-hazard zones immediately. Do not attempt supply retrieval if transit routes are compromised.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">2. Verified Information</span>
            <p className="text-slate-600 leading-relaxed">
              Verify resource reservation approval before traveling to designated staging warehouses or community hubs.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">3. Volunteer Coordination</span>
            <p className="text-slate-600 leading-relaxed">
              Coordinate all physical supply deliveries through registered dispatch and verified NGO field workers.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-slate-500">Need immediate emergency supplies?</span>
          <Link
            to="/resources"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold"
          >
            Open Relief Supplies Catalog
          </Link>
        </div>
      </div>
    </div>
  );
};
