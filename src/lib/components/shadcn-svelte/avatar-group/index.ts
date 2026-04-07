import Etc from "$lib/components/shadcn-svelte/avatar-group/avatar-group-etc.svelte";
import Member from "$lib/components/shadcn-svelte/avatar-group/avatar-group-member.svelte";
import Root from "$lib/components/shadcn-svelte/avatar-group/avatar-group.svelte";

import { Fallback, Image } from "$lib/components/shadcn-svelte/avatar";

export { Etc, Member, Fallback as MemberFallback, Image as MemberImage, Root };

export type * from "$lib/components/shadcn-svelte/avatar-group/types";
