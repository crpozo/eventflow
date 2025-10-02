import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@chakra-ui/button";
import { DataStore } from "aws-amplify/datastore";
import { Attendee, EventAttendee, Form } from "models";
import { uploadData, getUrl } from "aws-amplify/storage";
import QRCode from "qrcode";
import html2pdf from "html2pdf.js";
import logo from "assets/img/usfq/logo_2025.png";

export default function UploadExcelButton({ event }) {
  const url = window.location.href;
  const domain = url.split("/")[2];
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef(null);

  const handleButtonClick = async () => {
    if (!event || !event.id) {
      alert('Error: No se ha cargado la información del evento. Por favor recarga la página.');
      return;
    }
    fileInputRef.current.click();
  };

  // Generate QR code as base64
  const generateQRCode = async (attendeeId) => {
    try {
      return await QRCode.toDataURL(attendeeId, {
        width: 170,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      return null;
    }
  };


  // Generate ticket HTML (matches landing design exactly)
  const generateTicketHTML = (eventAttendee, qrCodeDataURL, userData, event) => {
    console.log('📋 userData recibido:', userData);
    console.log('📋 event recibido:', event);
    console.log('🖼️ qrCodeDataURL:', qrCodeDataURL ? 'OK' : 'NULL');

    const participantName = userData.find(item => item.name === "nombres")?.userData[0] || "Participante";
    console.log('👤 Nombre participante:', participantName);

    // Format date in Spanish like landing does
    const formatSpanishDate = (dateString) => {
      if (!dateString) return 'Fecha del evento';
      const date = new Date(dateString);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      return date.toLocaleDateString('es-ES', options);
    };

    return `
      <div style="
        display: flex;
        width: 100%;
        max-width: 350px;
        align-items: center;
        justify-content: flex-start;
        border: 1px solid #d1d5db;
        border-style: solid;
        padding-bottom: 8px;
      ">
        <div style="
          background: linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 80%, #faf3e9f7 80%);
          display: flex;
          width: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 32px 8px 10px 8px;
          font-family: Arial, sans-serif;
        ">
          <div style="display: flex; width: 100%; flex-direction: column; align-items: center; justify-content: flex-start;">
            <div style="display: flex; align-items: center; justify-content: center; background: white; padding: 4px;">
              <img src="${qrCodeDataURL}" style="width: 150px; height: 150px; margin-bottom: 50px;" alt="QR Code" />
            </div>
            <img src="${logo}" crossorigin="anonymous" style="width: 210px; margin-bottom: 50px;" alt="USFQ Logo" />
            <h1 style="margin-bottom: 16px; font-size: 24px; max-width: 300px; font-weight: bold; text-align: center;">
              ${event?.title || 'Evento USFQ'}
            </h1>
          </div>
          <div style="display: flex; width: 100%; flex-direction: column; align-items: center; justify-content: center;">
            <p style="font-size: 16px; width: 100%; text-align: center; font-weight: bold; text-transform: capitalize; margin-bottom: 8px;">
              ${participantName}
            </p>
            <p style="margin-bottom: 8px; text-align: right; font-size: 14px; font-weight: normal;">
              ${event?.location || 'Ubicación del evento'}
            </p>
            <p style="margin-bottom: 4px; max-width: fit-content; background: black; padding: 3px 8px; text-align: right; font-size: 14px; font-weight: normal; color: white;">
              ${formatSpanishDate(event?.date)}
            </p>
          </div>
        </div>
      </div>
    `;
  };

  // Generate PDF from HTML (same method as landing)
  const generatePDFFromHTML = async (htmlContent) => {
    // 1) Build an offscreen container
    const tempDiv = document.createElement('div');
    tempDiv.id = 'pdf-content-temp';
    tempDiv.innerHTML = htmlContent;

    // Keep it renderable (not display:none) so html2canvas can compute sizes
    Object.assign(tempDiv.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
    });

    document.body.appendChild(tempDiv);

    // Select the actual element (avoid .firstChild which might be a text node)
    const element = tempDiv.children[0] || tempDiv;

    // 2) Ensure all images are decoded before rendering (prevents hangs)
    const imgs = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      imgs.map(img =>
        // decode() is supported on modern browsers; fallback to load event
        (img.decode ? img.decode() : new Promise(res => {
          if (img.complete) return res();
          img.addEventListener('load', res, { once: true });
          img.addEventListener('error', res, { once: true });
        })).catch(() => {})
      )
    );

    try {
      // 3) Reasonable PDF options (no negative margins, useCORS on)
      //    We'll render at A6 portrait by default (fits badge nicely).
      const opt = {
        margin:       [5, 5, 5, 5],
        filename:     'ticket.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: null },
        jsPDF:        { unit: 'mm', format: 'a6', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all'] },
      };

      console.log('🔄 Generando PDF con html2pdf (safe settings)...');

      // 4) Build the PDF and get the pdf instance
      const worker = html2pdf().set(opt).from(element).toPdf();
      const pdf = await worker.get('pdf');

      // 5) Get binary ArrayBuffer, then convert to base64 safely
      const arrayBuffer = pdf.output('arraybuffer'); // binary
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64PDF = btoa(binary);

      // Optional local download to verify (blob route is safer than mixing strings)
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'test-ticket.pdf';
      a.click();
      URL.revokeObjectURL(url);

      console.log('✓ PDF generado y convertido a base64');
      return base64PDF;
    } finally {
      document.body.removeChild(tempDiv);
    }
  };



  // Save PDF to storage and update EventAttendee
  const savePDFAndUpdateAttendee = async (eventAttendee, base64PDF) => {
    try {
      // Upload PDF to storage
      await uploadData({
        key: `${eventAttendee.id}_${event.id}_ticket.txt`,
        data: base64PDF,
        options: {
          accessLevel: "guest",
          metadata: { key: event.id },
        },
      }).result;

      // Get URL for the uploaded file
      const getUrlResult = await getUrl({
        key: `${eventAttendee.id}_${event.id}_ticket.txt`,
        options: {
          accessLevel: "guest",
        },
      });

      const ticketPath = decodeURIComponent(getUrlResult.url.pathname.substring(1));

      // Update EventAttendee with ticket URL
      const original = await DataStore.query(EventAttendee, eventAttendee.id);
      const updatedEventAttendee = await DataStore.save(
        EventAttendee.copyOf(original, (updated) => {
          updated.ticket = ticketPath;
          updated.authorized = true;
        })
      );

      return updatedEventAttendee;
    } catch (error) {
      throw error;
    }
  };

  // Send ticket email
  const sendTicketEmail = async (eventAttendeeId) => {
    const payloadEmail = {
      eventAttendeeId: eventAttendeeId,
      typePayment: "CARD",
      statusPayment: "SUCCESSFUL",
    };

    console.log("📧 Payload enviado al API:", payloadEmail);

    const response = await fetch(
      "https://edunvujidf.execute-api.sa-east-1.amazonaws.com/prod/trigger-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadEmail),
      }
    );

    console.log("📬 Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("📨 Response del API:", result);

    return result;
  };

  async function createAttendee() {
    return await DataStore.save(new Attendee({}));
  }

  const handleFileChange = async (fileEvent) => {
    try {
      const file = fileEvent.target.files[0];
      if (!file) return;

      setIsPending(true);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          // Verify event is loaded
          if (!event || !event.id) {
            alert('Error: El evento no se ha cargado correctamente. Por favor recarga la página.');
            setIsPending(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            return;
          }

          console.log('✓ Evento cargado:', event.id, event.title);

          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          let participants = XLSX.utils.sheet_to_json(worksheet);

          // Convert all keys to lowercase
          participants = participants.map((row) => {
            return Object.fromEntries(
              Object.entries(row).map(([key, value]) => [
                key.toLowerCase(),
                value,
              ])
            );
          });

          const questions = (await DataStore.query(Form, (f) => f.formEventId.eq(event.id)))[0]?.questions;

          // Get existing EventAttendees to check for duplicates
          const existingEventAttendees = await DataStore.query(EventAttendee, (ea) => ea.eventID.eq(event.id));
          const existingEmails = new Set(existingEventAttendees.map(ea => ea.email.toLowerCase()));

          for (const participant of participants) {
            try {
              // Check for duplicate email
              if (existingEmails.has(participant.email.toLowerCase())) {
                continue;
              }

              const attendee = await createAttendee();
              const answers = questions.map((q) => ({
                ...q,
                userData: [participant[q.name.toLowerCase()] ?? '']
              }));

              if (attendee) {
                // Create EventAttendee record
                const newEventAttendee = await DataStore.save(
                  new EventAttendee({
                    eventID: event.id,
                    attendeeID: attendee.id,
                    authorized: false,
                    checkIn: false,
                    formAnswers: JSON.stringify(answers),
                    ticket: ``,
                    email: participant.email,
                    allowContact: false,
                    quantity: 1,
                    scanned: 0,
                    profileURL: `${domain}/usuario/${attendee.id}`,
                  })
                );

                // Generate QR code with EventAttendee ID (same as landing)
                const qrCodeDataURL = await generateQRCode(newEventAttendee.id);

                if (qrCodeDataURL) {
                  // Generate ticket HTML
                  const ticketHTML = generateTicketHTML(newEventAttendee, qrCodeDataURL, answers, event);
                  console.log('🎫 HTML del ticket generado para:', participant.email);
                  console.log('📝 HTML completo:', ticketHTML.substring(0, 500) + '...');

                  // Generate PDF from HTML
                  const base64PDF = await generatePDFFromHTML(ticketHTML);
                  console.log('📄 PDF generado, base64 length:', base64PDF?.length || 0);

                  // Save PDF and update EventAttendee
                  const updatedEventAttendee = await savePDFAndUpdateAttendee(newEventAttendee, base64PDF);

                  // Verify ticket is present
                  if (!updatedEventAttendee.ticket || updatedEventAttendee.ticket === '') {
                    console.error(`❌ ERROR: Ticket vacío para ${participant.email}. Email NO enviado.`);
                    alert(`ERROR: No se pudo generar el ticket para ${participant.email}. Email no enviado.`);
                  } else {
                    console.log(`✓ Ticket guardado localmente: ${updatedEventAttendee.ticket}`);

                    // Wait longer for DataStore sync - increased to 15 seconds
                    console.log(`⏱️ Esperando 15 segundos para sincronización con DynamoDB...`);
                    await new Promise(resolve => setTimeout(resolve, 15000));

                    // Query from DataStore to verify sync
                    console.log(`🔍 Verificando sincronización en DynamoDB...`);
                    const verifiedFromDB = await DataStore.query(EventAttendee, updatedEventAttendee.id);

                    if (!verifiedFromDB || !verifiedFromDB.ticket || verifiedFromDB.ticket === '') {
                      console.error(`❌ ERROR: Ticket no sincronizado para ${participant.email} después de 15s. Email NO enviado.`);
                      console.error(`❌ Estado en DB:`, verifiedFromDB);
                      alert(`ERROR: El ticket no se sincronizó para ${participant.email}. Email no enviado.`);
                    } else {
                      console.log(`✓ Ticket verificado en DB: ${verifiedFromDB.ticket}`);

                      // Send ticket email only if ticket is confirmed in DB
                      try {
                        console.log(`📧 Intentando enviar email a ${participant.email}...`);
                        await sendTicketEmail(updatedEventAttendee.id);
                        console.log(`✓ Email enviado exitosamente a: ${participant.email}`);

                        // Add to existing emails set to prevent duplicates in same batch
                        existingEmails.add(participant.email.toLowerCase());

                        // Delay between emails to avoid throttling
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      } catch (emailError) {
                        console.error(`❌ Error enviando email a ${participant.email}:`, emailError);
                        console.error(`❌ Detalles del error:`, emailError.message);
                      }
                    }
                  }
                }
              }
            } catch (error) {
              // Silent error handling
            }
          }

          alert("Importación completada. Los tickets han sido generados y enviados por email.");
        } catch (err) {
          alert("Hubo un error procesando el archivo.");
        } finally {
          setIsPending(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        setIsPending(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert("Error manejando la subida del archivo.");
      setIsPending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <Button
        colorScheme="red"
        className="rounded-xl bg-brand-500 px-4 py-2 text-white hover:bg-red-700 border-0"
        onClick={handleButtonClick}
        disabled={isPending}
      >
        {isPending ? "Importando y Generando Tickets..." : "Importar Usuarios"}
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .csv, .xls"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}