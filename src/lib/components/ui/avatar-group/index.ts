import Root from "$lib/components/ui/avatar-group/avatar-group.svelte";
import Member from "$lib/components/ui/avatar-group/avatar-group-member.svelte";
import Etc from "$lib/components/ui/avatar-group/avatar-group-etc.svelte";

import { Fallback, Image } from "$lib/components/ui/avatar";

export { Root, Member, Etc, Image as MemberImage, Fallback as MemberFallback };

export type * from "$lib/components/ui/avatar-group/types";
