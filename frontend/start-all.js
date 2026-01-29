#!/usr/bin/env node

/**
 * Start All Frontend Servers
 *
 * This script starts both the customer portal and monitoring dashboard
 * on different ports simultaneously.
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
};

// Server configurations
const servers = [
    {
        name: 'Customer Portal',
        dir: 'customer-ui',
        port: 3000,
        color: colors.cyan,
        icon: '🛒',
    },
    {
        name: 'Monitoring Dashboard',
        dir: 'dashboard',
        port: 3001,
        color: colors.magenta,
        icon: '📊',
    },
];

// Print header
console.log('\n' + colors.bright + colors.blue + '═'.repeat(60) + colors.reset);
console.log(colors.bright + colors.blue + '  Valerix Frontend Launcher' + colors.reset);
console.log(colors.bright + colors.blue + '═'.repeat(60) + colors.reset + '\n');

// Track running processes
const processes = [];

// Function to start a server
function startServer(config) {
    return new Promise((resolve, reject) => {
        console.log(
            `${config.color}${config.icon}  Starting ${config.name}...${colors.reset}`
        );

        const serverPath = path.join(__dirname, config.dir);

        // Try different server commands in order of preference
        const commands = [
            // Node http-server (most common)
            {
                cmd: 'npx',
                args: ['http-server', serverPath, '-p', config.port, '-c-1', '--cors', '-o'],
            },
            // Python 3
            {
                cmd: 'python3',
                args: ['-m', 'http.server', config.port],
                cwd: serverPath,
            },
            // Python 2
            {
                cmd: 'python',
                args: ['-m', 'SimpleHTTPServer', config.port],
                cwd: serverPath,
            },
        ];

        let currentAttempt = 0;

        function tryNextCommand() {
            if (currentAttempt >= commands.length) {
                reject(new Error(`Failed to start ${config.name} with any available server`));
                return;
            }

            const command = commands[currentAttempt];
            const serverProcess = spawn(command.cmd, command.args, {
                cwd: command.cwd || process.cwd(),
                shell: true,
            });

            let started = false;

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();

                if (!started) {
                    started = true;
                    console.log(
                        `${config.color}${colors.bright}✓ ${config.name} running at:${colors.reset}`,
                        `${colors.bright}http://localhost:${config.port}${colors.reset}`
                    );
                    resolve(serverProcess);
                }

                // Log server output with prefix
                const lines = output.trim().split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        console.log(`${config.color}[${config.name}]${colors.reset} ${line}`);
                    }
                });
            });

            serverProcess.stderr.on('data', (data) => {
                const error = data.toString();

                // Check if it's a "command not found" or "port in use" error
                if (error.includes('not found') || error.includes('command not found')) {
                    currentAttempt++;
                    serverProcess.kill();
                    tryNextCommand();
                } else if (!started) {
                    // Some servers output normal info to stderr
                    const lines = error.trim().split('\n');
                    lines.forEach(line => {
                        if (line.trim()) {
                            console.log(`${config.color}[${config.name}]${colors.reset} ${line}`);
                        }
                    });
                }
            });

            serverProcess.on('error', (error) => {
                if (!started) {
                    currentAttempt++;
                    tryNextCommand();
                }
            });

            serverProcess.on('close', (code) => {
                if (!started && code !== 0) {
                    currentAttempt++;
                    tryNextCommand();
                }
            });

            processes.push(serverProcess);

            // Timeout if server doesn't start in 5 seconds
            setTimeout(() => {
                if (!started) {
                    started = true; // Assume it started
                    console.log(
                        `${config.color}${colors.bright}✓ ${config.name} should be running at:${colors.reset}`,
                        `${colors.bright}http://localhost:${config.port}${colors.reset}`
                    );
                    resolve(serverProcess);
                }
            }, 5000);
        }

        tryNextCommand();
    });
}

// Start all servers
async function startAll() {
    try {
        // Start servers in parallel
        await Promise.all(servers.map(config => startServer(config)));

        console.log('\n' + colors.bright + colors.green + '═'.repeat(60) + colors.reset);
        console.log(colors.bright + colors.green + '  All servers started successfully!' + colors.reset);
        console.log(colors.bright + colors.green + '═'.repeat(60) + colors.reset + '\n');

        console.log(colors.bright + 'Available URLs:' + colors.reset);
        servers.forEach(config => {
            console.log(
                `  ${config.icon}  ${config.name}: ${colors.bright}${config.color}http://localhost:${config.port}${colors.reset}`
            );
        });

        console.log('\n' + colors.yellow + 'Press Ctrl+C to stop all servers' + colors.reset + '\n');

    } catch (error) {
        console.error(colors.red + '✗ Error starting servers:' + colors.reset, error.message);
        process.exit(1);
    }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n\n' + colors.yellow + 'Shutting down servers...' + colors.reset);

    processes.forEach(proc => {
        try {
            proc.kill();
        } catch (err) {
            // Ignore errors during shutdown
        }
    });

    console.log(colors.green + '✓ All servers stopped' + colors.reset + '\n');
    process.exit(0);
});

// Start everything
startAll();
