import type { Adapter, Session, User, Account } from "./types";
interface PrismaClient {
    session: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Session>;
        findUnique: (args: {
            where: Record<string, unknown>;
        }) => Promise<Session | null>;
        update: (args: {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
        }) => Promise<Session>;
        delete: (args: {
            where: Record<string, unknown>;
        }) => Promise<Session>;
    };
    user: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<User>;
        findUnique: (args: {
            where: Record<string, unknown>;
        }) => Promise<User | null>;
        update: (args: {
            where: Record<string, unknown>;
            data: Record<string, unknown>;
        }) => Promise<User>;
        delete: (args: {
            where: Record<string, unknown>;
        }) => Promise<User>;
    };
    account: {
        create: (args: {
            data: Record<string, unknown>;
        }) => Promise<Account>;
        findUnique: (args: {
            where: Record<string, unknown>;
        }) => Promise<Account | null>;
        delete: (args: {
            where: Record<string, unknown>;
        }) => Promise<Account>;
    };
}
export declare function prismaAdapter(client: PrismaClient): Adapter;
export {};
