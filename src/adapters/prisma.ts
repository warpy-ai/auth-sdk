import type { Adapter, Session, User, Account } from './types';

export function prismaAdapter(client: any): Adapter {
  return {
    // Session methods
    async createSession(session: Omit<Session, 'sessionToken'>): Promise<Session> {
      const sessionToken = crypto.randomUUID();
      const created = await client.session.create({
        data: {
          sessionToken,
          ...session,
        },
      });
      return created;
    },

    async getSession(sessionToken: string): Promise<Session | null> {
      const session = await client.session.findUnique({
        where: { sessionToken },
      });
      return session;
    },

    async updateSession(sessionToken: string, session: Partial<Session>): Promise<Session | null> {
      const updated = await client.session.update({
        where: { sessionToken },
        data: session,
      });
      return updated;
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await client.session.delete({
        where: { sessionToken },
      });
    },

    // User methods
    async createUser(user: Omit<User, 'id'>): Promise<User> {
      const created = await client.user.create({
        data: user,
      });
      return created;
    },

    async getUser(id: string): Promise<User | null> {
      const user = await client.user.findUnique({
        where: { id },
      });
      return user;
    },

    async getUserByEmail(email: string): Promise<User | null> {
      const user = await client.user.findUnique({
        where: { email },
      });
      return user;
    },

    async updateUser(id: string, user: Partial<User>): Promise<User | null> {
      const updated = await client.user.update({
        where: { id },
        data: user,
      });
      return updated;
    },

    // Account methods
    async createAccount(account: Omit<Account, 'id'>): Promise<Account> {
      const created = await client.account.create({
        data: account,
      });
      return created;
    },

    async getAccount(provider: string, providerAccountId: string): Promise<Account | null> {
      const account = await client.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
      return account;
    },

    async deleteAccount(provider: string, providerAccountId: string): Promise<void> {
      await client.account.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },
  };
}
