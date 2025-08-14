import { rawQuery } from "@/lib/server/query"
import { User } from "@/types/"

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await rawQuery<User>("SELECT * FROM users WHERE email = ?", [
    email,
  ])
  return users[0] ?? null
}
