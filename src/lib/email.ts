import nodemailer from 'nodemailer';

// Helper to create the SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'ShopTantra'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your ShopTantra Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1B3A6B; margin: 0;">ShopTantra</h1>
          </div>

          <h2 style="color: #333;">Hello${name ? ' ' + name : ''}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            We received a request to reset the password for your ShopTantra account associated with <strong>${email}</strong>.
            Please click the button below to choose a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1B3A6B; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="color: #888; font-size: 13px; text-align: center; line-height: 1.6;">
            This link is valid for <strong>10 minutes</strong> and can only be used once.<br/>
            If you did not request this, you can safely ignore this email. Your password will not change.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ShopTantra. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️ SMTP credentials not found. Password reset email delivery skipped.');
      return { success: false, error: new Error('SMTP credentials not configured') };
    }
    return { success: false, error };
  }
};

export const sendVerificationEmail = async (email: string, name: string, otp: string) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'ShopTantra'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your ShopTantra Seller Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1B3A6B; margin: 0;">ShopTantra</h1>
          </div>
          
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Thank you for registering as a seller on ShopTantra. To activate your account and access your dashboard, please verify your email address using the One-Time Password (OTP) below:
          </p>
          
          <div style="background-color: #f4f7fb; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1B3A6B;">${otp}</span>
          </div>
          
          <p style="color: #555; font-size: 14px; text-align: center;">
            This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 12px; text-align: center;">
            If you did not request this verification, please ignore this email.<br/>
            &copy; ${new Date().getFullYear()} ShopTantra. All rights reserved.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️ SMTP credentials not found. Email delivery skipped.');
      return { success: true };
    }
    return { success: false, error };
  }
};

/**
 * Seller registration confirmation. Includes the permanent Seller ID and the
 * current (unapproved) approval status. The PDF itself is NOT attached by
 * default — it lives in private storage and is linked via the seller
 * dashboard. Never sends bank/OTP/token data.
 */
export const sendSellerRegistrationEmail = async (
  email: string,
  name: string,
  sellerId: string,
  approvalStatus: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️ SMTP credentials not found. Seller registration email skipped (document retained).');
      return { success: false };
    }
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'ShopTantra'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `ShopTantra Seller Registration — ${sellerId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1B3A6B; margin: 0;">ShopTantra</h1>
          </div>
          <h2 style="color: #333;">Welcome, ${name || 'Seller'}!</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            Your seller registration has been received. Your permanent Seller ID is below.
          </p>
          <div style="background-color: #f4f7fb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #E85D04;">${sellerId}</span>
          </div>
          <p style="color: #555; font-size: 14px; line-height: 1.5;">
            Current approval status: <strong>${approvalStatus}</strong>.<br/>
            A full registration profile PDF is available in your seller dashboard. Please keep your Seller ID for reference.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 26px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ShopTantra. All rights reserved.
          </p>
        </div>
      `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Seller registration email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending seller registration email:', error);
    return { success: false, error };
  }
};

/**
 * Seller account approved email. Sent after a corporate executive approves
 * a seller's account. Confirms activation and explains next steps.
 * Never sends passwords, OTPs, or auth tokens.
 */
export const sendApprovalEmail = async (
  email: string,
  name: string,
  sellerId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    if (!process.env.SMTP_HOST) {
      console.warn('⚠️ SMTP credentials not found. Seller approval email skipped.');
      return { success: false };
    }
    const transporter = createTransporter();
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shoptantra.in';
    const loginUrl = dashboardUrl + '/seller/login';
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'ShopTantra'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your ShopTantra Seller Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1B3A6B; margin: 0;">ShopTantra</h1>
          </div>
          <h2 style="color: #333;">Hello, ${name || 'Seller'}!</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.5;">
            Great news — your ShopTantra seller application has been <strong>approved</strong> and your account is now <strong>active</strong>.
          </p>
          <div style="background-color: #e7f7e7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="color: #28a745; font-weight: bold; margin: 0;">
              ✅ You can now log in to your seller dashboard using your registered email address: ${email}
            </p>
          </div>
          <div style="background-color: #f4f7fb; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #555; font-size: 14px; margin: 0 0 10px 0;"><strong>Your Seller ID:</strong> ${sellerId}</p>
            <p style="color: #555; font-size: 14px; margin: 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          </div>
          <h3 style="color: #333; font-size: 15px;">Security Instructions</h3>
          <ul style="color: #555; font-size: 14px; line-height: 1.6;">
            <li>Use your registered email and original password to log in.</li>
            <li>Never share your password with anyone. ShopTantra will never ask for your password by email.</li>
            <li>If you suspect unauthorized access to your account, change your password immediately.</li>
            <li>Log out from the seller dashboard when using shared or public computers.</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #1B3A6B; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Log in to Seller Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 26px 0;" />
          <p style="color: #888; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} ShopTantra. All rights reserved.
          </p>
        </div>
      `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Seller approval email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending seller approval email:', error);
    return { success: false, error };
  }
};
