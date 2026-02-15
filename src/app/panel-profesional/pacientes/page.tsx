"use client";

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2, Search, FileText, Calendar, DollarSign, Edit2, Save, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Patient {
    id: string;
    name: string;
    email: string;
    totalSessions: number;
    completedSessions: number;
    totalSpent: number;
    lastSession: string;
    notes?: string;
    appointments: any[];
}

interface PatientNote {
    id: string;
    patientId: string;
    professionalId: string;
    appointmentId?: string;
    content: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
                p.email.toLowerCase().includes(searchTerm.toLowerCase())
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

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const patientId = data.userId;

                if (!patientMap.has(patientId)) {
                    patientMap.set(patientId, {
                        id: patientId,
                        name: data.userName || 'Paciente',
                        email: data.userEmail || '',
                        totalSessions: 0,
                        completedSessions: 0,
                        totalSpent: 0,
                        lastSession: data.date,
                        appointments: [],
                    });
                }

                const patient = patientMap.get(patientId)!;
                patient.totalSessions++;
                patient.appointments.push({ id: doc.id, ...data });

                if (data.status === 'completed') {
                    patient.completedSessions++;
                    patient.totalSpent += data.price || 0;
                }

                if (data.date > patient.lastSession) {
                    patient.lastSession = data.date;
                }
            });

            // Load notes for each patient
            for (const [patientId, patient] of patientMap.entries()) {
                const notesDoc = await getDoc(doc(db, 'patientNotes', `${uid}_${patientId}`));
                if (notesDoc.exists()) {
                    patient.notes = notesDoc.data().content || '';
                }
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

        setSavingNotes(true);
        try {
            const noteId = `${user.uid}_${selectedPatient.id}`;
            const noteRef = doc(db, 'patientNotes', noteId);

            await updateDoc(noteRef, {
                content: notes,
                updatedAt: Timestamp.now(),
            }).catch(async () => {
                // If document doesn't exist, create it
                await addDoc(collection(db, 'patientNotes'), {
                    id: noteId,
                    patientId: selectedPatient.id,
                    professionalId: user.uid,
                    content: notes,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
            });

            // Update local state
            const updatedPatients = patients.map(p =>
                p.id === selectedPatient.id ? { ...p, notes } : p
            );
            setPatients(updatedPatients);
            setSelectedPatient({ ...selectedPatient, notes });
            setEditingNotes(false);
        } catch (error) {
            console.error('Error saving notes:', error);
        } finally {
            setSavingNotes(false);
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
            <div>
                <h1 className="text-2xl font-bold text-secondary">Gestión de Pacientes</h1>
                <p className="text-text-secondary">Historial, notas y seguimiento de tus pacientes</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
                <Input
                    type="text"
                    placeholder="Buscar paciente por nombre o email..."
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
                                No se encontraron pacientes
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
                                            <p className="font-semibold text-secondary truncate">{patient.name}</p>
                                            <p className="text-xs text-text-secondary truncate">{patient.email}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                                <span>{patient.totalSessions} sesiones</span>
                                                <span>${patient.totalSpent.toLocaleString()}</span>
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
                            <p className="text-text-muted">Seleccioná un paciente para ver su información</p>
                        </div>
                    ) : (
                        <>
                            {/* Patient Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-secondary">{selectedPatient.name}</h2>
                                        <p className="text-text-secondary">{selectedPatient.email}</p>
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
                                            <p className="text-xs font-medium">Completadas</p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-900">{selectedPatient.completedSessions}</p>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-purple-600 mb-1">
                                            <DollarSign className="h-4 w-4" />
                                            <p className="text-xs font-medium">Total Gastado</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-900">${selectedPatient.totalSpent.toLocaleString()}</p>
                                    </div>

                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                                            <Calendar className="h-4 w-4" />
                                            <p className="text-xs font-medium">Última Sesión</p>
                                        </div>
                                        <p className="text-sm font-bold text-orange-900">
                                            {format(new Date(selectedPatient.lastSession), 'dd MMM', { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-secondary flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Notas Clínicas
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
                                    <div className="bg-neutral-50 rounded-lg p-4 min-h-[200px]">
                                        {notes ? (
                                            <p className="text-secondary whitespace-pre-wrap">{notes}</p>
                                        ) : (
                                            <p className="text-text-muted italic">No hay notas para este paciente</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Appointment History */}
                            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                                <h3 className="font-bold text-secondary mb-4">Historial de Sesiones</h3>
                                <div className="space-y-3">
                                    {selectedPatient.appointments
                                        .sort((a, b) => b.date.localeCompare(a.date))
                                        .map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-semibold text-secondary">
                                                        {format(new Date(apt.date), "EEEE, d 'de' MMMM", { locale: es })}
                                                    </p>
                                                    <p className="text-sm text-text-secondary">{apt.time} hs • {apt.professionalSpecialty}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : apt.status === 'cancelled'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-amber-100 text-amber-800'
                                                            }`}
                                                    >
                                                        {apt.status === 'completed' ? 'Completada' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                                                    </span>
                                                    <p className="text-sm font-bold text-secondary mt-1">${apt.price}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
