import Redis from "ioredis";
import crypto from "crypto";

const DEBOUNCE_MS = 4500;
const HANDOVER_TTL_SEC = 1800;

export interface IncomingChatEvent {
  channel: "messenger" | "zalo";
  userId: string;
  text?: string;
  imageUrls?: string[];
  isHumanAgentEcho?: boolean;
  timestamp: number;
}

export async function handleChatWebhookEvent(
  redis: Redis,
  event: IncomingChatEvent,
  onFlushBatch: (params: {
    channel: string;
    userId: string;
    combinedText: string;
    imageUrls: string[];
  }) => Promise<void>,
) {
  const bufKey = `msg_buf:${event.channel}:${event.userId}`;
  const tokKey = `msg_tok:${event.channel}:${event.userId}`;
  const handoverKey = `handover:${event.channel}:${event.userId}`;

  if (event.isHumanAgentEcho) {
    await redis.multi().set(handoverKey, "1", "EX", HANDOVER_TTL_SEC).del(bufKey, tokKey).exec();
    return { status: "HANDOVER_ACTIVATED" as const };
  }

  if (await redis.get(handoverKey)) {
    return { status: "SKIPPED_HUMAN_ACTIVE" as const };
  }

  const token = crypto.randomUUID();
  const payload = JSON.stringify({
    text: (event.text || "").trim(),
    imageUrls: event.imageUrls || [],
    ts: event.timestamp,
  });

  await redis
    .multi()
    .rpush(bufKey, payload)
    .expire(bufKey, 300)
    .set(tokKey, token, "EX", 300)
    .exec();

  setTimeout(async () => {
    const currentToken = await redis.get(tokKey);
    if (currentToken !== token) return;

    const execResult = await redis.multi().lrange(bufKey, 0, -1).del(bufKey).del(tokKey).exec();
    const rawList = (execResult?.[0]?.[1] as string[]) || [];
    if (rawList.length === 0) return;

    const parsedItems = rawList.map((s) => JSON.parse(s)) as Array<{ text: string; imageUrls: string[] }>;
    await onFlushBatch({
      channel: event.channel,
      userId: event.userId,
      combinedText: parsedItems.map((x) => x.text).filter(Boolean).join("\n"),
      imageUrls: Array.from(new Set(parsedItems.flatMap((x) => x.imageUrls || []))),
    });
  }, DEBOUNCE_MS);

  return { status: "BUFFERED" as const, token };
}
