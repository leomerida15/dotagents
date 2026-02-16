import { describe, it, expect } from 'bun:test';
import { SyncManifest } from '../../domain/entities/SyncManifest';

describe('SyncManifest - createEmpty', () => {
    it('debe crear un manifest vacío con agents como objeto vacío', () => {
        const manifest = SyncManifest.createEmpty();

        expect(manifest.lastProcessedAt).toBe(0);
        expect(manifest.lastActiveAgent).toBe('none');
        expect(manifest.currentAgent).toBeNull();

        const json = manifest.toJSON();
        expect(json.agents).toEqual({});
    });

    it('debe inicializar currentAgent en null', () => {
        const manifest = SyncManifest.createEmpty();

        expect(manifest.currentAgent).toBeNull();
    });
});

describe('SyncManifest - markAsSynced', () => {
    it('debe establecer timestamp del agente y del bridge iguales', () => {
        const manifest = SyncManifest.createEmpty();

        manifest.markAsSynced('antigravity');

        const json = manifest.toJSON();

        expect(manifest.currentAgent).toBe('antigravity');
        expect(manifest.lastActiveAgent).toBe('antigravity');

        // Verificar que ambos timestamps son iguales
        expect(json.agents['antigravity'].lastProcessedAt).toBe(
            json.agents['agents'].lastProcessedAt
        );
    });

    it('debe manejar múltiples agentes correctamente', () => {
        const manifest = SyncManifest.createEmpty();

        manifest.markAsSynced('antigravity');
        const firstTimestamp = manifest.getAgentTimestamp('antigravity');

        expect(firstTimestamp).toBeGreaterThan(0);

        // Simular paso de tiempo
        manifest.markAsSynced('cursor');

        const json = manifest.toJSON();

        expect(manifest.currentAgent).toBe('cursor');
        expect(json.agents['antigravity']).toBeDefined();
        expect(json.agents['cursor']).toBeDefined();
        expect(json.agents['agents'].lastProcessedAt).toBe(
            json.agents['cursor'].lastProcessedAt
        );
    });

    it('debe actualizar currentAgent cada vez que se llama', () => {
        const manifest = SyncManifest.createEmpty();

        manifest.markAsSynced('antigravity');
        expect(manifest.currentAgent).toBe('antigravity');

        manifest.markAsSynced('cursor');
        expect(manifest.currentAgent).toBe('cursor');

        manifest.markAsSynced('cline');
        expect(manifest.currentAgent).toBe('cline');
    });
});

describe('SyncManifest - needsSync', () => {
    it('debe retornar false cuando el agente está actualizado', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('antigravity');

        expect(manifest.needsSync('antigravity')).toBe(false);
    });

    it('debe retornar true cuando el bridge es más reciente', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('antigravity');

        // Simular sincronización desde otro agente
        manifest.markAsSynced('cursor');

        // antigravity ahora está desactualizado
        expect(manifest.needsSync('antigravity')).toBe(true);
    });

    it('debe retornar false para un agente que nunca se sincronizó', () => {
        const manifest = SyncManifest.createEmpty();

        // Sin sincronización, ambos timestamps son 0
        expect(manifest.needsSync('antigravity')).toBe(false);
    });

    it('debe retornar true cuando el agente no existe pero el bridge sí', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('cursor');

        // 'antigravity' nunca se sincronizó, pero 'agents' tiene timestamp
        expect(manifest.needsSync('antigravity')).toBe(true);
    });
});

describe('SyncManifest - toJSON', () => {
    it('debe serializar correctamente con la estructura esperada', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('antigravity');

        const json = manifest.toJSON();

        expect(json).toHaveProperty('lastProcessedAt');
        expect(json).toHaveProperty('lastActiveAgent');
        expect(json).toHaveProperty('currentAgent');
        expect(json).toHaveProperty('agents');

        expect(typeof json.agents).toBe('object');
        expect(json.agents['antigravity']).toHaveProperty('lastProcessedAt');
        expect(json.agents['agents']).toHaveProperty('lastProcessedAt');
    });

    it('debe incluir currentAgent en la serialización', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('antigravity');

        const json = manifest.toJSON();

        expect(json.currentAgent).toBe('antigravity');
    });

    it('debe serializar currentAgent como null cuando está vacío', () => {
        const manifest = SyncManifest.createEmpty();

        const json = manifest.toJSON();

        expect(json.currentAgent).toBeNull();
    });

    it('debe serializar todos los agentes con estructura AgentTimestamp', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('antigravity');
        manifest.markAsSynced('cursor');

        const json = manifest.toJSON();

        expect(json.agents['antigravity']).toHaveProperty('lastProcessedAt');
        expect(json.agents['cursor']).toHaveProperty('lastProcessedAt');
        expect(json.agents['agents']).toHaveProperty('lastProcessedAt');

        expect(typeof json.agents['antigravity'].lastProcessedAt).toBe('number');
        expect(typeof json.agents['cursor'].lastProcessedAt).toBe('number');
        expect(typeof json.agents['agents'].lastProcessedAt).toBe('number');
    });
});

describe('SyncManifest - setCurrentAgent', () => {
    it('debe permitir establecer currentAgent manualmente', () => {
        const manifest = SyncManifest.createEmpty();

        manifest.setCurrentAgent('custom-agent');
        expect(manifest.currentAgent).toBe('custom-agent');
    });

    it('debe permitir limpiar currentAgent estableciéndolo en null', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.setCurrentAgent('antigravity');
        expect(manifest.currentAgent).toBe('antigravity');

        manifest.setCurrentAgent(null);
        expect(manifest.currentAgent).toBeNull();
    });
});

describe('SyncManifest - getAgentTimestamp', () => {
    it('debe retornar el timestamp correcto para un agente', () => {
        const manifest = SyncManifest.createEmpty();
        manifest.markAsSynced('antigravity');

        const timestamp = manifest.getAgentTimestamp('antigravity');
        expect(timestamp).toBeGreaterThan(0);
    });

    it('debe retornar 0 para un agente que no existe', () => {
        const manifest = SyncManifest.createEmpty();

        const timestamp = manifest.getAgentTimestamp('nonexistent');
        expect(timestamp).toBe(0);
    });
});
