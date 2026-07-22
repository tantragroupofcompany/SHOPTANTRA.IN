import { NextResponse } from 'next/server';
import { requireCorporate } from '../../../../middleware/rbac';

export async function GET(request: NextRequest) {
  const guard = await requireCorporate(request, ['FOUNDER']);
  if (guard) return guard;

  return NextResponse.json({
    success: true,
    metrics: {
      users: 0,
      products: 0,
      orders: 0,
    },
  });
}