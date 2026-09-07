const { z } = require('zod');

const uploadDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    code: z.string().min(1).max(50),
    category: z.enum(['CERTIFICATE', 'LEAVE', 'CIRCULAR', 'GUIDELINES']),
    description: z.string().min(1),
  }),
});

const listDocumentsQuerySchema = z.object({
  query: z.object({
    category: z.enum(['CERTIFICATE', 'LEAVE', 'CIRCULAR', 'GUIDELINES']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
});

const documentIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

module.exports = { uploadDocumentSchema, listDocumentsQuerySchema, documentIdParamSchema };
