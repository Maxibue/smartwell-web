"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, setDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2, Search, FileText, Calendar, DollarSign, Edit2, Save, X, Plus, Clock, Phone, Mail, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { sanitizeHTML, detectXSS } from '@/lib/sanitize';

interface SessionRecord {
    id: string;
    date: string;
    time: string;
    service: string;
    duration: number;
    status: string;
    price: number;
    notes?: string;
    createdBy?: string;
}

interface Patient {
    id: string;         // unique key for grouping
    name: string;
    email: string;
    phone?: string;
    totalSessions: number;
    completedSessions: number;
    pendingSessions: number;
    totalSpent: number;
    lastSession: string;
    firstSession: string;
    notes?: string;
    sessions: SessionRecord[];
    isManual: boolean;   // whether created manually by the professional
}

export default function ProfessionalPatientsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [editingNotes, setEditingNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await loadPatients(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPatients(patients);
        } else {
            const filtered = patients.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.phone && p.phone.includes(searchTerm))
            );
            setFilteredPatients(filtered);
        }
    }, [searchTerm, patients]);

    const loadPatients = async (uid: string) => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'appointments'),
                where('professionalId', '==', uid)
            );

            const querySnapshot = await getDocs(q);
            const patientMap = new Map<string, Patient>();

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();

                // Determine patient key - use patientId/userId if available, else use name+email
                const patientName = data.patientName || data.userName || 'Paciente';
                const patientEmail = data.patientEmail || data.userEmail || '';
                const patientPhone = data.patientPhone || data.phone || '';
                const patientId = data.userId || data.patientId || `manual_${patientName.toLowerCase().replace(/\s+/g, '_')}_${patientEmail}`;
                const isManual = data.isManual || data.createdBy === 'professional' || !data.userId;

                if (!patientMap.has(patientId)) {
                    patientMap.set(patientId, {
                        id: patientId,
                        name: patientName,
                        email: patientEmail,
                        phone: patientPhone,
                        totalSessions: 0,
                        completedSessions: 0,
                        pendingSessions: 0,
                        totalSpent: 0,
                        lastSession: data.date || '',
                        firstSession: data.date || '',
                        sessions: [],
                        isManual: isManual,
                    });
                }

                const patient = patientMap.get(patientId)!;

                // Update contact info if we have better data
                if (patientName !== 'Paciente' && patient.name === 'Paciente') {
                    patient.name = patientName;
                }
                if (patientEmail && !patient.email) {
                    patient.email = patientEmail;
                }
                if (patientPhone && !patient.phone) {
                    patient.phone = patientPhone;
                }

                patient.totalSessions++;

                // Build session record
                const session: SessionRecord = {
                    id: docSnap.id,
                    date: data.date || '',
                    time: data.time || '',
                    service: data.service || data.serviceName || data.treatmentType || 'Consulta',
                    duration: data.duration || 60,
                    status: data.status || 'confirmed',
                    price: data.price || data.servicePrice || 0,
                    notes: data.notes || '',
                    createdBy: data.createdBy || 'patient',
                };

                patient.sessions.push(session);

                if (data.status === 'completed') {
                    patient.completedSessions++;
                    patient.totalSpent += session.price;
                }
                if (data.status === 'confirmed') {
                    patient.completedSessions++;
                    patient.totalSpent += session.price;
                }
                if (data.status === 'pending') {
                    patient.pendingSessions++;
                }

                if (data.date && data.date > patient.lastSession) {
                    patient.lastSession = data.date;
                }
                if (data.date && (data.date < patient.firstSession || !patient.firstSession)) {
                    patient.firstSession = data.date;
                }
            });

            // Load notes for each patient
            for (const [patientId, patient] of Array.from(patientMap.entries())) {
                try {
                    const noteId = `${uid}_${patientId}`;
                    const notesDoc = await getDoc(doc(db, 'patientNotes', noteId));
                    if (notesDoc.exists()) {
                        patient.notes = notesDoc.data().content || '';
                    }
                } catch (e) {
                    // Ignore notes errors
                }
            }

            // Sort sessions within each patient
            for (const patient of Array.from(patientMap.values())) {
                patient.sessions.sort((a: SessionRecord, b: SessionRecord) => b.date.localeCompare(a.date));
            }

            const patientsArray = Array.from(patientMap.values()).sort((a, b) =>
                b.lastSession.localeCompare(a.lastSession)
            );

            setPatients(patientsArray);
            setFilteredPatients(patientsArray);
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setNotes(patient.notes || '');
        setEditingNotes(false);
    };

    const handleSaveNotes = async () => {
        if (!user || !selectedPatient) return;

        if (detectXSS(notes)) {
            alert("⚠️ Se detectó contenido sospechoso en las notas.");
            return;
        }

        setSavingNotes(true);
        try {
            const sanitizedNotes = sanitizeHTML(notes);
            const noteId = `${user.uid}_${selectedPatient.id}`;
            const noteRef = doc(db, 'patientNotes', noteId);

            await setDoc(noteRef, {
                patientId: selectedPatient.id,
                professionalId: user.uid,
                content: sanitizedNotes,
                updatedAt: Timestamp.now(),
            }, { merge: true });

            const updatedPatients = patients.map(p =>
                p.id === selectedPatient.id ? { ...p, notes: sanitizedNotes } : p
            );
            setPatients(updatedPatients);
            setSelectedPatient({ ...selectedPatient, notes: sanitizedNotes });
            setNotes(sanitizedNotes);
            setEditingNotes(false);
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('Error al guardar las notas');
        } finally {
            setSavingNotes(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed': return 'Completada';
            case 'confirmed': return 'Confirmada';
            case 'pending': return 'Pendiente';
            case 'cancelled': return 'Cancelada';
            default: return status;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'confirmed': return 'bg-primary/10 text-primary-dark';
            case 'pending': return 'bg-amber-100 text-amber-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-neutral-100 text-neutral-800';
        }
    };

    const formatDateSafe = (dateStr: string) => {
        try {
            if (!dateStr) return 'Sin fecha';
            return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                .format(new Date(dateStr + 'T00:00:00'));
        } catch {
            return dateStr;
        }
    };

    const formatDayName = (dateStr: string) => {
        try {
            if (!dateStr) return '';
            return new Intl.DateTimeFormat('es-AR', { weekday: 'long' })
                .format(new Date(dateStr + 'T00:00:00'));
        } catch {
            return '';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Gestión de Pacientes</h1>
                    <p className="text-text-secondary">Historial, notas y seguimiento de tus pacientes</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-lg border border-neutral-100 shadow-sm text-center">
                        <p className="text-xs text-text-muted uppercase font-semibold">Total Pacientes</p>
                        <p className="text-xl font-bold text-secondary">{patients.length}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
                <Input
                    type="text"
                    placeholder="Buscar paciente por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Patients List */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                    <div className="p-4 border-b border-neutral-100">
                        <h3 className="font-bold text-secondary">Pacientes ({filteredPatients.length})</h3>
                    </div>
                    <div className="divide-y divide-neutral-100 max-h-[600px] overflow-y-auto">
                        {filteredPatients.length === 0 ? (
                            <div className="p-8 text-center text-text-muted">
                                <UserIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>No se encontraron pacientes</p>
                                <p className="text-xs mt-1">Creá turnos desde el calendario para agregar pacientes</p>
                            </div>
                        ) : (
                            filteredPatients.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => handleSelectPatient(patient)}
                                    className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors ${selectedPatient?.id === patient.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-secondary truncate">{patient.name}</p>
                                                {patient.isManual && (
                                                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">Manual</span>
                                                )}
                                            </div>
                                            {patient.email && (
                                                <p className="text-xs text-text-secondary truncate">{patient.email}</p>
                                            )}
                                            {patient.phone && (
                                                <p className="text-xs text-text-muted truncate">{patient.phone}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {patient.totalSessions} {patient.totalSessions === 1 ? 'sesión' : 'sesiones'}
                                                </span>
                                                {patient.totalSpent > 0 && (
                                                    <span>${patient.totalSpent.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        {patient.notes && (
                                            <FileText className="h-4 w-4 text-primary shrink-0 ml-2" />
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Patient Details */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedPatient ? (
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-12 text-center">
                            <UserIcon className="h-12 w-12 mx-auto mb-3 text-text-muted opacity-30" />
                            <p className="text-text-muted">Seleccioná un paciente para ver su información</p>
                        </div>
                    ) : (
                        <>
                            {/* Patient Info Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold text-secondary">{selectedPatient.name}</h2>
                                            {selectedPatient.isManual && (
                                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Paciente Manual</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
                                            {selectedPatient.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {selectedPatient.email}
                                                </span>
                                            )}
                                            {selectedPatient.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    {selectedPatient.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                                            <Calendar className="h-4 w-4" />
                                            <p className="text-xs font-medium">Total Sesiones</p>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-900">{selectedPatient.totalSessions}</p>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-green-600 mb-1">
                                            <Calendar className="h-4 w-4" />
                                            <p className="text-xs font-medium">Confirmadas</p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-900">{selectedPatient.completedSessions}</p>
                                    </div>

                                    <div className="bg-amber-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                                            <Clock className="h-4 w-4" />
                                            <p className="text-xs font-medium">Pendientes</p>
                                        </div>
                                        <p className="text-2xl font-bold text-amber-900">{selectedPatient.pendingSessions}</p>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                                            <DollarSign className="h-4 w-4" />
                                            <p className="text-xs font-medium">Total Gastado</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-900">${selectedPatient.totalSpent.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* First/Last Session Info */}
                                <div className="flex gap-4 mt-4 text-sm">
                                    {selectedPatient.firstSession && (
                                        <div className="text-text-muted">
                                            <span className="font-medium">Primera sesión:</span> {formatDateSafe(selectedPatient.firstSession)}
                                        </div>
                                    )}
                                    {selectedPatient.lastSession && (
                                        <div className="text-text-muted">
                                            <span className="font-medium">Última sesión:</span> {formatDateSafe(selectedPatient.lastSession)}
                                        </div>
                                    )}
                                </div>

                                {/* Datos de contacto */}
                                {(selectedPatient.email || selectedPatient.phone) && (
                                    <div className="mt-5 pt-5 border-t border-neutral-100">
                                        <p className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Datos de Contacto</p>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedPatient.email && (
                                                <a
                                                    href={`mailto:${selectedPatient.email}`}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors"
                                                >
                                                    <Mail className="h-4 w-4" />
                                                    {selectedPatient.email}
                                                </a>
                                            )}
                                            {selectedPatient.phone && (
                                                <a
                                                    href={`tel:${selectedPatient.phone}`}
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl text-sm font-medium transition-colors"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    {selectedPatient.phone}
                                                </a>
                                            )}
                                            {selectedPatient.phone && (
                                                <a
                                                    href={`https://wa.me/${selectedPatient.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium transition-colors"
                                                >
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                    WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-secondary flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Notas
                                    </h3>
                                    {!editingNotes ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingNotes(true)}
                                        >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            Editar
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSaveNotes}
                                                disabled={savingNotes}
                                            >
                                                {savingNotes ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-2" />
                                                )}
                                                Guardar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingNotes(false);
                                                    setNotes(selectedPatient.notes || '');
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {editingNotes ? (
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Escribí notas sobre el paciente, evolución, observaciones, etc..."
                                        className="w-full h-48 px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    />
                                ) : (
                                    <div className="bg-neutral-50 rounded-lg p-4 min-h-[120px]">
                                        {notes ? (
                                            <p className="text-secondary whitespace-pre-wrap">{notes}</p>
                                        ) : (
                                            <p className="text-text-muted italic">No hay notas para este paciente</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Session History */}
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                                <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Historial de Sesiones ({selectedPatient.sessions.length})
                                </h3>

                                {selectedPatient.sessions.length === 0 ? (
                                    <div className="text-center py-8 text-text-muted">
                                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>No hay sesiones registradas</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedPatient.sessions.map((session) => (
                                            <div
                                                key={session.id}
                                                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-secondary">
                                                            {formatDateSafe(session.date)}
                                                        </p>
                                                        <span className="text-xs text-text-muted capitalize">
                                                            {formatDayName(session.date)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {session.time} hs
                                                        </span>
                                                        <span>•</span>
                                                        <span>{session.service}</span>
                                                        <span>•</span>
                                                        <span>{session.duration} min</span>
                                                    </div>
                                                    {session.notes && (
                                                        <p className="text-xs text-text-muted mt-1 italic">"{session.notes}"</p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(session.status)}`}>
                                                        {getStatusLabel(session.status)}
                                                    </span>
                                                    {session.price > 0 && (
                                                        <p className="text-sm font-bold text-secondary mt-1">${session.price}</p>
                                                    )}
                                                    {session.createdBy === 'professional' && (
                                                        <p className="text-xs text-text-muted mt-0.5">Turno manual</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
