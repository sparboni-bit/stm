import { logoutAction } from "@/modules/auth/actions"

export async function GET() {
  await logoutAction()
}