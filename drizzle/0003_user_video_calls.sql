CREATE TABLE "user_video_calls" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "created_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
); 