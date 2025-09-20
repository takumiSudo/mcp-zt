import { useEffect, useState } from 'react';
import Table from '../components/Table';
import { AuditRecord, fetchAuditRecords } from '../lib/api';

export default function Audit() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAuditRecords();
        setRecords(data);
      } catch (err) {
        setError('Failed to load audit records');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading audit trail…</div>;
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Audit Trail</h2>
        <p className="mt-1 text-sm text-slate-500">Signed records stored in MinIO via the audit writer.</p>
      </div>
      <Table
        data={records}
        empty={<span>No audit records yet.</span>}
        columns={[
          {
            key: 'ts',
            header: 'Timestamp',
            render: (record) => new Date(record.ts).toLocaleString(),
          },
          { key: 'user', header: 'User' },
          {
            key: 'tool',
            header: 'Tool',
            render: (record) => `${record.tool.id} v${record.tool.ver ?? 'n/a'}`,
          },
          {
            key: 'policy',
            header: 'Scopes',
            render: (record) => record.policy.scopes.join(', '),
          },
          {
            key: 'dlp',
            header: 'DLP',
            render: (record) => `${record.dlp.action} (${record.dlp.count})`,
          },
          {
            key: 'latency_ms',
            header: 'Latency',
            render: (record) => `${record.latency_ms} ms`,
          },
        ]}
      />
    </div>
  );
}
