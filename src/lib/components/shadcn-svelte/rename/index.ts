import Cancel from "$lib/components/shadcn-svelte/rename/rename-cancel.svelte";
import Edit from "$lib/components/shadcn-svelte/rename/rename-edit.svelte";
import Provider from "$lib/components/shadcn-svelte/rename/rename-provider.svelte";
import Save from "$lib/components/shadcn-svelte/rename/rename-save.svelte";
import Root from "$lib/components/shadcn-svelte/rename/rename.svelte";

/**
 * This can be consumed one of two ways:
 * ```svelte
 * <script lang="ts">
 *  import { Rename } from '$lib/components/shadcn-svelte/rename';
 * </script>
 *
 * <Rename ... />
 * ```
 *
 * or
 *
 * ```svelte
 * <script lang="ts">
 *  import * as Rename from '$lib/components/shadcn-svelte/rename';
 * </script>
 *
 * <Rename.Provider>
 *  <Rename.Root ... />
 *  <Rename.Cancel/>
 *  <Rename.Save/>
 *  <Rename.Edit/>
 * </Rename.Provider>
 * ```
 */

export { Cancel, Edit, Provider, Root as Rename, Root, Save };
