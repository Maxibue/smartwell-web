/**
 * Professional Statistics and Reports Service
 * Handles analytics, revenue reports, and patient management
 */

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

export interface DailyStats {
    date: string;
    sessions: number;
    revenue: number;
    newPatients: number;
}

export interface MonthlyReport {
    month: string;
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    totalRevenue: number;
    averageSessionPrice: number;
    newPatients: number;
    returningPatients: number;
    cancellationRate: number;
    dailyStats: DailyStats[];
}

export interface YearlyReport {
    year: number;
    totalSessions: number;
    totalRevenue: number;
    monthlyBreakdown: Array<{
        month: string;
        sessions: number;
        revenue: number;
    }>;
    topServices: Array<{
        name: string;
        count: number;
        revenue: number;
    }>;
}

export interface PatientStats {
    totalPatients: number;
    activePatients: number;
    newThisMonth: number;
    averageSessionsPerPatient: number;
    topPatients: Array<{
        id: string;
        name: string;
        totalSessions: number;
        totalSpent: number;
        lastSession: string;
    }>;
}

/**
 * Devuelve true si el status cuenta como sesión realizada (completada o confirmada)
 */
function isCompletedStatus(status: string): boolean {
    return status === 'completed' || status === 'confirmed';
}

/** Formatea fecha como 'MMMM yyyy' en español */
function formatMonthES(date: Date): string {
    return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
}

/** Formatea fecha como 'yyyy-MM-dd' */
function toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * Get monthly statistics and report
 */
export async function getMonthlyReport(
    professionalId: string,
    month?: Date
): Promise<MonthlyReport> {
    const targetMonth = month || new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);
    const startKey = toDateKey(monthStart);
    const endKey = toDateKey(monthEnd);

    console.log(`[Stats] getMonthlyReport uid=${professionalId} rango=${startKey} → ${endKey}`);

    // Reporte vacío para retornar en caso de error
    const emptyReport: MonthlyReport = {
        month: formatMonthES(targetMonth),
        totalSessions: 0,
        completedSessions: 0,
        cancelledSessions: 0,
        totalRevenue: 0,
        averageSessionPrice: 0,
        newPatients: 0,
        returningPatients: 0,
        cancellationRate: 0,
        dailyStats: [],
    };

    try {
        // Consultar tanto 'appointments' como 'bookings'
        // NOTA: No filtramos por fecha en Firestore para evitar requerir índices compuestos.
        // Filtramos por fecha en memoria.
        const [apptSnap, bookSnap] = await Promise.all([
            getDocs(query(
                collection(db, 'appointments'),
                where('professionalId', '==', professionalId)
            )).catch(e => { console.warn('[Stats] appointments query error:', e); return { docs: [] } as any; }),
            getDocs(query(
                collection(db, 'bookings'),
                where('professionalId', '==', professionalId)
            )).catch(e => { console.warn('[Stats] bookings query error:', e); return { docs: [] } as any; }),
        ]);

        console.log(`[Stats] docs encontrados: appointments=${apptSnap.docs.length}, bookings=${bookSnap.docs.length}`);

        // Filtrar por rango de fechas en memoria
        const allDocs = [...apptSnap.docs, ...bookSnap.docs].filter(d => {
            const date = d.data().date || '';
            return date >= startKey && date <= endKey;
        });

        console.log(`[Stats] docs en el mes: ${allDocs.length}`);

        let totalSessions = 0;
        let completedSessions = 0;
        let cancelledSessions = 0;
        let totalRevenue = 0;
        const uniquePatients = new Set<string>();
        const dailyStatsMap = new Map<string, DailyStats>();

        allDocs.forEach((docSnap) => {
            const data = docSnap.data();
            totalSessions++;

            const completed = isCompletedStatus(data.status);
            const cancelled = data.status === 'cancelled';

            if (completed) {
                completedSessions++;
                totalRevenue += Number(data.price || data.servicePrice || 0);
            }

            if (cancelled) {
                cancelledSessions++;
            }

            // Paciente único: usar userId, patientId o nombre+email como fallback
            const patientKey = data.userId || data.patientId ||
                `${data.patientName || data.userName || 'unknown'}_${data.patientEmail || data.userEmail || ''}`;
            uniquePatients.add(patientKey);

            // Daily stats
            const dateKey = data.date;
            if (!dailyStatsMap.has(dateKey)) {
                dailyStatsMap.set(dateKey, { date: dateKey, sessions: 0, revenue: 0, newPatients: 0 });
            }
            const dayStats = dailyStatsMap.get(dateKey)!;
            dayStats.sessions++;
            if (completed) {
                dayStats.revenue += Number(data.price || data.servicePrice || 0);
            }
        });

        const dailyStats = Array.from(dailyStatsMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        return {
            month: formatMonthES(targetMonth),
            totalSessions,
            completedSessions,
            cancelledSessions,
            totalRevenue,
            averageSessionPrice: completedSessions > 0 ? totalRevenue / completedSessions : 0,
            newPatients: uniquePatients.size,
            returningPatients: 0,
            cancellationRate: totalSessions > 0 ? (cancelledSessions / totalSessions) * 100 : 0,
            dailyStats,
        };
    } catch (error) {
        console.error('[Stats] Error en getMonthlyReport:', error);
        return emptyReport; // Retornar vacío en lugar de lanzar
    }
}

/**
 * Get yearly statistics and report
 */
export async function getYearlyReport(
    professionalId: string,
    year?: number
): Promise<YearlyReport> {
    const targetYear = year || new Date().getFullYear();
    const yearStart = startOfYear(new Date(targetYear, 0, 1));
    const yearEnd = endOfYear(new Date(targetYear, 0, 1));
    const startKey = toDateKey(yearStart);
    const endKey = toDateKey(yearEnd);

    try {
        const [apptSnap, bookSnap] = await Promise.all([
            getDocs(query(
                collection(db, 'appointments'),
                where('professionalId', '==', professionalId)
            )).catch(e => { console.warn('[Stats] yearly appointments error:', e); return { docs: [] } as any; }),
            getDocs(query(
                collection(db, 'bookings'),
                where('professionalId', '==', professionalId)
            )).catch(e => { console.warn('[Stats] yearly bookings error:', e); return { docs: [] } as any; }),
        ]);

        // Filtrar por año en memoria
        const allDocs = [...apptSnap.docs, ...bookSnap.docs].filter(d => {
            const date = d.data().date || '';
            return date >= startKey && date <= endKey;
        });

        let totalSessions = 0;
        let totalRevenue = 0;
        const monthlyMap = new Map<string, { sessions: number; revenue: number }>();
        const servicesMap = new Map<string, { count: number; revenue: number }>();

        allDocs.forEach((docSnap) => {
            const data = docSnap.data();

            if (isCompletedStatus(data.status)) {
                totalSessions++;
                const price = Number(data.price || data.servicePrice || 0);
                totalRevenue += price;

                // Monthly breakdown
                const monthKey = new Intl.DateTimeFormat('es-AR', { month: 'short' }).format(new Date(data.date + 'T00:00:00'));
                if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { sessions: 0, revenue: 0 });
                const monthData = monthlyMap.get(monthKey)!;
                monthData.sessions++;
                monthData.revenue += price;

                // Services breakdown
                const serviceName = data.service || data.serviceName || data.professionalSpecialty || 'Consulta General';
                if (!servicesMap.has(serviceName)) servicesMap.set(serviceName, { count: 0, revenue: 0 });
                const serviceData = servicesMap.get(serviceName)!;
                serviceData.count++;
                serviceData.revenue += price;
            }
        });

        const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, data]) => ({
            month,
            sessions: data.sessions,
            revenue: data.revenue,
        }));

        const topServices = Array.from(servicesMap.entries())
            .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return { year: targetYear, totalSessions, totalRevenue, monthlyBreakdown, topServices };
    } catch (error) {
        console.error('Error getting yearly report:', error);
        throw error;
    }
}

/**
 * Get patient statistics
 */
export async function getPatientStats(professionalId: string): Promise<PatientStats> {
    try {
        const q = query(
            collection(db, 'appointments'),
            where('professionalId', '==', professionalId)
        );

        const querySnapshot = await getDocs(q);

        const patientMap = new Map<string, {
            name: string;
            sessions: number;
            spent: number;
            lastSession: string;
        }>();

        const thisMonth = new Date().toISOString().slice(0, 7); // 'yyyy-MM'
        const newPatientsThisMonth = new Set<string>();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const patientId = data.userId;

            if (!patientMap.has(patientId)) {
                patientMap.set(patientId, {
                    name: data.userName || 'Paciente',
                    sessions: 0,
                    spent: 0,
                    lastSession: data.date,
                });
            }

            const patient = patientMap.get(patientId)!;
            patient.sessions++;

            if (data.status === 'completed') {
                patient.spent += data.price || 0;
            }

            if (data.date > patient.lastSession) {
                patient.lastSession = data.date;
            }

            // Check if new patient this month
            if (data.date.startsWith(thisMonth)) {
                newPatientsThisMonth.add(patientId);
            }
        });

        const totalPatients = patientMap.size;
        const totalSessions = Array.from(patientMap.values()).reduce((sum, p) => sum + p.sessions, 0);

        const topPatients = Array.from(patientMap.entries())
            .map(([id, data]) => ({
                id,
                name: data.name,
                totalSessions: data.sessions,
                totalSpent: data.spent,
                lastSession: data.lastSession,
            }))
            .sort((a, b) => b.totalSessions - a.totalSessions)
            .slice(0, 10);

        return {
            totalPatients,
            activePatients: topPatients.filter(p => {
                const lastSession = new Date(p.lastSession);
                const threeMonthsAgo = subMonths(new Date(), 3);
                return lastSession >= threeMonthsAgo;
            }).length,
            newThisMonth: newPatientsThisMonth.size,
            averageSessionsPerPatient: totalPatients > 0 ? totalSessions / totalPatients : 0,
            topPatients,
        };
    } catch (error) {
        console.error('Error getting patient stats:', error);
        throw error;
    }
}

/**
 * Get comparison with previous period
 */
export async function getComparisonStats(professionalId: string) {
    const currentMonth = new Date();
    const previousMonth = subMonths(currentMonth, 1);

    const [current, previous] = await Promise.all([
        getMonthlyReport(professionalId, currentMonth),
        getMonthlyReport(professionalId, previousMonth),
    ]);

    return {
        current,
        previous,
        changes: {
            sessions: calculatePercentageChange(previous.totalSessions, current.totalSessions),
            revenue: calculatePercentageChange(previous.totalRevenue, current.totalRevenue),
            cancellationRate: current.cancellationRate - previous.cancellationRate,
        },
    };
}

function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
}
