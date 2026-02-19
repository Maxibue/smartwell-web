import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/cron/appointment-reminders
 *
 * Sends in-app notifications and emails for appointments happening in:
 *   - 24 hours (± 30 min tolerance)
 *   - 1 hour  (± 15 min tolerance)
 *
 * Designed to be called by an external scheduler (Vercel Cron, GitHub Actions,
 * cron-job.org, etc.) every 30 minutes.
 *
 * Security: requires a secret header  X-Cron-Secret = CRON_SECRET env var.
 * Set CRON_SECRET in your environment variables (Vercel → Settings → Env Vars).
 */

const CRON_SECRET = process.env.CRON_SECRET;

interface AppointmentDoc {
    id: string;
    userId: string;        // patient UID
    professionalId: string;
    date: string;          // 'YYYY-MM-DD'
    time: string;          // 'HH:mm'
    duration: number;
    status: string;
    patientName?: string;
    patientEmail?: string;
    professionalName?: string;
    professionalEmail?: string;
    professionalTitle?: string;
    reminders?: {
        sent24h?: boolean;
        sent1h?: boolean;
    };
}

function parseAppointmentDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function minutesUntil(target: Date): number {
    return (target.getTime() - Date.now()) / 60_000;
}

export async function POST(request: NextRequest) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    if (CRON_SECRET) {
        const secret = request.headers.get('x-cron-secret');
        if (secret !== CRON_SECRET) {
            console.warn('[reminders] Unauthorized cron attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    const db = getAdminDb();
    const now = new Date();
    const results = { checked: 0, sent24h: 0, sent1h: 0, errors: 0 };

    try {
        // Fetch upcoming confirmed appointments in the next 25 hours
        const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        const windowStart = new Date(now.getTime() + 30 * 60 * 1000); // >30 min from now

        // We query by date range — Firestore doesn't support datetime queries on
        // separate date/time fields, so we filter client-side after fetching a
        // reasonable window (today + tomorrow).
        const todayStr = now.toISOString().split('T')[0];
        const tomorrowStr = windowEnd.toISOString().split('T')[0];

        const snapshot = await db
            .collection('appointments')
            .where('status', 'in', ['confirmed', 'payment_confirmed', 'approved'])
            .where('date', '>=', todayStr)
            .where('date', '<=', tomorrowStr)
            .get();

        const appointments = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
        })) as AppointmentDoc[];

        results.checked = appointments.length;

        for (const apt of appointments) {
            try {
                const aptTime = parseAppointmentDateTime(apt.date, apt.time);
                const minutesLeft = minutesUntil(aptTime);

                const reminders = apt.reminders || {};

                // ── 24h reminder (window: 23:30 → 24:30 from now) ─────────────
                const in24h = minutesLeft >= 23 * 60 + 30 && minutesLeft <= 24 * 60 + 30;
                if (in24h && !reminders.sent24h) {
                    await sendReminderNotifications(db, apt, 24);
                    await db.collection('appointments').doc(apt.id).update({
                        'reminders.sent24h': true,
                        'reminders.sent24hAt': FieldValue.serverTimestamp(),
                    });
                    results.sent24h++;
                }

                // ── 1h reminder (window: 45min → 75min from now) ──────────────
                const in1h = minutesLeft >= 45 && minutesLeft <= 75;
                if (in1h && !reminders.sent1h) {
                    await sendReminderNotifications(db, apt, 1);
                    await db.collection('appointments').doc(apt.id).update({
                        'reminders.sent1h': true,
                        'reminders.sent1hAt': FieldValue.serverTimestamp(),
                    });
                    results.sent1h++;
                }
            } catch (aptErr) {
                console.error(`[reminders] Error processing appointment ${apt.id}:`, aptErr);
                results.errors++;
            }
        }

        console.log('[reminders] Run complete:', results);
        return NextResponse.json({ success: true, ...results });
    } catch (err: any) {
        console.error('[reminders] Fatal error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * Sends both in-app notification and email reminder for a single appointment.
 */
async function sendReminderNotifications(
    db: FirebaseFirestore.Firestore,
    apt: AppointmentDoc,
    hoursUntil: 24 | 1,
): Promise<void> {
    const timeText = hoursUntil === 24 ? 'mañana' : 'en 1 hora';
    const title = '⏰ Recordatorio de Turno';
    const patientMsg = `Tu turno con ${apt.professionalTitle ?? ''} ${apt.professionalName ?? 'el profesional'} es ${timeText} (${apt.date} a las ${apt.time}).`;
    const proMsg = `Recordatorio: Tenés un turno con ${apt.patientName ?? 'un paciente'} ${timeText} (${apt.date} a las ${apt.time}).`;

    const notificationsRef = db.collection('notifications');

    // In-app: patient
    if (apt.userId) {
        await notificationsRef.add({
            userId: apt.userId,
            type: 'appointment_reminder',
            title,
            message: patientMsg,
            read: false,
            appointmentId: apt.id,
            actionUrl: '/panel-usuario/turnos',
            metadata: {
                professionalName: apt.professionalName,
                appointmentDate: apt.date,
                appointmentTime: apt.time,
                hoursUntil,
            },
            createdAt: new Date(),
        });
    }

    // In-app: professional
    if (apt.professionalId) {
        await notificationsRef.add({
            userId: apt.professionalId,
            type: 'appointment_reminder',
            title,
            message: proMsg,
            read: false,
            appointmentId: apt.id,
            actionUrl: '/panel-profesional',
            metadata: {
                patientName: apt.patientName,
                appointmentDate: apt.date,
                appointmentTime: apt.time,
                hoursUntil,
            },
            createdAt: new Date(),
        });
    }

    // Email: patient
    if (apt.patientEmail) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Internal call — skip user auth, use cron secret
                    'x-cron-secret': CRON_SECRET || '',
                },
                body: JSON.stringify({
                    type: 'appointment_reminder',
                    data: {
                        patientEmail: apt.patientEmail,
                        patientName: apt.patientName,
                        professionalName: `${apt.professionalTitle ?? ''} ${apt.professionalName ?? ''}`.trim(),
                        date: apt.date,
                        time: apt.time,
                        duration: apt.duration,
                        hoursUntil,
                        appointmentId: apt.id,
                    },
                }),
            }).catch(e => console.warn('[reminders] Email to patient failed silently:', e));
        } catch { /* non-fatal */ }
    }

    // Email: professional
    if (apt.professionalEmail) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': CRON_SECRET || '',
                },
                body: JSON.stringify({
                    type: 'appointment_reminder_professional',
                    data: {
                        professionalEmail: apt.professionalEmail,
                        professionalName: apt.professionalName,
                        patientName: apt.patientName,
                        date: apt.date,
                        time: apt.time,
                        duration: apt.duration,
                        hoursUntil,
                        appointmentId: apt.id,
                    },
                }),
            }).catch(e => console.warn('[reminders] Email to professional failed silently:', e));
        } catch { /* non-fatal */ }
    }
}
