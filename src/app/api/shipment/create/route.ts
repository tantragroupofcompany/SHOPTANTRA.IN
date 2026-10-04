import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { classifyDbError } from '../../../../lib/authUtils';
import { isShippingEnabled, getShippingConfig } from '../../../../lib/shipping/config';
import { createShipmentsForOrder } from '../../../../lib/shipping/shipmentService';
import { requireOrderAccess } from '../../../../lib/sellerAuth';

/**
 * POST /api/shipment/create
 *
 * Creates one real Shipment row per seller for an order by delegating to the
 * verified provider orchestration in `shipmentService.createShipmentsForOrder`.
 *
 * WHY THIS ROUTE WAS REWRITTEN
 * The previous implementation built shipments itself and it was wrong twice over:
 *
 *  1. IT FABRICATED LOGISTICS DATA. It called `MasterCourierService.createShipment()`,
 *     which minted a random AWB (`DEL##########IN`) and a made-up expected-delivery
 *     date without any courier ever being contacted, then wrote that AWB to the
 *     Shipment row and marked the parcel CONFIRMED. Sellers and buyers were shown
 *     a tracking number for a parcel that did not exist.
 *
 *  2. IT DOUBLE-DECREMENTED STOCK. `orderProcessor.processOrder()` already
 *     decrements `Product.stock` inside the order-creation transaction. This
 *     route then decremented the same stock AGAIN when a shipment was created.
 *     Every shipped order therefore removed double its quantity from inventory,
 *     driving real products to zero/negative stock.
 *
 * It also invented a fallback pickup address ("Registered Business Address,
 * Mumbai 400001") for sellers with no warehouse on file, so parcels would be
 * collected from an address the seller never had.
 *
 * The delegated service is provider-backed, idempotent per (order, seller),
 * validates seller eligibility before booking, and records a failed booking
 * honestly as PENDING_PROVIDER_CONFIRMATION / BLOCKED with the real reason and
 * no AWB. It never touches stock.
 */
export async function POST(request: Request) {
  let orderId: string | null = null;
  try {
    const body = await request.json();
    orderId = body?.orderId || null;
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // AUTHORIZATION: booking a real shipment with the carrier costs money and
    // creates a real AWB. The route previously accepted ANY orderId from an
    // anonymous caller. A seller may only book for orders containing their own
    // products; staff may book for any order.
    const access = await requireOrderAccess(request, orderId);
    if (!access.ok) return access.response;

    // Load the order only to derive the payment mode and to answer 404 early.
    let order: any = null;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentMethod: true, paymentStatus: true },
      });
    } catch (e: any) {
      // A database outage is an outage. Classify it and answer 503 so no
      // connector internals or credentials leak.
      console.error('[shipment/create] DB error while retrieving order:', e?.code || e?.message);
      const classified = classifyDbError(e);
      if (classified) {
        return NextResponse.json({ error: classified }, { status: 503 });
      }
      return NextResponse.json({ error: 'Database error while retrieving order' }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 });
    }

    const paymentMode: 'PREPAID' | 'COD' =
      String(order.paymentMethod || '').toUpperCase() === 'COD' ||
      order.paymentStatus === 'COD_PENDING'
        ? 'COD'
        : 'PREPAID';

    const result = await createShipmentsForOrder({ orderId, paymentMode });

    if (!isShippingEnabled()) {
      return NextResponse.json(
        {
          success: false,
          shipments: [],
          providerEnabled: false,
          error:
            'Shipping is not configured for this deployment, so no shipment was booked. ' +
            'No AWB was created and stock was not touched.',
        },
        { status: 503 }
      );
    }

    const blocked = result.shipments.filter((s) => s.source === 'BLOCKED');
    const booked = result.shipments.filter((s) => s.source === 'PROVIDER');
    const pending = result.shipments.filter(
      (s) => s.source === 'FALLBACK' && s.status !== 'BOOKED'
    );

    // Nothing could be booked -> honest failure, listing the real reasons.
    if (booked.length === 0) {
      return NextResponse.json(
        {
          success: false,
          provider: getShippingConfig().provider,
          shipments: result.shipments,
          blocked,
          reasons: result.shipments.map(
            (s) => s.failureReason || `Shipment for seller ${s.sellerId} is ${s.status}.`
          ),
          error:
            'No shipment could be booked with the courier. ' +
            (result.reason || 'See the per-seller reasons for details.') +
            ' No AWB was created and stock was not touched.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: getShippingConfig().provider,
      message:
        `Booked ${booked.length} shipment(s) with the courier.` +
        (pending.length ? ` ${pending.length} awaiting provider confirmation.` : '') +
        (blocked.length ? ` ${blocked.length} blocked (seller not eligible).` : ''),
      shipments: result.shipments,
      booked: booked.length,
      pendingProviderConfirmation: pending.length,
      blocked: blocked.length,
    });
  } catch (error: any) {
    console.error('[shipment/create] failed:', error?.code || error?.message);
    const classified = classifyDbError(error);
    if (classified) {
      return NextResponse.json({ error: classified }, { status: 503 });
    }
    // createShipmentsForOrder throws a plain Error with an operator-readable
    // reason (e.g. "PREPAID order X is not paid"). It is safe to surface and
    // far more useful than a generic 500.
    const message =
      typeof error?.message === 'string' && error.message.length < 300
        ? error.message
        : 'Shipment could not be created. No AWB was generated and stock was not changed.';
    return NextResponse.json({ error: message, shipments: [] }, { status: 400 });
  }
}
