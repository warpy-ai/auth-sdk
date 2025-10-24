export interface Session {
  sessionToken: string;
  userId: string;
  expires: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface Account {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface Adapter {
  // Session methods
  createSession(session: Omit<Session, "sessionToken">): Promise<Session>;
  getSession(sessionToken: string): Promise<Session | null>;
  updateSession(
    sessionToken: string,
    session: Partial<Session>
  ): Promise<Session | null>;
  deleteSession(sessionToken: string): Promise<void>;

  // User methods
  createUser(user: Omit<User, "id">): Promise<User>;
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, user: Partial<User>): Promise<User | null>;

  // Account methods
  createAccount(account: Omit<Account, "id">): Promise<Account>;
  getAccount(
    provider: string,
    providerAccountId: string
  ): Promise<Account | null>;
  deleteAccount(provider: string, providerAccountId: string): Promise<void>;
}
