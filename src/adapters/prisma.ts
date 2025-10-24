// src/adapters/prisma.ts
export function prismaAdapter(client) {
  return {
    createSession: async (data) => client.session.create({ data }),
    // etc.
  };
}
