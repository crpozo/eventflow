// Campos de certificado que se inyectan AUTOMÁTICAMENTE en el formulario de
// registro cuando el evento tiene certificados activados (sendCertificates):
// el nombre a imprimir (con límite de caracteres; el PDF además auto-encoge) y
// la pregunta Sí/No de envío. Son virtuales: no se guardan en la definición del
// Form (el builder del admin no los ve) y las respuestas fluyen a formAnswers
// como cualquier campo — el Lambda ya los reconoce (cert_nombre manda en
// extractName; cert_enviar/valores Siquiero-Noquiero via wantsCertificate).
// Si el admin ya agregó un campo equivalente a mano, no se duplica.
const CERT_NAME_RE = /cert_nombre|nombre[\s\S]{0,30}certificad|certificad[\s\S]{0,30}nombre/i;
const CERT_ASK_RE = /certificad|certificate/i;
const CERT_NAME_MAXLEN = 40;
const withCertFields = (questions, sendCertificates) => {
  // Form.questions es AWSJSON: puede llegar como array, como string JSON, o
  // con elementos que son strings JSON — normalizar para DETECTAR (los
  // originales se renderizan tal cual, formRender ya los tolera).
  let list = questions;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch (e) {
      return questions;
    }
  }
  if (!sendCertificates || !Array.isArray(list) || list.length === 0)
    return questions;
  const parsed = list.map((q) => {
    if (typeof q !== "string") return q;
    try {
      return JSON.parse(q);
    } catch (e) {
      return null;
    }
  });
  // Misma discriminación por FORMA que el Lambda: los textos decorativos
  // (header/paragraph) y campos ajenos ("certificado de votación") también
  // mencionan 'certificado'; una pregunta Sí/No REAL es un select/radio con
  // values[], y un campo de NOMBRE real es de texto (o name exacto).
  const txt = (q) => `${q?.label || ""} ${q?.name || ""}`;
  const answerable = (q) =>
    q && q.type !== "header" && q.type !== "paragraph";
  const isChoice = (q) => Array.isArray(q?.values) && q.values.length > 0;
  const hasName = parsed.some(
    (q) =>
      answerable(q) &&
      (q?.name === "cert_nombre" ||
        (!isChoice(q) && CERT_NAME_RE.test(txt(q))))
  );
  const hasAsk = parsed.some(
    (q) =>
      answerable(q) &&
      (q?.name === "cert_enviar" || (isChoice(q) && CERT_ASK_RE.test(txt(q))))
  );
  const extra = [];
  if (!hasAsk)
    extra.push({
      type: "select",
      name: "cert_enviar",
      label: "¿Deseas recibir tu certificado de participación?",
      className: "form-control",
      multiple: false,
      access: false,
      // Values legibles ("Si"/"No"): las vistas de perfil imprimen userData[0]
      // crudo y "Siquiero" se veía como token aplastado. isAffirmative del
      // Lambda resuelve ambos estilos por prefijo.
      values: [
        { label: "Sí", value: "Si", selected: true },
        { label: "No", value: "No", selected: false },
      ],
    });
  if (!hasName)
    extra.push({
      type: "text",
      subtype: "text",
      name: "cert_nombre",
      label: `Nombre para el certificado (máx. ${CERT_NAME_MAXLEN} caracteres)`,
      placeholder: "Como aparecerá en tu certificado",
      className: "form-control",
      required: false,
      maxlength: CERT_NAME_MAXLEN,
      access: false,
    });
  return extra.length ? [...list, ...extra] : questions;
};

export { withCertFields, CERT_NAME_RE, CERT_ASK_RE, CERT_NAME_MAXLEN };
