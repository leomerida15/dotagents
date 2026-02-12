/**
 * Test script: runs Bun built-in test runner for the src directory.
 */
export async function runTests(): Promise<void> {
    console.log('Running tests...');

    const proc = Bun.spawn(['bun', 'test', '--coverage', 'src'], {
        cwd: process.cwd(),
        stdout: 'inherit',
        stderr: 'inherit'
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        process.exit(exitCode);
    }

    console.log('Tests completed successfully');
}

const isMain = process.argv[1]?.endsWith('bunstart.test.ts') || process.argv[1]?.endsWith('bunstart.test.js');
if (isMain) {
    runTests().catch((e) => {
        console.error('Testing failed', e);
        process.exit(1);
    });
}
