import React from "react";
import { post } from "aws-amplify/api";

// On-demand "Test certificate" sender, rendered inside the event update form.
// Posts to the userApi /certificate-test endpoint (certificateSender Lambda in
// test mode), which renders one certificate from the event's template/position
// and emails it. It does not touch attendees or mark the event as sent.
export default function TestCertificate({
  eventId,
  certificate,
  certificatePosition,
}) {
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState(null); // { ok: boolean, msg: string }

  const sendTest = async () => {
    const to = email.trim();
    if (!to) {
      setResult({ ok: false, msg: "Ingresa un correo." });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const op = post({
        apiName: "userApi",
        path: "/certificate-test",
        options: {
          // Send the template/position currently in the form so the test works
          // against the just-uploaded values, even before saving the event.
          body: {
            eventId,
            email: to,
            certificateKey: certificate || "",
            position: certificatePosition || "",
          },
        },
      });
      const { body } = await op.response;
      const data = await body.json();
      if (data?.ok) {
        setResult({ ok: true, msg: `Certificado de prueba enviado a ${to}.` });
      } else {
        setResult({ ok: false, msg: data?.error || "No se pudo enviar." });
      }
    } catch (err) {
      // Amplify rejects on non-2xx. Dig the server's JSON `error` out of the
      // response body, whatever shape it arrives in, before falling back to the
      // generic ("Unknown error") message.
      let msg = "";
      const resp = err?.response;
      const bodyVal = resp?.body;
      try {
        if (bodyVal && typeof bodyVal.json === "function") {
          const d = await bodyVal.json();
          msg = d?.error || d?.message || "";
        } else if (bodyVal && typeof bodyVal.text === "function") {
          const t = await bodyVal.text();
          try {
            msg = JSON.parse(t)?.error || t;
          } catch (e) {
            msg = t;
          }
        } else if (typeof bodyVal === "string") {
          try {
            msg = JSON.parse(bodyVal)?.error || bodyVal;
          } catch (e) {
            msg = bodyVal;
          }
        }
      } catch (e) {
        /* ignore body parse errors */
      }
      if (!msg) msg = err?.message || "Error al enviar.";
      const status = resp?.statusCode;
      setResult({ ok: false, msg: status ? `(${status}) ${msg}` : msg });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-2 border-t border-gray-100 pt-5 dark:border-navy-700">
      <h4 className="mb-1 font-semibold text-navy-700 dark:text-white">
        Probar certificado
      </h4>
      <p className="mb-3 text-sm text-gray-500">
        Envía un certificado de prueba (con la plantilla y posición configuradas)
        al correo que indiques. No afecta a los asistentes.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            // Inside the event <form>, Enter would submit it — send the test instead.
            if (e.key === "Enter") {
              e.preventDefault();
              sendTest();
            }
          }}
          placeholder="correo@ejemplo.com"
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
        />
        <button
          type="button"
          onClick={sendTest}
          disabled={sending}
          className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Test certificate"}
        </button>
      </div>
      {result && (
        <p
          className={`mt-2 text-sm ${
            result.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.msg}
        </p>
      )}
    </div>
  );
}
