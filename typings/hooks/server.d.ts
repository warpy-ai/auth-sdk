import type { Session } from "../core";
export declare function getServerSession(request: Request, secret: string): Promise<Session | null>;
