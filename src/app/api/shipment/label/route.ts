import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { generateBarcodeSVG, getQRCodeUrl } from '../../../../lib/barcodeQrGenerator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsString = searchParams.get('ids') || '';
    const shipmentIds = idsString.split(',').filter(Boolean);
    const download = searchParams.get('download') === 'true';

    if (shipmentIds.length === 0) {
      return new Response('Shipment ID(s) are required', { status: 400 });
    }

    const labelsHtml: string[] = [];

    for (const shipmentId of shipmentIds) {
      let shipment: any = null;
      try {
        shipment = await prisma.shipment.findUnique({
          where: { id: shipmentId },
          include: {
            order: true,
            seller: {
              include: {
                pickupAddress: true,
              },
            },
            items: true,
            courierPartner: true,
          },
        });
      } catch (err) {
        console.error(`Database error while fetching shipment ${shipmentId}:`, err);
        return new Response(`Database error for shipment ${shipmentId}`, { status: 500 });
      }

      if (!shipment) {
        return new Response(`Shipment ${shipmentId} not found in database`, { status: 404 });
      }

      const shippingAddress = typeof shipment.order.shippingAddress === 'string'
        ? JSON.parse(shipment.order.shippingAddress)
        : shipment.order.shippingAddress;

      const pickupAddress = shipment.seller?.pickupAddress || {
        storeName: shipment.seller?.storeName || 'Central Warehouse',
        contactName: 'Logistics Supervisor',
        phone: '9099985145',
        addressLine1: 'SHOPTANTRA central storage yard, Near Ring Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395002',
      };

      const paymentMethod = shipment.order.paymentMethod || 'PREPAID';
      const isCod = paymentMethod === 'COD' || shipment.codAmount > 0;
      const carrierName = shipment.courierPartner?.name || 'India Post Speed Post';

      const barcodeSvg = generateBarcodeSVG(shipment.awbNumber || shipment.shipmentNumber);
      const trackingLink = shipment.trackingLink || `https://shoptantra.in/track?awb=${shipment.awbNumber}`;
      const qrCodeUrl = getQRCodeUrl(trackingLink);

      const labelTemplate = `
        <div class="shipping-label-card" style="width: 100%; max-width: 500px; margin: 0 auto 30px auto; border: 2px solid #000; font-family: 'Arial', sans-serif; box-sizing: border-box; background-color: #fff; page-break-after: always; padding: 15px;">
          <!-- Top Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #ea580c; border: 2px solid #ea580c; padding: 2px 6px; font-family: sans-serif;">SHOPTANTRA</span>
            </div>
            <div style="border: 2px solid #000; padding: 4px 10px; font-size: 14px; font-weight: bold; background-color: #000; color: #fff;">
              ${paymentMethod === 'COD' ? 'COD' : 'PREPAID'}
            </div>
          </div>

          <!-- Carrier & AWB Details -->
          <div style="display: flex; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="flex: 1.2; border-right: 1px solid #ccc; padding-right: 10px;">
              <span style="font-size: 9px; color: #666; font-weight: bold; display: block;">COURIER PARTNER</span>
              <span style="font-size: 13px; font-weight: 900; text-transform: uppercase;">${carrierName}</span>
            </div>
            <div style="flex: 1.5; border-right: 1px solid #ccc; padding-left: 10px; padding-right: 10px;">
              <span style="font-size: 9px; color: #666; font-weight: bold; display: block;">TRACKING / AWB NUMBER</span>
              <span style="font-size: 12px; font-weight: bold; font-family: monospace;">${shipment.trackingNumber || shipment.awbNumber || 'PENDING'}</span>
            </div>
            <div style="flex: 1; padding-left: 10px;">
              <span style="font-size: 9px; color: #666; font-weight: bold; display: block;">DISPATCH DATE</span>
              <span style="font-size: 12px; font-weight: bold;">${shipment.dispatchDate || 'PENDING'}</span>
            </div>
          </div>

          <!-- Barcode Area -->
          <div style="display: flex; flex-direction: column; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; width: 100%;">
            <div style="width: 100%; height: 60px; max-width: 380px;">
              ${barcodeSvg}
            </div>
            <span style="font-size: 10px; font-weight: bold; margin-top: 5px; font-family: monospace; letter-spacing: 2px;">
              ${shipment.trackingNumber || shipment.awbNumber || shipment.shipmentNumber}
            </span>
          </div>

          <!-- Ship To Details -->
          <div style="border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
            <span style="font-size: 10px; color: #666; font-weight: bold; display: block; margin-bottom: 3px;">SHIPPING ADDRESS (DELIVERY TO)</span>
            <div style="font-size: 13px; line-height: 1.4;">
              <strong style="font-size: 14px; display: block;">${shippingAddress.full_name || shippingAddress.name || 'Recipient'}</strong>
              <div>${shippingAddress.address}</div>
              <div>${shippingAddress.city}, ${shippingAddress.state} - <strong>${shippingAddress.pincode}</strong></div>
              <div><strong>Mobile:</strong> ${shippingAddress.phone || 'N/A'}</div>
            </div>
          </div>

          <!-- Ship From & QR -->
          <div style="display: flex; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
            <div style="flex: 3; font-size: 11px; line-height: 1.4; border-right: 1px solid #ccc; padding-right: 10px;">
              <span style="font-size: 9px; color: #666; font-weight: bold; display: block; margin-bottom: 3px;">RETURN / WAREHOUSE ADDRESS (SELLER)</span>
              <strong>${pickupAddress.storeName}</strong><br/>
              C/O: ${pickupAddress.contactName}<br/>
              ${pickupAddress.addressLine1}<br/>
              ${pickupAddress.city}, ${pickupAddress.state} - ${pickupAddress.pincode}<br/>
              Phone: ${pickupAddress.phone}
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-left: 10px;">
              <img src="${qrCodeUrl}" style="width: 75px; height: 75px; border: 1px solid #000; padding: 2px;" alt="QR Code" />
              <span style="font-size: 8px; color: #555; text-align: center; margin-top: 3px; font-weight: bold;">SCAN TO TRACK</span>
            </div>
          </div>

          <!-- Product Details & Summary -->
          <div style="font-size: 11px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="padding: 4px 0; font-size: 9px; color: #666;">ITEM NAME</th>
                  <th style="padding: 4px 0; font-size: 9px; color: #666; text-align: center; width: 40px;">QTY</th>
                  <th style="padding: 4px 0; font-size: 9px; color: #666; text-align: right; width: 80px;">WEIGHT</th>
                </tr>
              </thead>
              <tbody>
                ${shipment.items?.map((item: any) => `
                  <tr style="border-bottom: 1px dashed #ccc;">
                    <td style="padding: 6px 0; font-weight: bold;">${item.title}</td>
                    <td style="padding: 6px 0; text-align: center;">${item.quantity}</td>
                    <td style="padding: 6px 0; text-align: right;">${shipment.weight} kg</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer COD Value -->
          ${isCod ? `
            <div style="background-color: #f3f4f6; border: 1px solid #000; padding: 8px 12px; margin-top: 12px; text-align: center; font-size: 14px;">
              <strong>CASH TO COLLECT (COD):</strong> <span style="font-size: 18px; font-weight: 950; color: #c2410c;">₹${shipment.codAmount.toFixed(2)}</span>
            </div>
          ` : `
            <div style="background-color: #f3f4f6; border: 1px dashed #000; padding: 8px 12px; margin-top: 12px; text-align: center; font-size: 13px; font-weight: bold;">
              PREPAID SHIPMENT - DO NOT COLLECT CASH
            </div>
          `}
          
          <div style="display: flex; justify-content: space-between; font-size: 8px; color: #888; margin-top: 10px; border-t: 1px solid #ddd; pt: 5px;">
            <span>Order ID: ${shipment.order.orderNumber}</span>
            <span>Shipment Ref: ${shipment.shipmentNumber}</span>
          </div>
        </div>
      `;

      labelsHtml.push(labelTemplate);
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>SHOPTANTRA Shipping Label</title>
          <style>
            body {
              background-color: #f0f0f0;
              margin: 0;
              padding: 20px;
            }
            @media print {
              body {
                background-color: #fff;
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
              .shipping-label-card {
                box-shadow: none !important;
                border: 2px solid #000 !important;
                margin: 0 !important;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 500px; margin: 0 auto 20px auto; display: flex; justify-content: space-between; align-items: center; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: #333;">
              Print Job: ${shipmentIds.length} Label(s)
            </div>
            <button onclick="window.print()" style="background-color: #ea580c; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background-color 0.2s;">
              Print Shipping Label(s)
            </button>
          </div>
          ${labelsHtml.join('')}
        </body>
      </html>
    `;

    const headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=utf-8',
    };
    if (download) {
      headers['Content-Disposition'] = `attachment; filename="shipping-label-${idsString.replace(/,/g, '-')}.html"`;
    }
    return new Response(fullHtml, { headers });
  } catch (error: any) {
    console.error('Error generating label:', error);
    return new Response(`Error generating shipping label: ${error.message}`, { status: 500 });
  }
}
