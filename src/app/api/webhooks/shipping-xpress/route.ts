import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '../../../../lib/prisma';
import { mapProviderStatus, sanitizeForLog } from '../../../../lib/shipping/helpers';

/**
 * POST /api/webhooks/shipping-xpress  (Phase 10 status sync)
 *
 * DOCUMENTATION STATUS — verified live on 2026-09-22: Shipping Xpress publishes
 * NO webhook contract. There is no documented callback registration, no event
 * schema, no payload field list and no signature header, and the read/status
 * routes (order/track, order/show, order/list) all return HTTP 404. Inventing a
 * format would be guessing, and an unauthenticated endpoint that mutates shipment
 * status is a security hole — so this endpoint is DISABLED by default:
 *
 *   - SHIPPING_XPRESS_WEBHOOK_SECRET unset  -> HTTP 503, no database writes.
 *   - secret set -> the caller must present a matching shared secret via
 *     `x-shoptantra-secret`, `x-webhook-secret` or `?secret=` (constant-time
 *     compare). Only then is a best-effort status update attempted, and only for
 *     a reference that already exists in ShopTantra.
 *
 * The secret is our own gate, not a claimed provider signature: as soon as the
 * provider documents a real signing scheme, swap `verifySharedSecret()` for it.
 */
function verifySharedSecret(request: NextRequest): 'ok' | 'unconfigured' | 'mismatch' {
  const expected = String(process.env.SHIPPING_XPRESS_WEBHOOK_SECRET || '').trim();
  if (!expected) return 'unconfigured';

  const provided = String(
    request.headers.get('x-shoptantra-secret') ||
      request.headers.get('x-webhook-secret') ||
      request.nextUrl.searchParams.get('secret') ||
      ''
  ).trim();
  if (!provided) return 'mismatch';

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return 'mismatch';
  try {
    return timingSafeEqual(a, b) ? 'ok' : 'mismatch';
  } catch {
    return 'mismatch';
  }
}

export async function POST(request: NextRequest) {
  const gate = verifySharedSecret(request);
  if (gate === 'unconfigured') {
    return NextResponse.json(
      {
        received: false,
        reason:
          'Webhook disabled: set SHIPPING_XPRESS_WEBHOOK_SECRET once the provider documents a callback + signature format.',
      },
      { status: 503 }
    );
  }
  if (gate === 'mismatch') {
    return NextResponse.json({ received: false, reason: 'Invalid webhook secret.' }, { status: 401 });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  // Payload keys are NOT documented by the provider, so only well-known
  // reference/status aliases are honoured — anything else is ignored safely.
  const ref: string | undefined =
    payload?.orderNumber ||
    payload?.order_id ||
    payload?.orderId ||
    payload?.data?.order_id ||
    payload?.reference ||
    payload?.awb ||
    payload?.trackingNumber ||
    payload?.tracking_number;

  let updated = false;
  if (ref) {
    const reportedStatus =
      payload?.status ||
      payload?.shipment_status ||
      payload?.event ||
      (payload?.data && (payload.data.status || payload.data.shipment_status));

    if (reportedStatus) {
      const mapped = mapProviderStatus(reportedStatus);
      if (mapped !== 'PENDING_PROVIDER_CONFIRMATION') {
        const matching = await prisma.shipment.findFirst({
          where: {
            OR: [
              { awbNumber: { equals: ref, mode: 'insensitive' } },
              { trackingNumber: { equals: ref, mode: 'insensitive' } },
              { providerOrderId: { equals: ref, mode: 'insensitive' } },
              { providerShipmentId: { equals: ref, mode: 'insensitive' } },
            ],
          },
        });
        if (matching) {
          await prisma.shipment.update({
            where: { id: matching.id },
            data: { status: mapped, lastProviderSyncAt: new Date() },
          });
          await prisma.trackingUpdate
            .create({
              data: {
                shipmentId: matching.id,
                status: mapped,
                message: `Status synced from Shipping Xpress webhook (${String(reportedStatus)}).`,
              },
            })
            .catch(() => undefined);
          updated = true;
        }
      }
    }
  }

  // Log only a sanitized summary — never the whole payload, never credentials.
  console.log(
    '[shipping-xpress webhook]',
    JSON.stringify(sanitizeForLog({ ref: ref || null, updated }))
  );

  return NextResponse.json({ received: true, updated }, { status: 200 });
}

export async function GET() {
  const configured = !!String(process.env.SHIPPING_XPRESS_WEBHOOK_SECRET || '').trim();
  return NextResponse.json(
    {
      service: 'shipping-xpress webhook',
      status: configured ? 'ready' : 'disabled',
      note: configured
        ? 'Shared-secret gate active.'
        : 'Set SHIPPING_XPRESS_WEBHOOK_SECRET to enable status sync (provider format undocumented).',
    },
    { status: 200 }
  );
}
