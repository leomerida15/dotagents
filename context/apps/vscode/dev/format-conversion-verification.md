# Format Conversion - VSCode Verification Steps

Verification that the format conversion flow works in the VSCode extension.

## Prerequisites

- Diff package with format conversion implemented (Sprints 1-6)
- Rules package with YamlMapper parsing `source_ext`/`target_ext`
- VSCode extension with `DiffSyncAdapter` and `ClientModule`

## Verification Steps

1. **Create a YAML rule with format conversion**
   - In `.agents/.ai/rules/`, add or edit a rule (e.g. `cursor.yaml`)
   - Add `source_ext` and `target_ext` to a mapping:
   ```yaml
   mapping:
     inbound:
       - from: "rules/"
         to: "rules/"
         format: "directory"
         source_ext: ".mdc"
         target_ext: ".md"
     outbound:
       - from: "rules/"
         to: "rules/"
         format: "directory"
         source_ext: ".md"
         target_ext: ".mdc"
   ```

2. **Run sync from the extension**
   - Open a workspace with `.cursor/` or `.agent/` (or whichever agent folder matches the rule)
   - Trigger sync via the extension (status bar, command palette, or auto-sync)
   - Or debug the extension and run the sync command

3. **Verify extensions in destination**
   - **Inbound**: Source files with `.mdc` in the agent folder should appear as `.md` in `.agents/rules/`
   - **Outbound**: Files with `.md` in `.agents/rules/` should appear as `.mdc` in the agent folder

## Flow

- `DiffSyncAdapter.syncAll` / `syncAgent` uses `ClientModule.createListInstalledRulesUseCase` to load rules from `.agents/.ai/rules/`
- Rules are parsed by `YamlMapper.toDomain()` which includes `source_ext`/`target_ext`
- `ListInstalledRulesUseCase.toDTO()` includes `sourceExt`/`targetExt` in the DTO
- `rule.mappings.inbound` is passed to `SyncProjectUseCase.execute()`
- `DefaultSyncInterpreter` applies extension conversion when computing target paths
