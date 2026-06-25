export interface AlertStatus {
  emailSent: boolean;
  smsSent: boolean;
  whatsappSent: boolean;
}

export function sendOrderConfirmationAlert(email: string, phone: string, name: string, orderNumber: string, amount: number): AlertStatus {
  console.log(`[ALERT EMAIL] To: ${email} | Subject: Order Confirmed - ${orderNumber} | Body: Hello ${name}, your payment of ₹${amount} was received and your order is being processed.`);
  console.log(`[ALERT SMS] To: ${phone} | Msg: ShopTantra Order ${orderNumber} confirmed! Payment of ₹${amount} received. Track your order in your dashboard.`);
  console.log(`[ALERT WHATSAPP] To: ${phone} | Msg: ✅ *ShopTantra Order Confirmed!* \nOrder: *${orderNumber}*\nAmount Paid: *₹${amount}*\nThank you for shopping Swadeshi!`);

  return {
    emailSent: true,
    smsSent: true,
    whatsappSent: true,
  };
}

export function sendShippingUpdateAlert(phone: string, email: string, orderNumber: string, trackingNumber: string, carrier: string, trackingLink: string): AlertStatus {
  console.log(`[ALERT EMAIL] To: ${email} | Subject: Order Shipped - ${orderNumber} | Body: Your order has been dispatched via ${carrier}. Tracking AWB: ${trackingNumber}. Link: ${trackingLink}`);
  console.log(`[ALERT SMS] To: ${phone} | Msg: ShopTantra Order ${orderNumber} has been shipped via ${carrier}. Track: ${trackingLink}`);
  console.log(`[ALERT WHATSAPP] To: ${phone} | Msg: 📦 *ShopTantra Order Shipped!*\nYour order *${orderNumber}* has been dispatched via *${carrier}*.\nTracking Number: *${trackingNumber}*\nTrack here: ${trackingLink}`);

  return {
    emailSent: true,
    smsSent: true,
    whatsappSent: true,
  };
}

export function sendDeliveryAlert(phone: string, email: string, orderNumber: string): AlertStatus {
  console.log(`[ALERT EMAIL] To: ${email} | Subject: Order Delivered - ${orderNumber} | Body: Your order has been delivered successfully. Please rate us and review your products!`);
  console.log(`[ALERT SMS] To: ${phone} | Msg: ShopTantra Order ${orderNumber} delivered. Share your review now!`);
  console.log(`[ALERT WHATSAPP] To: ${phone} | Msg: 🎉 *ShopTantra Order Delivered!*\nYour order *${orderNumber}* has been successfully delivered. Please leave a review!`);

  return {
    emailSent: true,
    smsSent: true,
    whatsappSent: true,
  };
}
