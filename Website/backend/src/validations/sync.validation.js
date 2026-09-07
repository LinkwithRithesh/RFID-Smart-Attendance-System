const { z } = require('zod');

const syncRecordsSchema = z.object({
  body: z.object({
    records: z
      .array(
        z.object({
          rfidCardId: z.string().min(1),
          markedAt: z.string().datetime(),
        })
      )
      .min(1)
      .max(500),
  }),
});

module.exports = { syncRecordsSchema };
