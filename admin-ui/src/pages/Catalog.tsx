import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Table from '../components/Table';
import { fetchTools, Tool } from '../lib/api';

export default function Catalog() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTools();
        setTools(data);
      } catch (err) {
        setError('Failed to load catalog');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading catalog…</div>;
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Tool Catalog</h2>
        <p className="mt-1 text-sm text-slate-500">Status, version, scopes, and data classification for each registered tool.</p>
      </div>
      <Table
        data={tools}
        empty={<span>No tools registered.</span>}
        columns={[
          {
            key: 'name',
            header: 'Tool',
            render: (tool) => (
              <Link to={`/tools/${tool.tool_id}`} className="font-medium text-primary hover:underline">
                {tool.name}
              </Link>
            ),
          },
          { key: 'owner', header: 'Owner' },
          { key: 'version', header: 'Version' },
          { key: 'status', header: 'Status' },
          {
            key: 'scopes',
            header: 'Scopes',
            render: (tool) => tool.scopes.join(', '),
          },
          { key: 'data_class', header: 'Data Class' },
          {
            key: 'signature_status',
            header: 'Signature',
            render: (tool) => tool.signature_status || 'unknown',
          },
        ]}
      />
    </div>
  );
}
