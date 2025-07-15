import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { videoCalls, videoCallParticipants } from "@/db/schema";
import { z } from "zod";
import { eq, and, desc, getTableColumns } from "drizzle-orm";
import { nanoid } from "nanoid";
import { user } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";

export const videoCallsRouter = createTRPCRouter({
  createCall: protectedProcedure
    .input(z.object({ name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = nanoid();
      const [call] = await db
        .insert(videoCalls)
        .values({
          id,
          hostId: ctx.auth.user.id,
          name: input.name ?? null,
        })
        .returning();
      // Add host as first participant
      await db.insert(videoCallParticipants).values({
        callId: id,
        userId: ctx.auth.user.id,
      });
      // Create the call on Stream Video
      const callInstance = streamVideo.video.call("default", id);
      await callInstance.create({
        data: {
          created_by_id: ctx.auth.user.id,
          custom: {
            callId: id,
            callName: input.name ?? null,
          },
        },
      });
      return call;
    }),

  getCalls: protectedProcedure.query(async ({ ctx }) => {
    // Get all calls where user is a participant
    const calls = await db
      .select({ ...getTableColumns(videoCalls) })
      .from(videoCalls)
      .innerJoin(
        videoCallParticipants,
        eq(videoCalls.id, videoCallParticipants.callId)
      )
      .where(eq(videoCallParticipants.userId, ctx.auth.user.id))
      .orderBy(desc(videoCalls.createdAt));
    return calls;
  }),

  getCallById: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ input }) => {
      const [call] = await db
        .select({ ...getTableColumns(videoCalls) })
        .from(videoCalls)
        .where(eq(videoCalls.id, input.callId));
      return call || null;
    }),

  completeCall: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only host can complete the call
      const [call] = await db
        .select({ hostId: videoCalls.hostId, status: videoCalls.status })
        .from(videoCalls)
        .where(eq(videoCalls.id, input.callId));
      if (!call) throw new Error("Call not found");
      if (call.hostId !== ctx.auth.user.id) throw new Error("Only host can end the call");
      if (call.status === "completed") throw new Error("Call already completed");
      await db
        .update(videoCalls)
        .set({ status: "completed" })
        .where(eq(videoCalls.id, input.callId));
      return { completed: true };
    }),

  joinCall: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check status
      const [call] = await db
        .select({ status: videoCalls.status })
        .from(videoCalls)
        .where(eq(videoCalls.id, input.callId));
      if (!call) throw new Error("Call not found");
      if (call.status === "completed") throw new Error("Call has ended");
      // Add user as participant if not already
      const existing = await db
        .select()
        .from(videoCallParticipants)
        .where(
          and(
            eq(videoCallParticipants.callId, input.callId),
            eq(videoCallParticipants.userId, ctx.auth.user.id)
          )
        );
      if (!existing.length) {
        await db.insert(videoCallParticipants).values({
          callId: input.callId,
          userId: ctx.auth.user.id,
        });
      }
      return { joined: true };
    }),

  getParticipants: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .query(async ({ input }) => {
      const participants = await db
        .select({
          userId: videoCallParticipants.userId,
          name: user.name,
          image: user.image,
        })
        .from(videoCallParticipants)
        .innerJoin(user, eq(videoCallParticipants.userId, user.id))
        .where(eq(videoCallParticipants.callId, input.callId));
      return participants;
    }),

  // Add generateToken for video calls
  generateToken: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if call exists and is not completed
      const [call] = await db
        .select({ status: videoCalls.status })
        .from(videoCalls)
        .where(eq(videoCalls.id, input.callId));
      if (!call) throw new Error("Call not found");
      if (call.status === "completed") throw new Error("Call has ended");

      await streamVideo.upsertUsers([
        {
          id: ctx.auth.user.id,
          name: ctx.auth.user.name,
          image:
            ctx.auth.user.image ??
            (typeof require !== 'undefined' ? require("@/lib/avatar").generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }) : undefined),
        },
      ]);
      const expirationTime = Math.floor(Date.now() / 1000) + 3600;
      const issuedAt = Math.floor(Date.now() / 1000) - 60;
      const token = streamVideo.generateUserToken({
        user_id: ctx.auth.user.id,
        exp: expirationTime,
        validity_in_seconds: issuedAt,
      });
      return token;
    }),

  removeCall: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only host can delete the call
      const [call] = await db
        .select({ hostId: videoCalls.hostId, status: videoCalls.status })
        .from(videoCalls)
        .where(eq(videoCalls.id, input.callId));
      if (!call) throw new Error("Call not found");
      if (call.hostId !== ctx.auth.user.id) throw new Error("Only host can delete the call");
      if (call.status !== "completed") throw new Error("Only completed calls can be deleted");
      await db.delete(videoCallParticipants).where(eq(videoCallParticipants.callId, input.callId));
      await db.delete(videoCalls).where(eq(videoCalls.id, input.callId));
      return { deleted: true };
    }),
}); 