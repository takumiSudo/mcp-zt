import express from 'express';

const app = express();
app.use(express.json());

app.post('/mcp/payroll-recon', (req, res) => {
  const { period, accountIds = [] } = req.body || {};
  res.json({
    summary: `Reconciled ${accountIds.length} accounts for ${period}`,
    discrepancies: []
  });
});

app.post('/mcp/sandbox-echo', (req, res) => {
  res.json({ ok: true, input: req.body });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`hello MCP server listening on port ${port}`);
});
