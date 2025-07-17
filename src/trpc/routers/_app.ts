import { agentsRouter } from '@/modules/agents/server/procedures';
import {  createTRPCRouter } from '../init';

import { meetingsRouter } from '@/modules/meetings/server/procedures';
import { premiumRouter } from '@/modules/premium/server/procedures';
import { userVideoCallRouter } from '@/modules/user-video-call/server/procedures';

export const appRouter = createTRPCRouter({

 agents: agentsRouter,
 meetings: meetingsRouter,
 premium: premiumRouter,
 userVideoCalls: userVideoCallRouter,
 
})
// export type definition of API
export type AppRouter = typeof appRouter;