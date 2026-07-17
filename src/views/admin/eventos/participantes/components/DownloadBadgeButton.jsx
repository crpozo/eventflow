import React, { useState } from 'react';
import { MdDownload } from 'react-icons/md';
import { generateClient } from 'aws-amplify/api';
import { getBadge } from 'graphql/queries';
import { getUrl } from 'aws-amplify/storage';

const client = generateClient();

// Construye un mapa nombre de campo → primer valor respondido
const buildFormFieldsMap = (formAnswers) => {
  const formFieldsMap = {};
  formAnswers.forEach(field => {
    if (field.userData && field.userData.length > 0) {
      formFieldsMap[field.name] = field.userData[0];
    }
  });
  return formFieldsMap;
};

// Busca el valor cuyo nombre de campo contenga alguna de las palabras clave
const findFieldValue = (formFieldsMap, keywords) => {
  const matchingKey = Object.keys(formFieldsMap).find(key =>
    keywords.some(keyword => key.toLowerCase().includes(keyword))
  );
  return matchingKey ? formFieldsMap[matchingKey] : '';
};

const getParticipantData = (eventAttendee) => {
  const result = {};

  try {
    if (eventAttendee.formAnswers && Array.isArray(eventAttendee.formAnswers)) {
      console.log("eventAttendee.formAnswers: ", eventAttendee.formAnswers);

      // Crear un mapa de los campos del formulario
      const formFieldsMap = buildFormFieldsMap(eventAttendee.formAnswers);

      console.log("formFieldsMap: ", formFieldsMap);

      // Mapear campos específicos a field_one, field_two, field_three
      // Buscar por todas las variantes posibles

      // field_one: nombre (buscar variantes comunes)
      result.field_one = findFieldValue(formFieldsMap, ['nombre', 'name']);

      // field_two: universidad
      result.field_two = findFieldValue(formFieldsMap, ['universidad', 'university']);

      // field_three: cargo
      result.field_three = findFieldValue(formFieldsMap, ['cargo', 'position']);
    }
  } catch (e) {
    console.error('Error parseando formAnswers:', e);
  }

  console.log('Datos del participante mapeados:', result);

  return result;
};

// Intenta llenar un campo individual del PDF; devuelve 1 si se llenó, 0 si no
const fillSingleField = async (field, fieldName, fieldValue) => {
  let value = String(fieldValue);

  // Truncar texto si es muy largo (más de 30 caracteres)
  if (value.length > 40) {
    const originalValue = value;
    value = value.substring(0, 27) + '...';
    console.log(`⚠ Texto truncado de ${originalValue.length} caracteres: "${originalValue}" → "${value}"`);
  }

  console.log(`Intentando llenar "${fieldName}" con valor: "${value}"`);
  console.log(`Métodos disponibles:`, Object.getOwnPropertyNames(Object.getPrototypeOf(field)));

  try {
    // Intentar setText (funciona para PDFTextField)
    if (typeof field.setText === 'function') {
      field.setText(value);
      console.log(`✓ Campo "${fieldName}" llenado con setText: "${value}"`);
      return 1;
    }

    // Si no tiene setText, intentar acceder directamente al acroField
    if (field.acroField) {
      try {
        const { PDFName, PDFString } = await import('pdf-lib');
        field.acroField.dict.set(PDFName.of('V'), PDFString.of(value));
        console.log(`✓ Campo "${fieldName}" llenado con acroField: "${value}"`);
        return 1;
      } catch (acroError) {
        console.log(`✗ Error usando acroField para "${fieldName}":`, acroError.message);
      }
      return 0;
    }

    console.log(`✗ Campo "${fieldName}" no tiene método setText ni acroField`);
  } catch (setTextError) {
    console.log(`✗ Error al llenar "${fieldName}":`, setTextError.message);
  }

  return 0;
};

// Llena todos los campos del formulario y devuelve cuántos se llenaron
const fillPdfFormFields = async (fields, participantData) => {
  let fieldsFound = 0;

  for (const field of fields) {
    const fieldName = field.getName();
    const fieldType = field.constructor.name;
    const fieldValue = participantData[fieldName];

    console.log(`Campo: "${fieldName}" | Tipo: ${fieldType} | Valor disponible:`, fieldValue);

    try {
      // Intentar llenar campos de texto
      if (fieldValue !== undefined && fieldValue !== null) {
        fieldsFound += await fillSingleField(field, fieldName, fieldValue);
      } else {
        console.log(`⊘ Campo "${fieldName}" sin valor en participantData`);
      }
    } catch (e) {
      console.error(`Error procesando campo "${field.getName()}":`, e);
    }
  }

  return fieldsFound;
};

// Agrega el diseño posterior como segunda página rotada 180 grados
const addBackPage = async (finalPdfDoc, backDesign) => {
  const { PDFDocument, degrees } = await import('pdf-lib');

  const backUrlResult = await getUrl({ key: backDesign });
  const backUrl = backUrlResult.url.toString();

  const backResponse = await fetch(backUrl);
  const backArrayBuffer = await backResponse.arrayBuffer();
  const backPdfDoc = await PDFDocument.load(backArrayBuffer);

  const [backPage] = await finalPdfDoc.copyPages(backPdfDoc, [0]);

  // Rotar la página trasera 180 grados
  const currentRotation = backPage.getRotation().angle;
  backPage.setRotation(degrees(currentRotation + 180));

  finalPdfDoc.addPage(backPage);
  console.log('✓ Página trasera agregada y rotada 180 grados');
};

// Crea el blob del PDF y dispara la descarga en el navegador
const triggerPdfDownload = (pdfBytes, fileName) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Muestra alertas si el PDF no tiene campos o si ninguno coincidió con los datos
const showFillResultAlerts = (fields, fieldsFound, participantData) => {
  // Solo mostrar alerta si NO hay campos de formulario en el PDF
  if (fields.length === 0) {
    alert('Badge descargado. NOTA: El PDF no tiene campos de formulario, por lo que no se reemplazaron las variables.\n\nAgrega campos de formulario al PDF con nombres como: field_one, field_two, field_three, ProfileQrCode');
    return;
  }

  // Mostrar advertencia si hay campos pero ninguno se llenó
  if (fieldsFound === 0) {
    console.error('ERROR: Ningún campo fue llenado');
    console.error('Campos del PDF:', fields.map(f => `"${f.getName()}"`).join(', '));
    console.error('Keys de participantData:', Object.keys(participantData).join(', '));
    alert(`Badge descargado. ADVERTENCIA: El PDF tiene campos de formulario (${fields.map(f => f.getName()).join(', ')}) pero ninguno coincide con los datos disponibles.\n\nDatos disponibles: ${Object.keys(participantData).join(', ')}`);
  }
};

const DownloadBadgeButton = ({ eventAttendee, event }) => {
  const [isLoading, setIsLoading] = useState(false);

  const downloadBadge = async () => {
    if (!event?.eventBadgeId) {
      alert('No hay un diseño de badge configurado para este evento');
      return;
    }

    setIsLoading(true);

    try {
      // Obtener el Badge del evento
      const badgeResponse = await client.graphql({
        query: getBadge,
        variables: { id: event.eventBadgeId }
      });

      const badge = badgeResponse.data.getBadge;

      if (!badge?.frontDesign) {
        alert('No se encontró el diseño del badge');
        setIsLoading(false);
        return;
      }

      // Importar pdf-lib dinámicamente para evitar errores de compilación
      const { PDFDocument } = await import('pdf-lib');

      // Obtener datos del participante
      const participantData = getParticipantData(eventAttendee);

      // Crear un nuevo documento PDF que contendrá ambas páginas
      const finalPdfDoc = await PDFDocument.create();

      // Obtener URL del PDF frontal desde S3
      const frontUrlResult = await getUrl({ key: badge.frontDesign });
      const frontUrl = frontUrlResult.url.toString();

      // Descargar y cargar el PDF frontal
      const frontResponse = await fetch(frontUrl);
      const frontArrayBuffer = await frontResponse.arrayBuffer();
      const frontPdfDoc = await PDFDocument.load(frontArrayBuffer);

      // Obtener el formulario del PDF frontal
      const form = frontPdfDoc.getForm();
      const fields = form.getFields();

      console.log('=== DEBUG CAMPOS PDF ===');
      console.log('Total campos en PDF:', fields.length);
      console.log('Datos del participante:', participantData);

      // Llenar todos los campos del formulario
      const fieldsFound = await fillPdfFormFields(fields, participantData);

      // Aplanar el formulario para que no se pueda editar
      try {
        form.flatten();
      } catch (e) {
        // Silent error
      }

      // Copiar página frontal al documento final
      const [frontPage] = await finalPdfDoc.copyPages(frontPdfDoc, [0]);
      finalPdfDoc.addPage(frontPage);

      // Si existe backDesign, agregarlo como segunda página
      if (badge.backDesign) {
        try {
          await addBackPage(finalPdfDoc, badge.backDesign);
        } catch (backError) {
          console.error('Error al cargar el diseño posterior:', backError);
        }
      }

      // Guardar el PDF modificado
      const pdfBytes = await finalPdfDoc.save();

      // Crear blob y descargar
      const fileName = participantData.field_one
        ? `badge-${participantData.field_one.replace(/\s+/g, '-')}.pdf`
        : `badge-${eventAttendee.email.split('@')[0]}.pdf`;
      triggerPdfDownload(pdfBytes, fileName);

      console.log('Campos del PDF:', fields.map(f => f.getName()));
      console.log('Datos del participante:', participantData);
      console.log('Campos llenados:', fieldsFound);

      console.log('=== RESULTADO ===');
      console.log('Campos llenados:', fieldsFound, 'de', fields.length);

      showFillResultAlerts(fields, fieldsFound, participantData);
    } catch (error) {
      alert('Error al descargar el badge: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={downloadBadge}
      disabled={isLoading}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isLoading
          ? 'bg-gray-400 cursor-not-allowed text-white'
          : 'bg-black hover:bg-brand-500 text-white'
      }`}
      title="Descargar Badge"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Descargando...</span>
        </>
      ) : (
        <>
          <MdDownload className="h-4 w-4" />
          <span>Badge</span>
        </>
      )}
    </button>
  );
};

export default DownloadBadgeButton;
