const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Medical assistant system prompt
const MEDICAL_SYSTEM_PROMPT = `Eres un asistente médico pediátrico experto con amplio conocimiento en:
- Pediatría general y especializada
- Diagnóstico diferencial en niños
- Farmacología pediátrica (dosis por peso/edad)
- Desarrollo infantil
- Vacunación y prevención

REGLAS IMPORTANTES:
1. Siempre responde en español
2. Esto es una herramienta de APOYO - el médico toma la decisión final
3. Considera siempre la edad y peso del paciente para dosis
4. Alerta sobre interacciones con alergias conocidas
5. Incluye banderas rojas y signos de alarma
6. Responde SIEMPRE en formato JSON válido`;

/**
 * Get diagnostic suggestions from Gemini
 */
async function getDiagnosticSuggestions(patientContext, symptoms, vitals, additionalInfo) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      differentialDiagnoses: [
        { diagnosis: "Configurar API Key de Gemini", probability: 100, icd10: "N/A", reasoning: "Se requiere GEMINI_API_KEY para usar el asistente IA" }
      ],
      recommendedQuestions: ["Configure la variable de entorno GEMINI_API_KEY"],
      recommendedTests: [],
      redFlags: [],
      alerts: ["Asistente IA no configurado"],
      notes: "Para activar el asistente IA, configure GEMINI_API_KEY en las variables de entorno."
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
      }
    });

    const prompt = `${MEDICAL_SYSTEM_PROMPT}

DATOS DEL PACIENTE:
- Edad: ${patientContext.age}
- Género: ${patientContext.gender}
- Alergias conocidas: ${patientContext.allergies?.length > 0 ? patientContext.allergies.join(', ') : 'Ninguna registrada'}
- Condiciones crónicas: ${patientContext.chronicConditions?.length > 0 ? patientContext.chronicConditions.join(', ') : 'Ninguna'}

SÍNTOMAS ACTUALES:
${symptoms}

${vitals ? `SIGNOS VITALES:
- Temperatura: ${vitals.temperature || 'No registrada'}°C
- FC: ${vitals.heartRate || 'No registrada'} lpm
- FR: ${vitals.respiratoryRate || 'No registrada'} rpm
- SpO2: ${vitals.oxygenSaturation || 'No registrada'}%
- Peso: ${vitals.weight || 'No registrado'} kg` : ''}

${additionalInfo ? `INFORMACIÓN ADICIONAL: ${additionalInfo}` : ''}

HISTORIAL RECIENTE:
${patientContext.recentHistory?.length > 0 
  ? patientContext.recentHistory.map(h => `- ${h.date}: ${h.diagnoses?.join(', ') || 'Sin diagnóstico'}`).join('\n')
  : 'Sin consultas previas registradas'}

Analiza la información y proporciona:
1. TOP 5 diagnósticos diferenciales con probabilidad estimada (%)
2. Preguntas clave adicionales que el médico debería hacer
3. Exámenes de laboratorio o estudios recomendados
4. Banderas rojas o signos de alarma a vigilar
5. Alertas basadas en el historial del paciente

Responde ÚNICAMENTE con JSON válido en esta estructura exacta:
{
  "differentialDiagnoses": [{"diagnosis": "nombre", "probability": 0, "icd10": "código", "reasoning": "explicación breve"}],
  "recommendedQuestions": ["pregunta1", "pregunta2"],
  "recommendedTests": ["examen1", "examen2"],
  "redFlags": ["bandera1", "bandera2"],
  "alerts": ["alerta1"],
  "notes": "notas adicionales"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      return JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Failed to parse Gemini response:', parseError);
      logger.debug('Raw response:', text);
      return {
        differentialDiagnoses: [],
        recommendedQuestions: [],
        recommendedTests: [],
        redFlags: [],
        alerts: ["Error al procesar respuesta de IA"],
        notes: text
      };
    }
  } catch (error) {
    logger.error('Gemini diagnostic error:', error);
    throw error;
  }
}

/**
 * Get treatment suggestions from Gemini
 */
async function getTreatmentSuggestions(diagnosis, patientAge, patientWeight, allergies) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      medications: [],
      nonPharmacological: [],
      followUp: "Configure GEMINI_API_KEY para obtener sugerencias",
      warnings: ["Asistente IA no configurado"]
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
      }
    });

    const prompt = `${MEDICAL_SYSTEM_PROMPT}

Como médico pediatra, sugiere tratamiento para:
- Diagnóstico: ${diagnosis}
- Edad del paciente: ${patientAge} meses (${Math.floor(patientAge/12)} años ${patientAge % 12} meses)
${patientWeight ? `- Peso: ${patientWeight} kg` : ''}
${allergies?.length > 0 ? `- Alergias: ${allergies.join(', ')}` : '- Sin alergias conocidas'}

Proporciona sugerencias de tratamiento considerando:
1. Dosis pediátricas apropiadas para edad/peso
2. Evitar medicamentos contraindicados por alergias
3. Opciones de primera línea
4. Alternativas si hay alergias

Responde ÚNICAMENTE con JSON válido:
{
  "medications": [
    {"name": "medicamento", "dose": "dosis", "frequency": "frecuencia", "duration": "duración", "notes": "notas"}
  ],
  "nonPharmacological": ["medida1", "medida2"],
  "followUp": "instrucciones de seguimiento",
  "warnings": ["advertencia1", "advertencia2"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      return JSON.parse(jsonText);
    } catch {
      return { 
        medications: [],
        nonPharmacological: [],
        followUp: "",
        warnings: [],
        notes: text 
      };
    }
  } catch (error) {
    logger.error('Gemini treatment error:', error);
    throw error;
  }
}

/**
 * Generate educational content for parents
 */
async function getEducationalContent(diagnosis, language = 'es') {
  if (!process.env.GEMINI_API_KEY) {
    return {
      title: `Información sobre ${diagnosis}`,
      description: "Configure GEMINI_API_KEY para contenido educativo",
      recommendations: [],
      whenToSeekHelp: []
    };
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1000,
      }
    });

    const prompt = `Genera contenido educativo para padres sobre: ${diagnosis}

El contenido debe ser:
- En español, claro y fácil de entender
- Sin términos médicos complejos
- Práctico y útil para el cuidado en casa

Responde en JSON:
{
  "title": "título",
  "description": "descripción general de la condición",
  "whatItIs": "explicación simple",
  "recommendations": ["recomendación1", "recomendación2"],
  "homecare": ["cuidado1", "cuidado2"],
  "whenToSeekHelp": ["señal1", "señal2"],
  "prevention": ["medida1", "medida2"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let jsonText = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    try {
      return JSON.parse(jsonText);
    } catch {
      return {
        title: `Información sobre ${diagnosis}`,
        description: text,
        recommendations: [],
        whenToSeekHelp: []
      };
    }
  } catch (error) {
    logger.error('Gemini education error:', error);
    throw error;
  }
}

/**
 * Analyze lab exam image/PDF with Gemini Vision
 */
async function analyzeLabExam(base64File, mimeType, examType, examName, patientContext) {
  if (!process.env.GEMINI_API_KEY) {
    return "Configure GEMINI_API_KEY para analizar exámenes con IA";
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
      }
    });

    const prompt = `Eres un asistente médico experto en interpretación de exámenes de laboratorio pediátricos.

CONTEXTO DEL PACIENTE:
- Edad: ${patientContext.age} años
- Género: ${patientContext.gender}

TIPO DE EXAMEN: ${examType}
NOMBRE DEL EXAMEN: ${examName}

Analiza la imagen del examen de laboratorio adjunta y proporciona:

1. **VALORES IDENTIFICADOS**: Lista los valores que puedes leer de la imagen con sus unidades
2. **VALORES FUERA DE RANGO**: Identifica qué valores están fuera del rango normal para la edad del paciente
3. **INTERPRETACIÓN CLÍNICA**: Explica qué significan estos resultados en términos médicos
4. **POSIBLES DIAGNÓSTICOS**: Qué condiciones podrían estar asociadas con estos resultados
5. **RECOMENDACIONES**: Qué acciones o exámenes adicionales podrían ser necesarios

IMPORTANTE: 
- Considera los rangos pediátricos apropiados para la edad
- Si no puedes leer claramente algún valor, indícalo
- Esta es una herramienta de apoyo, el médico tomará la decisión final

Responde en español de forma clara y estructurada.`;

    const imagePart = {
      inlineData: {
        data: base64File,
        mimeType: mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    logger.error('Gemini lab analysis error:', error);
    throw error;
  }
}

module.exports = {
  getDiagnosticSuggestions,
  getTreatmentSuggestions,
  getEducationalContent,
  analyzeLabExam
};
