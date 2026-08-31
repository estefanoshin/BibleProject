#!/usr/bin/env node
// The `capacitor` bin wrapper refuses to start on Node < 22, but the CLI itself
// works on the Node version pinned in Taskfile.yml. Skip the wrapper and call
// the CLI entrypoint directly.
const cli = require.resolve('@capacitor/cli/dist/index', { paths: [process.cwd()] });

require(cli).run();
