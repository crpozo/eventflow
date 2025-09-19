/**
 * Validate Banner Code against USFQ Nomina API.
 * 
 * @param {Array} userData - formRender userData array
 * @param {Object} opts - optional overrides
 * @returns {Promise<{ok: boolean, skipped?: boolean, reason?: string}>}
 */
export async function validateBannerCode(userData, opts = {}) {
  const {
    bannerFieldName = "codigo_banner",
    idFieldName = "identificacion",
    tokenUrl = "https://xjmntgc4yroqwjqzep3oqu653a0mohcv.lambda-url.sa-east-1.on.aws/",
    nominaBaseUrl = "https://gpapis.usfq.edu.ec/APISNominaGP-TEST/api/NominaGP",
  } = opts;

  const bannerId = getAnswer(userData, bannerFieldName);
  const identificacion = getAnswer(userData, idFieldName);

  // If one of the fields is missing → skip validation
  if (!bannerId || !identificacion) {
    return { ok: true, skipped: true };
  }

  try {
    const accessToken = await getNominaAccessToken(tokenUrl);
    const active = await checkEmpleadoActivo({
      nominaBaseUrl,
      bannerId,
      identificacion,
      accessToken,
    });

    return active ? { ok: true } : { ok: false, reason: "inactive_or_mismatch" };
  } catch (err) {
    console.error("validateBannerCode error:", err);
    return { ok: false, reason: "api_error" };
  }
}

// ---------- private helpers ----------

function getAnswer(arr, name) {
  try {
    return arr.find((i) => i.name === name)?.userData?.[0]?.toString().trim();
  } catch {
    return undefined;
  }
}

async function getNominaAccessToken(tokenUrl) {
  const res = await fetch(tokenUrl, { method: "GET" });
  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const data = await res.json();
  if (!data?.access_token) throw new Error("Missing access_token");
  return data.access_token;
}

async function checkEmpleadoActivo({ nominaBaseUrl, bannerId, identificacion, accessToken }) {
  const url =
    `${nominaBaseUrl}/PersonaNomina/EsEmpleadoActivo?` +
    `banner_id=${encodeURIComponent(bannerId)}` +
    `&identificacion=${encodeURIComponent(identificacion)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Nomina check failed: ${res.status}`);
  const data = await res.json();

  return data === true || data === "true";
}
