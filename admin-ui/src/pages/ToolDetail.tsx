import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Table from '../components/Table';
import { fetchGatewayEvents, fetchTool, GatewayEvent, Grant, PolicyProfile, Tool } from '../lib/api';

interface ToolBundle {
  tool: Tool;
  grants: Grant[];
  policy_profile?: PolicyProfile | null;
}

export default function ToolDetail() {
  const { toolId } = useParams<{ toolId: string }>();
  const [bundle, setBundle] = useState<ToolBundle | null>(null);
  const [events, setEvents] = useState<GatewayEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) return;
    (async () => {
      try {
        const data = await fetchTool(toolId);
        setBundle(data);
      } catch (err) {
        setError('Unable to load tool');
      }
      try {
        const ev = await fetchGatewayEvents(toolId);
        setEvents(ev);
      } catch (err) {
        // ignore
      }
    })();
  }, [toolId]);

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  if (!bundle) {
    return <div className="text-sm text-slate-500">Loading tool…</div>;
  }

  const { tool, grants, policy_profile } = bundle;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">{tool.name}</h2>
        <p className="mt-2 text-sm text-slate-600">Owner: {tool.owner}</p>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Endpoint</dt>
            <dd className="mt-1 font-mono text-xs text-slate-700">{tool.endpoint}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Version</dt>
            <dd className="mt-1 text-slate-700">{tool.version}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Status</dt>
            <dd className={`mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs ${tool.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {tool.status}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Scopes</dt>
            <dd className="mt-1 text-slate-700">{tool.scopes.join(', ')}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Data class</dt>
            <dd className="mt-1 text-slate-700">{tool.data_class}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">SBOM</dt>
            <dd className="mt-1">
              {tool.sbom_url ? (
                <a href={tool.sbom_url} target="_blank" rel="noreferrer" className="text-primary underline">
                  View SBOM
                </a>
              ) : (
                <span className="text-slate-500">Not provided</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Grants</h3>
        <Table
          data={grants}
          empty={<span>No grants defined.</span>}
          columns={[
            { key: 'group', header: 'Group' },
            { key: 'env', header: 'Environment' },
            { key: 'scopes', header: 'Scopes', render: (grant) => grant.scopes.join(', ') },
            {
              key: 'expires_at',
              header: 'Expires',
              render: (grant) => (grant.expires_at ? new Date(grant.expires_at).toLocaleString() : 'none'),
            },
          ]}
        />
      </section>

      {policy_profile && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Policy Profile</h3>
          <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">DLP Profile</dt>
              <dd className="mt-1 text-slate-700">{policy_profile.dlp_profile}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Rate limit</dt>
              <dd className="mt-1 text-slate-700">{policy_profile.rate_limit} req/min</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-500">Egress allow-list</dt>
              <dd className="mt-1 text-slate-700">{policy_profile.egress_allowlist.join(', ')}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Recent Gateway Events</h3>
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">No recent errors.</div>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.ts} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-mono text-slate-500">{new Date(event.ts).toLocaleString()}</div>
                <div className="text-sm font-semibold text-red-600">{event.code}</div>
                <p className="mt-1 text-sm text-slate-700">{event.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
