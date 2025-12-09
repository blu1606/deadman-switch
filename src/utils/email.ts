import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@deadmanswitch.app';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
        console.log('[Email] RESEND_API_KEY not set, skipping email');
        return false;
    }

    try {
        const { error } = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });

        if (error) {
            console.error('[Email] Send failed:', error);
            return false;
        }

        console.log(`[Email] Sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        console.error('[Email] Error:', err);
        return false;
    }
}

/**
 * Send reminder email to vault owner
 */
export async function sendOwnerReminder(
    ownerEmail: string,
    vaultAddress: string,
    daysRemaining: number,
    urgency: 'warning' | 'urgent' | 'final'
): Promise<boolean> {
    const urgencyColors = {
        warning: '#F59E0B',
        urgent: '#EF4444',
        final: '#DC2626',
    };

    const urgencyText = {
        warning: 'Reminder',
        urgent: 'Urgent Reminder',
        final: 'Final Warning',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0F172A; color: #F8FAFC; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; }
        .alert { background: ${urgencyColors[urgency]}20; border: 1px solid ${urgencyColors[urgency]}; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .alert-title { color: ${urgencyColors[urgency]}; font-weight: bold; font-size: 18px; }
        .info { background: #0F172A; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { color: #94A3B8; }
        .value { color: #F8FAFC; font-family: monospace; }
        .btn { display: inline-block; background: linear-gradient(to right, #10B981, #059669); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Deadman's Switch</h1>
        </div>
        
        <div class="alert">
            <div class="alert-title">⚠️ ${urgencyText[urgency]}: Your vault needs attention</div>
        </div>
        
        <p>Your vault will be released in <strong>${daysRemaining.toFixed(1)} days</strong> if you don't check in.</p>
        
        <div class="info">
            <div class="info-row">
                <span class="label">Vault ID:</span>
                <span class="value">${vaultAddress.slice(0, 8)}...${vaultAddress.slice(-8)}</span>
            </div>
            <div class="info-row">
                <span class="label">Status:</span>
                <span class="value" style="color: ${urgencyColors[urgency]}">Pending Check-in</span>
            </div>
        </div>
        
        <p>If you're unable to check in, your vault contents will be released to the designated recipient.</p>
        
        <center>
            <a href="${APP_URL}/dashboard" class="btn">✓ Check In Now</a>
        </center>
        
        <div class="footer">
            <p>This is an automated message from Deadman's Switch.</p>
            <p>If you did not create this vault, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: ownerEmail,
        subject: `⚠️ ${urgencyText[urgency]}: Your Deadman's Switch needs attention`,
        html,
    });
}

/**
 * Send release notification to recipient
 */
export async function sendRecipientNotification(
    recipientEmail: string,
    vaultAddress: string,
    ownerAddress: string
): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0F172A; color: #F8FAFC; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; }
        .alert { background: #10B98120; border: 1px solid #10B981; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .alert-title { color: #10B981; font-weight: bold; font-size: 18px; }
        .info { background: #0F172A; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { color: #94A3B8; }
        .value { color: #F8FAFC; font-family: monospace; }
        .btn { display: inline-block; background: linear-gradient(to right, #6366F1, #4F46E5); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔓 Deadman's Switch</h1>
        </div>
        
        <div class="alert">
            <div class="alert-title">🎁 A Digital Legacy Has Been Released to You</div>
        </div>
        
        <p>A vault has been released and is now available for you to claim.</p>
        
        <div class="info">
            <div class="info-row">
                <span class="label">From:</span>
                <span class="value">${ownerAddress.slice(0, 8)}...${ownerAddress.slice(-8)}</span>
            </div>
            <div class="info-row">
                <span class="label">Vault ID:</span>
                <span class="value">${vaultAddress.slice(0, 8)}...${vaultAddress.slice(-8)}</span>
            </div>
            <div class="info-row">
                <span class="label">Released:</span>
                <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
        </div>
        
        <p>Connect your wallet to decrypt and download the contents.</p>
        
        <center>
            <a href="${APP_URL}/claim" class="btn">🔓 Claim Your Legacy</a>
        </center>
        
        <div class="footer">
            <p>This is an automated message from Deadman's Switch.</p>
            <p>The contents of this vault are encrypted and can only be accessed with your wallet.</p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: recipientEmail,
        subject: '🔓 A Digital Legacy Has Been Released to You',
        html,
    });
}

/**
 * C.2: Schedule vault ready notification for a future date
 * Uses Resend's scheduledAt feature to send email at exact release time
 */
export async function sendScheduledVaultReady(
    recipientEmail: string,
    vaultAddress: string,
    scheduledAt: Date
): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
        console.log('[Email] RESEND_API_KEY not set, skipping scheduled email');
        return { success: false, error: 'Email not configured' };
    }

    // Resend requires scheduledAt to be at least 1 minute in the future
    const minScheduleTime = new Date(Date.now() + 60 * 1000);
    const actualScheduleTime = scheduledAt > minScheduleTime ? scheduledAt : minScheduleTime;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0F172A; color: #F8FAFC; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1E293B; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; }
        .alert { background: #6366F120; border: 1px solid #6366F1; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .alert-title { color: #6366F1; font-weight: bold; font-size: 18px; }
        .info { background: #0F172A; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .btn { display: inline-block; background: linear-gradient(to right, #10B981, #059669); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Deadman's Switch</h1>
        </div>
        
        <div class="alert">
            <div class="alert-title">🔓 A Vault You Subscribed To Is Now Ready!</div>
        </div>
        
        <p>The vault you requested to be notified about has been released and is now available to claim.</p>
        
        <div class="info">
            <p style="font-family: monospace; color: #94A3B8;">
                Vault: ${vaultAddress.slice(0, 8)}...${vaultAddress.slice(-8)}
            </p>
        </div>
        
        <p>Connect your wallet to decrypt and access the contents.</p>
        
        <center>
            <a href="${APP_URL}/claim?vault=${vaultAddress}" class="btn">🔓 Claim Now</a>
        </center>
        
        <div class="footer">
            <p>You received this because you subscribed to vault release notifications.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: recipientEmail,
            subject: '🔓 Your Subscribed Vault Is Ready to Claim!',
            html,
            scheduledAt: actualScheduleTime.toISOString(),
        });

        if (error) {
            console.error('[Email] Scheduled send failed:', error);
            return { success: false, error: error.message };
        }

        console.log(`[Email] Scheduled for ${recipientEmail} at ${actualScheduleTime.toISOString()}`);
        return { success: true, id: data?.id };
    } catch (err: any) {
        console.error('[Email] Scheduled error:', err);
        return { success: false, error: err.message };
    }
}

