export const MOCK_PROFESSIONALS: Record<string, any> = {
    "mock1": {
        profile: {
            name: "Lic. Mariana Costa",
            title: "Psicóloga Clínica (UBA)",
            description: "Especialista en ansiedad y gestión emocional. Mi enfoque es integrativo, combinando TCC con herramientas de Mindfulness para ayudarte a recuperar el equilibrio.",
            rating: 4.9,
            reviews: 32,
            image: "https://i.pravatar.cc/150?u=mock_psy",
            location: "Palermo, CABA (y Online)",
            videoAllowed: true
        },
        services: [
            { id: "s1", name: "Sesión Individual", duration: 50, price: 45000, description: "Terapia individual online o presencial." },
            { id: "s2", name: "Pack 4 Sesiones", duration: 50, price: 160000, description: "Descuento por pago mensual." }
        ],
        schedule: {
            "Lunes": [{ start: "09:00", end: "18:00" }],
            "Martes": [{ start: "14:00", end: "20:00" }],
            "Jueves": [{ start: "09:00", end: "18:00" }]
        }
    },
    "mock2": {
        profile: {
            name: "Lic. Lucas Funes",
            title: "Nutricionista Deportivo",
            description: "Ayudo a deportistas y personas activas a mejorar su rendimiento y composición corporal sin dietas restrictivas. Educación alimentaria real.",
            rating: 4.8,
            reviews: 18,
            image: "https://i.pravatar.cc/150?u=mock_nutri",
            location: "Online",
            videoAllowed: true
        },
        services: [
            { id: "s1", name: "Consulta Inicial", duration: 60, price: 35000, description: "Evaluación completa y plan personalizado." },
            { id: "s2", name: "Control Mensual", duration: 30, price: 25000, description: "Ajustes y seguimiento." }
        ],
        schedule: {
            "Lunes": [{ start: "10:00", end: "19:00" }],
            "Miércoles": [{ start: "10:00", end: "19:00" }],
            "Viernes": [{ start: "09:00", end: "16:00" }]
        }
    },
    "mock3": {
        profile: {
            name: "Lic. Sofía Mendez",
            title: "Puericultora & Psicóloga Perinatal",
            description: "Acompaño maternidades desde el embarazo hasta la crianza temprana. Especialista en lactancia y sueño infantil respetuoso.",
            rating: 5.0,
            reviews: 15,
            image: "https://i.pravatar.cc/150?u=mock_mat",
            location: "Belgrano, CABA",
            videoAllowed: true
        },
        services: [
            { id: "s1", name: "Consulta Lactancia", duration: 90, price: 40000, description: "Bajada de leche, acople, dolor." },
            { id: "s2", name: "Asesoría Sueño", duration: 60, price: 45000, description: "Plan de sueño respetuoso." }
        ],
        schedule: {
            "Jueves": [{ start: "10:00", end: "15:00" }],
            "Sábado": [{ start: "09:00", end: "13:00" }]
        }
    },
    "mock4": {
        profile: {
            name: "Lic. Javier Ortiz",
            title: "Psicólogo de Pareja y Familia",
            description: "Facilito espacios de diálogo para resolver conflictos, mejorar la comunicación y fortalecer vínculos. Terapia sistémica.",
            rating: 4.7,
            reviews: 21,
            image: "https://i.pravatar.cc/150?u=mock_couple",
            location: "Online",
            videoAllowed: true
        },
        services: [
            { id: "s1", name: "Terapia de Pareja", duration: 75, price: 48000, description: "Sesión conjunta para parejas." },
            { id: "s2", name: "Terapia Familiar", duration: 90, price: 55000, description: "Sesión con miembros de la familia." }
        ],
        schedule: {
            "Viernes": [{ start: "16:00", end: "21:00" }],
            "Sábado": [{ start: "10:00", end: "14:00" }]
        }
    },
    "mock5": {
        profile: {
            name: "Lic. Roberto Diaz",
            title: "Master Coach Ontológico",
            description: "Potenciá tu liderazgo y tu carrera. Trabajo con profesionales que buscan dar el siguiente paso o redefinir su propósito.",
            rating: 4.9,
            reviews: 28,
            image: "https://i.pravatar.cc/150?u=mock_coach",
            location: "Online",
            videoAllowed: true
        },
        services: [
            { id: "s1", name: "Sesión de Coaching", duration: 60, price: 50000, description: "Enfoque en objetivos y carrera." },
            { id: "s2", name: "Programa Liderazgo (4 sesiones)", duration: 60, price: 180000, description: "Mentoria intensiva." }
        ],
        schedule: {
            "Lunes": [{ start: "09:00", end: "17:00" }],
            "Martes": [{ start: "09:00", end: "17:00" }]
        }
    }
};
