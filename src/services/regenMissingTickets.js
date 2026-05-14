import { DataStore } from "aws-amplify/datastore";
import { EventAttendee } from "models";
import { uploadData, getUrl } from "aws-amplify/storage";
import QRCode from "qrcode";
import logo from "assets/img/usfq/logo_2025.png";

const EMAIL_API =
  "https://edunvujidf.execute-api.sa-east-1.amazonaws.com/prod/trigger-email";

const generateQRCode = (attendeeId) =>
  QRCode.toDataURL(attendeeId, {
    width: 170,
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

const formatSpanishDate = (dateString) => {
  if (!dateString) return "Fecha del evento";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateTicketHTML = (eventAttendee, qrCodeDataURL, userData, event) => {
  const participantName =
    userData.find((item) => item.name === "nombres")?.userData[0] ||
    "Participante";

  return `
    <div style="display:flex;width:100%;max-width:350px;align-items:center;justify-content:flex-start;border:1px solid #d1d5db;border-style:solid;padding-bottom:8px;">
      <div style="background:linear-gradient(0deg,rgba(255,255,255,1) 0%,rgba(255,255,255,1) 80%,#faf3e9f7 80%);display:flex;width:100%;flex-direction:column;align-items:center;justify-content:space-between;gap:30px;padding:32px 8px 10px 8px;font-family:Arial,sans-serif;">
        <div style="display:flex;width:100%;flex-direction:column;align-items:center;justify-content:flex-start;">
          <div style="display:flex;align-items:center;justify-content:center;background:white;padding:4px;">
            <img src="${qrCodeDataURL}" style="width:150px;height:150px;margin-bottom:50px;" alt="QR Code" />
          </div>
          <img src="${logo}" crossorigin="anonymous" style="width:210px;margin-bottom:50px;" alt="USFQ Logo" />
          <h1 style="margin-bottom:16px;font-size:24px;max-width:300px;font-weight:bold;text-align:center;">
            ${event?.title || "Evento USFQ"}
          </h1>
        </div>
        <div style="display:flex;width:100%;flex-direction:column;align-items:center;justify-content:center;">
          <p style="font-size:16px;width:100%;text-align:center;font-weight:bold;text-transform:capitalize;margin-bottom:8px;">
            ${participantName}
          </p>
          <p style="margin-bottom:8px;text-align:right;font-size:14px;font-weight:normal;">
            ${event?.location || "Ubicación del evento"}
          </p>
          <p style="margin-bottom:4px;max-width:fit-content;background:black;padding:3px 8px;text-align:right;font-size:14px;font-weight:normal;color:white;">
            ${formatSpanishDate(event?.date)}
          </p>
        </div>
      </div>
    </div>
  `;
};

const generatePDFBase64 = async (htmlContent) => {
  const html2pdf = (await import("html2pdf.js")).default;

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  Object.assign(tempDiv.style, {
    position: "fixed",
    top: "0",
    left: "0",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  document.body.appendChild(tempDiv);
  const element = tempDiv.children[0] || tempDiv;

  const imgs = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      (img.decode
        ? img.decode()
        : new Promise((res) => {
            if (img.complete) return res();
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          })
      ).catch(() => {})
    )
  );

  try {
    const opt = {
      margin: [5, 5, 5, 5],
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: null },
      jsPDF: { unit: "mm", format: "a6", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] },
    };
    const worker = html2pdf().set(opt).from(element).toPdf();
    const pdf = await worker.get("pdf");
    const arrayBuffer = pdf.output("arraybuffer");
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    return btoa(binary);
  } finally {
    document.body.removeChild(tempDiv);
  }
};

const uploadTicketAndUpdate = async (eventAttendee, event, base64PDF) => {
  const key = `${eventAttendee.id}_${event.id}_ticket.txt`;

  await uploadData({
    key,
    data: base64PDF,
    options: { accessLevel: "guest", metadata: { key: event.id } },
  }).result;

  const getUrlResult = await getUrl({ key, options: { accessLevel: "guest" } });
  const ticketPath = decodeURIComponent(
    getUrlResult.url.pathname.substring(1)
  );

  const original = await DataStore.query(EventAttendee, eventAttendee.id);
  return await DataStore.save(
    EventAttendee.copyOf(original, (updated) => {
      updated.ticket = ticketPath;
      updated.authorized = true;
    })
  );
};

const triggerEmail = async (eventAttendeeId) => {
  const response = await fetch(EMAIL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventAttendeeId,
      typePayment: "CARD",
      statusPayment: "SUCCESSFUL",
    }),
  });
  if (!response.ok) throw new Error(`Email API HTTP ${response.status}`);
  return response.json();
};

const findMissing = async (eventId) => {
  const all = await DataStore.query(EventAttendee, (ea) =>
    ea.eventID.eq(eventId)
  );
  return all.filter((ea) => !ea.ticket || ea.ticket.length === 0);
};

export async function regenMissingTickets(event, { dryRun = false } = {}) {
  if (!event || !event.id) {
    console.error("[regen] No event provided.");
    return;
  }

  console.log(`[regen] Buscando attendees sin ticket para "${event.title}" (${event.id})...`);
  const missing = await findMissing(event.id);

  if (missing.length === 0) {
    console.log("[regen] No hay attendees sin ticket. Nada que hacer.");
    alert("No hay attendees sin ticket. Nada que hacer.");
    return;
  }

  console.table(
    missing.map((ea) => ({
      id: ea.id,
      email: ea.email,
      createdAt: ea.createdAt,
    }))
  );

  const emails = missing.map((ea) => ea.email || "(sin email)").join("\n");
  const ok = window.confirm(
    `Se generarán y enviarán tickets a ${missing.length} attendees del evento "${event.title}":\n\n${emails}\n\n¿Continuar?`
  );
  if (!ok) {
    console.log("[regen] Cancelado por el usuario.");
    return;
  }

  if (dryRun) {
    console.log("[regen] dryRun=true — no se enviarán correos.");
    return missing;
  }

  const results = { sent: [], failed: [] };

  for (let i = 0; i < missing.length; i++) {
    const ea = missing[i];
    const label = `[${i + 1}/${missing.length}] ${ea.email || ea.id}`;
    try {
      console.log(`${label} — generando...`);

      if (!ea.email) {
        throw new Error("EventAttendee sin email");
      }

      let answers = [];
      try {
        answers = JSON.parse(ea.formAnswers || "[]");
      } catch (_) {
        answers = [];
      }

      const qr = await generateQRCode(ea.id);
      if (!qr) throw new Error("Fallo al generar QR");

      const html = generateTicketHTML(ea, qr, answers, event);
      const base64 = await generatePDFBase64(html);
      if (!base64) throw new Error("PDF vacío");

      const updated = await uploadTicketAndUpdate(ea, event, base64);

      // Esperar sync DataStore -> DynamoDB (mismo patrón que UploadExcelButton)
      await new Promise((r) => setTimeout(r, 15000));

      const verified = await DataStore.query(EventAttendee, updated.id);
      if (!verified || !verified.ticket || verified.ticket === "") {
        throw new Error("Ticket no sincronizado a DynamoDB tras 15s");
      }

      await triggerEmail(updated.id);
      console.log(`${label} — ✓ enviado`);
      results.sent.push(ea.email);

      // throttle
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`${label} — ✗ falló:`, err);
      results.failed.push({ email: ea.email, id: ea.id, error: err.message });
    }
  }

  console.log("[regen] Terminado.");
  console.log(`[regen] Enviados: ${results.sent.length}`);
  console.log(`[regen] Fallidos: ${results.failed.length}`);
  if (results.failed.length) console.table(results.failed);

  alert(
    `Terminado.\nEnviados: ${results.sent.length}\nFallidos: ${results.failed.length}\n\nRevisa la consola para detalles.`
  );

  return results;
}
