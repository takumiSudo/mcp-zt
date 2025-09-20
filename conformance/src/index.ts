#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { recordSession } from './record.js';
import { replaySession } from './replay.js';

const cli = yargs(hideBin(process.argv))
  .scriptName('mcpctl')
  .command(
    'record',
    'Record a golden session',
    (y) =>
      y
        .option('tool', { type: 'string', demandOption: true })
        .option('save', { type: 'string', demandOption: true })
        .option('gateway', { type: 'string', default: 'http://localhost:8080' })
        .option('inputs', { type: 'string', demandOption: true, describe: 'JSON payload' })
        .option('token', { type: 'string', default: process.env.MCP_TOKEN || '' }),
    async (argv) => {
      const inputs = JSON.parse(argv.inputs as string);
      await recordSession({
        tool: argv.tool as string,
        gateway: argv.gateway as string,
        inputs,
        outputPath: argv.save as string,
        token: argv.token as string,
      });
      console.log(`Recorded session saved to ${argv.save}`);
    }
  )
  .command(
    'replay <file>',
    'Replay a golden session file',
    (y) =>
      y
        .positional('file', { type: 'string', demandOption: true })
        .option('gateway', { type: 'string', default: 'http://localhost:8080' })
        .option('token', { type: 'string', default: process.env.MCP_TOKEN || '' })
        .option('budget.latencyMs', { type: 'number', describe: 'Override latency budget' }),
    async (argv) => {
      const result = await replaySession({
        file: argv.file as string,
        gateway: argv.gateway as string,
        token: argv.token as string,
      });
      const budget = (argv['budget.latencyMs'] as number | undefined) ?? undefined;
      const latencyOk = budget ? result.latency <= budget : true;
      if (result.success && latencyOk) {
        console.log(`✅ replay ok in ${result.latency}ms`);
        process.exit(0);
      }
      if (!latencyOk) {
        console.error(`Latency budget exceeded: ${result.latency}ms > ${budget}ms`);
      }
      if (result.missingKeys.length) {
        console.error(`Missing keys: ${result.missingKeys.join(', ')}`);
      }
      if (!result.schemaOk) {
        console.error('Schema expectation failed (non-200 response)');
      }
      process.exit(1);
    }
  )
  .demandCommand(1)
  .help();

cli.parse();
