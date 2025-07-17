import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { userVideoCalls } from "@/db/schema";
import { nanoid } from "nanoid";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { streamVideo } from "@/lib/stream-video";
import { streamChat } from "@/lib/stream-chat";

const statusEnum = z.enum(["upcoming", "active", "completed", "processing", "cancelled"]);

export const userVideoCallRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      status: statusEnum.optional(),
      scheduledAt: z.coerce.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Generate unique joinToken and meetingUrl
      const joinToken = nanoid(24);
      const meetingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/user-video-calls/join/${joinToken}`;
      const [call] = await db
        .insert(userVideoCalls)
        .values({
          id: nanoid(),
          name: input.name,
          createdBy: ctx.auth.user.id,
          status: input.status ?? "upcoming",
          scheduledAt: input.scheduledAt,
          joinToken,
          meetingUrl,
        })
        .returning();
      // Create the call on Stream Video
      const streamCall = streamVideo.video.call("default", call.id);
      await streamCall.create({
        data: {
          created_by_id: ctx.auth.user.id,
          custom: {
            userVideoCallId: call.id,
            callName: call.name,
          },
          settings_override: {
            recording: {
              mode: "auto-on",
              quality: "1080p",
            },
          },
        },
      });
      return call;
    }),
  verifyToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const [call] = await db.select().from(userVideoCalls).where(eq(userVideoCalls.joinToken, input.token));
      if (!call) {
        throw new Error("Invalid or expired token");
      }
      if (call.status === "completed" || call.status === "cancelled") {
        throw new Error("Meeting has already been ended");
      }
      // Allow joining if status is 'upcoming', 'active', or 'processing'
      return call;
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      status: statusEnum.optional(),
      scheduledAt: z.coerce.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only allow creator to mark as completed
      if (input.status === "completed") {
        const [call] = await db.select().from(userVideoCalls).where(eq(userVideoCalls.id, input.id));
        if (!call) throw new Error("Call not found");
        if (call.createdBy !== ctx.auth.user.id) throw new Error("Only the creator can complete the meeting");
      }
      const [call] = await db
        .update(userVideoCalls)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.status && { status: input.status }),
          ...(input.scheduledAt && { scheduledAt: input.scheduledAt }),
        })
        .where(eq(userVideoCalls.id, input.id))
        .returning();
      return call;
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(userVideoCalls)
      .where(eq(userVideoCalls.createdBy, ctx.auth.user.id))
      .orderBy(desc(userVideoCalls.createdAt));
  }),
  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const [call] = await db.select().from(userVideoCalls).where(eq(userVideoCalls.id, input.id));
    return call || null;
  }),
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    // Upsert the user before generating the token
    await streamVideo.upsertUsers([
      {
        id: ctx.auth.user.id,
        name: ctx.auth.user.name,
        image: ctx.auth.user.image ?? undefined,
        role: "user",
      },
    ]);
    // Generate a Stream Video user token for the current user
    const token = streamVideo.generateUserToken({ user_id: ctx.auth.user.id });
    return { token };
  }),
  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    const token = streamChat.createToken(ctx.auth.user.id);
    await streamChat.upsertUser({
      id: ctx.auth.user.id,
      role: "user",
      name: ctx.auth.user.name,
      image: ctx.auth.user.image ?? undefined,
    });
    return token;
  }),
  inviteMember: protectedProcedure
    .input(z.object({
      callId: z.string(),
      userId: z.string(), // For now, invite by userId
      userName: z.string().optional(),
      userImage: z.string().optional(),
      role: z.string().optional(), // Optionally allow role
    }))
    .mutation(async ({ input }) => {
      // Upsert the user in Stream
      await streamVideo.upsertUsers([
        {
          id: input.userId,
          name: input.userName,
          image: input.userImage,
          role: input.role || "user",
        },
      ]);
      // Add the user as a member to the call
      const call = streamVideo.video.call("default", input.callId);
      await call.updateCallMembers({
        update_members: [
          { user_id: input.userId, role: input.role || "user" },
        ],
      });
      return { success: true };
    }),
}); 