export async function auditAsync(action: () => Promise<void>, label: string): Promise<void> {
    try {
        await action();
    } catch (err) {
        console.error(`[audit] ${label} failed:`, err);
    }
}