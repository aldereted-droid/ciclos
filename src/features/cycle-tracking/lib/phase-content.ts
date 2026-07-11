import type { CyclePhase, PhaseInfo } from '../types'

/**
 * Informacion educativa sobre las 4 fases del ciclo.
 *
 * IMPORTANTE: son TENDENCIAS generales derivadas de los cambios hormonales, no
 * reglas. La variacion entre mujeres (y entre ciclos de la misma mujer) es
 * enorme: muchas no notan casi nada y otras tienen sintomas marcados. Este
 * contenido nunca debe presentarse como diagnostico ni como prediccion del
 * comportamiento de una persona.
 */
export const PHASE_CONTENT: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    phase: 'menstrual',
    label: 'Menstruacion',
    tagline: 'El ciclo se reinicia',
    hormones: 'Estrogeno y progesterona en su punto mas bajo.',
    mood: 'Suele haber mayor necesidad de calma y descanso. Muchas mujeres reportan alivio emocional respecto a los dias previos, aunque el malestar fisico puede generar irritabilidad o desanimo.',
    energy: 'Energia baja, sobre todo los primeros dias. Es normal necesitar mas horas de sueno.',
    symptoms: [
      'Colicos o dolor abdominal',
      'Cansancio y sueno',
      'Dolor de cabeza',
      'Dolor lumbar o de piernas',
      'Sensibilidad emocional',
    ],
    tips: [
      'Respetar el descanso: no es pereza, es fisiologia',
      'Calor local ayuda con los colicos',
      'Movimiento suave (caminar, estirar) alivia mas que el reposo total',
      'Hidratacion y hierro (la perdida de sangre lo baja)',
    ],
    color: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
  },

  folicular: {
    phase: 'folicular',
    label: 'Fase folicular',
    tagline: 'La energia vuelve a subir',
    hormones: 'El estrogeno sube de forma sostenida.',
    mood: 'Tiende a ser la fase mas estable y optimista. Suele haber mas apertura social, motivacion y tolerancia al estres.',
    energy: 'Energia en ascenso. Buen momento para empezar cosas nuevas y para el ejercicio exigente.',
    symptoms: [
      'Pocos sintomas fisicos',
      'Piel mas luminosa',
      'Mayor claridad mental y concentracion',
      'Mas sociabilidad',
    ],
    tips: [
      'Aprovechar para tareas que exigen foco o iniciativa',
      'El cuerpo tolera bien el entrenamiento de alta intensidad',
      'Buen momento para conversaciones dificiles o decisiones',
    ],
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
  },

  ovulacion: {
    phase: 'ovulacion',
    label: 'Ovulacion',
    tagline: 'Pico de fertilidad',
    hormones: 'Pico de LH y estrogeno; se libera el ovulo.',
    mood: 'Suele ser el punto mas alto de animo, confianza y deseo sexual. Mayor sensacion de bienestar y expresividad.',
    energy: 'Energia en su maximo. Fuerza y resistencia en su mejor momento.',
    symptoms: [
      'Aumento del deseo sexual',
      'Flujo mas abundante y elastico',
      'Leve dolor pelvico de un solo lado (mittelschmerz)',
      'Sensibilidad en los senos',
      'Ligero aumento de la temperatura corporal',
    ],
    tips: [
      'Ventana fertil: dias de maxima probabilidad de embarazo',
      'Buen momento para actividades sociales y exposicion publica',
      'La estimacion de fertilidad NO sirve como metodo anticonceptivo confiable',
    ],
    color: {
      bg: 'bg-violet-50',
      text: 'text-violet-700',
      border: 'border-violet-200',
      dot: 'bg-violet-500',
    },
  },

  lutea: {
    phase: 'lutea',
    label: 'Fase lutea',
    tagline: 'Repliegue y sensibilidad',
    hormones: 'Sube la progesterona; al final del ciclo caen progesterona y estrogeno.',
    mood: 'En la primera mitad suele haber calma. En los ultimos dias, con la caida hormonal, es cuando aparece el sindrome premenstrual (SPM): irritabilidad, ansiedad, tristeza o sensibilidad aumentada. No le pasa a todas ni con la misma intensidad.',
    energy: 'Energia decreciente. Mas necesidad de introspeccion y de bajar el ritmo hacia el final.',
    symptoms: [
      'Irritabilidad o cambios de animo (SPM)',
      'Hinchazon y retencion de liquidos',
      'Senos sensibles o doloridos',
      'Antojos de comida (dulce, salado)',
      'Dificultad para dormir',
      'Acne',
    ],
    tips: [
      'Los sintomas del SPM aparecen sobre todo en los ultimos 5 dias',
      'Bajar cafeina, alcohol y sal reduce la hinchazon y la irritabilidad',
      'Ejercicio moderado mejora el animo mas que el reposo',
      'No es "estar de mal humor sin razon": hay una caida hormonal real detras',
    ],
    color: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
  },
}

export const PHASE_ORDER: CyclePhase[] = ['menstrual', 'folicular', 'ovulacion', 'lutea']

export const MEDICAL_DISCLAIMER =
  'Esta informacion es educativa y refleja tendencias generales. Cada mujer vive su ciclo de forma distinta. No sustituye consejo medico, no sirve como metodo anticonceptivo y no debe usarse para asumir el estado de animo de una persona.'
