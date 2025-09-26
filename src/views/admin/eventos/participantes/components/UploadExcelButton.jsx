import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@chakra-ui/button";
import { DataStore } from "aws-amplify/datastore";
import { Attendee, EventAttendee, Form } from "models";
import { uploadData, getUrl } from "aws-amplify/storage";
import QRCode from "qrcode"; // You'll need to install this: npm install qrcode
import html2pdf from "html2pdf.js";

export default function UploadExcelButton({ event }) {
  const url = window.location.href;
  const domain = url.split("/")[2];
  const eventID = url.split("/")[5];
  const [isPending, setIsPending] = useState(false);
  const fileInputRef = useRef(null);

  const handleButtonClick = async () => {
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
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  // Generate ticket HTML
  const generateTicketHTML = (eventAttendee, qrCodeDataURL, userData, event) => {
    const participantName = userData.find(item => item.name === "nombres")?.userData[0] || "Participante";
    
    return `
      <div style="
        width: 350px;
        border: 1px solid #ccc;
        background: linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 80%, #faf3e9f7 80%);
        padding: 32px 8px 24px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        font-family: Arial, sans-serif;
      ">
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
          <div style="background: white; padding: 4px; margin-bottom: 50px;">
            <img src="${qrCodeDataURL}" style="width: 170px; height: 170px;" alt="QR Code" />
          </div>
          <img src="assets/img/usfq/logo_2025.png" style="width: 250px; margin-bottom: 50px;" alt="USFQ Logo" />
          <h1 style="margin-bottom: 16px; font-size: 24px; max-width: 300px; font-weight: bold; text-align: center;">
            ${event?.title || 'Evento USFQ'}
          </h1>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
          <p style="font-size: 16px; width: 100%; text-align: right; font-weight: bold; text-transform: capitalize; margin-bottom: 8px;">
            ${participantName}
          </p>
          <p style="margin-bottom: 8px; text-align: right; font-size: 14px;">
            ${event?.location || 'Ubicación del evento'}
          </p>
          <p style="margin-bottom: 4px; max-width: fit-content; background: black; padding: 3px 8px; text-align: right; font-size: 14px; color: white;">
            ${event?.date || 'Fecha del evento'}
          </p>
        </div>
      </div>
    `;
  };

  // Generate PDF from HTML
  const generatePDFFromHTML = async (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const pdfOptions = {
        image: { type: "jpeg", quality: 1 },
        margin: [5, -220, 0, 0],
        jsPDF: { unit: "mm", format: [520, 340] },
      };

      const pdfBlob = await html2pdf()
        .set(pdfOptions)
        .from(tempDiv)
        .outputPdf('blob');

      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64,
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  // Save PDF to storage and update EventAttendee
  const savePDFAndUpdateAttendee = async (eventAttendee, base64PDF) => {
    try {
      // Upload PDF to storage
      const resultUpload = await uploadData({
        key: `${eventAttendee.id}_${eventID}_ticket.txt`,
        data: base64PDF,
        options: {
          accessLevel: "guest",
          metadata: { key: eventID },
        },
      }).result;

      // Get URL for the uploaded file
      const getUrlResult = await getUrl({
        key: `${eventAttendee.id}_${eventID}_ticket.txt`,
        options: {
          accessLevel: "guest",
        },
      });

      // Update EventAttendee with ticket URL
      const original = await DataStore.query(EventAttendee, eventAttendee.id);
      const updatedEventAttendee = await DataStore.save(
        EventAttendee.copyOf(original, (updated) => {
          updated.ticket = decodeURIComponent(getUrlResult.url.pathname.substring(1));
          updated.authorized = true; // Set as authorized since it's imported
        })
      );

      return updatedEventAttendee;
    } catch (error) {
      console.error("Error saving PDF and updating attendee:", error);
      throw error;
    }
  };

  // Send ticket email
  const sendTicketEmail = async (eventAttendeeId) => {
    try {
      const payloadEmail = {
        eventAttendeeId: eventAttendeeId,
        typePayment: "CARD", 
        statusPayment: "SUCCESSFUL",
      };

      console.log("Sending email with payload:", payloadEmail);

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Email API response:", result);
      return result;
    } catch (error) {
      console.error("Error sending ticket email:", error);
      throw error; // Re-lanzar el error para que sea manejado arriba
    }
  };

  async function createAttendee() {
    return await DataStore.save(new Attendee({}));
  }

  const handleFileChange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setIsPending(true);

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
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

          const questions = (await DataStore.query(Form, (f) => f.formEventId.eq(eventID)))[0]?.questions;

          for (const participant of participants) {
            try {
              const attendee = await createAttendee();
              const answers = questions.map((q) => ({
                ...q,
                userData: [participant[q.name.toLowerCase()] ?? '']
              }));

              if (attendee) {
                // Create EventAttendee record
                const newEventAttendee = await DataStore.save(
                  new EventAttendee({
                    eventID: eventID,
                    attendeeID: attendee.id,
                    authorized: false, // Will be set to true after ticket generation
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

                // Generate QR code
                const qrCodeDataURL = await generateQRCode(attendee.id);
                
                if (qrCodeDataURL) {
                  // Generate ticket HTML
                  const ticketHTML = generateTicketHTML(newEventAttendee, qrCodeDataURL, answers, event);
                  
                  // Generate PDF from HTML
                  const base64PDF = await generatePDFFromHTML(ticketHTML);
                  
                  // Save PDF and update EventAttendee
                  await savePDFAndUpdateAttendee(newEventAttendee, base64PDF);
                  
                  // Send ticket email
                  try {
                    await sendTicketEmail(newEventAttendee.id);
                    console.log(`Ticket generated and EMAIL SENT for: ${participant.email}`);
                  } catch (emailError) {
                    console.error(`Email failed for ${participant.email}:`, emailError);
                    console.log(`Ticket generated but EMAIL FAILED for: ${participant.email}`);
                  }
                } else {
                  console.error(`Failed to generate QR code for attendee: ${attendee.id}`);
                }
              }
            } catch (error) {
              console.error(`Error processing participant ${participant.email}:`, error);
            }
          }

          alert("Importación completada. Los tickets han sido generados y enviados por email.");
        } catch (err) {
          console.error("Error processing file:", err);
          alert("Hubo un error procesando el archivo.");
        } finally {
          setIsPending(false);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setIsPending(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Error handling file upload:", err);
      alert("Error manejando la subida del archivo.");
      setIsPending(false);
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