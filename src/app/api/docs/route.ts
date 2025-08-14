import { swaggerSpec } from "@/lib/server/swagger"

export const dynamic = "force-dynamic"

export async function GET() {
  return new Response(JSON.stringify(swaggerSpec), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
}
