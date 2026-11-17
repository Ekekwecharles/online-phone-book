import { hash, verify } from "@node-rs/argon2";

// argon2id (the default for this library). Memory is kept modest for a free host.
const opts = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (p: string) => hash(p, opts);

export async function checkPassword(stored: string, p: string): Promise<boolean> {
  try {
    return await verify(stored, p);
  } catch {
    return false;
  }
}

let dummy: Promise<string> | undefined;
/** Used when the account does not exist, so timing does not reveal it. */
export async function fakeCheck(p: string): Promise<void> {
  dummy ??= hashPassword("not-a-real-password");
  await checkPassword(await dummy, p);
}
