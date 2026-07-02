# Vapor UI cheatsheet (antd → Vapor + Tailwind v4)

Single source of truth: https://vapor-ui.goorm.io/docs. When unsure of a prop, inspect the
installed types: `node_modules/@vapor-ui/core/dist/components/<name>/*.d.ts`.
Icon names: grep `node_modules/@vapor-ui/icons/dist/types/index.d.ts` (e.g. `PlusOutlineIcon`).

## Imports
```tsx
import { Button, Card, TextInput, Textarea, Select, MultiSelect, Dialog, Table, Badge,
  Text, Flex, HStack, VStack, Box, Grid, Spinner, Avatar, Tooltip, Checkbox, Switch,
  Callout, IconButton, Field } from '@vapor-ui/core'
import { PlusOutlineIcon, SearchOutlineIcon, TrashOutlineIcon } from '@vapor-ui/icons'
```

## Component map (antd → Vapor)
| antd | Vapor |
| --- | --- |
| Button | `<Button colorPalette="primary|secondary|success|danger" variant="fill|outline|ghost" size="sm|md|lg">` |
| Input | `<TextInput value onValueChange={(v)=>...} placeholder type="text|email|password|url|search" />` |
| Input.TextArea | `<Textarea value onValueChange />` |
| InputNumber | `<TextInput type="text" inputMode="numeric" value onValueChange />` (parse to number yourself) |
| Select | `Select.Root value onValueChange` → `Select.Trigger`+`Select.Value` → `Select.Popup`→`Select.Item value` |
| Select multiple | `MultiSelect` (compound, see its d.ts) — use for tag/item multi-pick |
| Table | `Table.Root`→`Table.Header`/`Table.Body`→`Table.Row`→`Table.Cell`/`Table.Heading` |
| Modal | `Dialog.Root open onOpenChange` → `Dialog.Popup`→`Dialog.Title`/`Dialog.Body`/`Dialog.Footer`/`Dialog.Close` |
| Tag | `<Badge colorPalette="primary|hint|success|warning|danger" size>` |
| Typography Title/Text | `<Text typography="heading3|body1|..." >` (or just Tailwind text classes) |
| Space / Row / Col | `HStack`/`VStack` (gap prop) / `Flex` / `Grid` |
| Spin | `<Spinner />` |
| Avatar | `Avatar.Root`→`Avatar.Image`/`Avatar.Fallback` (check d.ts) or `<Avatar>` |
| Tooltip | `Tooltip.Root`→`Tooltip.Trigger`→`Tooltip.Content` |
| Alert | `Callout` (colorPalette) |
| Form + Form.Item | `Field.Root`→`Field.Label`/`Field.Description`/`Field.Error` wrapping the input |
| Empty | plain Tailwind: centered muted `<Text>` + icon |
| Upload | custom: hidden `<input type=file>` + `api.upload(file, folder)` + preview grid (see components/ui/ImageUploader) |
| Card | `Card.Root`→`Card.Header`/`Card.Body`/`Card.Footer` |
| Image | `next/image` or plain `<img>` with Tailwind |

## Rules
- NO `style={{...}}` inline. Use Tailwind utilities + Vapor token utils (`bg-v-primary`, `p-v-100`, `text-v-foreground`, `gap-v-...`). Plain Tailwind utilities (flex, grid, rounded, etc.) are fine.
- NO `any` (eslint `no-explicit-any` is an error). Use `unknown`/proper types.
- Controlled inputs use `onValueChange(value)` (NOT `onChange={e=>e.target.value}`).
- Keep all data fetching via `@/lib/api` (`api.projects.getList()`, etc.) and the existing response
  envelope `{ success, data }`. Do not change API contracts.
- Reuse shared components in `src/components/ui/*` (PageHeader, DataTable, SearchInput, StatusBadge,
  ConfirmDialog, ImageUploader, TagSelect, EntityPicker) instead of re-implementing.
- Preserve each page's behavior, routes, and Korean copy. This is a presentation swap, not a rewrite of logic.
- Desktop-optimized + responsive. Accessibility: label inputs (Field.Label), keyboard-operable controls.
