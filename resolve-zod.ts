
try {
    const path = await import.meta.resolve('zod/mini');
    console.log('Resolved path:', path);
    // dynamic import
    const z = await import('zod/mini');
    console.log('Exports:', Object.keys(z));
    if (z.boolean) {
        const b = z.boolean();
        console.log('boolean instance keys:', Object.keys(b));
        console.log('Has optional?', typeof b.optional === 'function');
    }
} catch (e) {
    console.error('Resolution failed:', e);
}
