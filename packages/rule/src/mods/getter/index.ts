export * from './domain/index';
export * from './application/index';
// We deliberately do NOT export infrastructure implementation details
// but we DO export the Composition Root (Module Factory)
export { GetterModule } from './GetterModule';
