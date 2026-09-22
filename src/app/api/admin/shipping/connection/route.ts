import { NextRequest, NextResponse } from 'next/server';
import { requireCorporate } from '../../../../../middleware/rbac';
import {
  getShippingProvider,
  isShippingEnabled,
  getShippingConfig,
  SHIPPING_XPRESS_CONTRACT,
} from '../../../../../lib/shipping';

/**
 * GET /api/admin/shipping/connection
 *
 * Phase 5 — admin-only "Test API Connection".
 *
 * Runs entirely server-side and NEVER returns the API token. The check posts an
 * EMPTY body to the order-creation endpoint, which the provider answers with an
 * HTTP 422 validation response before it can create anything — so this proves
 * host + path + token WITHOUT booking a real shipment:
 *   HTTP 422 -> reachable AND token accepted
 *   HTTP 401 -> token missing/incorrect
 *   HTTP 405 -> POST not allowed at this path (wrong base URL)
 *   network  -> unreachable
 */
export async function GET(request: NextRequest) {
  const denied = await requireCorporate(request, ['ADMIN', 'CORPORATE', 'SUPER_ADMIN']);
  if (denied) return denied;

  const config = getShippingConfig();

  try {
    if (!isShippingEnabled()) {
      return NextResponse.json(
        {
          provider: 'SHIPPING_XPRESS',
          enabled: false,
          configured: false,
          reachable: false,
          error: 'SHIPPING_XPRESS_ENABLED is not true, so automatic shipping is disabled.',
          contract: SHIPPING_XPRESS_CONTRACT,
        },
        { status: 200 }
      );
    }

    const provider = getShippingProvider();
    if (!provider) {
      return NextResponse.json(
        {
          provider: 'SHIPPING_XPRESS',
          enabled: false,
          configured: true,
          reachable: false,
          error: 'Shipping is enabled but no provider is registered.',
          contract: SHIPPING_XPRESS_CONTRACT,
        },
        { status: 200 }
      );
    }

    const result = await provider.testConnection();

    // Only status/reachability metadata is echoed — never the token.
    return NextResponse.json(
      {
        ...result,
        enabled: true,
        environment: config.environment,
        timeoutMs: config.requestTimeoutMs,
        capabilities: provider.capabilities,
        contract: SHIPPING_XPRESS_CONTRACT,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const msg = e?.message || 'Connection test failed';
    const status =
      msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('access denied')
        ? 403
        : 500;
    return NextResponse.json({ error: msg, provider: 'SHIPPING_XPRESS' }, { status });
  }
}
